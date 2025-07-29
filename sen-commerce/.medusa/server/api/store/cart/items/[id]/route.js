"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.PUT = void 0;
const utils_1 = require("@medusajs/framework/utils");
// PUT /api/store/cart/items/[id] - Update cart item quantity
const PUT = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cartId = req.session?.cart_id || req.headers["x-cart-id"];
        const itemId = req.params.id;
        if (!cartId) {
            return res.status(404).json({
                error: "Cart not found",
                message: "No cart ID provided"
            });
        }
        if (!itemId) {
            return res.status(400).json({
                error: "Missing item ID",
                message: "Item ID is required"
            });
        }
        const { quantity } = req.body;
        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({
                error: "Invalid quantity",
                message: "Quantity must be a non-negative number"
            });
        }
        // Update item quantity
        await cartService.updateLineItems([{
                selector: { id: itemId, cart_id: cartId },
                data: { quantity }
            }]);
        // Retrieve updated cart with relations
        const cart = await cartService.retrieveCart(cartId, {
            relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
        });
        res.json({
            cart,
            message: "Item updated successfully"
        });
    }
    catch (error) {
        console.error("[Store Cart Items] Error updating item:", error);
        res.status(500).json({
            error: "Failed to update cart item",
            message: error.message
        });
    }
};
exports.PUT = PUT;
// DELETE /api/store/cart/items/[id] - Remove item from cart
const DELETE = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cartId = req.session?.cart_id || req.headers["x-cart-id"];
        const itemId = req.params.id;
        if (!cartId) {
            return res.status(404).json({
                error: "Cart not found",
                message: "No cart ID provided"
            });
        }
        if (!itemId) {
            return res.status(400).json({
                error: "Missing item ID",
                message: "Item ID is required"
            });
        }
        // Remove item from cart
        await cartService.deleteLineItems([itemId]);
        // Retrieve updated cart with relations
        const cart = await cartService.retrieveCart(cartId, {
            relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
        });
        res.json({
            cart,
            message: "Item removed from cart successfully"
        });
    }
    catch (error) {
        console.error("[Store Cart Items] Error removing item:", error);
        res.status(500).json({
            error: "Failed to remove cart item",
            message: error.message
        });
    }
};
exports.DELETE = DELETE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnQvaXRlbXMvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxxREFBbUQ7QUFFbkQsNkRBQTZEO0FBQ3RELE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNuRSxJQUFJLENBQUM7UUFDSCxNQUFNLFdBQVcsR0FBdUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXZFLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7UUFDL0QsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUE7UUFFNUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsT0FBTyxFQUFFLHFCQUFxQjthQUMvQixDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLGlCQUFpQjtnQkFDeEIsT0FBTyxFQUFFLHFCQUFxQjthQUMvQixDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFXLENBQUE7UUFFcEMsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2pELE9BQU8s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