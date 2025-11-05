import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../../modules/artwork-module"
import sharp from "sharp"
import fetch from "node-fetch"
import path from "path"
import fs from "fs"

/**
 * GET /admin/artworks/:id/watermark
 * Generate and serve watermarked artwork image (for product images)
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: "Artwork ID is required" })
    }

    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)

    // Use listArtworks with filter since retrieveArtwork might not be available
    const artworks = await artworkModuleService.listArtworks({ id })
    const artwork = artworks?.[0]

    if (!artwork || !artwork.image_url) {
      return res.status(404).json({ error: "Artwork not found" })
    }

    console.log(`[Watermark] Processing artwork ${id}: ${artwork.image_url}`)

    // Fetch original artwork image
    const imageResponse = await fetch(artwork.image_url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch artwork image: ${imageResponse.statusText}`)
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Load logo.svg
    const logoPath = path.join(process.cwd(), 'public', 'logo.svg')
    if (!fs.existsSync(logoPath)) {
      console.warn('[Watermark] logo.svg not found, serving unwatermarked image')
      res.setHeader('Content-Type', 'image/jpeg')
      return res.send(imageBuffer)
    }

    const logoBuffer = fs.readFileSync(logoPath)

    // Get image dimensions
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()
    const { width = 1000, height = 1000 } = metadata

    // Calculate watermark size (20% of image width)
    const watermarkWidth = Math.floor(width * 0.2)

    // Convert SVG logo to PNG with transparency and resize
    const watermarkBuffer = await sharp(logoBuffer)
      .resize(watermarkWidth)
      .png()
      .toBuffer()

    // Composite watermark in center with semi-transparency
    const watermarkedImage = await image
      .composite([{
        input: watermarkBuffer,
        gravity: 'center',
        blend: 'over'
      }])
      .jpeg({ quality: 85 })
      .toBuffer()

    console.log(`[Watermark] Successfully watermarked artwork ${id}`)

    // Set cache headers
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000') // Cache for 1 year
    res.send(watermarkedImage)

  } catch (error) {
    console.error("[Watermark] Error processing artwork image:", error)
    res.status(500).json({
      error: "Failed to process artwork image",
      message: error.message
    })
  }
}
