import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa"

// No image downloading - just use CDN URLs directly

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const { artwork_id, template_ids } = req.body
    
    console.log(`[DEBUG] Generating mockups for product ${id} with artwork ${artwork_id}`)
    
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get the product to check if it's a Printful POD product
    const product = await productService.retrieveProduct(id, {
      relations: ["variants", "metadata"]
    })
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }
    
    if (product.metadata?.fulfillment_type !== 'printful_pod') {
      return res.status(400).json({ error: "Product is not a Printful POD product" })
    }
    
    const printfulProductId = product.metadata?.printful_product_id
    if (!printfulProductId) {
      return res.status(400).json({ error: "No Printful product ID found" })
    }
    
    // Get artwork URL if artwork_id provided
    let artworkUrl = product.metadata?.artwork_url || "https://files.cdn.printful.com/files/a84/a842c58bc25b3d0169edf368bd5676c9_preview.png"
    
    if (artwork_id) {
      try {
        const response = await fetch(`${req.protocol}://${req.get('host')}/admin/artworks`, {
          headers: {
            'Cookie': req.headers.cookie || ''
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const artwork = data.artworks?.find((a: any) => a.id === artwork_id)
          
          if (artwork?.image_url) {
            artworkUrl = artwork.image_url
          }
        }
      } catch (error) {
        console.error("Failed to fetch artwork:", error)
        // Continue with default artwork URL
      }
    }
    
    // Get Printful service
    const printfulService = req.scope.resolve("printfulModule") as any
    
    if (!printfulService.generateAndWaitForMockups) {
      return res.status(500).json({ error: "Mockup generation not available" })
    }
    
    // Get variant IDs (limit to first 3 for mockup generation)
    const variantIds = product.variants?.slice(0, 3).map(v => v.id) || []
    
    try {
      console.log(`[DEBUG] Generating mockups for variants: ${variantIds.join(', ')} with artwork: ${artworkUrl}`)
      
      // Generate mockups
      const mockupUrls = await printfulService.generateAndWaitForMockups(
        printfulProductId, 
        variantIds, 
        artworkUrl, 
        30000 // 30 second timeout
      )
      
      console.log(`[DEBUG] Generated ${mockupUrls.length} mockup CDN URLs`)
      
      // Keep all URLs as CDN links - no downloading
      const cdnMockupUrls = mockupUrls
      
      // Get existing images and add new mockups
      const existingImages = product.images || []
      const existingImageUrls = existingImages.map(img => img.url)
      
      // Add new mockups to images (avoid duplicates)
      const newImageUrls = cdnMockupUrls.filter(url => !existingImageUrls.includes(url))
      const allImageUrls = [...existingImageUrls, ...newImageUrls]
      
      // Use Printful thumbnail if no thumbnail exists
      const printfulThumbnail = "https://files.cdn.printful.com/files/a84/a842c58bc25b3d0169edf368bd5676c9_preview.png"
      
      // Update product with new images and mockup metadata
      const updatedMetadata = {
        ...product.metadata,
        mockup_urls: cdnMockupUrls,
        artwork_url: artworkUrl,
        last_mockup_generation: new Date().toISOString(),
        printful_thumbnail: printfulThumbnail
      }
      
      await productService.updateProducts(id, {
        metadata: updatedMetadata,
        images: allImageUrls.map(url => ({ url })),
        // Set Printful thumbnail if no thumbnail exists
        ...((!product.thumbnail) ? { thumbnail: printfulThumbnail } : {})
      })
      
      console.log(`[DEBUG] Updated product with ${cdnMockupUrls.length} mockup CDN URLs and ${allImageUrls.length} total images`)
      
      res.json({ 
        success: true, 
        mockups_generated: cdnMockupUrls.length,
        mockup_urls: cdnMockupUrls,
        total_images: allImageUrls.length,
        thumbnail_set: !product.thumbnail,
        thumbnail_url: printfulThumbnail
      })
      
    } catch (mockupError) {
      console.error(`[DEBUG] Mockup generation failed:`, mockupError)
      res.status(500).json({ 
        error: "Failed to generate mockups", 
        message: mockupError.message || mockupError 
      })
    }
    
  } catch (error) {
    console.error("Error generating mockups:", error)
    res.status(500).json({ 
      error: "Failed to generate mockups",
      message: error.message 
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
];