import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ISalesChannelModuleService } from "@medusajs/types"

interface CreateProductRequest {
  artwork_id: string
  product_type: 'printful_pod' | 'digital'
  title: string
  description?: string
  price: number // in cents
  
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
      printful_product_id,
      printful_variant_id,
      digital_product_id
    } = req.body as CreateProductRequest

    console.log("Extracted fields:", { artwork_id, product_type, title, price })

    // Validate required fields
    if (!artwork_id || !product_type || !title || price === undefined) {
      console.error("Missing required fields:", { artwork_id, product_type, title, price })
      return res.status(400).json({
        error: "Missing required fields: artwork_id, product_type, title, price",
        received: { artwork_id, product_type, title, price }
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

    const manager = req.scope.resolve("manager")
    
    // Get artwork details
    const artworks = await manager.query(`
      SELECT id, title, image_url, product_ids 
      FROM artwork WHERE id = $1 AND deleted_at IS NULL
    `, [artwork_id])

    if (artworks.length === 0) {
      return res.status(404).json({
        error: "Artwork not found"
      })
    }

    const artwork = artworks[0]

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
    
    const productInput = {
      title,
      status: "published",
      description: description || `${title} featuring artwork: ${artwork.title}`,
      thumbnail: artwork.image_url,
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
              currency_code: "usd",
            }
          ]
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
      metadata: {
        fulfillment_type: product_type,
        artwork_id: artwork_id,
        ...(product_type === 'printful_pod' ? {
          printful_product_id,
          printful_variant_id
        } : {}),
        ...(product_type === 'digital' ? {
          digital_product_id
        } : {})
      },
    }

    const { result } = await createProductsWorkflow(req.scope).run({
      input: { products: [productInput] }
    })
    
    const medusaProduct = result.products[0]

    // Update artwork to include this product ID
    const currentProductIds = artwork.product_ids || []
    const updatedProductIds = [...currentProductIds, medusaProduct.id]
    
    await manager.query(`
      UPDATE artwork 
      SET product_ids = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [JSON.stringify(updatedProductIds), artwork_id])

    // If digital product, create linking record
    if (product_type === 'digital') {
      try {
        await manager.query(`
          INSERT INTO product_digital_product (product_id, digital_product_id)
          VALUES ($1, $2)
          ON CONFLICT (product_id, digital_product_id) DO NOTHING
        `, [medusaProduct.id, digital_product_id])
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