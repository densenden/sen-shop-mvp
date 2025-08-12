import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("Fetching artwork collections for store...")
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get collections from the artwork module service
    const collections = await artworkModuleService.listArtworkCollections({})
    console.log("Collections found:", collections?.length || 0)
    
    // Get artworks and group them by collection
    let collectionsWithArtworks = collections || []
    if (collections && collections.length > 0) {
      try {
        const artworks = await artworkModuleService.listArtworks({})
        console.log("Artworks found:", artworks?.length || 0)
        
        // Get all products with pricing using query service
        const { data: allProducts } = await query.graph({
          entity: 'product',
          fields: [
            'id',
            'title',
            'handle',
            'thumbnail',
            'variants.*',
            'variants.price_set.*',
            'variants.price_set.prices.*'
          ]
        })
        console.log("Products found:", allProducts?.length || 0)
        
        // Create a map of artwork ID to products using artwork.product_ids
        const artworkProductMap = new Map()
        for (const artwork of artworks || []) {
          if (artwork.product_ids && Array.isArray(artwork.product_ids)) {
            const artworkProducts: any[] = []
            for (const productId of artwork.product_ids) {
              const product = allProducts.find(p => p.id === productId)
              if (product) {
                // Get price from first variant with proper price set data
                const firstVariant = product.variants?.[0]
                const prices = firstVariant?.price_set?.prices || []
                const eurPrice = prices.find((p: any) => p.currency_code === 'eur') || prices[0]
                const price = eurPrice?.amount || 0
                const currencyCode = 'eur' // Force EUR
                
                artworkProducts.push({
                  id: product.id,
                  title: product.title,
                  handle: product.handle || product.id,
                  thumbnail: product.thumbnail,
                  price: price,
                  currency_code: currencyCode
                })
              }
            }
            artworkProductMap.set(artwork.id, artworkProducts)
          }
        }
        
        // Group artworks by collection and add products
        collectionsWithArtworks = collections.map(collection => ({
          ...collection,
          artwork_count: artworks.filter(artwork => artwork.artwork_collection_id === collection.id).length,
          artworks: artworks.filter(artwork => artwork.artwork_collection_id === collection.id).map(artwork => ({
            ...artwork,
            products: artworkProductMap.get(artwork.id) || []
          })) || []
        }))
      } catch (artworkError) {
        console.log("Could not fetch artworks, returning collections without artworks:", artworkError.message)
        collectionsWithArtworks = collections.map(collection => ({
          ...collection,
          artwork_count: 0,
          artworks: []
        }))
      }
    }
    
    res.json({
      collections: collectionsWithArtworks,
      count: collectionsWithArtworks.length
    })
    
  } catch (error) {
    console.error("Error fetching artwork collections for store:", error)
    
    res.json({
      collections: [],
      count: 0
    })
  }
}
