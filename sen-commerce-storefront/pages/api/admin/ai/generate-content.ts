/**
 * AI Content Generation API Endpoint
 * Task 4.6: Endpoint for generating AI-powered product content
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIService } from '../../../../src/modules/ai/services/openai-service';
import { memoryCacheService } from '../../../../src/modules/ai/services/cache-service';
import { ContentGenerationRequest } from '../../../../src/modules/ai/types/content-generation';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Initialize OpenAI service
const openAIService = new OpenAIService({
  cacheService: memoryCacheService
});

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  rateLimitRemaining?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = checkRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
        rateLimitRemaining: 0
      });
    }

    // Validate request body
    const validationResult = validateRequest(req.body);
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: validationResult.message
      });
    }

    const request = req.body as ContentGenerationRequest;

    // Support batch generation
    if (Array.isArray(request)) {
      return handleBatchGeneration(req, res, request);
    }

    // Single content generation
    const result = await openAIService.generateContent(request);

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        generatedAt: result.generatedAt.toISOString()
      },
      rateLimitRemaining: rateLimitResult.remaining
    });

  } catch (error) {
    console.error('AI content generation API error:', error);

    // Determine if this is a client error or server error
    const isClientError = error instanceof Error && (
      error.message.includes('validation') ||
      error.message.includes('invalid') ||
      error.message.includes('required')
    );

    const statusCode = isClientError ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      error: isClientError ? 'Invalid request' : 'Internal server error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
}

/**
 * Handle batch content generation
 */
async function handleBatchGeneration(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  requests: ContentGenerationRequest[]
): Promise<void> {
  const maxBatchSize = 5; // Limit batch size to prevent timeouts

  if (requests.length > maxBatchSize) {
    return res.status(400).json({
      success: false,
      error: 'Batch too large',
      message: `Maximum batch size is ${maxBatchSize}. Received ${requests.length} requests.`
    });
  }

  try {
    const results = await Promise.allSettled(
      requests.map(request => openAIService.generateContent(request))
    );

    const successful: any[] = [];
    const errors: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push({
          index,
          data: {
            ...result.value,
            generatedAt: result.value.generatedAt.toISOString()
          }
        });
      } else {
        errors.push({
          index,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        successful,
        errors,
        total: requests.length,
        successCount: successful.length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Batch generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Batch generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Validate request body
 */
function validateRequest(body: any): { valid: boolean; message?: string } {
  if (!body) {
    return { valid: false, message: 'Request body is required' };
  }

  // Handle batch requests
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return { valid: false, message: 'Batch request cannot be empty' };
    }

    for (let i = 0; i < body.length; i++) {
      const itemValidation = validateSingleRequest(body[i]);
      if (!itemValidation.valid) {
        return { valid: false, message: `Item ${i}: ${itemValidation.message}` };
      }
    }

    return { valid: true };
  }

  // Single request validation
  return validateSingleRequest(body);
}

/**
 * Validate single content generation request
 */
function validateSingleRequest(request: any): { valid: boolean; message?: string } {
  if (!request.productName || typeof request.productName !== 'string') {
    return { valid: false, message: 'productName is required and must be a string' };
  }

  if (request.productName.trim().length === 0) {
    return { valid: false, message: 'productName cannot be empty' };
  }

  if (request.productName.length > 200) {
    return { valid: false, message: 'productName must be less than 200 characters' };
  }

  // Validate optional fields
  if (request.artworkInfo) {
    if (request.artworkInfo.name && typeof request.artworkInfo.name !== 'string') {
      return { valid: false, message: 'artworkInfo.name must be a string' };
    }
  }

  if (request.seoKeywords) {
    if (!Array.isArray(request.seoKeywords)) {
      return { valid: false, message: 'seoKeywords must be an array' };
    }

    if (request.seoKeywords.length > 10) {
      return { valid: false, message: 'seoKeywords cannot have more than 10 items' };
    }
  }

  if (request.brandVoice) {
    const validVoices = ['professional', 'casual', 'artistic', 'trendy'];
    if (!validVoices.includes(request.brandVoice)) {
      return { valid: false, message: `brandVoice must be one of: ${validVoices.join(', ')}` };
    }
  }

  return { valid: true };
}

/**
 * Rate limiting implementation
 */
function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean up old entries
  for (const [ip, data] of rateLimitMap.entries()) {
    if (data.resetTime < windowStart) {
      rateLimitMap.delete(ip);
    }
  }

  const currentData = rateLimitMap.get(clientIp);

  if (!currentData || currentData.resetTime < windowStart) {
    // New window
    rateLimitMap.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
  }

  if (currentData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentData.resetTime
    };
  }

  // Increment count
  currentData.count++;

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - currentData.count,
    resetTime: currentData.resetTime
  };
}

/**
 * Extract client IP address
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress;

  return ip || 'unknown';
}