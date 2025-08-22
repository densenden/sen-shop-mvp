import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"
import { ARTWORK_MODULE } from "../../../../../modules/artwork-module"
import type { ArtworkModuleService } from "../../../../../modules/artwork-module/service"
import jwt from "jsonwebtoken"

// Helper function to get artwork and collection info
async function getArtworkCollectionInfo(digitalProductId: string, artworkService: ArtworkModuleService) {
  try {
    // First get the digital product to find artwork_id
    const digitalProducts = await artworkService.listDigitalProducts({
      filters: { id: digitalProductId }
    })
    
    if (!digitalProducts || digitalProducts.length === 0) {
      return { artworkName: null, collectionName: null }
    }
    
    const digitalProduct = digitalProducts[0]
    if (!digitalProduct.artwork_id) {
      return { artworkName: null, collectionName: null }
    }
    
    // Get the artwork
    const artworks = await artworkService.listArtworks({
      filters: { id: digitalProduct.artwork_id }
    })
    
    if (!artworks || artworks.length === 0) {
      return { artworkName: null, collectionName: null }
    }
    
    const artwork = artworks[0]
    let collectionName = null
    
    // Get the collection if artwork has one
    if (artwork.artwork_collection_id) {
      const collections = await artworkService.listArtworkCollections({
        filters: { id: artwork.artwork_collection_id }
      })
      
      if (collections && collections.length > 0) {
        collectionName = collections[0].name
      }
    }
    
    return {
      artworkName: artwork.title,
      collectionName: collectionName
    }
  } catch (error) {
    console.error('Error fetching artwork/collection info:', error)
    return { artworkName: null, collectionName: null }
  }
}

// GET /store/customers/me/downloads - Get customer's digital downloads
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Add CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-publishable-api-key')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  try {
    console.log('[Downloads] Request received with query:', req.query)
    
    // Get customer email from query params (for non-authenticated access)
    const customerEmail = req.query.customer_email as string
    
    if (!customerEmail) {
      console.log('[Downloads] No customer email provided')
      return res.status(400).json({ error: "Customer email required" })
    }
    
    console.log(`[Downloads] Fetching downloads for customer: ${customerEmail}`)
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    const artworkService: ArtworkModuleService = 
      req.scope.resolve(ARTWORK_MODULE)
    
    // Get customer's orders with digital items by email
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { 
        email: customerEmail,
        status: ["completed", "pending", "captured"] // Include various order statuses
      },
      fields: [
        "id",
        "display_id", 
        "created_at",
        "total",
        "currency_code",
        "items.*",
        "items.product.*",
        "items.product.metadata"
      ],
    })
    
    if (!orders || orders.length === 0) {
      return res.json({ downloads: [] })
    }
    
    // Extract digital product items from all orders
    const digitalItems: any[] = []
    
    for (const order of orders) {
      if (order.items) {
        for (const item of order.items) {
          if (item?.product?.metadata?.fulfillment_type === 'digital_download') {
            const digitalProductId = item.product.metadata.digital_product_id
            
            if (digitalProductId) {
              try {
                // Get download access for this order and digital product
                const downloadAccess = await digitalProductService.listDigitalProductDownloads({
                  filters: {
                    order_id: order.id,
                    digital_product_id: digitalProductId,
                    is_active: true
                  }
                })
                
                // Get the digital product details
                const [digitalProduct] = await digitalProductService.listDigitalProducts({
                  filters: { id: digitalProductId }
                })
              
              if (digitalProduct) {
                // Get artwork and collection info
                const { artworkName, collectionName } = await getArtworkCollectionInfo(digitalProductId, artworkService)
                
                if (downloadAccess.length > 0) {
                  for (const access of downloadAccess) {
                    digitalItems.push({
                      order_id: order.id,
                      order_display_id: order.display_id,
                      order_date: order.created_at,
                      product_name: digitalProduct.name || item.product.title,
                      product_description: digitalProduct.description,
                      download_url: `${process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/download/secure/${access.token}`,
                      expires_at: access.expires_at,
                      download_count: access.download_count,
                      max_downloads: digitalProduct.max_downloads || -1,
                      is_expired: access.expires_at ? new Date() > new Date(access.expires_at) : false,
                      file_size: digitalProduct.file_size,
                      mime_type: digitalProduct.mime_type,
                      storage_url: digitalProduct.file_url || null,
                      supabase_path: digitalProduct.storage_path || null,
                      artwork_name: artworkName,
                      collection_name: collectionName
                    })
                  }
                } else if (digitalProduct.file_url || digitalProduct.storage_path) {
                  // If no download access exists but the product has a file, create direct link
                  const supabaseUrl = digitalProduct.file_url || 
                    (digitalProduct.storage_bucket && digitalProduct.storage_path ? 
                      `${process.env.SUPABASE_URL}/storage/v1/object/public/${digitalProduct.storage_bucket}/${digitalProduct.storage_path}` : 
                      null)
                  
                  if (supabaseUrl) {
                    digitalItems.push({
                      order_id: order.id,
                      order_display_id: order.display_id,
                      order_date: order.created_at,
                      product_name: digitalProduct.name || item.product.title,
                      product_description: digitalProduct.description,
                      download_url: supabaseUrl,
                      expires_at: null,
                      download_count: 0,
                      max_downloads: -1,
                      is_expired: false,
                      file_size: digitalProduct.file_size,
                      mime_type: digitalProduct.mime_type,
                      storage_url: supabaseUrl,
                      supabase_path: digitalProduct.storage_path || null,
                      artwork_name: artworkName,
                      collection_name: collectionName
                    })
                  }
                }
              }
              } catch (error) {
                console.error('Error fetching digital product data:', error)
              }
            } else if (item.product.metadata.digital_download_url) {
              // Fallback: Use direct URL from metadata if available
              digitalItems.push({
                order_id: order.id,
                order_display_id: order.display_id,
                order_date: order.created_at,
                product_name: item.product.title,
                product_description: item.product.description || '',
                download_url: item.product.metadata.digital_download_url,
                expires_at: null,
                download_count: 0,
                max_downloads: -1,
                is_expired: false,
                file_size: null,
                mime_type: null,
                storage_url: item.product.metadata.digital_download_url,
                supabase_path: null,
                artwork_name: item.product.title, // Use product title as artwork name fallback
                collection_name: null // No collection info available in fallback
              })
            }
          }
        }
      }
    }
    
    // Sort by order date (newest first)
    digitalItems.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
    
    res.json({ 
      downloads: digitalItems,
      count: digitalItems.length
    })
    
  } catch (error) {
    console.error("Error fetching customer downloads:", error)
    res.status(500).json({ 
      error: "Failed to fetch downloads" 
    })
  }
}