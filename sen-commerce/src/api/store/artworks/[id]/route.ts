import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../../modules/artwork-module/services/artwork-module-service"
import { IProductModuleService, ProductDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        error: "Artwork ID is required"
      })
    }

    console.log(`[Store API] Fetching artwork with ID: ${id}`)

    const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    if (!artworkModuleService) {
      return res.status(500).json({
        error: "Artwork service not available"
      })
    }

    // Get artwork by ID (without relations since artwork_collection is just an ID)
    const artwork = await artworkModuleService.retrieveArtwork(id)

    if (!artwork) {
      console.log(`[Store API] Artwork not found with ID: ${id}`)
      return res.status(404).json({
        error: "Artwork not found"
      })
    }

    console.log(`[Store API] Found artwork: ${artwork.title}`)

    // Get related products for this artwork
    let relatedProducts: ProductDTO[] = []
    try {
      console.log(`[Store API] artwork.product_ids:`, artwork.product_ids, 'type:', typeof artwork.product_ids)
      
      // Handle different formats of product_ids (same as in list API)
      let productIds: string[] = []
      if (artwork.product_ids) {
        if (Array.isArray(artwork.product_ids)) {
          productIds = artwork.product_ids.filter(id => typeof id === 'string')
        } else if (typeof artwork.product_ids === 'string') {
          try {
            const parsed = JSON.parse(artwork.product_ids)
            productIds = Array.isArray(parsed) ? parsed : []
          } catch {
            productIds = [artwork.product_ids]
          }
        }
      }
      
      console.log(`[Store API] Resolved product IDs for artwork ${id}:`, productIds)
      
      if (productIds.length > 0) {
        console.log(`[Store API] Attempting to fetch products with IDs:`, productIds)
        
        // Try to fetch each product individually
        const productPromises = productIds.map(async (productId) => {
          try {
            const product = await productService.retrieveProduct(productId, {
              relations: ["variants", "variants.prices"]
            })
            return product
          } catch (error) {
            console.log(`[Store API] Could not fetch product ${productId}:`, error.message)
            return null
          }
        })
        
        const productResults = await Promise.all(productPromises)
        relatedProducts = productResults.filter(p => p !== null)
        
        console.log(`[Store API] Found ${relatedProducts.length} related products`)
        if (relatedProducts.length > 0) {
          console.log(`[Store API] Product details:`, relatedProducts.map(p => ({ id: p.id, title: p.title })))
        }
      } else {
        console.log(`[Store API] No product_ids found for artwork ${id}`)
      }
    } catch (error) {
      console.warn("Could not fetch related products:", error)
    }

    // Format response
    const response = {
      id: artwork.id,
      title: artwork.title,
      description: artwork.description,
      image_url: artwork.image_url,
      artwork_collection_id: artwork.artwork_collection_id,
      artist_name: artwork.artist_name,
      creation_date: artwork.creation_date,
      dimensions: artwork.dimensions,
      style: artwork.style,
      brand_story: artwork.brand_story,
      tags: artwork.tags ? (Array.isArray(artwork.tags) ? artwork.tags : [artwork.tags]) : [],
      products: relatedProducts
    }

    res.json({ artwork: response })

  } catch (error) {
    console.error("[Store API] Error fetching artwork:", error)
    res.status(500).json({
      error: "Failed to fetch artwork",
      message: error.message
    })
  }
}