import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"
import { Modules } from "@medusajs/framework/utils"

// POST /admin/digital-products/[id]/create-products - Create Medusa products from digital product
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const digitalProductService = req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Get the digital product
    const [digitalProduct] = await digitalProductService.listDigitalProducts({
      id
    })
    
    if (!digitalProduct) {
      return res.status(404).json({ error: "Digital product not found" })
    }
    
    // Create product with thumbnail as main image
    const productData = {
      title: digitalProduct.name,
      description: digitalProduct.description || `Digital download: ${digitalProduct.name}`,
      handle: digitalProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      status: "published" as const,
      thumbnail: digitalProduct.thumbnail_url || digitalProduct.file_url, // Use thumbnail if available, fallback to file URL
      metadata: {
        fulfillment_type: "digital",
        digital_product_id: digitalProduct.id,
        digital_download_url: digitalProduct.file_url
      },
      variants: [
        {
          title: "Digital Download",
          prices: [
            {
              amount: 1999, // Default price $19.99 (can be changed later)
              currency_code: "eur"
            }
          ],
          metadata: {
            fulfillment_type: "digital",
            digital_product_id: digitalProduct.id,
            digital_download_url: digitalProduct.file_url
          }
        }
      ]
    }
    
    // Import the create products workflow
    const { createProductsWorkflow } = await import("@medusajs/core-flows")
    
    // Create the product using the workflow
    const { result } = await createProductsWorkflow(req.scope).run({
      input: { products: [productData] }
    })
    
    const product = result[0]
    console.log(`Created product from digital file: ${product.id}`)
    
    res.json({ 
      product: product,
      digital_product: digitalProduct,
      message: "Product created successfully from digital file"
    })
  } catch (error) {
    console.error("Error creating product from digital file:", error)
    res.status(500).json({ error: error.message || "Failed to create product" })
  }
}