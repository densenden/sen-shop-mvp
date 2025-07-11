import { MedusaService } from "@medusajs/framework/utils"
import { PrintfulFulfillmentService } from "./printful-fulfillment-service"
import crypto from 'crypto'

interface PrintfulWebhookEvent {
  type: string
  data: any
  timestamp: string
  signature?: string
}

interface PrintfulOrderUpdateEvent {
  type: 'order_updated'
  data: {
    order: {
      id: string
      status: string
      tracking_number?: string
      tracking_url?: string
      shipped_at?: string
      delivered_at?: string
    }
  }
}

interface PrintfulProductUpdateEvent {
  type: 'product_updated'
  data: {
    product: {
      id: string
      name: string
      variants: any[]
    }
  }
}

export class PrintfulWebhookService extends MedusaService({}) {
  private fulfillmentService: PrintfulFulfillmentService
  private webhookSecret: string

  constructor(container: any, options?: any) {
    super(container, options)
    this.fulfillmentService = new PrintfulFulfillmentService(container, options)
    this.webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET || ""
  }

  // Verify webhook signature
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('PRINTFUL_WEBHOOK_SECRET not configured, skipping signature verification')
      return true
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // Process incoming webhook
  async processWebhook(rawPayload: string, signature?: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Verify signature if provided
      if (signature && !this.verifyWebhookSignature(rawPayload, signature)) {
        return { success: false, message: 'Invalid webhook signature' }
      }

      const event: PrintfulWebhookEvent = JSON.parse(rawPayload)
      
      console.log(`Processing Printful webhook event: ${event.type}`)

      switch (event.type) {
        case 'order_updated':
          return await this.handleOrderUpdate(event as PrintfulOrderUpdateEvent)
        
        case 'order_shipped':
          return await this.handleOrderShipped(event as PrintfulOrderUpdateEvent)
        
        case 'order_delivered':
          return await this.handleOrderDelivered(event as PrintfulOrderUpdateEvent)
        
        case 'order_cancelled':
          return await this.handleOrderCancelled(event as PrintfulOrderUpdateEvent)
        
        case 'product_updated':
          return await this.handleProductUpdate(event as PrintfulProductUpdateEvent)
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`)
          return { success: true, message: 'Event type not handled' }
      }

    } catch (error: any) {
      console.error('Error processing webhook:', error)
      return { success: false, message: error.message }
    }
  }

  // Handle order status updates
  private async handleOrderUpdate(event: PrintfulOrderUpdateEvent): Promise<{ success: boolean; message?: string }> {
    try {
      const { order } = event.data
      
      await this.fulfillmentService.handleStatusUpdate(
        order.id,
        order.status,
        {
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          shipped_at: order.shipped_at,
          delivered_at: order.delivered_at
        }
      )

      return { success: true, message: `Order ${order.id} status updated to ${order.status}` }

    } catch (error: any) {
      console.error('Error handling order update:', error)
      return { success: false, message: error.message }
    }
  }

  // Handle order shipped events
  private async handleOrderShipped(event: PrintfulOrderUpdateEvent): Promise<{ success: boolean; message?: string }> {
    try {
      const { order } = event.data
      
      // Update order status to shipped
      await this.fulfillmentService.handleStatusUpdate(
        order.id,
        'shipped',
        {
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          shipped_at: order.shipped_at
        }
      )

      // Send shipping notification to customer
      await this.sendShippingNotification(order)

      return { success: true, message: `Order ${order.id} shipped` }

    } catch (error: any) {
      console.error('Error handling order shipped:', error)
      return { success: false, message: error.message }
    }
  }

  // Handle order delivered events
  private async handleOrderDelivered(event: PrintfulOrderUpdateEvent): Promise<{ success: boolean; message?: string }> {
    try {
      const { order } = event.data
      
      // Update order status to delivered
      await this.fulfillmentService.handleStatusUpdate(
        order.id,
        'delivered',
        {
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          delivered_at: order.delivered_at
        }
      )

      // Send delivery notification to customer
      await this.sendDeliveryNotification(order)

      return { success: true, message: `Order ${order.id} delivered` }

    } catch (error: any) {
      console.error('Error handling order delivered:', error)
      return { success: false, message: error.message }
    }
  }

  // Handle order cancelled events
  private async handleOrderCancelled(event: PrintfulOrderUpdateEvent): Promise<{ success: boolean; message?: string }> {
    try {
      const { order } = event.data
      
      // Update order status to cancelled
      await this.fulfillmentService.handleStatusUpdate(order.id, 'cancelled')

      // Send cancellation notification to customer
      await this.sendCancellationNotification(order)

      return { success: true, message: `Order ${order.id} cancelled` }

    } catch (error: any) {
      console.error('Error handling order cancelled:', error)
      return { success: false, message: error.message }
    }
  }

  // Handle product updates
  private async handleProductUpdate(event: PrintfulProductUpdateEvent): Promise<{ success: boolean; message?: string }> {
    try {
      const { product } = event.data
      
      // Update product information in local database
      // This would sync product changes from Printful
      console.log(`Product ${product.id} updated: ${product.name}`)

      // You could implement product sync logic here
      // For example, update pricing, availability, etc.

      return { success: true, message: `Product ${product.id} updated` }

    } catch (error: any) {
      console.error('Error handling product update:', error)
      return { success: false, message: error.message }
    }
  }

  // Send shipping notification to customer
  private async sendShippingNotification(order: any): Promise<void> {
    try {
      // This would integrate with your notification system
      // For example, sending email via SendGrid, SMS, etc.
      console.log(`Sending shipping notification for order ${order.id}`)
      
      // Example: Use Medusa's notification service
      // const notificationService = this.container.resolve('notificationService')
      // await notificationService.sendNotification({
      //   type: 'order_shipped',
      //   to: order.customer_email,
      //   data: {
      //     order_id: order.id,
      //     tracking_number: order.tracking_number,
      //     tracking_url: order.tracking_url
      //   }
      // })

    } catch (error: any) {
      console.error('Error sending shipping notification:', error)
    }
  }

  // Send delivery notification to customer
  private async sendDeliveryNotification(order: any): Promise<void> {
    try {
      console.log(`Sending delivery notification for order ${order.id}`)
      
      // Example: Use Medusa's notification service
      // const notificationService = this.container.resolve('notificationService')
      // await notificationService.sendNotification({
      //   type: 'order_delivered',
      //   to: order.customer_email,
      //   data: {
      //     order_id: order.id,
      //     delivered_at: order.delivered_at
      //   }
      // })

    } catch (error: any) {
      console.error('Error sending delivery notification:', error)
    }
  }

  // Send cancellation notification to customer
  private async sendCancellationNotification(order: any): Promise<void> {
    try {
      console.log(`Sending cancellation notification for order ${order.id}`)
      
      // Example: Use Medusa's notification service
      // const notificationService = this.container.resolve('notificationService')
      // await notificationService.sendNotification({
      //   type: 'order_cancelled',
      //   to: order.customer_email,
      //   data: {
      //     order_id: order.id,
      //     reason: 'Cancelled by fulfillment provider'
      //   }
      // })

    } catch (error: any) {
      console.error('Error sending cancellation notification:', error)
    }
  }

  // Register webhook endpoints with Printful
  async registerWebhooks(baseUrl: string): Promise<void> {
    try {
      const webhookEndpoints = [
        {
          url: `${baseUrl}/webhooks/printful/order-updated`,
          events: ['order_updated', 'order_shipped', 'order_delivered', 'order_cancelled']
        },
        {
          url: `${baseUrl}/webhooks/printful/product-updated`,
          events: ['product_updated']
        }
      ]

      for (const endpoint of webhookEndpoints) {
        console.log(`Registering webhook: ${endpoint.url}`)
        // This would call Printful's webhook registration API
        // await this.registerWebhookEndpoint(endpoint)
      }

    } catch (error: any) {
      console.error('Error registering webhooks:', error)
      throw error
    }
  }

  // Unregister webhook endpoints
  async unregisterWebhooks(): Promise<void> {
    try {
      console.log('Unregistering Printful webhooks')
      // This would call Printful's webhook unregistration API

    } catch (error: any) {
      console.error('Error unregistering webhooks:', error)
      throw error
    }
  }

  // Test webhook endpoint
  async testWebhook(eventType: string, testData: any): Promise<{ success: boolean; message?: string }> {
    try {
      const testEvent: PrintfulWebhookEvent = {
        type: eventType,
        data: testData,
        timestamp: new Date().toISOString()
      }

      const result = await this.processWebhook(JSON.stringify(testEvent))
      return result

    } catch (error: any) {
      console.error('Error testing webhook:', error)
      return { success: false, message: error.message }
    }
  }
}