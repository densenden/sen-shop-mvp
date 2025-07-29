"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
async function POST(req, res) {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const salesChannelService = req.scope.resolve(utils_1.Modules.SALES_CHANNEL);
        const { region_id, currency_code = 'usd' } = req.body;
        // Get default sales channel
        const [defaultSalesChannel] = await salesChannelService.listSalesChannels({
            name: "Default"
        });
        const cart = await cartService.createCarts({
            currency_code,
            region_id: region_id || undefined,
            sales_channel_id: defaultSalesChannel?.id
        });
        // Store cart ID in session
        if (req.session) {
            req.session.cart_id = cart.id;
        }
        res.json({ cart });
    }
    catch (error) {
        console.error("Error creating cart:", error);
        res.status(500).json({ error: "Failed to create cart", message: error.message });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsb0JBNEJDO0FBL0JELHFEQUFtRDtBQUc1QyxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQXVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN2RSxNQUFNLG1CQUFtQixHQUErQixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7UUFFaEcsTUFBTSxFQUFFLFNBQVMsRUFBRSxhQUFhLEdBQUcsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUU1RCw0QkFBNEI7UUFDNUIsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxpQkFBaUIsQ0FBQztZQUN4RSxJQUFJLEVBQUUsU0FBUztTQUNoQixDQUFDLENBQUE7UUFFRixNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUM7WUFDekMsYUFBYTtZQUNiLFNBQVMsRUFBRSxTQUFTLElBQUksU0FBUztZQUNqQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxFQUFFO1NBQzFDLENBQUMsQ0FBQTtRQUVGLDJCQUEyQjtRQUMzQixJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBSSxJQUFZLENBQUMsRUFBRSxDQUFBO1FBQ3hDLENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUNwQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDNUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ2xGLENBQUM7QUFDSCxDQUFDIn0=