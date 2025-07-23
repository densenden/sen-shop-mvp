"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
console.log("[Medusa] Loaded /api/store/checkout route.ts");
// Simple checkout endpoint (placeholder for payment processing)
async function POST(req, res) {
    console.log("[Store Checkout] POST request received");
    try {
        const { cart_id, shipping_address, payment_method } = req.body;
        if (!cart_id) {
            return res.status(400).json({ error: "Cart ID is required" });
        }
        if (!shipping_address) {
            return res.status(400).json({ error: "Shipping address is required" });
        }
        if (!payment_method) {
            return res.status(400).json({ error: "Payment method is required" });
        }
        // In a real implementation, this would:
        // 1. Validate cart contents
        // 2. Process payment (Stripe, PayPal, etc.)
        // 3. Create order in database
        // 4. Send confirmation email
        // 5. Clear cart
        // For now, we'll create a mock order
        const order = {
            id: `order_${Date.now()}`,
            cart_id,
            status: "confirmed",
            total: 0, // Would be calculated from cart
            shipping_address,
            payment_method,
            items: [], // Would be populated from cart
            created_at: new Date().toISOString(),
            estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        };
        console.log(`[Store Checkout] Order created: ${order.id}`);
        res.json({
            success: true,
            order,
            message: "Order placed successfully"
        });
    }
    catch (error) {
        console.error("[Store Checkout] Error processing checkout:", error);
        res.status(500).json({
            error: "Failed to process checkout",
            details: error.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NoZWNrb3V0L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsb0JBcURDO0FBekRELE9BQU8sQ0FBQyxHQUFHLENBQUMsOENBQThDLENBQUMsQ0FBQTtBQUczRCxnRUFBZ0U7QUFDekQsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0NBQXdDLENBQUMsQ0FBQTtJQUVyRCxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFXLENBQUE7UUFFckUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUE7UUFDL0QsQ0FBQztRQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLEVBQUUsQ0FBQyxDQUFBO1FBQ3hFLENBQUM7UUFFRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSw0QkFBNEIsRUFBRSxDQUFDLENBQUE7UUFDdEUsQ0FBQztRQUVELHdDQUF3QztRQUN4Qyw0QkFBNEI7UUFDNUIsNENBQTRDO1FBQzVDLDhCQUE4QjtRQUM5Qiw2QkFBNkI7UUFDN0IsZ0JBQWdCO1FBRWhCLHFDQUFxQztRQUNyQyxNQUFNLEtBQUssR0FBRztZQUNaLEVBQUUsRUFBRSxTQUFTLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUN6QixPQUFPO1lBQ1AsTUFBTSxFQUFFLFdBQVc7WUFDbkIsS0FBSyxFQUFFLENBQUMsRUFBRSxnQ0FBZ0M7WUFDMUMsZ0JBQWdCO1lBQ2hCLGNBQWM7WUFDZCxLQUFLLEVBQUUsRUFBRSxFQUFFLCtCQUErQjtZQUMxQyxVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7WUFDcEMsa0JBQWtCLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxrQkFBa0I7U0FDcEcsQ0FBQTtRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBRTFELEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxPQUFPLEVBQUUsSUFBSTtZQUNiLEtBQUs7WUFDTCxPQUFPLEVBQUUsMkJBQTJCO1NBQ3JDLENBQUMsQ0FBQTtJQUVKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNuRSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsNEJBQTRCO1lBQ25DLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyJ9