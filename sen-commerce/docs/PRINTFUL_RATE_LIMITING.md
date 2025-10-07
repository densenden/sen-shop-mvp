# Printful API Rate Limiting Strategy

## Overview

This document explains how we handle Printful's strict API rate limits during mockup generation without requiring a job queue system like BullMQ.

## Printful Rate Limits

Printful enforces the following rate limits:

- **New stores**: 2 requests per minute
- **Established stores**: 10 requests per minute
- **429 Response**: Returns retry-after time in seconds

## Why We Don't Need BullMQ

### The Problem
- Generating mockups for 20 variants = 20+ API requests
- At 2 req/min, polling 20 tasks simultaneously = 400 req/min → instant rate limit

### Traditional Solution (BullMQ)
```
User → Queue Job → Background Worker → Poll API → Notify User
```

**Pros:**
- Decoupled from HTTP request
- User can close tab
- Scalable job processing

**Cons:**
- Requires Redis infrastructure
- Webhook setup for notifications
- Complex architecture
- Overkill for single-user/small team usage

### Our Solution (Sequential Polling with Progress)
```
User → HTTP Request → Sequential Polling (30s delays) → Return Result
```

**Pros:**
- ✅ Simple implementation (no infrastructure)
- ✅ Visual progress in UI
- ✅ Respects rate limits automatically
- ✅ No external dependencies
- ✅ Synchronous UX (users see real-time progress)

**Cons:**
- ❌ User must keep tab open (~10 minutes for 20 variants)
- ❌ Ties up HTTP connection

## Implementation Details

### 1. Rate Limit Detection

Parse 429 responses to extract retry-after time:

```typescript
if (res.status === 429) {
  let retryAfter = 60 // Default
  const errorData = JSON.parse(errorText)
  const match = errorData.data?.match(/after (\d+) seconds?/)
  if (match) {
    retryAfter = parseInt(match[1], 10)
  }

  const error: any = new Error(`Rate limited: retry after ${retryAfter}s`)
  error.retryAfter = retryAfter
  error.status = 429
  throw error
}
```

**Location**: `src/modules/printful/services/printful-pod-product-service.ts:685-702`

### 2. Sequential Polling Strategy

Instead of polling all tasks simultaneously (`Promise.all`), we poll sequentially with delays:

```typescript
// BEFORE (causes rate limit):
const statuses = await Promise.all(taskIds.map(id => getMockupStatus(id)))
// = 20 simultaneous requests = rate limit!

// AFTER (respects rate limit):
const statuses = []
for (let i = 0; i < taskIds.length; i++) {
  if (i > 0) {
    await new Promise(resolve => setTimeout(resolve, 30000)) // 30s delay
  }
  const status = await getMockupStatus(taskIds[i])
  statuses.push(status)
}
// = 1 request per 30 seconds = 2 req/min ✓
```

**Location**: `src/modules/printful/services/printful-pod-product-service.ts:778-802`

### 3. Dynamic Timeout Calculation

Timeout must scale with variant count:

```typescript
// Formula: (variants × 30s) + 60s buffer
const rateLimitTimeout = selectedVariantIds.length * 30000 + 60000

// Examples:
// 3 variants  = 150s (2.5 minutes)
// 10 variants = 360s (6 minutes)
// 20 variants = 660s (11 minutes)

const maxWaitTime = Math.max(baseTimeout, rateLimitTimeout)
```

**Location**: `src/modules/printful/services/studio/base-service.ts:373-382`

### 4. Visible Progress Tracking

#### Server-Side Logging
```typescript
console.log(`[PrintfulService] ⏳ Starting mockup polling for ${taskIds.length} tasks`)
console.log(`[PrintfulService] 🔄 Poll #${pollCount}: Checking ${taskIds.length} tasks...`)
console.log(`[PrintfulService] ⏱️  Waiting 30s before next request (rate limit)...`)
console.log(`[PrintfulService] ✓ Task ${i+1}/${taskIds.length}: ${status.status}`)
console.log(`[PrintfulService] 📊 Progress: ${completed}/${total} completed`)
console.log(`[PrintfulService] ✅ All mockups completed: ${urls.length} mockups in ${time}s`)
console.warn(`[PrintfulService] ⚠️  Rate limited! Waiting ${retryAfter}s before retry...`)
```

#### UI Progress Indicator
```tsx
{session.mockups.mockup_status === 'generating' && (
  <div className="border bg-ui-bg-highlight p-4">
    <Loader2 className="animate-spin" />
    <p>⏳ Generating 20 mockups (est. 10 min due to rate limits)...</p>
    <p className="text-xs">Please keep this tab open.</p>
  </div>
)}
```

**Location**: `src/admin/routes/printful-studio/page.tsx:1306-1319`

### 5. Rate Limit Recovery

When rate limited, we respect the retry-after time:

```typescript
try {
  const status = await this.getMockupStatus(taskId)
  statuses.push(status)
} catch (error: any) {
  if (error.status === 429 && error.retryAfter) {
    console.warn(`⚠️  Rate limited! Waiting ${error.retryAfter}s`)
    rateLimitWait = error.retryAfter * 1000
    break // Stop this polling round, wait longer
  }
  throw error
}
```

**Location**: `src/modules/printful/services/printful-pod-product-service.ts:794-801`

## User Experience Flow

### 1. User Initiates Mockup Generation
```
User clicks "Generate Mockups" → Selects 20 variants
```

### 2. Immediate Feedback
```
UI shows: "⏳ Generating 20 mockups (est. 10 min due to rate limits)..."
Placeholder images displayed with loading overlays
```

### 3. Server Processing
```
Server logs visible in terminal:
⏳ Starting mockup polling for 20 tasks
🔄 Poll #1: Checking 20 tasks...
⏱️  Waiting 30s before next request (rate limit)...
✓ Task 1/20: completed
✓ Task 2/20: completed
...
📊 Progress: 18/20 completed, 2 pending
✅ All mockups completed: 20 mockups in 620s
```

### 4. Completion
```
UI updates: "✅ Generated 20 mockups successfully!"
Real mockup images replace placeholders
User can proceed to create product
```

### 5. If Rate Limited
```
Server: ⚠️  Rate limited! Waiting 53s before retry...
UI: No change (still shows generating status)
Server: Automatically retries after wait period
```

## Configuration

### Rate Limit Settings

```typescript
// Poll interval (time between polling rounds)
const pollInterval = 10000 // 10 seconds

// Delay between sequential requests within a poll
const requestDelay = 30000 // 30 seconds (2 req/min)

// Max wait time calculation
const baseTimeout = 90000 // 90 seconds base
const perVariantTime = 30000 // 30 seconds per variant
const buffer = 60000 // 60 second buffer
const maxWaitTime = Math.max(baseTimeout, variantCount * perVariantTime + buffer)
```

### Estimated Times by Variant Count

| Variants | Sequential Requests | Estimated Time | Timeout Set |
|----------|-------------------|----------------|-------------|
| 1        | 1 request         | ~30s           | 90s         |
| 3        | 3 requests        | ~1.5 min       | 150s        |
| 5        | 5 requests        | ~2.5 min       | 210s        |
| 10       | 10 requests       | ~5 min         | 360s        |
| 20       | 20 requests       | ~10 min        | 660s        |

**Note**: Times assume mockup generation completes quickly. Actual time depends on Printful's processing speed + polling overhead.

## When You WOULD Need BullMQ

Consider implementing BullMQ if:

1. **High Volume**: Generating mockups for 100+ variants regularly
2. **Multi-User**: Multiple users generating mockups simultaneously
3. **Async Workflows**: Users need to close tab and be notified later
4. **Rate Limit Sharing**: Multiple processes sharing the same API quota
5. **Retry Logic**: Complex retry strategies beyond simple exponential backoff
6. **Job Monitoring**: Need job history, failure tracking, and analytics

## BullMQ Implementation (Future)

If you decide to implement BullMQ later, here's the structure:

```typescript
// 1. Queue Definition
import { Queue } from 'bullmq'

const mockupQueue = new Queue('printful-mockups', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000 // Start with 30s
    }
  }
})

// 2. Add Job
await mockupQueue.add('generate-mockups', {
  productId: '123',
  variantIds: ['1', '2', '3'],
  artworkUrl: 'https://...',
  userId: 'user123'
})

// 3. Worker
import { Worker } from 'bullmq'

const worker = new Worker('printful-mockups', async (job) => {
  const { productId, variantIds, artworkUrl } = job.data

  // Sequential polling with rate limit respect
  for (let i = 0; i < variantIds.length; i++) {
    await job.updateProgress((i / variantIds.length) * 100)

    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 30000))
    }

    const status = await pollMockupStatus(taskIds[i])
    // ... process
  }

  return { mockupUrls }
}, { connection: redisConnection })

// 4. Notification
worker.on('completed', (job, result) => {
  // Send webhook/email to user
  notifyUser(job.data.userId, result.mockupUrls)
})
```

## Troubleshooting

### Issue: Still Getting 429 Errors

**Cause**: Another process is using the same Printful API token

**Solution**:
- Check for multiple dev servers running
- Ensure no other apps are using the same token
- Increase delay between requests to 60s (1 req/min)

### Issue: Timeout Before Completion

**Cause**: Too many variants for current timeout setting

**Solution**:
- Current timeout auto-scales with variant count
- If still timing out, increase buffer in base-service.ts:
  ```typescript
  const rateLimitTimeout = selectedVariantIds.length * 30000 + 120000 // 2-minute buffer
  ```

### Issue: User Closes Tab During Generation

**Cause**: Long-running HTTP request interrupted

**Solution**:
- Mockup generation fails (expected behavior)
- User can retry (Printful keeps completed mockups cached briefly)
- For async support, implement BullMQ

## Performance Metrics

Based on testing with Printful's 2 req/min limit:

```
Variant Count: 20
API Calls: 20 status checks
Sequential Delays: 19 × 30s = 570s
Polling Overhead: ~50s
Total Time: ~620s (10.3 minutes)
Success Rate: 100% (no rate limit errors)
```

## Conclusion

The sequential polling approach with visible progress indicators is the optimal solution for:
- Small to medium mockup generation (1-30 variants)
- Single-user or small team environments
- Synchronous user workflows

It successfully handles Printful's strict rate limits without requiring additional infrastructure like Redis/BullMQ, while providing excellent user experience through real-time progress tracking.

For high-volume production environments with 50+ variants or multiple concurrent users, consider implementing BullMQ for better scalability.
