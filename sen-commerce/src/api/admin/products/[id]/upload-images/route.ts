import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa"
import { ProductImageService } from "../../../../../services/product-image-service"
import { ImageUploadService } from "../../../../../modules/artwork-module"
import multer from 'multer'


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
      try {
        console.log(`[DEBUG] 📤 Processing multipart file upload for product ${id}`)
        console.log(`[DEBUG] Content-Type: ${contentType}`)
        
        // Use Multer to handle file upload in memory (same as working uploads endpoint)
        const upload = multer({ storage: multer.memoryStorage() })
        
        // Multer needs to be called as middleware, so we wrap it in a promise
        await new Promise<void>((resolve, reject) => {
          upload.array('files', 10)(req as any, res as any, (err: any) => {
            if (err) {
              console.error(`[DEBUG] Multer error:`, err)
              return reject(err)
            }
            resolve()
          })
        })
        
        // @ts-ignore - Handle both req.file and req.files
        const files = req.files || (req.file ? [req.file] : [])
        console.log(`[DEBUG] Files received:`, files.length)
        
        if (!files || files.length === 0) {
          return res.status(400).json({ error: "No files uploaded" })
        }
        
        // Create the upload service with the container (for DI)
        const imageUploadService = new ImageUploadService(req.scope)
        const uploadedImages = []
        
        // Upload each file
        for (const file of files) {
          const publicUrl = await imageUploadService.uploadImage(
            file.buffer,
            file.originalname,
            file.mimetype
          )
          console.log(`[DEBUG] File uploaded:`, publicUrl)
          uploadedImages.push(publicUrl)
        }
        
        // Use ProductImageService to handle image merging properly
        const imageService = new ProductImageService(req)
        const currentImageCollection = imageService.parseExistingProductImages(product)
        
        // Add new user uploads
        const newUserUploads = uploadedImages.map(url => ({ url }))
        const updatedImageCollection = await imageService.mergeWithUserUploads(
          currentImageCollection, 
          newUserUploads
        )
        
        // Convert to Medusa format
        const medusaImageData = imageService.convertToMedusaFormat(updatedImageCollection)
        
        // Update product with new images
        await productService.updateProducts(id, {
          thumbnail: medusaImageData.thumbnail,
          images: medusaImageData.images,
          metadata: {
            ...product.metadata,
            ...medusaImageData.metadata
          }
        })
        
        console.log(`[DEBUG] Successfully processed ${uploadedImages.length} images for product ${id}`)
        
        return res.json({ 
          success: true, 
          images: uploadedImages.map(url => ({ url })),
          total_images: updatedImageCollection.images.length,
          image_sources: updatedImageCollection.metadata.image_sources,
          files_processed: files.length
        })
        
      } catch (uploadError) {
        console.error(`[DEBUG] File upload failed:`, uploadError)
        return res.status(500).json({ 
          error: "Failed to upload files", 
          message: uploadError.message,
          details: uploadError.stack
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