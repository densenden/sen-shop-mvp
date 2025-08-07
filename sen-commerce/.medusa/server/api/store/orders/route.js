"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
const medusa_1 = require("@medusajs/medusa");
const utils_1 = require("@medusajs/framework/utils");
// In-memory store for demo purposes
const ordersStore = new Map();
async function GET(req, res) {
    try {
        // Get customer ID from token or session
        const customerId = req.user?.customer_id || 'demo_customer';
        // Get orders for this customer
        const customerOrders = ordersStore.get(customerId) || [];
        // Also include a demo order for testing
        const demoOrder = {
            id: "order_demo_01234567890",
            display_id: 1001,
            status: "completed",
            fulfillment_status: "fulfilled",
            payment_status: "captured",
            total: 2500,
            subtotal: 2000,
            tax_total: 200,
            shipping_total: 300,
            currency_code: "usd",
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            email: "demo@example.com",
            items: [
                {
                    id: "item_01234567890",
                    title: "Digital Artwork - Abstract Design",
                    quantity: 1,
                    unit_price: 2000,
                    total: 2000,
                    thumbnail: "/placeholder-artwork.jpg",
                    product_id: "prod_01234567890",
                    variant_id: "variant_01234567890",
                    metadata: {
                        fulfillment_type: "digital_download",
                        digital_download_url: "/store/download/token123",
                        artwork_id: "artwork_01234567890"
                    }
                }
            ],
            shipping_address: {
                id: "addr_01234567890",
                first_name: "John",
                last_name: "Doe",
                address_1: "123 Main St",
                city: "New York",
                province: "NY",
                postal_code: "10001",
                country_code: "us",
                phone: "+1234567890"
            },
            tracking_links: []
        };
        // Combine demo order with actual orders
        const allOrders = [...customerOrders];
        if (customerOrders.length === 0) {
            allOrders.push(demoOrder);
        }
        res.json({ orders: allOrders });
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
}
async function POST(req, res) {
    console.log("[Orders API] Creating new order from checkout");
    try {
        const { cart_id, customer_info, shipping_address, payment_session_id, cart_items, cart_total } = req.body;
        if (!cart_id || !customer_info || !customer_info.email) {
            return res.status(400).json({
                error: "cart_id, customer_info with email are required"
            });
        }
        // Create order with real data
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const displayId = Math.floor(Math.random() * 9000) + 1000;
        console.log(`[Orders API] Creating order ${orderId} for ${customer_info.email}`);
        const order = {
            id: orderId,
            display_id: displayId,
            status: "pending",
            fulfillment_status: "not_fulfilled",
            payment_status: "captured", // Mock as captured for demo
            total: cart_total || 2500,
            subtotal: Math.floor((cart_total || 2500) * 0.85),
            tax_total: Math.floor((cart_total || 2500) * 0.08),
            shipping_total: Math.floor((cart_total || 2500) * 0.07),
            currency_code: "usd",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email: customer_info.email,
            customer_id: customer_info.customer_id || customer_info.email,
            customer_info,
            shipping_address,
            payment_session_id,
            cart_id,
            items: cart_items || [],
            tracking_links: []
        };
        // Store order in memory
        const customerId = customer_info.customer_id || customer_info.email;
        if (!ordersStore.has(customerId)) {
            ordersStore.set(customerId, []);
        }
        const customerOrders = ordersStore.get(customerId);
        customerOrders.unshift(order);
        console.log(`[Orders API] Order stored, total orders for customer: ${customerOrders.length}`);
        // **CRITICAL**: Emit the order.placed event to trigger all subscribers
        try {
            console.log("[Orders API] Emitting order.placed event...");
            const eventBus = req.scope.resolve(utils_1.Modules.EVENT_BUS);
            await eventBus.emit("order.placed", {
                id: orderId,
                data: order // Pass the complete order data
            });
            console.log("[Orders API] ✅ order.placed event emitted successfully!");
        }
        catch (eventError) {
            console.error("[Orders API] ❌ Failed to emit order.placed event:", eventError);
            // Don't fail the order creation, but log the error
        }
        // Update order status to completed after event emission
        order.status = "completed";
        order.fulfillment_status = "fulfilled";
        console.log(`[Orders API] ✅ Order ${orderId} created and events triggered`);
        res.json({
            success: true,
            order,
            message: "Order created successfully - confirmation emails will be sent"
        });
    }
    catch (error) {
        console.error("[Orders API] Error creating order:", error);
        res.status(500).json({
            error: "Failed to create order",
            details: error.message
        });
    }
}
exports.middlewares = [
    (0, medusa_1.authenticate)("customer", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL29yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFPQSxrQkFpRUM7QUFFRCxvQkE2RkM7QUF0S0QsNkNBQStDO0FBQy9DLHFEQUFtRDtBQUVuRCxvQ0FBb0M7QUFDcEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQWlCLENBQUE7QUFFckMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILHdDQUF3QztRQUN4QyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLFdBQVcsSUFBSSxlQUFlLENBQUE7UUFFM0QsK0JBQStCO1FBQy9CLE1BQU0sY0FBYyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFBO1FBRXhELHdDQUF3QztRQUN4QyxNQUFNLFNBQVMsR0FBRztZQUNoQixFQUFFLEVBQUUsd0JBQXdCO1lBQzVCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE1BQU0sRUFBRSxXQUFXO1lBQ25CLGtCQUFrQixFQUFFLFdBQVc7WUFDL0IsY0FBYyxFQUFFLFVBQVU7WUFDMUIsS0FBSyxFQUFFLElBQUk7WUFDWCxRQUFRLEVBQUUsSUFBSTtZQUNkLFNBQVMsRUFBRSxHQUFHO1lBQ2QsY0FBYyxFQUFFLEdBQUc7WUFDbkIsYUFBYSxFQUFFLEtBQUs7WUFDcEIsVUFBVSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFO1lBQ3hFLFVBQVUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtZQUNwQyxLQUFLLEVBQUUsa0JBQWtCO1lBQ3pCLEtBQUssRUFBRTtn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