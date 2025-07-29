import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ICartModuleService, IProductModuleService } from "@medusajs/types"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const { id: cartId } = req.params
    const { variant_id, quantity = 1 } = req.body as any

    try {
      // Get the product variant to get real data
      const variants = await productService.listProductVariants({ id: variant_id })
      const variant = variants[0]
      
      if (!variant) {
        return res.status(404).json({ error: "Product variant not found" })
      }

      // Get the product to get the title
      if (!variant.product_id) {
        return res.status(400).json({ error: "Product variant has no associated product" })
      }
      
      const product = await productService.retrieveProduct(variant.product_id)
      
      // Use a default price for now - in production this would come from pricing module
      const defaultPrice = 2000 // 20.00 in cents
      
      // Add line item to cart using Medusa's cart service with real product data
      await cartService.addLineItems(cartId, [{
        variant_id,
        quantity,
        title: product.title,
        unit_price: defaultPrice,
        metadata: {
          fulfillment_type: 'digital_download',
          product_id: product.id
        }
      }])

      // Retrieve updated cart
      const cart = await cartService.retrieveCart(cartId, {
        relations: ["items", "items.variant", "items.product"]
      })

      res.json({ cart })
    } catch (cartError) {
      console.error("Cart service error:", cartError)
      res.status(400).json({ 
        error: "Failed to add item to cart", 
        message: cartError.message 
      })
    }
  } catch (error) {
    console.error("Error adding item to cart:", error)
    res.status(500).json({ error: "Failed to add item to cart", message: error.message })
  }
}
