"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulWebhookService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const printful_fulfillment_service_1 = require("./printful-fulfillment-service");
const crypto_1 = __importDefault(require("crypto"));
class PrintfulWebhookService extends (0, utils_1.MedusaService)({}) {
    constructor(container, options) {
        super(container, options);
        this.fulfillmentService = new printful_fulfillment_service_1.PrintfulFulfillmentService(container, options);
        this.webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET || "";
    }
    // Verify webhook signature
    verifyWebhookSignature(payload, signature) {
        if (!this.webhookSecret) {
            console.warn('PRINTFUL_WEBHOOK_SECRET not configured, skipping signature verification');
            return true;
        }
        const expectedSignature = crypto_1.default
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    // Process incoming webhook
    async processWebhook(rawPayload, signature) {
        try {
            // Verify signature if provided
            if (signature && !this.verifyWebhookSignature(rawPayload, signature)) {
                return { success: false, message: 'Invalid webhook signature' };
            }
            const event = JSON.parse(rawPayload);
            console.log(`Processing Printful webhook event: ${event.type}`);
            switch (event.type) {
                case 'order_updated':
                    return await this.handleOrderUpdate(event);
                case 'order_shipped':
                    return await this.handleOrderShipped(event);
                case 'order_delivered':
                    return await this.handleOrderDelivered(event);
                case 'order_cancelled':
                    return await this.handleOrderCancelled(event);
                case 'product_updated':
                    return await this.handleProductUpdate(event);
                default:
                    console.log(`Unhandled webhook event type: ${event.type}`);
                    return { success: true, message: 'Event type not handled' };
            }
        }
        catch (error) {
            console.error('Error processing webhook:', error);
            return { success: false, message: error.message };
        }
    }
    // Handle order status updates
    async handleOrderUpdate(event) {
        try {
            const { order } = event.data;
            await this.fulfillmentService.handleStatusUpdate(order.id, order.status, {
                tracking_number: order.tracking_number,
                tracking_url: order.tracking_url,
                shipped_at: order.shipped_at,
                delivered_at: order.delivered_at
            });
            return { success: true, message: `Order ${order.id} status updated to ${order.status}` };
        }
        catch (error) {
            console.error('Error handling order update:', error);
            return { success: false, message: error.message };
        }
    }
    // Handle order shipped events
    async handleOrderShipped(event) {
        try {
            const { order } = event.data;
            // Update order status to shipped
            await this.fulfillmentService.handleStatusUpdate(order.id, 'shipped', {
                tracking_number: order.tracking_number,
                tracking_url: order.tracking_url,
                shipped_at: order.shipped_at
            });
            // Send shipping notification to customer
            await this.sendShippingNotification(order);
            return { success: true, message: `Order ${order.id} shipped` };
        }
        catch (error) {
            console.error('Error handling order shipped:', error);
            return { success: false, message: error.message };
        }
    }
    // Handle order delivered events
    async handleOrderDelivered(event) {
        try {
            const { order } = event.data;
            // Update order status to delivered
            await this.fulfillmentService.handleStatusUpdate(order.id, 'delivered', {
                tracking_number: order.tracking_number,
                tracking_url: order.tracking_url,
                delivered_at: order.delivered_at
            });
            // Send delivery notification to customer
            await this.sendDeliveryNotification(order);
            return { success: true, message: `Order ${order.id} delivered` };
        }
        catch (error) {
            console.error('Error handling order delivered:', error);
            return { success: false, message: error.message };
        }
    }
    // Handle order cancelled events
    async handleOrderCancelled(event) {
        try {
            const { order } = event.data;
            // Update order status to cancelled
            await this.fulfillmentService.handleStatusUpdate(order.id, 'cancelled');
            // Send cancellation notification to customer
            await this.sendCancellationNotification(order);
            return { success: true, message: `Order ${order.id} cancelled` };
        }
        catch (error) {
            console.error('Error handling order cancelled:', error);
            return { success: false, message: error.message };
        }
    }
    // Handle product updates
    async handleProductUpdate(event) {
        try {
            const { product } = event.data;
            // Update product information in local database
            // This would sync product changes from Printful
            console.log(`Product ${product.id} updated: ${product.name}`);
            // You could implement product sync logic here
            // For example, update pricing, availability, etc.
            return { success: true, message: `Product ${product.id} updated` };
        }
        catch (error) {
            console.error('Error handling product update:', error);
            return { success: false, message: error.message };
        }
    }
    // Send shipping notification to customer
    async sendShippingNotification(order) {
        try {
            // This would integrate with your notification system
            // For example, sending email via SendGrid, SMS, etc.
            console.log(`Sending shipping notification for order ${order.id}`);
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
        }
        catch (error) {
            console.error('Error sending shipping notification:', error);
        }
    }
    // Send delivery notification to customer
    async sendDeliveryNotification(order) {
        try {
            console.log(`Sending delivery notification for order ${order.id}`);
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
        }
        catch (error) {
            console.error('Error sending delivery notification:', error);
        }
    }
    // Send cancellation notification to customer
    async sendCancellationNotification(order) {
        try {
            console.log(`Sending cancellation notification for order ${order.id}`);
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
        }
        catch (error) {
            console.error('Error sending cancellation notification:', error);
        }
    }
    // Register webhook endpoints with Printful
    async registerWebhooks(baseUrl) {
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
            ];
            for (const endpoint of webhookEndpoints) {
                console.log(`Registering webhook: ${endpoint.url}`);
                // This would call Printful's webhook registration API
                // await this.registerWebhookEndpoint(endpoint)
            }
        }
        catch (error) {
            console.error('Error registering webhooks:', error);
            throw error;
        }
    }
    // Unregister webhook endpoints
    async unregisterWebhooks() {
        try {
            console.log('Unregistering Printful webhooks');
            // This would call Printful's webhook unregistration API
        }
        catch (error) {
            console.error('Error unregistering webhooks:', error);
            throw error;
        }
    }
    // Test webhook endpoint
    async testWebhook(eventType, testData) {
        try {
            const testEvent = {
                type: eventType,
                data: testData,
                timestamp: new Date().toISOString()
            };
            const result = await this.processWebhook(JSON.stringify(testEvent));
            return result;
        }
        catch (error) {
            console.error('Error testing webhook:', error);
            return { success: false, message: error.message };
        }
    }
}
exports.PrintfulWebhookService = PrintfulWebhookService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtd2ViaG9vay1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvcHJpbnRmdWwvc2VydmljZXMvcHJpbnRmdWwtd2ViaG9vay1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHFEQUF5RDtBQUN6RCxpRkFBMkU7QUFDM0Usb0RBQTJCO0FBa0MzQixNQUFhLHNCQUF1QixTQUFRLElBQUEscUJBQWEsRUFBQyxFQUFFLENBQUM7SUFJM0QsWUFBWSxTQUFjLEVBQUUsT0FBYTtRQUN2QyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLHlEQUEwQixDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUM1RSxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLElBQUksRUFBRSxDQUFBO0lBQ2hFLENBQUM7SUFFRCwyQkFBMkI7SUFDbkIsc0JBQXNCLENBQUMsT0FBZSxFQUFFLFNBQWlCO1FBQy9ELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyx5RUFBeUUsQ0FBQyxDQUFBO1lBQ3ZGLE9BQU8sSUFBSSxDQUFBO1FBQ2IsQ0FBQztRQUVELE1BQU0saUJBQWlCLEdBQUcsZ0JBQU07YUFDN0IsVUFBVSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDO2FBQ3hDLE1BQU0sQ0FBQyxPQUFPLENBQUM7YUFDZixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFaEIsT0FBTyxnQkFBTSxDQUFDLGVBQWUsQ0FDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENB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