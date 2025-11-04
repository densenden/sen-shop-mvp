import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getOpenAIService } from "../../../../modules/ai/services/openai-service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { image_url } = req.body as { image_url: string }

    if (!image_url) {
      return res.status(400).json({
        error: "Missing required field: image_url"
      })
    }

    console.log("[Artwork Analysis] Analyzing image:", image_url)

    // Get OpenAI service and analyze the image
    const openAIService = getOpenAIService()
    const description = await openAIService.analyzeArtworkImage(image_url)

    console.log("[Artwork Analysis] Analysis completed, description length:", description.length)

    res.json({
      description,
      analyzed: !!description
    })
  } catch (error) {
    console.error("[Artwork Analysis] Error analyzing image:", error)
    res.status(500).json({
      error: "Failed to analyze image",
      message: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
