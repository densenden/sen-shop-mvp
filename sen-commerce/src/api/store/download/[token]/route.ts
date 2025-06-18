import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../modules/digital-product/services/digital-product-module-service"

// GET /store/download/:token - Download digital product
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { token } = req.params
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Find download access by token
    const [downloadAccess] = await digitalProductService.listDigitalProductDownloads({
      filters: { 
        token,
        is_active: true
      },
      relations: ["digital_product"]
    })
    
    if (!downloadAccess) {
      return res.status(404).json({ 
        error: "Invalid or expired download link" 
      })
    }
    
    // Check if expired
    if (downloadAccess.expires_at && new Date() > new Date(downloadAccess.expires_at)) {
      // Mark as inactive
      await digitalProductService.updateDigitalProductDownloads({
        id: downloadAccess.id,
        is_active: false
      })
      
      return res.status(410).json({ 
        error: "This download link has expired" 
      })
    }
    
    // Get the digital product
    const [digitalProduct] = await digitalProductService.listDigitalProducts({
      filters: { id: downloadAccess.digital_product_id }
    })
    
    if (!digitalProduct) {
      return res.status(404).json({ 
        error: "Digital product not found" 
      })
    }
    
    // Check download limit
    if (digitalProduct.max_downloads !== -1 && 
        downloadAccess.download_count >= digitalProduct.max_downloads) {
      return res.status(429).json({ 
        error: "Download limit exceeded" 
      })
    }
    
    // Update download count and timestamp
    await digitalProductService.updateDigitalProductDownloads({
      id: downloadAccess.id,
      download_count: downloadAccess.download_count + 1,
      last_downloaded_at: new Date()
    })
    
    // Redirect to file URL
    // In production, you might want to generate a signed URL instead
    res.redirect(digitalProduct.file_url)
    
  } catch (error) {
    console.error("Error processing download:", error)
    res.status(500).json({ 
      error: "Failed to process download" 
    })
  }
} 