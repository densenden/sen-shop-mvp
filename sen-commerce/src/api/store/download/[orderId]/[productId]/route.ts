import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { orderId, productId } = req.params
  
  try {
    console.log(`[Download] Request for order: ${orderId}, product: ${productId}`)
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Step 1: Verify the order exists and contains this product
    const { data: [order] } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: [
        "id",
        "email", 
        "items.*"
      ]
    })
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }
    
    const orderItem = order.items?.find((item: any) => item.product_id === productId)
    if (!orderItem) {
      return res.status(404).json({ error: "Product not found in this order" })
    }
    
    // Step 2: Get the product to find the digital product ID
    const { data: [product] } = await query.graph({
      entity: "product",
      filters: { id: productId },
      fields: ["id", "metadata"]
    })
    
    if (!product || !product.metadata?.digital_product_id) {
      return res.status(404).json({ 
        error: "Digital product not found",
        message: "This product is not available for digital download"
      })
    }
    
    // Step 3: Get the digital product file URL directly
    const { data: [digitalProduct] } = await query.graph({
      entity: "digital_product",
      filters: { id: product.metadata.digital_product_id },
      fields: ["id", "name", "file_url", "mime_type"]
    })
    
    if (!digitalProduct) {
      return res.status(404).json({ 
        error: "Digital product file not found"
      })
    }
    
    console.log(`[Download] Found digital product: ${digitalProduct.name}`)
    console.log(`[Download] Redirecting to file: ${digitalProduct.file_url}`)
    
    // Set headers for download
    res.setHeader('Content-Type', digitalProduct.mime_type || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${digitalProduct.name || 'download'}"`)
    
    // Redirect to the actual Supabase file URL
    return res.redirect(digitalProduct.file_url)
    
  } catch (error) {
    console.error('[Download] Error:', error)
    return res.status(500).json({ 
      error: "Error processing download request",
      message: error.message 
    })
  }
}