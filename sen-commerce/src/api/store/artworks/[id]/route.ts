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

    // Get artwork by ID
    const artwork = await artworkModuleService.retrieveArtwork(id, {
      relations: ["artwork_collection"]
    })

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
      if (Array.isArray(artwork.product_ids) && artwork.product_ids.length > 0) {
        const productResult: ProductDTO[] = await productService.listProducts({
          id: artwork.product_ids as string[],
        }, {
          relations: ["variants", "variants.prices"]
        })
        relatedProducts = productResult || []
        console.log(`[Store API] Found ${relatedProducts.length} related products`)
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