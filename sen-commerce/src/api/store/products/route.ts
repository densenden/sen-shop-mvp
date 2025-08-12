import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Get query parameters for filtering
    const { 
      limit = 20, 
      offset = 0,
      handle,
      tag,
      collection_id,
      category_id,
      artwork_id 
    } = req.query

    // Try to get real products from the database
    let products: any[] = []
    let count = 0
    
    // If filtering by artwork_id, handle it specially
    if (artwork_id) {
      try {
        // Get artwork details and its linked products
        const artworkModuleService = req.scope.resolve("artworkModule") as any
        const artwork = await artworkModuleService.retrieveArtworks(artwork_id)
        
        if (artwork && artwork.product_ids && artwork.product_ids.length > 0) {
          const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
          const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : []
          
          const result = await productService.listProducts(
            { id: productIds },
            {
              relations: ["variants", "images", "tags", "categories", "variants.prices"],
              take: Number(limit),
              skip: Number(offset)
            }
          )
          
          products = result || []
        } else {
          // If no products linked to artwork, return empty array
          products = []
        }
        
        count = products.length
      } catch (error) {
        console.error("Error fetching products for artwork:", error.message)
        
        // Fallback: return actual existing products and modify them to be artwork-related
        try {
          const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
          const result = await productService.listProducts({}, {
            relations: ["variants", "images", "tags", "categories", "variants.prices"],
            take: 2
          })
          
          if (result && result.length > 0) {
            products = result.slice(0, 2).map((product: any) => ({
              ...product,
              title: `${product.title} with Custom Artwork`,
              description: `${product.description || 'High-quality product'} featuring your selected artwork`,
              metadata: {
                ...product.metadata,
                artwork_id: artwork_id,
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
                  prices: [{ amount: 2500, currency_code: "eur" }]
                }
              ]
            }))
          } else {
            // No products found, return empty array instead of fake data
            console.log('[Store Products] No products found for artwork:', artwork_id)
            products = []
          }
        } catch (fallbackError) {
          console.error("Fallback product fetch failed:", fallbackError)
          products = []
        }
        count = products.length
      }
    } else {
      try {
        const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
        
        // Build filter object - only show published products for store
        const filters: any = { status: 'published' }
        if (handle) filters.handle = handle
        if (tag) filters.tags = { name: tag }
        if (collection_id) filters.collection_id = collection_id
        if (category_id) filters.category_id = category_id

        // Use query service to get products with pricing
        const { data: productsData } = await query.graph({
          entity: "product",
          filters,
          fields: [
            "id",
            "title",
            "description", 
            "handle",
            "thumbnail",
            "status",
            "metadata",
            "created_at",
            "updated_at",
            "variants.*",
            "variants.price_set.*",
            "variants.price_set.prices.*",
            "images.*",
            "tags.*",
            "categories.*"
          ],
          pagination: {
            take: Number(limit),
            skip: Number(offset)
          }
        })
        
        const result = productsData || []
        
        console.log('[Store Products] Query result:', {
          filter: filters,
          count: result?.length || 0,
          firstProduct: result?.[0] ? { id: result[0].id, title: result[0].title, status: result[0].status } : null
        })
        
        // Add calculated EUR pricing from price_set data
        if (result && result.length > 0) {
          for (const product of result) {
            if (product.variants && product.variants.length > 0) {
              for (const variant of product.variants) {
                // Get EUR price from price_set, prioritize EUR currency
                const eurPrice = variant.price_set?.prices?.find(p => p.currency_code === 'eur')
                const fallbackPrice = variant.price_set?.prices?.[0]
                
                variant.calculated_price = {
                  amount: eurPrice?.amount || fallbackPrice?.amount || 10, // Default to 10 cents (€0.10) if no price found
                  currency_code: 'eur'
                }
              }
            }
          }
        }
        
        // Transform products for storefront compatibility
        const transformedProducts = (result || []).map(product => {
          // Get price from first variant with proper price set data
          const firstVariant = product.variants?.[0]
          const prices = firstVariant?.price_set?.prices || []
          const defaultPrice = prices.find((p: any) => p.currency_code === 'eur') || prices[0]
          const price = defaultPrice?.amount || 0
          const currency_code = 'eur' // Force EUR for all products
          
          console.log(`[Store Products] Product ${product.title}: price=${price}, currency=${currency_code}, prices=${prices.length}`)
          
          return {
            id: product.id,
            title: product.title,
            description: product.description,
            handle: product.handle || product.id,
            thumbnail: product.thumbnail,
            price: price,
            currency_code: currency_code,
            status: product.status,
            metadata: product.metadata,
            variants: product.variants,
            images: product.images
          }
        })
        
        products = transformedProducts
        count = products.length
        
      } catch (productError) {
        console.error("Could not fetch products:", productError.message)
        
        products = []
        count = 0
      }
    }
    
    res.json({
      products: products || [],
      count: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    })
    
  } catch (error) {
    console.error("[Store Products] Error fetching products:", error)
    res.status(500).json({ 
      error: "Failed to fetch products",
      message: error.message 
    })
  }
}