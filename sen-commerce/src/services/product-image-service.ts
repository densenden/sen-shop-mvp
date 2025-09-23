import { MedusaRequest } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export interface ImageSource {
  url: string
  type: 'thumbnail' | 'mockup' | 'catalog' | 'variant' | 'user_upload'
  metadata?: {
    variant_id?: string
    template_id?: string
    original_printful_url?: string
  }
}

export interface ProductImageCollection {
  images: ImageSource[]
  thumbnail: string
  metadata: {
    total_images: number
    image_sources: {
      mockups: number
      catalog: number
      variants: number
      user_uploads: number
    }
    printful_product_id?: string
    artwork_url?: string
  }
}

export class ProductImageService {
  private fileModuleService: any
  private printfulService: any

  constructor(private req: MedusaRequest) {
    this.fileModuleService = req.scope.resolve(Modules.FILE)
    
    // Safely resolve printful service
    try {
      this.printfulService = req.scope.resolve("printfulModule")
    } catch (error) {
      console.warn("Printful module not available:", error)
      this.printfulService = null
    }
  }

  // Download and upload image to Medusa file service
  async downloadAndUploadImage(imageUrl: string): Promise<string> {
    try {
      console.log(`[ImageService] Downloading image: ${imageUrl}`)
      
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      
      const buffer = await response.arrayBuffer()
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const fileName = `imported-${Date.now()}.${contentType.split('/')[1] || 'jpg'}`
      
      const file = new File([buffer], fileName, { type: contentType })
      
      const uploadResult = await this.fileModuleService.uploadFiles([{
        file,
        fileName
      }])
      
      console.log(`[ImageService] Image uploaded successfully:`, uploadResult[0]?.url)
      return uploadResult[0]?.url || imageUrl
      
    } catch (error) {
      console.error(`[ImageService] Failed to download/upload image ${imageUrl}:`, error)
      return imageUrl // Fallback to original URL
    }
  }

  // Collect comprehensive images from Printful product
  async collectPrintfulImages(
    printfulProduct: any, 
    artworkUrl?: string,
    maxMockups: number = 8,
    maxTotalImages: number = 20
  ): Promise<ProductImageCollection> {
    console.log(`[ImageService] 🔍 STARTING COMPREHENSIVE IMAGE COLLECTION`)
    console.log(`[ImageService] Input product structure:`, {
      id: printfulProduct.id,
      name: printfulProduct.name,
      thumbnail_url: printfulProduct.thumbnail_url,
      has_variants: !!printfulProduct.variants,
      has_sync_variants: !!printfulProduct.sync_variants,
      variants_count: printfulProduct.variants?.length || 0,
      sync_variants_count: printfulProduct.sync_variants?.length || 0,
      artworkUrl,
      maxMockups,
      maxTotalImages
    })
    
    const imageCollection: ImageSource[] = []
    let mockupUrls: string[] = []
    let catalogImages: string[] = []
    let variantImages: string[] = []

    // 1. Generate mockups if artwork and service available
    if (artworkUrl && printfulProduct.variants?.length > 0 && this.printfulService?.generateAndWaitForMockups) {
      try {
        console.log(`[ImageService] Generating mockups for product ${printfulProduct.id}`)
        const variantIds = printfulProduct.variants.slice(0, maxMockups).map((v: any) => v.id)
        mockupUrls = await this.printfulService.generateAndWaitForMockups(
          printfulProduct.id, 
          variantIds, 
          artworkUrl, 
          30000 // 30 second timeout
        )
        
        // Add mockups to collection
        mockupUrls.forEach((url, index) => {
          imageCollection.push({
            url,
            type: 'mockup',
            metadata: {
              variant_id: variantIds[index],
              original_printful_url: url
            }
          })
        })
        
        console.log(`[ImageService] Generated ${mockupUrls.length} mockups`)
      } catch (error) {
        console.warn(`[ImageService] Failed to generate mockups:`, error)
      }
    }

    // 2. Fetch catalog product images if service available
    console.log(`[ImageService] Checking for catalog images...`)
    if (this.printfulService?.getCatalogProduct) {
      try {
        console.log(`[ImageService] Calling getCatalogProduct for ${printfulProduct.id}`)
        const catalogProduct = await this.printfulService.getCatalogProduct(printfulProduct.id)
        console.log(`[ImageService] Catalog product result:`, catalogProduct ? 'Found' : 'Not found')
        
        if (catalogProduct) {
          // Main catalog image
          if (catalogProduct.image) {
            console.log(`[ImageService] Adding catalog main image: ${catalogProduct.image}`)
            catalogImages.push(catalogProduct.image)
            imageCollection.push({
              url: catalogProduct.image,
              type: 'catalog',
              metadata: { original_printful_url: catalogProduct.image }
            })
          }
          
          // Catalog variant images with enhanced metadata
          console.log(`[ImageService] Processing ${catalogProduct.variants?.length || 0} catalog variants`)
          catalogProduct.variants?.forEach((variant: any, index: number) => {
            console.log(`[ImageService] Catalog variant ${index}: ${variant.name} - Image: ${variant.image}`)
            if (variant.image && !catalogImages.includes(variant.image)) {
              console.log(`[ImageService] Adding catalog variant image: ${variant.image}`)
              catalogImages.push(variant.image)
              imageCollection.push({
                url: variant.image,
                type: 'catalog',
                metadata: { 
                  variant_id: variant.id,
                  variant_name: variant.name,
                  variant_size: variant.size,
                  variant_color: variant.color,
                  variant_availability: variant.availability,
                  original_printful_url: variant.image 
                }
              })
            }
          })
        }
        console.log(`[ImageService] ✅ Found ${catalogImages.length} catalog images`)
      } catch (error) {
        console.error(`[ImageService] ❌ Failed to fetch catalog images:`, error)
      }
    } else {
      console.log(`[ImageService] ⚠️ No catalog service available`)
    }

    // 3. Collect store product variant images and files
    // Handle both sync_variants (from raw Printful API) and variants (from our service mapping)
    const storeVariants = printfulProduct.sync_variants || printfulProduct.variants || []
    console.log(`[ImageService] Processing ${storeVariants.length} store variants`)
    console.log(`[ImageService] Full printful product structure:`, {
      id: printfulProduct.id,
      name: printfulProduct.name,
      thumbnail_url: printfulProduct.thumbnail_url,
      has_sync_variants: !!printfulProduct.sync_variants,
      has_variants: !!printfulProduct.variants,
      sync_variants_length: printfulProduct.sync_variants?.length || 0,
      variants_length: printfulProduct.variants?.length || 0,
      first_variant_sample: printfulProduct.variants?.[0] ? {
        id: printfulProduct.variants[0].id,
        name: printfulProduct.variants[0].name,
        has_files: !!printfulProduct.variants[0].files,
        files_count: printfulProduct.variants[0].files?.length || 0
      } : 'No variants'
    })
    
    if (storeVariants.length > 0) {
      storeVariants.forEach((variant: any, index: number) => {
        console.log(`[ImageService] Store variant ${index}:`, {
          id: variant.id,
          name: variant.name,
          has_image: !!variant.image,
          files_count: variant.files?.length || 0
        })
        
        // Collect variant main image
        if (variant.image && !variantImages.includes(variant.image)) {
          console.log(`[ImageService] Adding store variant image: ${variant.image}`)
          variantImages.push(variant.image)
          imageCollection.push({
            url: variant.image,
            type: 'variant',
            metadata: { 
              variant_id: variant.id,
              variant_name: variant.name,
              original_printful_url: variant.image 
            }
          })
        } else if (variant.image) {
          console.log(`[ImageService] Store variant image already collected: ${variant.image}`)
        } else {
          console.log(`[ImageService] Store variant ${index} has no main image`)
        }
        
        // Collect variant files (additional detailed images) - this is the key fix!
        if (variant.files && Array.isArray(variant.files)) {
          console.log(`[ImageService] Processing ${variant.files.length} files for variant ${index}`)
          variant.files.forEach((file: any, fileIndex: number) => {
            console.log(`[ImageService] Variant file ${fileIndex}: type=${file.type}, has_preview=${!!file.preview_url}, has_url=${!!file.url}`)
            
            // Use preview_url if available, otherwise use main url
            const fileUrl = file.preview_url || file.url
            if (fileUrl && !variantImages.includes(fileUrl)) {
              console.log(`[ImageService] ✅ Adding variant file image: ${fileUrl}`)
              variantImages.push(fileUrl)
              imageCollection.push({
                url: fileUrl,
                type: 'variant',
                metadata: { 
                  variant_id: variant.id,
                  variant_name: variant.name,
                  file_id: file.id,
                  file_type: file.type,
                  original_printful_url: fileUrl,
                  is_file_attachment: true
                }
              })
            } else if (fileUrl) {
              console.log(`[ImageService] Variant file image already collected: ${fileUrl}`)
            } else {
              console.log(`[ImageService] ⚠️ Variant file ${fileIndex} has no usable URL`)
            }
          })
        } else {
          console.log(`[ImageService] Store variant ${index} has no files`)
        }
      })
      console.log(`[ImageService] ✅ Found ${variantImages.length} store variant/file images total`)
    } else {
      console.log(`[ImageService] ⚠️ No store variants available`)
    }

    // 4. Collect mockup template images (if available)
    if (this.printfulService?.getMockupTemplates) {
      try {
        const mockupTemplates = await this.printfulService.getMockupTemplates(printfulProduct.id)
        if (mockupTemplates && Array.isArray(mockupTemplates)) {
          mockupTemplates.forEach((template: any) => {
            if (template.preview_url && !imageCollection.some(img => img.url === template.preview_url)) {
              imageCollection.push({
                url: template.preview_url,
                type: 'catalog',
                metadata: {
                  template_id: template.id,
                  template_name: template.name,
                  placement_id: template.placement_id,
                  original_printful_url: template.preview_url,
                  is_template_preview: true
                }
              })
            }
          })
        }
        console.log(`[ImageService] Found ${mockupTemplates?.length || 0} mockup template images`)
      } catch (error) {
        console.warn(`[ImageService] Failed to fetch mockup templates:`, error)
      }
    }

    // 5. Add thumbnail (highest priority)
    const thumbnailUrl = printfulProduct.thumbnail_url || printfulProduct.image
    if (thumbnailUrl) {
      // Add thumbnail to beginning if not already present
      const existingThumbnail = imageCollection.find(img => img.url === thumbnailUrl)
      if (!existingThumbnail) {
        imageCollection.unshift({
          url: thumbnailUrl,
          type: 'thumbnail',
          metadata: { original_printful_url: thumbnailUrl }
        })
      }
    }

    // 6. Remove duplicates while preserving order and limit total
    const uniqueImages = []
    const seenUrls = new Set<string>()
    
    for (const image of imageCollection) {
      if (!seenUrls.has(image.url) && uniqueImages.length < maxTotalImages) {
        seenUrls.add(image.url)
        uniqueImages.push(image)
      }
    }

    const finalThumbnail = uniqueImages[0]?.url || thumbnailUrl || ''

    const result = {
      images: uniqueImages,
      thumbnail: finalThumbnail,
      metadata: {
        total_images: uniqueImages.length,
        image_sources: {
          mockups: mockupUrls.length,
          catalog: catalogImages.length,
          variants: variantImages.length,
          user_uploads: 0
        },
        printful_product_id: printfulProduct.id,
        artwork_url: artworkUrl
      }
    }

    // Detailed logging for debugging
    console.log(`[ImageService] COMPREHENSIVE IMAGE COLLECTION COMPLETE for ${printfulProduct.id}:`)
    console.log(`  📊 Total Images: ${result.metadata.total_images}`)
    console.log(`  🎨 Mockups: ${result.metadata.image_sources.mockups}`)
    console.log(`  📸 Catalog: ${result.metadata.image_sources.catalog}`)
    console.log(`  🎯 Variants: ${result.metadata.image_sources.variants}`)
    console.log(`  🏷️ Thumbnail: ${finalThumbnail ? '✅' : '❌'}`)
    
    // Log each image with its source
    uniqueImages.forEach((img, index) => {
      const isFile = img.metadata?.is_file_attachment ? ' (FILE)' : ''
      const isTemplate = img.metadata?.is_template_preview ? ' (TEMPLATE)' : ''
      console.log(`    [${index + 1}] ${img.type.toUpperCase()}${isFile}${isTemplate}: ${img.url}`)
    })

    return result
  }

  // Merge user uploads with existing Printful images
  async mergeWithUserUploads(
    printfulImageCollection: ProductImageCollection,
    userUploadedImages: { id?: string; url: string }[]
  ): Promise<ProductImageCollection> {
    const userImages: ImageSource[] = userUploadedImages.map(img => ({
      url: img.url,
      type: 'user_upload',
      metadata: { user_upload_id: img.id }
    }))

    // Combine: user uploads first, then Printful images
    const allImages = [...userImages, ...printfulImageCollection.images]
    
    // Remove duplicates
    const uniqueImages = []
    const seenUrls = new Set<string>()
    
    for (const image of allImages) {
      if (!seenUrls.has(image.url)) {
        seenUrls.add(image.url)
        uniqueImages.push(image)
      }
    }

    // Update thumbnail preference: user upload > mockup > catalog > variant > thumbnail
    let newThumbnail = printfulImageCollection.thumbnail
    if (userImages.length > 0) {
      newThumbnail = userImages[0].url
    } else if (printfulImageCollection.images.some(img => img.type === 'mockup')) {
      newThumbnail = printfulImageCollection.images.find(img => img.type === 'mockup')?.url || newThumbnail
    }

    return {
      images: uniqueImages,
      thumbnail: newThumbnail,
      metadata: {
        ...printfulImageCollection.metadata,
        total_images: uniqueImages.length,
        image_sources: {
          ...printfulImageCollection.metadata.image_sources,
          user_uploads: userImages.length
        }
      }
    }
  }

  // Convert image collection to Medusa product format
  convertToMedusaFormat(imageCollection: ProductImageCollection) {
    return {
      thumbnail: imageCollection.thumbnail,
      images: imageCollection.images.map(img => ({ url: img.url })),
      metadata: {
        ...imageCollection.metadata,
        image_source_details: imageCollection.images.map(img => ({
          url: img.url,
          type: img.type,
          metadata: img.metadata
        }))
      }
    }
  }

  // Get images for existing product (for edit scenarios)
  parseExistingProductImages(product: any): ProductImageCollection {
    const images: ImageSource[] = []
    
    // Parse existing images
    if (product.images) {
      product.images.forEach((img: any) => {
        const imageUrl = typeof img === 'string' ? img : img.url
        if (imageUrl) {
          // Try to determine type from metadata
          let type: ImageSource['type'] = 'user_upload'
          
          if (product.metadata?.image_source_details) {
            const sourceDetail = product.metadata.image_source_details.find((detail: any) => detail.url === imageUrl)
            if (sourceDetail) {
              type = sourceDetail.type
            }
          }
          
          images.push({
            url: imageUrl,
            type,
            metadata: img.metadata || {}
          })
        }
      })
    }

    // Count by type
    const imageCounts = images.reduce((acc, img) => {
      acc[img.type === 'user_upload' ? 'user_uploads' : img.type]++
      return acc
    }, { mockups: 0, catalog: 0, variants: 0, user_uploads: 0 })

    return {
      images,
      thumbnail: product.thumbnail || images[0]?.url || '',
      metadata: {
        total_images: images.length,
        image_sources: imageCounts,
        printful_product_id: product.metadata?.printful_product_id,
        artwork_url: product.metadata?.artwork_url
      }
    }
  }
}