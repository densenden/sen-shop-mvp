"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
// GET /api/store/cart - Get current cart
const GET = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        // Get cart ID from session/headers
        const cartId = req.session?.cart_id || req.headers["x-cart-id"];
        if (!cartId) {
            return res.status(404).json({
                error: "Cart not found",
                message: "No cart ID provided"
            });
        }
        try {
            const cart = await cartService.retrieveCart(cartId, {
                relations: ["items", "items.variant", "items.product"]
            });
            res.json({ cart });
        }
        catch (cartError) {
            return res.status(404).json({
                error: "Cart not found",
                message: "Cart does not exist"
            });
        }
    }
    catch (error) {
        console.error("[Store Cart] Error getting cart:", error);
        res.status(500).json({
            error: "Failed to get cart",
            message: error.message
        });
    }
};
exports.GET = GET;
// DELETE /api/store/cart - Delete cart
const DELETE = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cartId = req.session?.cart_id || req.headers["x-cart-id"];
        if (!cartId) {
            return res.status(404).json({
                error: "Cart not found",
                message: "No cart ID provided"
            });
        }
        await cartService.deleteCarts([cartId]);
        // Clear cart ID from session
        if (req.session) {
            req.session.cart_id = undefined;
        }
        res.json({
            message: "Cart deleted successfully"
        });
    }
    catch (error) {
        console.error("[Store Cart] Error deleting cart:", error);
        res.status(500).json({
            error: "Failed to delete cart",
            message: error.message
        });
    }
};
exports.DELETE = DELETE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscURBQW1EO0FBR25ELHlDQUF5QztBQUNsQyxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQXVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUV2RSxtQ0FBbUM7UUFDbkMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUUvRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsZ0JBQWdCO2dCQUN2QixPQUFPLEVBQUUscUJBQXFCO2FBQy9CLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFO2dCQUNsRCxTQUFTLEVBQUUsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQzthQUN2RCxDQUFDLENBQUE7WUFFRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUNwQixDQUFDO1FBQUMsT0FBTyxTQUFTLEVBQUUsQ0FBQztZQUNuQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsZ0JBQWdCO2dCQUN2QixPQUFPLEVBQUUscUJBQXFCO2FBQy9CLENBQUMsQ0FBQTtRQUNKLENBQUM7SUFFSCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDeEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLG9CQUFvQjtZQUMzQixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQWxDWSxRQUFBLEdBQUcsT0FrQ2Y7QUFFRCx1Q0FBdUM7QUFDaEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3RFLElBQUksQ0FBQztRQUNILE1BQU0sV0FBVyxHQUF1QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFdkUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUUvRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsZ0JBQWdCO2dCQUN2QixPQUFPLEVBQUUscUJBQXFCO2FBQy9CLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1FBRXZDLDZCQUE2QjtRQUM3QixJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUE7UUFDakMsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxPQUFPLEVBQUUsMkJBQTJCO1NBQ3JDLENBQUMsQ0FBQTtJQUVKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN6RCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsdUJBQXVCO1lBQzlCLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBL0JZLFFBQUEsTUFBTSxVQStCbEIifQ==