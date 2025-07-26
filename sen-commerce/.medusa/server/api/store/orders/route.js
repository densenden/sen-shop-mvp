"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
async function GET(req, res) {
    try {
        // Extract customer ID from auth token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const token = authHeader.substring(7);
        // Extract customer ID from token (in a real app, you'd validate the token properly)
        const customerId = token.split('_')[1];
        if (!customerId) {
            return res.status(401).json({ message: "Invalid token" });
        }
        // Get order service from Medusa v2
        const orderModuleService = req.scope.resolve(utils_1.Modules.ORDER);
        try {
            // List orders for the customer
            const orders = await orderModuleService.listOrders({
                customer_id: customerId
            });
            // Format orders for the frontend
            const formattedOrders = orders.map(order => ({
                id: order.id,
                status: order.status,
                total: order.total,
                currency_code: order.currency_code,
                created_at: order.created_at,
                items: order.items?.map(item => ({
                    id: item.id,
                    title: item.title,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    thumbnail: item.thumbnail,
                    metadata: item.metadata
                })) || [],
                shipping_address: order.shipping_address
            }));
            res.json({
                orders: formattedOrders
            });
        }
        catch (error) {
            console.error("Error fetching orders:", error);
            return res.status(500).json({
                message: "Failed to fetch orders"
            });
        }
    }
    catch (error) {
        console.error("Orders API error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}
async function POST(req, res) {
    try {
        // Extract customer ID from auth token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Authentication required" });
        }
        const token = authHeader.substring(7);
        const customerId = token.split('_')[1];
        if (!customerId) {
            return res.status(401).json({ message: "Invalid token" });
        }
        const { items, shipping_address, payment_method } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Order items are required" });
        }
        // Get required services
        const orderModuleService = req.scope.resolve(utils_1.Modules.ORDER);
        const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
        try {
            // Calculate order total
            let total = 0;
            const orderItems = [];
            for (const item of items) {
                // Get product details
                const product = await productModuleService.retrieveProduct(item.product_id);
                if (!product) {
                    return res.status(400).json({
                        message: `Product ${item.product_id} not found`
                    });
                }
                const variant = product.variants?.find(v => v.id === item.variant_id);
                if (!variant) {
                    return res.status(400).json({
                        message: `Variant ${item.variant_id} not found`
                    });
                }
                const itemTotal = 1000; // Default price for now
                total += itemTotal * item.quantity;
                orderItems.push({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    title: product.title,
                    quantity: item.quantity,
                    unit_price: itemTotal,
                    total: itemTotal * item.quantity,
                    thumbnail: product.thumbnail || '',
                    metadata: {
                        fulfillment_type: product.metadata?.fulfillment_type,
                        artwork_id: product.metadata?.artwork_id
                    }
                });
            }
            // Create Medusa order
            const order = {
                id: `order_${Date.now()}`,
                status: 'pending',
                total,
                currency_code: 'usd',
                created_at: new Date().toISOString(),
                items: orderItems,
                shipping_address,
                email: `customer_${customerId}@example.com` // Mock email for now
            };
            // Check if order contains POD products and process with Printful
            const hasPrintfulProducts = orderItems.some(item => item.metadata?.fulfillment_type === 'printful_pod' ||
                item.metadata?.customizable === true);
            if (hasPrintfulProducts) {
                try {
                    // Get Printful fulfillment service
                    const printfulFulfillmentService = req.scope.resolve("printfulFulfillmentService");
                    if (printfulFulfillmentService) {
                        console.log("Processing Printful fulfillment for order:", order.id);
                        // Process fulfillment asynchronously
                        printfulFulfillmentService.processFulfillment(order)
                            .then((fulfillmentData) => {
                            console.log("Printful fulfillment completed:", fulfillmentData);
                        })
                            .catch((error) => {
                            console.error("Printful fulfillment failed:", error);
                        });
                    }
                    else {
                        console.log("Printful fulfillment service not available, order will be processed manually");
                    }
                }
                catch (error) {
                    console.error("Error initiating Printful fulfillment:", error);
                    // Continue with order creation even if fulfillment setup fails
                }
            }
            res.status(201).json({
                order: {
                    id: order.id,
                    status: order.status,
                    total: order.total,
                    currency_code: order.currency_code,
                    created_at: order.created_at,
                    items: orderItems
                }
            });
        }
        catch (error) {
            console.error("Error creating order:", error);
            return res.status(500).json({
                message: "Failed to create order"
            });
        }
    }
    catch (error) {
        console.error("Create order API error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL29yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLGtCQTREQztBQUVELG9CQXVJQztBQXZNRCxxREFBbUQ7QUFFNUMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILHNDQUFzQztRQUN0QyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQTtRQUM1QyxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQ3JELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUseUJBQXlCLEVBQUUsQ0FBQyxDQUFBO1FBQ3JFLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQ3JDLG9GQUFvRjtRQUNwRixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRXRDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxDQUFDLENBQUE7UUFDM0QsQ0FBQztRQUVELG1DQUFtQztRQUNuQyxNQUFNLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUUzRCxJQUFJLENBQUM7WUFDSCwrQkFBK0I7WUFDL0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxVQUFVLENB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