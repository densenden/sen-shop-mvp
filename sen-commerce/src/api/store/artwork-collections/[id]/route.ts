import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ARTWORK_MODULE } from "../../../../modules/artwork-module"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    console.log("Fetching artwork collection for store:", id)
    
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    
    // Get the specific collection
    const collection = await artworkModuleService.retrieveArtworkCollection(id)
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" })
    }
    
    console.log("Collection found:", collection.name)
    
    try {
      // Get artworks for this collection
      const artworks = await artworkModuleService.listArtworks({
        artwork_collection_id: id
      })
      console.log("Artworks found:", artworks?.length || 0)
      
      // Get all products with pricing using query service for better price data
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
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
      
      // Add products to artworks
      const artworksWithProducts = artworks.map(artwork => ({
        ...artwork,
        products: artworkProductMap.get(artwork.id) || []
      }))
      
      const collectionWithArtworks = {
        ...collection,
        artwork_count: artworks.length,
        artworks: artworksWithProducts
      }
      
      res.json({
        collection: collectionWithArtworks
      })
      
    } catch (artworkError) {
      console.error("Error fetching artworks:", artworkError)
      console.log("Could not fetch artworks, returning collection without artworks:", artworkError.message)
      res.json({
        collection: {
          ...collection,
          artwork_count: 0,
          artworks: []
        }
      })
    }
    
  } catch (error) {
    console.error("Error fetching artwork collection for store:", error)
    res.status(500).json({ 
      error: "Failed to fetch collection",
      message: error.message 
    })
  }
}
