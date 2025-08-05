import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../modules/digital-product"
import type { DigitalProductModuleService } from "../modules/digital-product/services/digital-product-module-service"
import EmailService from "../services/email-service"
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
    const digitalProductItems: Array<{digitalProductId: string, product: any, quantity: number}> = []
    
    for (const item of order.items) {
      if (item?.product?.id && item?.product?.metadata) {
        // Check if product has digital fulfillment
        if (item.product.metadata.fulfillment_type === 'digital_download') {
          // Look for linked digital product ID in metadata
          const digitalProductId = item.product.metadata.digital_product_id
          if (digitalProductId) {
            digitalProductItems.push({
              digitalProductId,
              product: item.product,
              quantity: item.quantity || 1
            })
            logger.info(`Found digital product ${digitalProductId} for order item ${item.id}`)
          }
        }
      }
    }
    
    // If we found digital products, create download access
    if (digitalProductItems.length > 0) {
      const downloadLinks: any[] = []
      
      for (const item of digitalProductItems) {
        const digitalProducts = await digitalProductService.listDigitalProducts({
          filters: { id: item.digitalProductId }
        })
        const digitalProduct = digitalProducts[0]
        
        if (digitalProduct) {
          // Generate secure token for each quantity (some digital products might need separate tokens)
          for (let i = 0; i < item.quantity; i++) {
            const token = crypto.randomBytes(32).toString('hex')
            
            // Create download access
            await digitalProductService.createDigitalProductDownloads({
              digital_product_id: digitalProduct.id,
              order_id: order.id,
              customer_id: order.customer_id || order.email || 'guest',
              token,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              is_active: true,
              download_count: 0
            })
            
            downloadLinks.push({
              product_name: digitalProduct.name,
              download_url: `${process.env.STORE_URL || 'http://localhost:3000'}/api/store/download/${token}`,
              expires_in_days: 7
            })
          }
        }
      }
      
      // Send email with download links
      if (downloadLinks.length > 0) {
        logger.info(`Sending ${downloadLinks.length} download links to ${order.email}`)
        
        const emailService = new EmailService()
        
        // Get customer name or use email
        const customerName = order.email?.split('@')[0] || 'Customer'
        const orderNumber = order.id.slice(-8).toUpperCase()
        
        const emailData = {
          customerEmail: order.email,
          customerName,
          orderId: order.id,
          orderNumber,
          downloadLinks: downloadLinks.map(link => ({
            productTitle: link.product_name,
            downloadUrl: link.download_url,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          }))
        }
        
        try {
          await emailService.sendDigitalDownloadLinks(emailData)
          logger.info(`Download links email sent successfully to ${order.email}`)
        } catch (error) {
          logger.error(`Failed to send download links email:`, error)
        }
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