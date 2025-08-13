import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Extract order ID and product ID from query parameters
  const orderId = req.query.order as string
  const productId = req.query.product as string
  
  if (!orderId || !productId) {
    return res.status(400).json({ 
      error: "Missing order or product ID" 
    })
  }
  
  try {
    // For now, return a placeholder download response
    // In production, this should verify order ownership and serve actual files
    
    const downloadUrl = `https://storage.googleapis.com/digital-downloads/${productId}/file.zip`
    
    // You could also redirect directly to the file
    // return res.redirect(downloadUrl)
    
    return res.json({
      success: true,
      download_url: downloadUrl,
      message: "Download link generated successfully",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
    
  } catch (error) {
    console.error('Download error:', error)
    return res.status(500).json({ 
      error: "Error processing download request" 
    })
  }
}