"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const utils_1 = require("@medusajs/framework/utils");
async function GET(req, res) {
    try {
        // Get order service from Medusa v2
        const orderModuleService = req.scope.resolve(utils_1.Modules.ORDER);
        try {
            // Fetch orders that need fulfillment (POD products)
            const orders = await orderModuleService.listOrders({
            // Filter for orders with POD products
            });
            // Transform orders to fulfillment order format
            const fulfillmentOrders = orders
                .filter(order => {
                // Only include orders that have POD products
                return order.items?.some(item => item.metadata?.fulfillment_type === 'printful_pod');
            })
                .map(order => {
                // Find customer info
                const customerName = order.customer_id ?
                    `${order.shipping_address?.first_name || 'Customer'} ${order.shipping_address?.last_name || ''}`.trim() :
                    'Guest Customer';
                return {
                    id: `fo_${order.id}`,
                    medusa_order_id: order.id,
                    printful_order_id: order.metadata?.printful_order_id || null,
                    provider_type: 'printful',
                    status: getFulfillmentStatus(order),
                    tracking_number: order.metadata?.tracking_number,
                    tracking_url: order.metadata?.tracking_url,
                    shipped_at: order.metadata?.shipped_at,
                    delivered_at: order.metadata?.delivered_at,
                    estimated_delivery: order.metadata?.estimated_delivery,
                    customer_email: order.email,
                    customer_name: customerName,
                    total_amount: order.total ? Number(order.total) / 100 : 0, // Convert from cents
                    currency: order.currency_code?.toUpperCase() || 'USD',
                    created_at: order.created_at,
                    updated_at: order.updated_at
                };
            });
            res.json({
                orders: fulfillmentOrders,
                total: fulfillmentOrders.length
            });
        }
        catch (error) {
            console.error("Error fetching orders:", error);
            // Return empty state on error
            res.json({
                orders: [],
                total: 0
            });
        }
    }
    catch (error) {
        console.error("Fulfillment orders API error:", error);
        res.status(500).json({
            message: "Internal server error",
            orders: [],
            total: 0
        });
    }
}
function getFulfillmentStatus(order) {
    // Determine fulfillment status based on order metadata and status
    if (order.metadata?.fulfillment_status) {
        return order.metadata.fulfillment_status;
    }
    if (order.metadata?.delivered_at) {
        return 'delivered';
    }
    if (order.metadata?.shipped_at || order.metadata?.tracking_number) {
        return 'shipped';
    }
    if (order.metadata?.printful_order_id) {
        return 'processing';
    }
    return 'pending';
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2Z1bGZpbGxtZW50LW9yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLGtCQW1FQztBQXJFRCxxREFBbUQ7QUFFNUMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILG1DQUFtQztRQUNuQyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUUzRCxJQUFJLENBQUM7WUFDSCxvREFBb0Q7WUFDcEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxVQUFVLENBQUM7WUFDakQsc0NBQXNDO2FBQ3ZDLENBQUMsQ0FBQTtZQUVGLCtDQUErQztZQUMvQyxNQUFNLGlCQUFpQixHQUFHLE1BQU07aUJBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDZCw2Q0FBNkM7Z0JBQzdDLE9BQU8sS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDOUIsSUFBSSxDQUFDLFFBQVEsRUFBRSxnQkFBZ0IsS0FBSyxjQUFjLENBQ25ELENBQUE7WUFDSCxDQUFDLENBQUM7aUJBQ0QsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNYLHFCQUFxQjtnQkFDckIsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUN0QyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztvQkFDekcsZ0JBQWdCLENBQUE7Z0JBRWxCLE9BQU87b0JBQ0wsRUFBRSxFQUFFLE1BQU0sS0FB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