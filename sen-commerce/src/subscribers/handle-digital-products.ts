import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../modules/digital-product"
import type { DigitalProductModuleService } from "../modules/digital-product/services/digital-product-module-service"
import crypto from "crypto"

export default async function handleDigitalProducts({ 
  event: { data },
  container 
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  
  try {
    logger.info(`Processing digital products for order ${data.id}`)
    
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const digitalProductService: DigitalProductModuleService = 
      container.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Get order with line items
    const { data: [order] } = await query.graph({
      entity: "order",
      filters: { id: data.id },
      fields: [
        "id",
        "email",
        "customer_id",
        "items.*",
        "items.product.*"
      ],
    })
    
    if (!order || !order.items) {
      logger.warn(`Order ${data.id} not found or has no items`)
      return
    }
    
    // Check each line item for digital products
    const digitalProductIds: string[] = []
    
    // For now, we'll check if products have digital products by querying separately
    for (const item of order.items) {
      if (item?.product?.id) {
        // Query for linked digital products
        // Since we removed the link, we'll need another way to associate them
        // For now, let's check if product metadata or title indicates it's digital
        
        // This is a placeholder - you'll need to implement your own logic
        // For example, you could:
        // 1. Store digital product IDs in product metadata
        // 2. Use a naming convention
        // 3. Create a custom field on products
        
        logger.info(`Checking product ${item.product.id} for digital products`)
      }
    }
    
    // If we found digital products, create download access
    if (digitalProductIds.length > 0) {
      const downloadLinks: any[] = []
      
      for (const digitalProductId of digitalProductIds) {
        const [digitalProduct] = await digitalProductService.listDigitalProducts({
          filters: { id: digitalProductId }
        })
        
        if (digitalProduct) {
          // Generate secure token
          const token = crypto.randomBytes(32).toString('hex')
          
          // Create download access
          await digitalProductService.createDigitalProductDownloads({
            digital_product_id: digitalProduct.id,
            order_id: order.id,
            customer_id: order.customer_id || order.email,
            token,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            is_active: true
          })
          
          downloadLinks.push({
            product_name: digitalProduct.name,
            download_url: `${process.env.STORE_URL || 'http://localhost:8000'}/download/${token}`,
            expires_in_days: 7
          })
        }
      }
      
      // Send email with download links
      if (downloadLinks.length > 0) {
        logger.info(`Sending ${downloadLinks.length} download links to ${order.email}`)
        
        // TODO: Send email using notification service
        // For now, just log the links
        logger.info("Download links:", downloadLinks)
      }
    }
    
  } catch (error) {
    logger.error(`Error processing digital products for order ${data.id}:`, error)
    // Don't throw - we don't want to fail the order
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
} 