import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"

// GET /store/orders/:id/details - Get order details with download links
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: orderId } = req.params
    console.log(`[Order Details] Fetching order: ${orderId}`)
    
    // Get order from database
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Get order with line items and products
    const { data: [order] } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: [
        "id",
        "email",
        "customer_id", 
        "total",
        "currency_code",
        "created_at",
        "status",
        "items.*",
        "items.product.*"
      ],
    })
    
    if (!order) {
      console.log(`[Order Details] Order not found: ${orderId}`)
      return res.status(404).json({ error: "Order not found" })
    }
    
    // Get download links for digital products
    const downloadLinks: any[] = []
    
    // Only check for digital downloads if there are items with digital fulfillment
    const hasDigitalItems = order.items?.some((item: any) => 
      item.metadata?.fulfillment_type === 'digital_download' ||
      item.fulfillment_type === 'digital_download'
    )
    
    if (hasDigitalItems) {
      // Get all download access records for this order
      try {
        const downloads = await digitalProductService.listDigitalProductDownloads({
          order_id: orderId,
          is_active: true
        })
        
        // Process downloads if any found
        if (downloads && downloads.length > 0) {
          // Map downloads to items
          for (const download of downloads) {
            // Use download properties directly without relation
            downloadLinks.push({
              token: download.token,
              product_name: download.product_name || 'Digital Product',
              download_url: `${process.env.STORE_URL || 'http://localhost:9000'}/store/download/${download.token}`,
              expires_at: download.expires_at,
              download_count: download.download_count,
              max_downloads: download.max_downloads || -1
            })
          }
        }
      } catch (downloadError) {
        console.warn('[Order Details] Could not fetch digital downloads:', downloadError)
        // Continue without digital downloads
      }
    }
    
    // Format the order data
    const formattedOrder = {
      id: order.id,
      email: order.email,
      customer_id: order.customer_id,
      total: order.total || 0,
      currency_code: order.currency_code || 'eur',
      created_at: order.created_at,
      status: order.status,
      items: order.items?.map((item: any) => ({
        id: item.id,
        title: item.product?.title || item.title || 'Unknown Product',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: (item.unit_price || 0) * (item.quantity || 1),
        fulfillment_type: item.product?.metadata?.fulfillment_type || 'physical',
        thumbnail: item.product?.thumbnail
      })) || [],
      download_links: downloadLinks
    }
    
    res.json({ order: formattedOrder })
    
  } catch (error) {
    console.error("Error fetching order details:", error)
    res.status(500).json({ 
      error: "Failed to fetch order details" 
    })
  }
}