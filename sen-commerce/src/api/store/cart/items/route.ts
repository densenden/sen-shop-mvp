import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService, IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// POST /api/store/cart/items - Add item to cart
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    const cartId = req.session?.cart_id || req.headers["x-cart-id"]
    
    if (!cartId) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "No cart ID provided" 
      })
    }
    
    const { product_id, variant_id, quantity = 1, metadata = {} } = req.body as any
    
    if (!product_id || !variant_id) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "product_id and variant_id are required"
      })
    }
    
    // Get product and variant details for line item
    const product = await productService.retrieveProduct(product_id, {
      relations: ["variants"]
    })
    
    const variant = product.variants?.find(v => v.id === variant_id)
    if (!variant) {
      return res.status(404).json({
        error: "Variant not found",
        message: "Specified variant not found for this product"
      })
    }
    
    // Default price in cents (e.g., $20.00)
    const unitPrice = 2000
    
    // Add line item to cart using Medusa v2 API
    await cartService.addLineItems(cartId, [
      {
        title: `${product.title} - ${variant.title || 'Default'}`,
        subtitle: product.subtitle || undefined,
        thumbnail: product.thumbnail || undefined,
        variant_id,
        quantity,
        unit_price: unitPrice,
        product_id,
        product_title: product.title,
        product_description: product.description || undefined,
        product_subtitle: product.subtitle || undefined,
        product_handle: product.handle || undefined,
        variant_sku: variant.sku || undefined,
        variant_title: variant.title || undefined,
        metadata: {
          ...metadata,
          product_id
        }
      }
    ])
    
    // Retrieve updated cart with relations
    const cart = await cartService.retrieveCart(cartId, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
    })
    
    res.json({ 
      cart,
      message: "Item added to cart successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart Items] Error adding item:", error)
    res.status(500).json({ 
      error: "Failed to add item to cart",
      message: error.message 
    })
  }
}