"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUT = void 0;
const utils_1 = require("@medusajs/framework/utils");
// PUT /api/store/cart/addresses - Update cart addresses
const PUT = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cartId = req.session?.cart_id || req.headers["x-cart-id"];
        if (!cartId) {
            return res.status(404).json({
                error: "Cart not found",
                message: "No cart ID provided"
            });
        }
        const { shipping_address, billing_address } = req.body;
        const updateData = {};
        if (shipping_address) {
            updateData.shipping_address = shipping_address;
        }
        if (billing_address) {
            updateData.billing_address = billing_address;
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: "No address data provided",
                message: "Provide shipping_address or billing_address"
            });
        }
        // Update cart addresses
        await cartService.updateCarts(cartId, updateData);
        // Retrieve updated cart with relations
        const cart = await cartService.retrieveCart(cartId, {
            relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
        });
        res.json({
            cart,
            message: "Cart addresses updated successfully"
        });
    }
    catch (error) {
        console.error("[Store Cart Addresses] Error updating addresses:", error);
        res.status(500).json({
            error: "Failed to update cart addresses",
            message: error.message
        });
    }
};
exports.PUT = PUT;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnQvYWRkcmVzc2VzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHFEQUFtRDtBQUVuRCx3REFBd0Q7QUFDakQsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ25FLElBQUksQ0FBQztRQUNILE1BQU0sV0FBVyxHQUF1QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFdkUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUUvRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsZ0JBQWdCO2dCQUN2QixPQUFPLEVBQUUscUJBQXFCO2FBQy9CLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUU3RCxNQUFNLFVBQVUsR0FBUSxFQUFFLENBQUE7UUFFMUIsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ3JCLFVBQVUsQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQTtRQUNoRCxDQUFDO1FBRUQsSUFBSSxlQUFlLEVBQUUsQ0FBQztZQUNwQixVQUFVLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQTtRQUM5QyxDQUFDO1FBRUQsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUN6QyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsMEJBQTBCO2dCQUNqQyxPQUFPLEVBQUUsNkNBQTZDO2FBQ3ZELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCx3QkFBd0I7UUFDeEIsTUFBTSxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQTtRQUVqRCx1Q0FBdUM7UUFDdkMsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRTtZQUNsRCxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxpQkFBaUIsQ0FBQztTQUM5RixDQUFDLENBQUE7UUFFRixHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsSUFBSTtZQUNKLE9BQU8sRUFBRSxxQ0FBcUM7U0FDL0MsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3hFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSxpQ0FBaUM7WUFDeEMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3ZCLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDLENBQUE7QUFwRFksUUFBQSxHQUFHLE9Bb0RmIn0=