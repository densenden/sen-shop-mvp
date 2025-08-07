import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../modules/digital-product"
import type { DigitalProductModuleService } from "../modules/digital-product/services/digital-product-module-service"
import EmailService from "../services/email-service"
import crypto from "crypto"

export default async function handleDigitalProducts({ 
  event: { data },
  container 
}: SubscriberArgs<{ id: string, data?: any }>) {
  const logger = container.resolve("logger")
  
  try {
    console.log(`[Digital Products Subscriber] 📱 Processing digital products for order ${data.id}`)
    
    // Get order data from event (new structure)
    const orderData = data.data
    if (!orderData || !orderData.items || !orderData.email) {
      console.log("[Digital Products Subscriber] ❌ No order data or items found, skipping digital products")
      return
    }
    
    console.log(`[Digital Products Subscriber] 🔍 Checking ${orderData.items.length} items for digital products`)
    
    const digitalProductService: DigitalProductModuleService = 
      container.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Check each line item for digital products
    const digitalProductItems: Array<{digitalProductId: string, product: any, quantity: number}> = []
    
    for (const item of orderData.items) {
      console.log(`[Digital Products Subscriber] 🏷️ Checking item: ${item.title}`)
      console.log(`[Digital Products Subscriber] Item metadata:`, item.metadata)
      
      // Check if item has digital fulfillment
      const fulfillmentType = item.fulfillment_type || 
                             item.metadata?.fulfillment_type || 
                             item.product?.metadata?.fulfillment_type
      
      if (fulfillmentType === 'digital' || fulfillmentType === 'digital_download') {
        // Look for linked digital product ID in metadata
        const digitalProductId = item.digital_product_id || 
                                item.metadata?.digital_product_id || 
                                item.product?.metadata?.digital_product_id
        
        if (digitalProductId) {
          digitalProductItems.push({
            digitalProductId,
            product: item.product || item,
            quantity: item.quantity || 1
          })
          console.log(`[Digital Products Subscriber] ✅ Found digital product ${digitalProductId} for item ${item.title}`)
        } else {
          console.log(`[Digital Products Subscriber] ⚠️ Digital item ${item.title} has no digital_product_id`)
        }
      }
    }
    
    // If we found digital products, create download access
    if (digitalProductItems.length > 0) {
      console.log(`[Digital Products Subscriber] 🎯 Processing ${digitalProductItems.length} digital product items`)
      
      const downloadLinks: any[] = []
      
      for (const item of digitalProductItems) {
        try {
          const digitalProducts = await digitalProductService.listDigitalProducts({
            filters: { id: item.digitalProductId }
          })
          const digitalProduct = digitalProducts[0]
          
          if (digitalProduct) {
            console.log(`[Digital Products Subscriber] 📁 Found digital product: ${digitalProduct.name}`)
            
            // Generate secure token for each quantity
            for (let i = 0; i < item.quantity; i++) {
              const token = crypto.randomBytes(32).toString('hex')
              
              // Create download access
              await digitalProductService.createDigitalProductDownloads({
                digital_product_id: digitalProduct.id,
                order_id: orderData.id,
                customer_id: orderData.customer_id || orderData.email,
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
              
              console.log(`[Digital Products Subscriber] 🔗 Created download link for ${digitalProduct.name}`)
            }
          } else {
            console.log(`[Digital Products Subscriber] ❌ Digital product ${item.digitalProductId} not found`)
          }
        } catch (error) {
          console.error(`[Digital Products Subscriber] ❌ Error processing digital product ${item.digitalProductId}:`, error)
        }
      }
      
      // Send email with download links
      if (downloadLinks.length > 0) {
        console.log(`[Digital Products Subscriber] 📧 Sending ${downloadLinks.length} download links to ${orderData.email}`)
        
        const emailService = new EmailService()
        
        // Get customer name
        const customerName = orderData.customer_info?.name || 
                           orderData.customer_info?.first_name || 
                           orderData.email.split('@')[0] || 'Customer'
        const orderNumber = orderData.id.slice(-8).toUpperCase()
        
        const emailData = {
          customerEmail: orderData.email,
          customerName,
          orderId: orderData.id,
          orderNumber,
          downloadLinks: downloadLinks.map(link => ({
            productTitle: link.product_name,
            downloadUrl: link.download_url,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          }))
        }
        
        try {
          await emailService.sendDigitalDownloadLinks(emailData)
          console.log(`[Digital Products Subscriber] ✅ Download links email sent successfully to ${orderData.email}`)
        } catch (error) {
          console.error(`[Digital Products Subscriber] ❌ Failed to send download links email:`, error)
        }
      } else {
        console.log(`[Digital Products Subscriber] ⚠️ No download links generated, skipping email`)
      }
    } else {
      console.log(`[Digital Products Subscriber] ℹ️ No digital products found in order ${data.id}`)
    }
    
  } catch (error) {
    console.error(`[Digital Products Subscriber] ❌ Error processing digital products for order ${data.id}:`, error)
    console.error("[Digital Products Subscriber] Full error stack:", error.stack)
    // Don't throw - we don't want to fail the order
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}