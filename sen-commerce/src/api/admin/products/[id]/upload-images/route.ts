import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    
    console.log(`[DEBUG] Uploading images for product ${id}`)
    
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get the product
    const product = await productService.retrieveProduct(id, {
      relations: ["images"]
    })
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }
    
    // Handle different content types
    const contentType = req.headers['content-type']
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle file uploads
      try {
        // Parse multipart form data - this would need multer or similar
        // For now, return a placeholder response
        return res.status(501).json({ error: "File upload not yet implemented" })
        
      } catch (uploadError) {
        console.error(`[DEBUG] File upload failed:`, uploadError)
        return res.status(500).json({ 
          error: "Failed to upload files", 
          message: uploadError.message 
        })
      }
      
    } else if (contentType?.includes('application/json')) {
      // Handle URL additions
      const { imageUrls } = req.body as { imageUrls: string[] }
      
      if (!imageUrls || !Array.isArray(imageUrls)) {
        return res.status(400).json({ error: "imageUrls array is required" })
      }
      
      // Validate URLs
      const validUrls = imageUrls.filter(url => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      })
      
      if (validUrls.length === 0) {
        return res.status(400).json({ error: "No valid URLs provided" })
      }
      
      // Get existing images
      const existingImages = product.images || []
      const existingImageUrls = existingImages.map(img => img.url)
      
      // Add new URLs (avoid duplicates)
      const newImageUrls = validUrls.filter(url => !existingImageUrls.includes(url))
      const allImageUrls = [...existingImageUrls, ...newImageUrls]
      
      // Update product with new images
      await productService.updateProducts(id, {
        images: allImageUrls.map(url => ({ url })),
        // Set first image as thumbnail if no thumbnail exists
        ...((!product.thumbnail && allImageUrls.length > 0) ? { thumbnail: allImageUrls[0] } : {})
      })
      
      console.log(`[DEBUG] Added ${newImageUrls.length} new images to product ${id}`)
      
      res.json({ 
        success: true, 
        images_added: newImageUrls.length,
        new_urls: newImageUrls,
        total_images: allImageUrls.length,
        thumbnail_set: !product.thumbnail && allImageUrls.length > 0
      })
      
    } else {
      return res.status(400).json({ error: "Unsupported content type" })
    }
    
  } catch (error) {
    console.error("Error uploading images:", error)
    res.status(500).json({ 
      error: "Failed to upload images",
      message: error.message 
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]