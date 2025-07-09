import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../../modules/artwork-module"

// POST /admin/printful-products/:id/link-artwork
// Links a Printful product to an artwork by updating the artwork's product_ids field
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    const artwork_id = body.artwork_id
    const { id: printfulProductId } = req.params
    if (!printfulProductId || !artwork_id) {
      return res.status(400).json({ error: "Missing id or artwork_id" })
    }
    // Resolve the artwork service
    const artworkService = req.scope.resolve(ARTWORK_MODULE)
    // Fetch the artwork
    const artwork = await artworkService.retrieveArtwork(artwork_id)
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" })
    }
    // Ensure printfulProductId is a string
    const printfulProductIdStr = Array.isArray(printfulProductId) ? printfulProductId[0] : printfulProductId
    // Add the Printful product ID to the artwork's product_ids array (avoid duplicates)
    const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : []
    if (!productIds.includes(printfulProductIdStr)) {
      productIds.push(printfulProductIdStr)
    }
    // Use the same update pattern as the working artwork PUT route
    const updateData = { product_ids: productIds }
    const updated = await (artworkService.updateArtworks as any)({ id: artwork_id, ...updateData } as any)
    res.json({ success: true, updated })
  } catch (error: any) {
    console.error("Error linking artwork:", error)
    res.status(500).json({ error: error.message || "Failed to link artwork" })
  }
} 