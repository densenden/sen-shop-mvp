import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /store/customers/me/favorites - Get customer's favorite products
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const customer_id = req.query.customer_id as string
    const customer_email = req.query.customer_email as string
    const favorite_ids = req.query.favorite_ids as string
    
    if (!favorite_ids) {
      return res.json({ favorites: [] })
    }
    
    // Parse favorite IDs from comma-separated string
    const favoriteIds = favorite_ids.split(',').filter(id => id.trim())
    
    if (favoriteIds.length === 0) {
      return res.json({ favorites: [] })
    }
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get products that match the favorite IDs
    const { data: products } = await query.graph({
      entity: "product",
      filters: {
        id: favoriteIds
      },
      fields: [
        "id",
        "title",
        "handle",
        "description",
        "thumbnail",
        "images.*",
        "variants.*",
        "variants.calculated_price.*",
        "metadata"
      ],
    })
    
    // Format products for response
    const favorites = (products || []).map((product: any) => {
      // Get the default variant or first variant
      const defaultVariant = product.variants?.find((v: any) => v.is_default) || product.variants?.[0]
      
      // Get price from variant
      let price = 0
      let currency_code = 'eur'
      if (defaultVariant?.calculated_price) {
        price = defaultVariant.calculated_price.calculated_amount || 0
        currency_code = defaultVariant.calculated_price.currency_code || 'eur'
      }
      
      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description,
        thumbnail: product.thumbnail || product.images?.[0]?.url,
        price,
        currency_code,
        in_stock: defaultVariant?.inventory_quantity > 0,
        metadata: product.metadata || {}
      }
    })
    
    res.json({ 
      favorites,
      count: favorites.length 
    })
    
  } catch (error) {
    console.error("Error fetching favorites:", error)
    res.status(500).json({ error: "Failed to fetch favorites" })
  }
}

// POST /store/customers/me/favorites - Add product to favorites
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { product_id } = req.body
    
    if (!product_id) {
      return res.status(400).json({ error: "Product ID required" })
    }
    
    // This endpoint is mainly for tracking - actual storage happens client-side
    // We just validate the product exists
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    const { data: products } = await query.graph({
      entity: "product",
      filters: { id: product_id },
      fields: ["id", "title"],
    })
    
    if (!products || products.length === 0) {
      return res.status(404).json({ error: "Product not found" })
    }
    
    res.json({ 
      success: true,
      product_id 
    })
    
  } catch (error) {
    console.error("Error adding favorite:", error)
    res.status(500).json({ error: "Failed to add favorite" })
  }
}

// DELETE /store/customers/me/favorites/:id - Remove product from favorites
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productId = req.params.id
    
    // This endpoint is mainly for tracking - actual storage happens client-side
    res.json({ 
      success: true,
      product_id: productId 
    })
    
  } catch (error) {
    console.error("Error removing favorite:", error)
    res.status(500).json({ error: "Failed to remove favorite" })
  }
}