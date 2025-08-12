"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
const utils_1 = require("@medusajs/framework/utils");
const medusa_1 = require("@medusajs/medusa");
async function GET(req, res) {
    try {
        const orderService = req.scope.resolve(utils_1.Modules.ORDER);
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        // Get all orders using Medusa v2 service
        const orders = await orderService.listOrders({
            relations: ["items", "items.product", "shipping_address", "billing_address"],
        }, { take: 100, order: { created_at: "DESC" } });
        console.log(`Found ${orders.length} orders to process for fulfillment dashboard`);
        // For now, we'll use mock tracking data for Printful orders
        // In a full implementation, you would query your Printful tracking table
        const printfulTrackingMock = new Map();
        const digitalDownloadsMock = new Map();
        // Transform orders for fulfillment dashboard
        const fulfillmentOrders = orders.map(order => {
            // Determine provider type based on product metadata
            let providerType = 'standard';
            let hasPrintfulProducts = false;
            let hasDigitalProducts = false;
            if (order.items && order.items.length > 0) {
                for (const item of order.items) {
                    if (item.product?.metadata?.fulfillment_type === 'printful_pod') {
                        hasPrintfulProducts = true;
                        providerType = 'printful';
                    }
                    else if (item.product?.metadata?.fulfillment_type === 'digital') {
                        hasDigitalProducts = true;
                        if (providerType === 'standard')
                            providerType = 'digital';
                    }
                }
            }
            // Determine status based on order fulfillment status
            let status = 'pending';
            switch (order.fulfillment_status) {
                case 'fulfilled':
                    status = 'delivered';
                    break;
                case 'shipped':
                    status = 'shipped';
                    break;
                case 'partially_fulfilled':
                    status = 'processing';
                    break;
                case 'not_fulfilled':
                    status = order.payment_status === 'captured' ? 'pending' : 'pending';
                    break;
                default:
                    status = 'pending';
            }
            // For digital products, they're "delivered" immediately after payment
            if (providerType === 'digital' && order.payment_status === 'captured') {
                status = 'delivered';
            }
            const customerName = order.shipping_address
                ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()
                : order.billing_address
                    ? `${order.billing_address.first_name || ''} ${order.billing_address.last_name || ''}`.trim()
                    : order.email?.split('@')[0] || 'Unknown';
            return {
                id: `fulfillment_${order.id}`,
                medusa_order_id: order.id,
                printful_order_id: null, // Would be populated from tracking data
                provider_type: providerType,
                status,
                tracking_number: null,
                tracking_url: null,
                shipped_at: null,
                delivered_at: status === 'delivered' ? new Date().toISOString() : null,
                estimated_delivery: null,
                customer_email: order.email,
                customer_name: customerName,
                total_amount: order.total ? order.total / 100 : 0, // Convert from cents
                currency: order.currency_code?.toUpperCase() || 'USD',
                created_at: order.created_at,
                updated_at: order.updated_at,
                order_number: order.display_id?.toString() || order.id
            };
        });
        // Calculate stats
        const stats = fulfillmentOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            acc.total += 1;
            return acc;
        }, {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            total: 0
        });
        res.json({
            orders: fulfillmentOrders,
            stats
        });
    }
    catch (error) {
        console.error("Error fetching fulfillment orders:", error);
        res.status(500).json({
            error: "Failed to fetch fulfillment orders",
            details: error.message,
            orders: [],
            stats: {
                pending: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                total: 0
            }
        });
    }
}
exports.middlewares = [
    (0, medusa_1.authenticate)("admin", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2Z1bGZpbGxtZW50LW9yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFLQSxrQkF5SEM7QUE3SEQscURBQW1EO0FBRW5ELDZDQUErQztBQUV4QyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxZQUFZLEdBQXdCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMxRSxNQUFNLGNBQWMsR0FBMEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRWhGLHlDQUF5QztRQUN6QyxNQUFNLE1BQU0sR0FBRyxNQUFNLFlBQVksQ0FBQyxVQUFVLENBQUM7WUFDM0MsU0FBUyxFQUFFLENBQUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsQ0FBQztTQUM3RSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRWhELE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxNQUFNLENBQUMsTUFBTSw4Q0FBOEMsQ0FBQyxDQUFBO1FBRWpGLDREQUE0RDtRQUM1RCx5RUFBeUU7UUFDekUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQ3RDLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUV0Qyw2Q0FBNkM7UUFDN0MsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzNDLG9EQUFvRDtZQUNwRCxJQUFJLFlBQVksR0FBRyxVQUFVLENBQUE7WUFDN0Is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