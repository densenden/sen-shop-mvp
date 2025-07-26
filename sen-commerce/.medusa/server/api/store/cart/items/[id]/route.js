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
        await cartService.updateLineItem(cartId, itemId, {
            quantity
        });
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
        await cartService.removeFromCart(cartId, itemId);
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