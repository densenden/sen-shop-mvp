"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.POST = exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
// GET /store/carts/{id} - Retrieve cart by ID (Medusa v2 standard)
const GET = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cartId = req.params.id;
        if (!cartId) {
            return res.status(400).json({
                error: "Cart ID required",
                message: "Cart ID must be provided in URL path"
            });
        }
        const cart = await cartService.retrieveCart(cartId, {
            relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
        });
        res.json({ cart });
    }
    catch (error) {
        console.error("[Store Cart Retrieve] Error getting cart:", error);
        res.status(500).json({
            error: "Failed to get cart",
            message: error.message
        });
    }
};
exports.GET = GET;
// POST /store/carts/{id} - Update cart (Medusa v2 standard)
const POST = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cartId = req.params.id;
        if (!cartId) {
            return res.status(400).json({
                error: "Cart ID required",
                message: "Cart ID must be provided in URL path"
            });
        }
        const cart = await cartService.updateCarts(cartId, req.body);
        res.json({
            cart,
            message: "Cart updated successfully"
        });
    }
    catch (error) {
        console.error("[Store Cart Update] Error updating cart:", error);
        res.status(500).json({
            error: "Failed to update cart",
            message: error.message
        });
    }
};
exports.POST = POST;
// DELETE /store/carts/{id} - Delete cart (Medusa v2 standard)
const DELETE = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cartId = req.params.id;
        if (!cartId) {
            return res.status(400).json({
                error: "Cart ID required",
                message: "Cart ID must be provided in URL path"
            });
        }
        await cartService.deleteCarts(cartId);
        res.json({
            message: "Cart deleted successfully"
        });
    }
    catch (error) {
        console.error("[Store Cart Delete] Error deleting cart:", error);
        res.status(500).json({
            error: "Failed to delete cart",
            message: error.message
        });
    }
};
exports.DELETE = DELETE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscURBQW1EO0FBRW5ELG1FQUFtRTtBQUM1RCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQXVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUV2RSxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQTtRQUU1QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsa0JBQWtCO2dCQUN6QixPQUFPLEVBQUUsc0NBQXNDO2FBQ2hELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFO1lBQ2xELFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixDQUFDO1NBQzlGLENBQUMsQ0FBQTtRQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBRXBCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNqRSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsb0JBQW9CO1lBQzNCLE9BQU8sRUFBRSxL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