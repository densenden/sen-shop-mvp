import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Removed admin check: now any user (even not logged in) can access this endpoint
  try {
    const service = new PrintfulPodProductService(req.scope)
    const products = await service.fetchPrintfulProducts()
    const { id } = req.query

    // --- Join artwork info for each product ---
    // Get all artworks (for mapping product_ids)
    const artworkService = req.scope.resolve(ARTWORK_MODULE)
    const artworks = await artworkService.listArtworks()
    // Build a map: productId -> artwork
    const productIdToArtwork = new Map()
    for (const artwork of artworks) {
      if (Array.isArray(artwork.product_ids)) {
        for (const pid of artwork.product_ids) {
          productIdToArtwork.set(pid, artwork)
        }
      }
    }
    // Add artwork info to each product
    const productsWithArtwork = products.map((p: any) => {
      const linkedArtwork = productIdToArtwork.get(String(p.id))
      return {
        ...p,
        artwork_id: linkedArtwork ? linkedArtwork.id : undefined,
        artwork_title: linkedArtwork ? linkedArtwork.title : undefined,
      }
    })

    if (id) {
      // Find the product with the matching id (as string)
      const product = productsWithArtwork.find((p: any) => String(p.id) === String(id))
      if (product) {
        res.json({ product })
      } else {
        res.status(404).json({ error: "Product not found" })
      }
    } else {
      res.json({ products: productsWithArtwork })
    }
  } catch (error: any) {
    console.error("Error fetching Printful products:", error)
    res.status(500).json({ error: error.message || "Failed to fetch Printful products" })
  }
} 