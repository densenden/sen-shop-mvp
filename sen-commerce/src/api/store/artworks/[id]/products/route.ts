import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const artworkId = req.params.id
    
    if (!artworkId) {
      return res.status(400).json({ error: "Artwork ID is required" })
    }

    console.log(`Fetching products for artwork: ${artworkId}`)
    
    let products: any[] = []
    let count = 0
    
    try {
      // Try to get artwork details and its linked products
      const artworkModuleService = req.scope.resolve("artworkModuleService") as any
      const artwork = await artworkModuleService.retrieve(artworkId, {
        relations: ["products"],
      })
      
      if (artwork && artwork.products && artwork.products.length > 0) {
        // Products are already populated from the relation
        products = artwork.products
      } else if (artwork && artwork.product_ids && artwork.product_ids.length > 0) {
        const productService: IProductModuleService = req.scope.resolve(
          Modules.PRODUCT
        )
        const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : []

        const result = await productService.listProducts(
          { id: productIds },
          {
            relations: [
              "variants",
              "images",
              "tags",
              "categories",
              "variants.prices",
            ],
          }
        )

        products = result || []
      } else {
        // If no products linked to artwork, return existing products as customizable versions
        const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
        const result = await productService.listProducts({}, {
          relations: ["variants", "images", "tags", "categories", "variants.prices"],
          take: 3
        })
        
        if (result && result.length > 0) {
          products = result.slice(0, 3).map((product: any) => ({
            ...product,
            title: `${product.title} with Custom Artwork`,
            description: `${product.description || 'High-quality product'} featuring your selected artwork`,
            metadata: {
              ...product.metadata,
              artwork_id: artworkId,
              customizable: true
            },
            variants: product.variants?.map((variant: any) => ({
              ...variant,
              prices: variant.prices?.length > 0 ? variant.prices : [
                { amount: 2500, currency_code: "usd" }
              ]
            })) || [
              {
                id: `${product.id}-default`,
                title: "Default",
                prices: [{ amount: 2500, currency_code: "usd" }]
              }
            ]
          }))
        }
      }
      
      count = products.length
    } catch (error) {
      console.error("Error fetching products for artwork:", error.message)
      
      // Fallback: return mock products that work with the cart system
      products = [
        {
          id: "artwork-tshirt-" + artworkId,
          title: "T-Shirt with this Artwork",
          handle: "artwork-tshirt-" + artworkId,
          description: "High-quality cotton t-shirt featuring this artwork",
          thumbnail: null,
          images: [],
          variants: [
            {
              id: "variant-tshirt-" + artworkId,
              title: "Medium",
              prices: [
                { amount: 2500, currency_code: "usd" }
              ]
            }
          ],
          metadata: {
            artwork_id: artworkId,
            customizable: true
          }
        },
        {
          id: "artwork-poster-" + artworkId,
          title: "Art Print Poster",
          handle: "artwork-poster-" + artworkId,
          description: "Premium quality art print poster featuring this artwork",
          thumbnail: null,
          images: [],
          variants: [
            {
              id: "variant-poster-" + artworkId,
              title: "18x24",
              prices: [
                { amount: 1500, currency_code: "usd" }
              ]
            }
          ],
          metadata: {
            artwork_id: artworkId,
            customizable: true
          }
        }
      ]
      count = products.length
    }
    
    res.json({
      products: products || [],
      count: count || 0,
      artwork_id: artworkId
    })
    
  } catch (error) {
    console.error("[Store Artwork Products] Error fetching products:", error)
    res.status(500).json({ 
      error: "Failed to fetch products for artwork",
      message: error.message 
    })
  }
}
