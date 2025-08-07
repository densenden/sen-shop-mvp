import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: productId } = req.params
    
    if (!productId) {
      return res.status(400).json({
        error: "Product ID is required"
      })
    }

    // For digital products, the product itself IS the digital product
    // Check if this product has digital metadata
    const query = req.scope.resolve("query")
    const { data: [product] } = await query.graph({
      entity: "product",
      fields: ["id", "metadata"],
      filters: { id: productId }
    })

    const digitalProducts = []
    
    // If this product has a digital_product_id in metadata, fetch that digital product
    if (product?.metadata?.digital_product_id) {
      const digitalProductService = req.scope.resolve("digitalProductModuleService")
      try {
        const allDigitalProducts = await digitalProductService.listDigitalProducts()
        const digitalProduct = allDigitalProducts.find(dp => dp.id === product.metadata.digital_product_id)
        if (digitalProduct) {
          digitalProducts.push(digitalProduct)
        }
      } catch (err) {
        console.error("Error fetching digital product:", err)
      }
    }

    res.json({
      digital_products: digitalProducts
    })
  } catch (error) {
    console.error("Error fetching product digital products:", error)
    res.status(500).json({
      error: "Failed to fetch digital products",
      details: error.message
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: productId } = req.params
    const { digital_product_id } = req.body
    
    if (!productId || !digital_product_id) {
      return res.status(400).json({
        error: "Product ID and digital product ID are required"
      })
    }

    const manager = req.scope.resolve("manager")
    
    // Check if link already exists
    const existingLinks = await manager.query(`
      SELECT id FROM product_digital_product 
      WHERE product_id = $1 AND digital_product_id = $2
    `, [productId, digital_product_id])

    if (existingLinks.length > 0) {
      return res.status(409).json({
        error: "Digital product is already linked to this product"
      })
    }

    // Create the link
    await manager.query(`
      INSERT INTO product_digital_product (product_id, digital_product_id)
      VALUES ($1, $2)
    `, [productId, digital_product_id])

    // Get the linked digital product for response
    const digitalProduct = await manager.query(`
      SELECT * FROM digital_product WHERE id = $1 AND deleted_at IS NULL
    `, [digital_product_id])

    res.json({
      message: "Digital product linked successfully",
      digital_product: digitalProduct[0]
    })
  } catch (error) {
    console.error("Error linking digital product:", error)
    res.status(500).json({
      error: "Failed to link digital product",
      details: error.message
    })
  }
}