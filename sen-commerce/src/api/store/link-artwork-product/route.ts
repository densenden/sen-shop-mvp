import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { artwork_id, printful_product_ids } = req.body as {
      artwork_id: string
      printful_product_ids: string[]
    }

    if (!artwork_id || !printful_product_ids || !Array.isArray(printful_product_ids)) {
      return res.status(400).json({ 
        error: "artwork_id and printful_product_ids array are required" 
      })
    }

    console.log(`Linking artwork ${artwork_id} to products:`, printful_product_ids)

    // Get the artwork module service
    try {
      const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
      
      if (!artworkModuleService) {
        return res.status(500).json({ 
          error: "Artwork module service not available" 
        })
      }

      // Get the current artwork
      const [artworks] = await artworkModuleService.listAndCountArtworks({ id: artwork_id })
      
      if (!artworks || artworks.length === 0) {
        return res.status(404).json({ 
          error: "Artwork not found" 
        })
      }

      const artwork = artworks[0]

      console.log("Current artwork:", artwork.title)
      console.log("Current product_ids:", artwork.product_ids)

      // Update the artwork with the new product IDs
      const currentProductIds = artwork.product_ids || {}
      
      // Add new product IDs to the existing ones
      const updatedProductIds = { ...currentProductIds }
      printful_product_ids.forEach(productId => {
        updatedProductIds[productId] = {
          provider: 'printful',
          linked_at: new Date().toISOString(),
          status: 'active'
        }
      })

      console.log("Updated product_ids:", updatedProductIds)
      console.log("Updating artwork with ID:", artwork_id)
      console.log("Artwork object ID:", artwork.id)

      // Update the artwork
      const updatedArtwork = await artworkModuleService.updateArtworks(artwork.id, {
        product_ids: updatedProductIds
      })

      console.log("Artwork updated successfully")

      res.json({
        success: true,
        artwork_id,
        linked_products: printful_product_ids,
        updated_artwork: {
          id: updatedArtwork.id,
          title: updatedArtwork.title,
          product_ids: updatedArtwork.product_ids
        }
      })

    } catch (error) {
      console.error("Error linking artwork to products:", error)
      res.status(500).json({ 
        error: "Failed to link artwork to products",
        message: error.message 
      })
    }

  } catch (error) {
    console.error("Link artwork-product API error:", error)
    res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    })
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { artwork_id } = req.query

    if (!artwork_id) {
      return res.status(400).json({ 
        error: "artwork_id query parameter is required" 
      })
    }

    console.log(`Getting linked products for artwork: ${artwork_id}`)

    // Get the artwork module service
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    
    if (!artworkModuleService) {
      return res.status(500).json({ 
        error: "Artwork module service not available" 
      })
    }

    // Get the artwork
    const [artworks] = await artworkModuleService.listAndCountArtworks({ id: artwork_id as string })
    
    if (!artworks || artworks.length === 0) {
      return res.status(404).json({ 
        error: "Artwork not found" 
      })
    }

    const artwork = artworks[0]

    const linkedProducts = artwork.product_ids || {}
    const productIds = Object.keys(linkedProducts)

    console.log(`Found ${productIds.length} linked products`)

    res.json({
      success: true,
      artwork_id,
      artwork_title: artwork.title,
      linked_products: linkedProducts,
      product_count: productIds.length
    })

  } catch (error) {
    console.error("Get linked products error:", error)
    res.status(500).json({ 
      error: "Failed to get linked products",
      message: error.message 
    })
  }
}