"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const core_flows_1 = require("@medusajs/medusa/core-flows");
const utils_1 = require("@medusajs/framework/utils");
// POST /store/carts/{id}/line-items - Add line item to cart using workflow (Medusa v2 standard)
const POST = async (req, res) => {
    try {
        const cartId = req.params.id;
        if (!cartId) {
            return res.status(400).json({
                error: "Cart ID required",
                message: "Cart ID must be provided in URL path"
            });
        }
        const { variant_id, quantity = 1, unit_price, metadata = {} } = req.body;
        if (!variant_id) {
            return res.status(400).json({
                error: "Missing required fields",
                message: "variant_id is required"
            });
        }
        // Use addToCartWorkflow instead of direct service calls
        const { result } = await (0, core_flows_1.addToCartWorkflow)(req.scope).run({
            input: {
                cart_id: cartId,
                items: [{
                        variant_id,
                        quantity,
                        unit_price: unit_price || 2000, // Default price of $20 if no custom price
                        metadata
                    }]
            }
        });
        // Retrieve updated cart with relations
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const cart = await cartService.retrieveCart(cartId, {
            relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
        });
        res.json({
            cart,
            message: "Item added to cart successfully"
        });
    }
    catch (error) {
        console.error("[Store Cart Line Items] Error adding item:", error);
        res.status(500).json({
            error: "Failed to add item to cart",
            message: error.message
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL1tpZF0vbGluZS1pdGVtcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw0REFBK0Q7QUFFL0QscURBQW1EO0FBRW5ELGdHQUFnRztBQUN6RixNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUE7UUFFNUIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLGtCQUFrQjtnQkFDekIsT0FBTyxFQUFFLHNDQUFzQzthQUNoRCxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEdBQUcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxRQUFRLEdBQUcsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUUvRSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDaEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLHlCQUF5QjtnQkFDaEMsT0FBTyxFQUFFLHdCQUF3QjthQUNsQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsd0RBQXdEO1FBQ3hELE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUEsOEJBQWlCLEVBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUN4RCxLQUFLLEVBQUU7Z0JBQ0wsT0FBTyxFQUFFLE1BQU07Z0JBQ2YsS0FBSyxFQUFFLENBQUM7d0JBQ04sVUFBVTt3QkFDVixRQUFRO3dCQUNSLFVBQVUsRUFBRSxVQUFVLElBQUksSUFBSSxFQUFFLDBDQUEwQzt3QkFDMUUsUUFBUTtxQkFDVCxDQUFDO2FBQ0g7U0FDRixDQUFDLENBQUE7UUFFRix1Q0FBdUM7UUFDdkMsTUFBTSxXQUFXLEdBQXVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN2RSxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFO1lBQ2xELFNBQVMsRUFBRSxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixDQUFDO1NBQzlGLENBQUMsQ0FBQTtRQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxJQUFJO1lBQ0osT0FBTyxFQUFFLGlDQUFpQztTQUMzQyxDQUFDLENBQUE7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDbEUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLDRCQUE0QjtZQUNuQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQW5EWSxRQUFBLElBQUksUUFtRGhCIn0=