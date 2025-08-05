import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"
import jwt from "jsonwebtoken"

// GET /store/customers/me/downloads - Get customer's digital downloads
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: "Authentication required - No token provided"
      })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret")
    } catch (error) {
      return res.status(401).json({
        error: "Authentication required - Invalid token"
      })
    }

    const customerId = decoded.customer_id
    
    if (!customerId) {
      return res.status(401).json({ error: "Authentication required" })
    }
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Get customer's orders with digital items
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { 
        customer_id: customerId,
        status: ["completed", "pending"] // Include both completed and pending orders
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
              
              if (digitalProduct && downloadAccess.length > 0) {
                for (const access of downloadAccess) {
                  digitalItems.push({
                    order_id: order.id,
                    order_display_id: order.display_id,
                    order_date: order.created_at,
                    product_name: digitalProduct.name,
                    product_description: digitalProduct.description,
                    download_url: `${process.env.STORE_URL || 'http://localhost:3000'}/api/store/download/${access.token}`,
                    expires_at: access.expires_at,
                    download_count: access.download_count,
                    max_downloads: digitalProduct.max_downloads,
                    is_expired: access.expires_at ? new Date() > new Date(access.expires_at) : false,
                    file_size: digitalProduct.file_size,
                    mime_type: digitalProduct.mime_type
                  })
                }
              }
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