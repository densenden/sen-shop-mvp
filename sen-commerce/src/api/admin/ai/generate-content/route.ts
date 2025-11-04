import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { getOpenAIService } from "../../../../modules/ai/services/openai-service"
import type { ContentGenerationRequest, ContentVariation } from "../../../../modules/ai/types"

/**
 * POST /api/admin/ai/generate-content
 * Generate AI-powered content variations for POD products
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const request = req.body as ContentGenerationRequest

    if (!request.product_context) {
      return res.status(400).json({
        message: "Product context is required for content generation"
      })
    }

    const {
      generation_options = {},
      output_format = 'json'
    } = request

    const {
      variation_count = 3,
      tone = 'professional',
      length = 'medium',
      include_seo = true
    } = generation_options

    // Validate variation count
    if (variation_count < 1 || variation_count > 5) {
      return res.status(400).json({
        message: "Variation count must be between 1 and 5"
      })
    }

    // Get OpenAI service and generate content
    const aiService = getOpenAIService()
    const serviceStatus = aiService.getStatus()

    const variations = await aiService.generateContent(request)

    const response = {
      variations,
      cached: false,
      generated_at: new Date().toISOString(),
      generation_stats: {
        variations_generated: variations.length,
        tone_used: tone,
        length_setting: length,
        seo_optimized: include_seo,
        using_openai: serviceStatus.available,
        using_mock: serviceStatus.usingMock
      }
    }

    if (output_format === 'text') {
      // Return plain text format for easy copying
      const textOutput = variations.map((variation, index) =>
        formatVariationAsText(variation, index + 1)
      ).join('\n\n---\n\n')

      res.setHeader('Content-Type', 'text/plain')
      res.send(textOutput)
    } else {
      res.json(response)
    }

  } catch (error: any) {
    console.error("Error generating AI content:", error)
    res.status(500).json({
      message: "Failed to generate AI content",
      error: error.message
    })
  }
}

/**
 * Format variation as plain text
 */
function formatVariationAsText(variation: ContentVariation, index: number): string {
  let text = `Variation ${index}:\n\n`
  text += `Title: ${variation.title}\n\n`
  text += `Description: ${variation.description}\n\n`

  if (variation.bullet_points && variation.bullet_points.length > 0) {
    text += 'Features:\n'
    variation.bullet_points.forEach(point => {
      text += `• ${point}\n`
    })
    text += '\n'
  }

  if (variation.seo_title) {
    text += `SEO Title: ${variation.seo_title}\n`
  }

  if (variation.meta_description) {
    text += `Meta Description: ${variation.meta_description}\n`
  }

  if (variation.keywords && variation.keywords.length > 0) {
    text += `Keywords: ${variation.keywords.join(', ')}\n`
  }

  if (variation.url_slug) {
    text += `URL Slug: ${variation.url_slug}\n`
  }

  if (variation.tags && variation.tags.length > 0) {
    text += `Tags: ${variation.tags.join(', ')}\n`
  }

  return text
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]