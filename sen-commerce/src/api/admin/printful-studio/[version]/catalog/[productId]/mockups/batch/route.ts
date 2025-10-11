import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../../../../service-resolver"

interface BatchMockupRequest {
  variant_id: string
  mockup_style_id?: number
}

interface BatchMockupRequestPayload {
  requests: BatchMockupRequest[]
  artwork_id?: string
  artwork_url?: string
  product_options?: Record<string, string>
  wait_for_completion?: boolean
}

interface BatchMockupResponse {
  success: boolean
  results: Array<{
    variant_id: string
    mockup_style_id?: number
    mockup_url?: string
    error?: string
    duration_ms: number
  }>
  total_duration_ms: number
  rate_limit_waits_ms: number
}

// Global rate limiter - tracks last request time across all requests
let lastPrintfulRequestTime = 0
const MIN_REQUEST_GAP_MS = 35000 // 35 seconds between requests to Printful

async function waitForRateLimit(): Promise<number> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastPrintfulRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_GAP_MS) {
    const waitTimeMs = MIN_REQUEST_GAP_MS - timeSinceLastRequest
    console.log(`[batch-mockups] Rate limit protection: waiting ${Math.ceil(waitTimeMs / 1000)}s`)
    await new Promise(resolve => setTimeout(resolve, waitTimeMs))
    return waitTimeMs
  }

  return 0
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const startTime = Date.now()
  let totalWaitTime = 0

  try {
    const { version, productId } = req.params as { version: string; productId: string }
    const body = (req.body || {}) as BatchMockupRequestPayload

    console.log('[batch-mockups] Batch request received:', {
      version,
      productId,
      request_count: body.requests?.length || 0
    })

    if (!body.requests || body.requests.length === 0) {
      res.status(400).json({
        success: false,
        error: 'no_requests',
        message: 'No mockup requests provided'
      })
      return
    }

    const service = resolvePrintfulStudioService(req, version)
    const results: BatchMockupResponse['results'] = []

    // Process requests one at a time with rate limiting
    for (let i = 0; i < body.requests.length; i++) {
      const request = body.requests[i]
      const requestStartTime = Date.now()

      // Wait for rate limit if needed (skip for first request)
      if (i > 0) {
        const waitTime = await waitForRateLimit()
        totalWaitTime += waitTime
      }

      try {
        console.log(`[batch-mockups] Processing request ${i + 1}/${body.requests.length}:`, {
          variant_id: request.variant_id,
          mockup_style_id: request.mockup_style_id
        })

        // Update last request time BEFORE making the request
        lastPrintfulRequestTime = Date.now()

        const mockupResult = await service.generateMockups({
          productId,
          variantIds: [request.variant_id],
          artworkId: body.artwork_id,
          artworkUrl: body.artwork_url,
          mockupStyleIds: request.mockup_style_id ? [request.mockup_style_id] : undefined,
          productOptions: body.product_options,
          maxMockups: 1,
          waitForCompletion: body.wait_for_completion !== false,
        })

        const duration = Date.now() - requestStartTime

        if (mockupResult.mockup_urls && mockupResult.mockup_urls.length > 0) {
          results.push({
            variant_id: request.variant_id,
            mockup_style_id: request.mockup_style_id,
            mockup_url: mockupResult.mockup_urls[0],
            duration_ms: duration
          })
          console.log(`[batch-mockups] ✅ Success ${i + 1}/${body.requests.length} (${Math.round(duration / 1000)}s)`)
        } else {
          results.push({
            variant_id: request.variant_id,
            mockup_style_id: request.mockup_style_id,
            error: 'No mockup generated',
            duration_ms: duration
          })
          console.log(`[batch-mockups] ❌ Failed ${i + 1}/${body.requests.length}: No mockup generated`)
        }

      } catch (error: any) {
        const duration = Date.now() - requestStartTime
        results.push({
          variant_id: request.variant_id,
          mockup_style_id: request.mockup_style_id,
          error: error?.message || 'Unknown error',
          duration_ms: duration
        })
        console.error(`[batch-mockups] ❌ Error ${i + 1}/${body.requests.length}:`, error?.message)
      }
    }

    const totalDuration = Date.now() - startTime
    const successCount = results.filter(r => r.mockup_url).length
    const failureCount = results.filter(r => r.error).length

    console.log('[batch-mockups] Batch complete:', {
      total: results.length,
      success: successCount,
      failed: failureCount,
      total_duration_s: Math.round(totalDuration / 1000),
      rate_limit_wait_s: Math.round(totalWaitTime / 1000)
    })

    res.json({
      success: true,
      results,
      total_duration_ms: totalDuration,
      rate_limit_waits_ms: totalWaitTime
    } as BatchMockupResponse)

  } catch (error: any) {
    console.error("[batch-mockups] Fatal error", error)
    res.status(500).json({
      success: false,
      error: "batch_failed",
      message: error?.message ?? "Failed to process batch mockup request",
    })
  }
}
