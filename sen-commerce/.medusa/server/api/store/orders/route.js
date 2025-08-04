"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
const medusa_1 = require("@medusajs/medusa");
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
    try {
        const { cart_id, customer_info, shipping_address, payment_session_id, cart_items, cart_total } = req.body;
        if (!cart_id || !customer_info || !shipping_address) {
            return res.status(400).json({
                error: "cart_id, customer_info, and shipping_address are required"
            });
        }
        // Get customer ID from session or use email as identifier
        const customerId = req.user?.customer_id || customer_info.email || 'demo_customer';
        // Create order with actual data
        const orderId = `order_${Date.now()}`;
        const order = {
            id: orderId,
            display_id: Math.floor(Math.random() * 9000) + 1000,
            status: "pending",
            fulfillment_status: "not_fulfilled",
            payment_status: "captured", // Mock as captured for demo
            total: cart_total || 2500,
            subtotal: Math.floor((cart_total || 2500) * 0.8), // Rough calculation
            tax_total: Math.floor((cart_total || 2500) * 0.08),
            shipping_total: Math.floor((cart_total || 2500) * 0.12),
            currency_code: "usd",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            customer_info,
            shipping_address,
            payment_session_id,
            cart_id,
            items: cart_items || [],
            tracking_links: []
        };
        // Store order in memory (in production, use database)
        if (!ordersStore.has(customerId)) {
            ordersStore.set(customerId, []);
        }
        const customerOrders = ordersStore.get(customerId);
        customerOrders.unshift(order); // Add new order at the beginning
        console.log('Order created and stored:', order);
        console.log('Total orders for customer:', customerOrders.length);
        // Here you would typically:
        // - Save order to database
        // - Trigger order confirmation workflow/emails
        // - Process digital downloads
        // - Send to fulfillment providers (Printful, etc.)
        res.json({
            success: true,
            order,
            message: "Order created successfully"
        });
    }
    catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            error: "Failed to create order",
            details: error.message
        });
    }
}
exports.middlewares = [
    (0, medusa_1.authenticate)("customer", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL29yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFJQSxrQkFnRUM7QUFFRCxvQkFnRUM7QUFySUQsNkNBQStDO0FBR3hDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCx3Q0FBd0M7UUFDeEMsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxXQUFXLElBQUksZUFBZSxDQUFBO1FBRTNELCtCQUErQjtRQUMvQixNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUV4RCx3Q0FBd0M7UUFDeEMsTUFBTSxTQUFTLEdBQUc7WUFDaEIsRUFBRSxFQUFFLHdCQUF3QjtZQUM1QixVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsV0FBVztZQUNuQixrQkFBa0IsRUFBRSxXQUFXO1lBQy9CLGNBQWMsRUFBRSxVQUFVO1lBQzFCLEtBQUssRUFBRSxJQUFJO1lBQ1gsUUFBUSxFQUFFLElBQUk7WUFDZCxTQUFTLEVBQUUsR0FBRztZQUNkLGNBQWMsRUFBRSxHQUFHO1lBQ25CLGFBQWEsRUFBRSxLQUFLO1lBQ3BCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRTtZQUN4RSxVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7WUFDcEMsS0FBSyxFQUFFO2dCQUNMO29CQUNFLEVBQUUsRUFBRSxrQkFBa0I7b0JBQ3RCLEtBQUssRUFBRSxtQ0FBbUM7b0JBQzFDLFFBQVEsRUFBRSxDQUFDO29CQUNYLFVBQVUsRUFBRSxJ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