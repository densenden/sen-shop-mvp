import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../modules/digital-product/services/digital-product-module-service"

// GET /store/downloads - Get customer's digital downloads
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log('[Downloads] Request received with query:', req.query)
    
    // Get customer email from query params
    const customerEmail = req.query.customer_email as string
    
    if (!customerEmail) {
      console.log('[Downloads] No customer email provided')
      return res.status(400).json({ error: "Customer email required" })
    }
    
    console.log(`[Downloads] Fetching downloads for customer: ${customerEmail}`)
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Get customer's orders with digital items by email
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { 
        email: customerEmail
      },
      fields: [
        "id",
        "display_id", 
        "created_at",
        "items.*",
        "items.product.*",
        "items.product.id",
        "items.product.metadata"
      ],
    })
    
    if (!orders || orders.length === 0) {
      console.log('[Downloads] No orders found for customer')
      return res.json({ downloads: [] })
    }
    
    console.log(`[Downloads] Found ${orders.length} orders for customer`)
    
    // Extract digital product items from all orders  
    const digitalItems: any[] = []
    
    // Also check via direct database query to ensure we get digital downloads
    // This is a temporary solution since the query.graph might not be working correctly
    try {
      console.log('[Downloads] Trying direct database query as fallback...')
      
      // Try different ways to get database connection
      let db
      try {
        db = req.scope.resolve('pg')
      } catch (e) {
        console.log('[Downloads] Could not resolve pg, trying dbConnection...')
        db = req.scope.resolve('dbConnection')
      }
      const directQuery = `
        SELECT 
          o.id as order_id,
          o.display_id as order_display_id,
          o.created_at as order_date,
          oli.title as product_name,
          oli.product_id as product_id,
          oli.metadata->>'digital_download_url' as download_url,
          oli.metadata->>'fulfillment_type' as fulfillment_type
        FROM "order" o
        JOIN order_item oi ON o.id = oi.order_id
        JOIN order_line_item oli ON oi.item_id = oli.id
        WHERE o.email = $1 
        AND (oli.metadata->>'fulfillment_type' = 'digital_download' OR oli.metadata->>'fulfillment_type' = 'digital')
        ORDER BY o.created_at DESC
      `
      
      const directResult = await db.raw(directQuery, [customerEmail])
      console.log(`[Downloads] Direct query found ${directResult.rows.length} digital downloads`)
      
      if (directResult.rows.length > 0) {
        directResult.rows.forEach(row => {
          digitalItems.push({
            product_id: row.product_id, // Include the actual product ID from database
            order_id: row.order_id,
            order_display_id: row.order_display_id,
            order_date: row.order_date,
            product_name: row.product_name,
            product_description: '',
            download_url: row.download_url,
            expires_at: null,
            download_count: 0,
            max_downloads: -1,
            is_expired: false,
            file_size: null,
            mime_type: null,
            storage_url: row.download_url,
            supabase_path: null
          })
        })
      }
      
    } catch (dbError) {
      console.error('[Downloads] Direct database query failed:', dbError)
    }
    
    for (const order of orders) {
      if (order.items) {
        for (const item of order.items) {
          // Check both item metadata and product metadata for digital types
          const itemType = item?.metadata?.fulfillment_type
          const productType = item?.product?.metadata?.fulfillment_type
          const isDigitalFromItem = itemType === 'digital_download' || itemType === 'digital'
          const isDigitalFromProduct = productType === 'digital_download' || productType === 'digital'
          
          console.log(`[Downloads] Item ${item.title}: item_fulfillment=${item?.metadata?.fulfillment_type}, product_fulfillment=${item?.product?.metadata?.fulfillment_type}`)
          
          if (isDigitalFromItem || isDigitalFromProduct) {
            console.log(`[Downloads] Processing digital item: ${item.title}`)
            
            // For now, just use the direct URL approach since the digital product module has issues
            const downloadUrl = item.metadata?.digital_download_url || item.product?.metadata?.digital_download_url
            const productName = item.title || item.product?.title || 'Digital Product'
            
            if (downloadUrl) {
              console.log(`[Downloads] Adding digital download for ${productName}`)
              digitalItems.push({
                product_id: item.product?.id || item.product_id, // Include the actual product ID
                order_id: order.id,
                order_display_id: order.display_id,
                order_date: order.created_at,
                product_name: productName,
                product_description: item.product?.description || '',
                download_url: downloadUrl,
                expires_at: null,
                download_count: 0,
                max_downloads: -1,
                is_expired: false,
                file_size: null,
                mime_type: null,
                storage_url: downloadUrl,
                supabase_path: null
              })
            } else {
              // Try to get the file URL from the digital_product table directly
              const digitalProductId = item.metadata?.digital_product_id || item.product?.metadata?.digital_product_id
              if (digitalProductId) {
                console.log(`[Downloads] Trying direct DB lookup for digital product: ${digitalProductId}`)
                try {
                  // Use the query service instead of direct DB access
                  const digitalProductResult = await query.graph({
                    entity: "digital_product",
                    filters: { id: digitalProductId },
                    fields: ["id", "name", "file_url", "file_size", "mime_type"]
                  })
                  
                  if (digitalProductResult.data && digitalProductResult.data.length > 0) {
                    const dp = digitalProductResult.data[0]
                    console.log(`[Downloads] Found digital product via query: ${dp.name}`)
                    digitalItems.push({
                      product_id: item.product?.id || item.product_id, // Include the actual product ID
                      order_id: order.id,
                      order_display_id: order.display_id,
                      order_date: order.created_at,
                      product_name: dp.name || productName,
                      product_description: item.product?.description || '',
                      download_url: dp.file_url,
                      expires_at: null,
                      download_count: 0,
                      max_downloads: -1,
                      is_expired: false,
                      file_size: dp.file_size,
                      mime_type: dp.mime_type,
                      storage_url: dp.file_url,
                      supabase_path: null
                    })
                  }
                } catch (queryError) {
                  console.log(`[Downloads] Query lookup failed for digital product ${digitalProductId}:`, queryError.message)
                }
              } else {
                console.log(`[Downloads] No download URL or digital_product_id found for: ${productName}`)
              }
            }
          }
        }
      }
    }
    
    // Sort by order date (newest first)
    digitalItems.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
    
    console.log(`[Downloads] Found ${digitalItems.length} digital items for customer`)
    
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