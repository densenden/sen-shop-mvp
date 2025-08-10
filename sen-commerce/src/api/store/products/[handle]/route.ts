import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const handle = req.params.handle
  
  console.log(`[Product API] Fetching product with handle: ${handle}`)
  
  try {
    const productService = req.scope.resolve(Modules.PRODUCT)
    
    // First try to find by handle
    const [products] = await productService.listAndCount(
      { handle },
      {
        relations: ["variants", "variants.prices", "images"],
        take: 1
      }
    )
    
    let product = products[0]
    
    // If not found by handle, try by ID
    if (!product) {
      console.log(`[Product API] Product not found by handle, trying ID: ${handle}`)
      try {
        const productById = await productService.retrieve(handle, {
          relations: ["variants", "variants.prices", "images"]
        })
        product = productById
      } catch (idError) {
        console.log(`[Product API] Product not found by ID either`)
      }
    }
    
    if (!product) {
      return res.status(404).json({ 
        error: "Product not found",
        message: `Product with handle/id "${handle}" does not exist`
      })
    }
    
    // Add calculated prices for EUR region - use actual EUR prices from database
    if (product.variants) {
      product.variants = product.variants.map(variant => {
        // Find EUR price from price_set
        const eurPrice = variant.price_set?.prices?.find(p => p.currency_code === 'eur')
        
        return {
          ...variant,
          calculated_price: {
            amount: eurPrice ? eurPrice.amount : 10, // Use actual EUR price from database, fallback to 10 cents (€0.10)
            currency_code: 'eur'
          }
        }
      })
    }
    
    console.log(`[Product API] Product found: ${product.title}`)
    
    res.json({ product })
    
  } catch (error) {
    console.error(`[Product API] Error fetching product:`, error)
    res.status(500).json({ 
      error: "Failed to fetch product",
      message: error.message 
    })
  }
}