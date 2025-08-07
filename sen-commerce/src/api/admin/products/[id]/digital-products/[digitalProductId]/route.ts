import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: productId, digitalProductId } = req.params
    
    if (!productId || !digitalProductId) {
      return res.status(400).json({
        error: "Product ID and digital product ID are required"
      })
    }

    const manager = req.scope.resolve("manager")
    
    // Find the link to delete
    const links = await manager.query(`
      SELECT id FROM product_digital_product 
      WHERE product_id = $1 AND digital_product_id = $2
    `, [productId, digitalProductId])

    if (links.length === 0) {
      return res.status(404).json({
        error: "Digital product link not found"
      })
    }

    // Delete the link
    await manager.query(`
      DELETE FROM product_digital_product 
      WHERE product_id = $1 AND digital_product_id = $2
    `, [productId, digitalProductId])

    res.json({
      message: "Digital product unlinked successfully"
    })
  } catch (error) {
    console.error("Error unlinking digital product:", error)
    res.status(500).json({
      error: "Failed to unlink digital product",
      details: error.message
    })
  }
}