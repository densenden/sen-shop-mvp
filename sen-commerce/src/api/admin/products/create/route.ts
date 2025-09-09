import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService, IStoreModuleService, IRegionModuleService } from "@medusajs/types"

interface CreateProductRequest {
  artwork_id?: string
  product_type: 'printful_pod' | 'digital' | 'service'
  title: string
  description?: string
  price: number // in cents
  images?: string[] // Array of image URLs
  videos?: string[] // Array of video URLs
  thumbnail?: string // Primary thumbnail image
  
  // For POD products
  printful_product_id?: string
  printful_variant_id?: string
  
  // For Digital products  
  digital_product_id?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("Product creation request body:", JSON.stringify(req.body, null, 2))
    
    const {
      artwork_id,
      product_type,
      title,
      description,
      price,
      images,
      videos,
      thumbnail,
      printful_product_id,
      printful_variant_id,
      digital_product_id
    } = req.body as CreateProductRequest

    console.log("Extracted fields:", { artwork_id, product_type, title, price })

    // Validate required fields
    if (!product_type || !title || price === undefined) {
      console.error("Missing required fields:", { product_type, title, price })
      return res.status(400).json({
        error: "Missing required fields: product_type, title, price",
        received: { product_type, title, price }
      })
    }

    if (product_type === 'printful_pod' && !printful_product_id) {
      return res.status(400).json({
        error: "printful_product_id is required for POD products"
      })
    }

    if (product_type === 'digital' && !digital_product_id) {
      return res.status(400).json({
        error: "digital_product_id is required for digital products"
      })
    }

    // Get artwork details if artwork_id is provided
    let artwork: any = null
    if (artwork_id) {
      try {
        const response = await fetch(`${req.protocol}://${req.get('host')}/admin/artworks`, {
          headers: {
            'Cookie': req.headers.cookie || ''
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          artwork = data.artworks?.find((a: any) => a.id === artwork_id)
          
          if (!artwork) {
            return res.status(404).json({
              error: "Artwork not found"
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch artwork:", error)
        // Continue without artwork if fetching fails
      }
    }

    // Get store configuration to determine default currency
    const storeService: IStoreModuleService = req.scope.resolve(Modules.STORE)
    const regionService: IRegionModuleService = req.scope.resolve(Modules.REGION)
    
    const [store] = await storeService.listStores()
    let currencyCode = "eur" // Default to EUR
    
    if (store?.default_region_id) {
      const region = await regionService.retrieveRegion(store.default_region_id)
      currencyCode = region.currency_code || "eur"
    }
    
    console.log("Using currency:", currencyCode)

    // Get default sales channel
    const salesChannelService: ISalesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL)
    let [defaultSalesChannel] = await salesChannelService.listSalesChannels({
      name: "Default",
    })

    if (!defaultSalesChannel) {
      defaultSalesChannel = await salesChannelService.createSalesChannels({
        name: "Default",
        description: "Default sales channel for all products",
      })
    }

    // Create product using workflow
    const { createProductsWorkflow } = await import("@medusajs/core-flows")
    
    // Prepare product images - first image is thumbnail, rest are additional images
    const productImages = []
    const primaryThumbnail = thumbnail || images?.[0] || artwork?.image_url || undefined
    
    if (primaryThumbnail) {
      productImages.push({ url: primaryThumbnail })
    }
    
    // Add remaining images
    if (images && images.length > 0) {
      images.forEach((url, index) => {
        // Skip first image if it's already used as thumbnail
        if (index === 0 && url === primaryThumbnail) return
        productImages.push({ url })
      })
    }

    // Generate a unique handle to avoid conflicts
    const baseHandle = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
    
    const uniqueHandle = `${baseHandle}-${Date.now()}`

    const productInput = {
      title,
      handle: uniqueHandle,
      status: "published",
      description: description || (artwork ? `${title} featuring artwork: ${artwork.title}` : title),
      thumbnail: primaryThumbnail,
      images: productImages,
      options: [
        {
          title: product_type === 'digital' ? "Format" : "Default",
          values: [product_type === 'digital' ? "Digital" : "Default"]
        }
      ],
      variants: [
        {
          title: product_type === 'digital' ? "Digital Version" : "Default Variant",
          sku: `${product_type}-${artwork_id}-${Date.now()}`,
          manage_inventory: false,
          allow_backorder: true,
          options: {
            [product_type === 'digital' ? "Format" : "Default"]: product_type === 'digital' ? "Digital" : "Default"
          },
          prices: [
            {
              amount: price,
              currency_code: currencyCode,
            }
          ]
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      metadata: {
        fulfillment_type: product_type,
        ...(artwork_id ? { artwork_id } : {}),
        ...(images && images.length > 0 ? { product_images: images } : {}),
        ...(videos && videos.length > 0 ? { product_videos: videos } : {}),
        ...(product_type === 'printful_pod' ? {
          printful_product_id,
          printful_variant_id
        } : {}),
        ...(product_type === 'digital' ? {
          digital_product_id
        } : {})
      },
    }

    console.log("Product input being sent to workflow:", JSON.stringify(productInput, null, 2))
    
    let result
    try {
      const workflowResult = await createProductsWorkflow(req.scope).run({
        input: { products: [productInput] }
      })
      
      result = workflowResult.result
      console.log("Workflow result:", JSON.stringify(result, null, 2))
      
      if (!result || result.length === 0) {
        console.error("Workflow returned empty result:", result)
        throw new Error("Failed to create product - workflow returned no products")
      }
      
      console.log("Product created successfully:", result[0].id)
    } catch (workflowError) {
      console.error("Workflow execution failed:", workflowError)
      throw new Error(`Product creation workflow failed: ${workflowError.message}`)
    }
    
    const medusaProduct = result[0]

    // Update artwork to include this product ID (only if artwork exists)
    if (artwork && artwork_id) {
      try {
        const currentProductIds = artwork.product_ids || []
        const updatedProductIds = [...currentProductIds, medusaProduct.id]
        
        // Update artwork via API call
        await fetch(`${req.protocol}://${req.get('host')}/admin/artworks/${artwork_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.cookie || ''
          },
          body: JSON.stringify({
            product_ids: updatedProductIds
          })
        })
      } catch (error) {
        console.warn("Could not update artwork product_ids:", error)
        // Don't fail the whole operation for this
      }
    }

    // If digital product, create linking record
    if (product_type === 'digital' && digital_product_id) {
      try {
        // For now, we'll store the digital_product_id in metadata
        // The linking table can be handled by a separate workflow if needed
        console.log(`Digital product ${digital_product_id} linked to product ${medusaProduct.id} via metadata`)
      } catch (linkError) {
        console.warn("Could not create digital product link:", linkError)
        // Don't fail the whole operation for this
      }
    }

    res.json({
      product: medusaProduct,
      artwork: artwork,
      message: "Product created successfully and linked to artwork"
    })
  } catch (error) {
    console.error("Error creating product:", error)
    res.status(500).json({
      error: "Failed to create product",
      details: error.message
    })
  }
}