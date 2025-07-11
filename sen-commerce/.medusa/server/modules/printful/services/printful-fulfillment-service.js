"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulFulfillmentService = void 0;
const utils_1 = require("@medusajs/framework/utils");
const printful_order_service_1 = require("./printful-order-service");
class PrintfulFulfillmentService extends (0, utils_1.MedusaService)({}) {
    constructor(container, options) {
        super(container, options);
        this.container = container;
        this.orderService = new printful_order_service_1.PrintfulOrderService(container, options);
    }
    // Main fulfillment workflow
    async processFulfillment(medusaOrder) {
        const fulfillmentData = {
            medusa_order_id: medusaOrder.id,
            printful_order_id: '',
            status: 'pending',
            workflow_steps: []
        };
        try {
            // Step 1: Validate order has Printful products
            const validationStep = await this.validateOrder(medusaOrder);
            fulfillmentData.workflow_steps.push(validationStep);
            if (validationStep.status === 'failed') {
                fulfillmentData.status = 'failed';
                return fulfillmentData;
            }
            // Step 2: Convert Medusa order to Printful format
            const conversionStep = await this.convertOrder(medusaOrder);
            fulfillmentData.workflow_steps.push(conversionStep);
            if (conversionStep.status === 'failed') {
                fulfillmentData.status = 'failed';
                return fulfillmentData;
            }
            // Step 3: Create order in Printful
            const creationStep = await this.createPrintfulOrder(medusaOrder);
            fulfillmentData.workflow_steps.push(creationStep);
            if (creationStep.status === 'failed') {
                fulfillmentData.status = 'failed';
                return fulfillmentData;
            }
            // Extract Printful order ID from creation step
            const printfulOrderId = creationStep.id;
            fulfillmentData.printful_order_id = printfulOrderId;
            // Step 4: Confirm order for production
            const confirmationStep = await this.confirmOrder(printfulOrderId);
            fulfillmentData.workflow_steps.push(confirmationStep);
            if (confirmationStep.status === 'failed') {
                fulfillmentData.status = 'failed';
                return fulfillmentData;
            }
            // Step 5: Update Medusa order with fulfillment info
            const updateStep = await this.updateMedusaOrder(medusaOrder.id, printfulOrderId);
            fulfillmentData.workflow_steps.push(updateStep);
            fulfillmentData.status = 'in_progress';
            return fulfillmentData;
        }
        catch (error) {
            console.error('Fulfillment workflow error:', error);
            fulfillmentData.status = 'failed';
            fulfillmentData.workflow_steps.push({
                id: 'error',
                name: 'Workflow Error',
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: error.message
            });
            return fulfillmentData;
        }
    }
    // Validate that order contains Printful products
    async validateOrder(medusaOrder) {
        const step = {
            id: 'validation',
            name: 'Validate Order',
            status: 'in_progress',
            timestamp: new Date().toISOString()
        };
        try {
            const items = medusaOrder.items || [];
            const printfulItems = items.filter((item) => item.metadata?.product_type === 'printful_pod');
            if (printfulItems.length === 0) {
                step.status = 'failed';
                step.error = 'No Printful products found in order';
                return step;
            }
            // Validate required fields
            if (!medusaOrder.shipping_address) {
                step.status = 'failed';
                step.error = 'Shipping address is required';
                return step;
            }
            if (!medusaOrder.email) {
                step.status = 'failed';
                step.error = 'Customer email is required';
                return step;
            }
            step.status = 'completed';
            return step;
        }
        catch (error) {
            step.status = 'failed';
            step.error = error.message;
            return step;
        }
    }
    // Convert Medusa order to Printful format
    async convertOrder(medusaOrder) {
        const step = {
            id: 'conversion',
            name: 'Convert Order Format',
            status: 'in_progress',
            timestamp: new Date().toISOString()
        };
        try {
            const printfulOrder = await this.orderService.convertMedusaOrderToPrintful(medusaOrder);
            if (!printfulOrder.items || printfulOrder.items.length === 0) {
                step.status = 'failed';
                step.error = 'No items to convert';
                return step;
            }
            step.status = 'completed';
            return step;
        }
        catch (error) {
            step.status = 'failed';
            step.error = error.message;
            return step;
        }
    }
    // Create order in Printful
    async createPrintfulOrder(medusaOrder) {
        const step = {
            id: 'creation',
            name: 'Create Printful Order',
            status: 'in_progress',
            timestamp: new Date().toISOString()
        };
        try {
            const printfulOrderData = await this.orderService.convertMedusaOrderToPrintful(medusaOrder);
            const printfulOrder = await this.orderService.createOrder(printfulOrderData);
            step.status = 'completed';
            step.id = printfulOrder.id; // Store the Printful order ID
            return step;
        }
        catch (error) {
            step.status = 'failed';
            step.error = error.message;
            return step;
        }
    }
    // Confirm order for production
    async confirmOrder(printfulOrderId) {
        const step = {
            id: 'confirmation',
            name: 'Confirm Order',
            status: 'in_progress',
            timestamp: new Date().toISOString()
        };
        try {
            await this.orderService.confirmOrder(printfulOrderId);
            step.status = 'completed';
            return step;
        }
        catch (error) {
            step.status = 'failed';
            step.error = error.message;
            return step;
        }
    }
    // Update Medusa order with fulfillment information
    async updateMedusaOrder(medusaOrderId, printfulOrderId) {
        const step = {
            id: 'update',
            name: 'Update Medusa Order',
            status: 'in_progress',
            timestamp: new Date().toISOString()
        };
        try {
            // Update order metadata with Printful info
            // This would use Medusa's order update workflow
            const { updateOrderWorkflow } = require("@medusajs/medusa/core-flows");
            await updateOrderWorkflow(this.container).run({
                input: {
                    id: medusaOrderId,
                    metadata: {
                        printful_order_id: printfulOrderId,
                        fulfillment_provider: 'printful'
                    }
                }
            });
            step.status = 'completed';
            return step;
        }
        catch (error) {
            step.status = 'failed';
            step.error = error.message;
            return step;
        }
    }
    // Check fulfillment status
    async checkFulfillmentStatus(printfulOrderId) {
        try {
            const printfulOrder = await this.orderService.getOrder(printfulOrderId);
            if (!printfulOrder) {
                return { status: 'not_found' };
            }
            return {
                status: printfulOrder.status,
                tracking_number: printfulOrder.tracking_number,
                tracking_url: printfulOrder.tracking_url,
                updated_at: printfulOrder.updated_at
            };
        }
        catch (error) {
            console.error('Error checking fulfillment status:', error);
            return { status: 'error', error: error.message };
        }
    }
    // Handle fulfillment status updates (called by webhooks)
    async handleStatusUpdate(printfulOrderId, newStatus, trackingData) {
        try {
            // Find the corresponding Medusa order
            // This would query your database to find the order by printful_order_id
            console.log(`Handling status update for Printful order ${printfulOrderId}: ${newStatus}`);
            // Update the Medusa order status accordingly
            const statusMapping = {
                'pending': 'pending',
                'draft': 'pending',
                'confirmed': 'processing',
                'in_production': 'processing',
                'shipped': 'shipped',
                'delivered': 'delivered',
                'cancelled': 'cancelled'
            };
            const medusaStatus = statusMapping[newStatus] || 'pending';
            // Update order status in Medusa
            // This would use Medusa's fulfillment workflow
            console.log(`Updating Medusa order status to: ${medusaStatus}`);
            // If tracking info is available, update that too
            if (trackingData) {
                console.log(`Updating tracking info: ${trackingData.tracking_number}`);
            }
        }
        catch (error) {
            console.error('Error handling status update:', error);
            throw error;
        }
    }
    // Cancel fulfillment
    async cancelFulfillment(printfulOrderId) {
        try {
            const success = await this.orderService.cancelOrder(printfulOrderId);
            if (success) {
                console.log(`Successfully cancelled Printful order: ${printfulOrderId}`);
            }
            return success;
        }
        catch (error) {
            console.error('Error cancelling fulfillment:', error);
            throw error;
        }
    }
    // Get fulfillment history
    async getFulfillmentHistory(printfulOrderId) {
        try {
            const order = await this.orderService.getOrder(printfulOrderId);
            if (!order) {
                return null;
            }
            return {
                order_id: order.id,
                status: order.status,
                created_at: order.created_at,
                updated_at: order.updated_at,
                tracking_number: order.tracking_number,
                tracking_url: order.tracking_url,
                items: order.items
            };
        }
        catch (error) {
            console.error('Error getting fulfillment history:', error);
            throw error;
        }
    }
}
exports.PrintfulFulfillmentService = PrintfulFulfillmentService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtZnVsZmlsbG1lbnQtc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL3NlcnZpY2VzL3ByaW50ZnVsLWZ1bGZpbGxtZW50LXNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXlEO0FBQ3pELHFFQUErRDtBQXFCL0QsTUFBYSwwQkFBMkIsU0FBUSxJQUFBLHFCQUFhLEVBQUMsRUFBRSxDQUFDO0lBSS9ELFlBQVksU0FBYyxFQUFFLE9BQWE7UUFDdkMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUN6QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtRQUMxQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksNkNBQW9CLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ2xFLENBQUM7SUFFRCw0QkFBNEI7SUFDNUIsS0FBSyxDQUFDLGtCQUFrQixDQUFDLFdBQWdCO1FBQ3ZDLE1BQU0sZUFBZSxHQUE0QjtZQUMvQyxlQUFlLEVBQUUsV0FBVyxDQUFDLEVBQUU7WUFDL0IsaUJBQWlCLEVBQUUsRUFBRTtZQUNyQixNQUFNLEVBQUUsU0FBUztZQUNqQixjQUFjLEVBQUUsRUFBRTtTQUNuQixDQUFBO1FBRUQsSUFBSSxDQUFDO1lBQ0gsK0NBQStDO1lBQy9DLE1BQU0sY0FBYyxHQUFHLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQTtZQUM1RCxlQUFlLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTtZQUVuRCxJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ3ZDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFBO2dCQUNqQyxPQUFPLGVBQWUsQ0FBQTtZQUN4QixDQUFDO1lBRUQsa0RBQWtEO1lBQ2xELE1BQU0sY0FB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