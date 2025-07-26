"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const core_flows_1 = require("@medusajs/medusa/core-flows");
// POST /store/carts - Create new cart using workflow (Medusa v2 standard)
const POST = async (req, res) => {
    try {
        const { region_id, currency_code = "USD", customer_id, email, sales_channel_id, items = [], ...rest } = req.body;
        // Use createCartWorkflow instead of direct service calls
        const { result: cart } = await (0, core_flows_1.createCartWorkflow)(req.scope).run({
            input: {
                region_id,
                currency_code,
                customer_id,
                email,
                sales_channel_id,
                items,
                ...rest
            }
        });
        // Set cart ID in session for compatibility
        if (req.session) {
            req.session.cart_id = cart.id;
        }
        res.json({
            cart,
            message: "Cart created successfully"
        });
    }
    catch (error) {
        console.error("[Store Carts Create] Error creating cart:", error);
        res.status(500).json({
            error: "Failed to create cart",
            message: error.message
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDREQUFnRTtBQUVoRSwwRUFBMEU7QUFDbkUsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLEdBQWtCLEVBQUUsR0FBbUIsRUFBRSxFQUFFO0lBQ3BFLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxTQUFTLEVBQUUsYUFBYSxHQUFHLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO1FBRXZILHlEQUF5RDtRQUN6RCxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sSUFBQSwrQkFBa0IsRUFBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQy9ELEtBQUssRUFBRTtnQkFDTCxTQUFTO2dCQUNULGFBQWE7Z0JBQ2IsV0FBVztnQkFDWCxLQUFLO2dCQUNMLGdCQUFnQjtnQkFDaEIsS0FBSztnQkFDTCxHQUFHLElBQUk7YUFDUjtTQUNGLENBQUMsQ0FBQTtRQUVGLDJDQUEyQztRQUMzQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO1FBQy9CLENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsSUFBSTtZQUNKLE9BQU8sRUFBRSwyQkFBMkI7U0FDckMsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ2pFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSx1QkFBdUI7WUFDOUIsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3ZCLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDLENBQUE7QUFsQ1ksUUFBQSxJQUFJLFFBa0NoQiJ9