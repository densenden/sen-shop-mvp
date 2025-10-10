import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../../modules/artwork-module"
import sharp from "sharp"
import fetch from "node-fetch"

/**
 * GET /admin/artworks/:id/preview
 * Generate and serve low-res preview (max 800px) for faster loading in selectors
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Artwork ID is required" })
    }

    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    const artwork = await artworkModuleService.retrieveArtwork(id)

    if (!artwork || !artwork.image_url) {
      return res.status(404).json({ error: "Artwork not found" })
    }

    console.log(`[Preview] Generating preview for artwork ${id}: ${artwork.image_url}`)

    // Fetch original artwork image
    const imageResponse = await fetch(artwork.image_url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch artwork image: ${imageResponse.statusText}`)
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Generate low-res preview (max 800px width, maintain aspect ratio)
    const previewBuffer = await sharp(imageBuffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true // Don't upscale if already smaller
      })
      .jpeg({ quality: 75 }) // Lower quality for faster loading
      .toBuffer()

    console.log(`[Preview] Generated preview for artwork ${id}`)

    // Set aggressive cache headers (previews rarely change)
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=2592000') // Cache for 30 days
    res.send(previewBuffer)

  } catch (error) {
    console.error("[Preview] Error generating preview:", error)
    res.status(500).json({
      error: "Failed to generate preview",
      message: error.message
    })
  }
}
