import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../modules/digital-product/services/digital-product-module-service"

// GET /store/download/:token - Download a digital product
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const token = req.params.token
    
    if (!token) {
      return res.status(400).json({ error: "Invalid download link" })
    }
    
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Validate token and get download URL
    const { url, product } = await digitalProductService.getDownloadUrl(token)
    
    // Redirect to the file URL
    // Since your Supabase bucket is public, we can redirect directly
    res.redirect(url)
    
    // Alternative: You could also return JSON with the URL
    // res.json({
    //   download_url: url,
    //   file_name: product.name,
    //   file_size: product.file_size,
    //   mime_type: product.mime_type
    // })
  } catch (error) {
    console.error("Download error:", error)
    res.status(400).json({ 
      error: error.message || "Invalid or expired download link" 
    })
  }
} 