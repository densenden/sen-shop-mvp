"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const utils_1 = require("@medusajs/framework/utils");
// POST /api/store/cart/items - Add item to cart
const POST = async (req, res) => {
    try {
        // Use the default cart workflow from Medusa
        const cartWorkflow = req.scope.resolve("cartWorkflowService");
        const cartId = req.session?.cart_id || req.headers["x-cart-id"];
        if (!cartId) {
            return res.status(404).json({
                error: "Cart not found",
                message: "No cart ID provided"
            });
        }
        const { variant_id, quantity = 1 } = req.body;
        if (!variant_id) {
            return res.status(400).json({
                error: "Missing required fields",
                message: "variant_id is required"
            });
        }
        try {
            // Use Medusa's built-in add to cart workflow
            const result = await cartWorkflow.addToCart({
                cart_id: cartId,
                items: [
                    {
                        variant_id,
                        quantity
                    }
                ]
            });
            res.json({
                cart: result.cart,
                message: "Item added to cart successfully"
            });
        }
        catch (workflowError) {
            console.log("Workflow failed, trying direct cart service...");
            // Fallback to manual cart service
            const cartService = req.scope.resolve(utils_1.Modules.CART);
            // Create line item manually
            const lineItem = await cartService.addLineItems(cartId, [{
                    cart_id: cartId,
                    variant_id,
                    quantity,
                    unit_price: 2000, // Default price
                    title: `Product ${variant_id}`,
                    metadata: { variant_id }
                }]);
            // Get updated cart
            const cart = await cartService.retrieveCart(cartId, {
                relations: ["items"]
            });
            res.json({
                cart,
                message: "Item added to cart successfully"
            });
        }
    }
    catch (error) {
        console.error("[Store Cart Items] Error adding item:", error);
        res.status(500).json({
            error: "Failed to add item to cart",
            message: error.message
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnQvaXRlbXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscURBQW1EO0FBRW5ELGdEQUFnRDtBQUN6QyxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsSUFBSSxDQUFDO1FBQ0gsNENBQTRDO1FBQzVDLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFFN0QsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUUvRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsZ0JBQWdCO2dCQUN2QixPQUFPLEVBQUUscUJBQXFCO2FBQy9CLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO1FBRXBELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUseUJBQXlCO2dCQUNoQyxPQUFPLEVBQUUsd0JBQXdCO2FBQ2xDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCw2Q0FBNkM7WUFDN0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsU0FBUyxDQUFDO2dCQUMxQyxPQUFPLEVBQUUsTUFBTTtnQkFDZixLQUFLLEVBQUU7b0JBQ0w7d0JBQ0UsVUFBVTt3QkFDVixRQUFRO3FCQUNUO2lCQUNGO2FBQ0YsQ0FBQyxDQUFBO1lBRUYsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDUCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7Z0JBQ2pCLE9BQU8sRUFBRSxpQ0FBaUM7YUFDM0MsQ0FBQyxDQUFBO1FBRUosQ0FBQztRQUFDLE9BQU8sYUFBYSxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO1lBRTdELGtDQUFrQztZQUNsQyxNQUFNLFdBQVcsR0FBdUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLElBQUksQ0FBQyxDQUFBO1lBRXZFLDRCQUE0QjtZQUM1QixNQUFNLFFBQVEsR0FBRyxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7b0JBQ3ZELE9BQU8sRUFBRSxNQUFNO29CQUNmLFVBQVU7b0JBQ1YsUUFBUTtvQkFDUixVQUFVLEVBQUUsSUFBSSxFQUFFLGdCQUFnQjtvQkFDbEMsS0FBSyxFQUFFLFdBQVcsVUFBVSxFQUFFO29CQUM5QixRQUFRLEVBQUUsRUFBRSxVQUFVLEVBQUU7aUJBQ3pCLENBQUMsQ0FBQyxDQUFBO1lBRUgsbUJBQW1CO1lBQ25CLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2xELFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQzthQUNyQixDQUFDLENBQUE7WUFFRixHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNQLElBQUk7Z0JBQ0osT0FBTyxFQUFFLGlDQUFpQzthQUMzQyxDQUFDLENBQUE7UUFDSixDQUFDO0lBRUgsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzdELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSw0QkFBNEI7WUFDbkMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3ZCLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDLENBQUE7QUExRVksUUFBQSxJQUFJLFFBMEVoQiJ9