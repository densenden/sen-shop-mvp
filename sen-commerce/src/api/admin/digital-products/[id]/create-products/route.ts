import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import { Modules } from "@medusajs/framework/utils"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"
import type { IProductModuleService } from "@medusajs/framework/types"

// POST /admin/digital-products/:id/create-products - Create Medusa products from digital product
export const POST = async (
  req: MedusaRequest<{
    product_title?: string
    product_description?: string
    price: number
    currency_code?: string
    variants?: Array<{
      title: string
      prices: Array<{
        currency_code: string
        amount: number
      }>
    }>
  }>,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    const productService: IProductModuleService = 
      req.scope.resolve(Modules.PRODUCT)
    
    // Get the digital product
    const [digitalProduct] = await digitalProductService.listDigitalProducts({
      filters: { id }
    })
    
    if (!digitalProduct) {
      return res.status(404).json({ error: "Digital product not found" })
    }
    
    // Create the product data
    const productData = {
      title: req.body.product_title || digitalProduct.name,
      description: req.body.product_description || digitalProduct.description || "",
      status: "published" as const,
      is_giftcard: false,
      discountable: true,
      metadata: {
        fulfillment_type: "digital_download",
        digital_product_id: digitalProduct.id,
        file_url: digitalProduct.file_url
      },
      options: [
        {
          title: "Default",
          values: ["Default"]
        }
      ]
    }
    
    // Create the product
    const product = await productService.createProducts(productData)
    
    // Create variant with pricing
    const variantData = {
      title: req.body.variants?.[0]?.title || "Default",
      product_id: product.id,
      manage_inventory: false,
      allow_backorder: true,
      inventory_quantity: 999999, // Digital products have unlimited inventory
      sku: `DIGITAL-${digitalProduct.id}-${Date.now()}`,
      options: {
        "Default": "Default"
      },
      prices: req.body.variants?.[0]?.prices || [
        {
          currency_code: req.body.currency_code || "usd",
          amount: req.body.price
        }
      ]
    }
    
    // Create the variant
    const variant = await productService.createProductVariants(variantData)
    
    // Update digital product to reference the created product
    await digitalProductService.updateDigitalProducts({
      id: digitalProduct.id,
      printful_product_ids: [product.id]
    })
    
    res.json({ 
      product,
      variant,
      digital_product: digitalProduct,
      message: "Medusa product created successfully from digital product"
    })
  } catch (error) {
    console.error("Error creating products from digital product:", error)
    res.status(500).json({ 
      error: error.message || "Failed to create products from digital product" 
    })
  }
}