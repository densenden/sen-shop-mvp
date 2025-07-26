"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
// GET /store/check-pricing - Check product pricing status
const GET = async (req, res) => {
    try {
        const query = req.scope.resolve(utils_1.ContainerRegistrationKeys.QUERY);
        // Check products with their pricing information
        const productsWithPricing = await query.graph({
            entity: "product",
            fields: [
                "id",
                "title",
                "variants.id",
                "variants.title",
                "variants.prices.id",
                "variants.prices.amount",
                "variants.prices.currency_code"
            ]
        });
        res.json({
            success: true,
            products: productsWithPricing
        });
    }
    catch (error) {
        console.error("[Check Pricing] Error:", error);
        res.status(500).json({
            error: "Failed to check pricing",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NoZWNrLXByaWNpbmcvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscURBQXFFO0FBRXJFLDBEQUEwRDtBQUNuRCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsaUNBQXlCLENBQUMsS0FBSyxDQUFDLENBQUE7UUFFaEUsZ0RBQWdEO1FBQ2hELE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQzVDLE1BQU0sRUFBRSxTQUFTO1lBQ2pCLE1BQU0sRUFBRTtnQkFDTixJQUFJO2dCQUNKLE9BQU87Z0JBQ1AsYUFBYTtnQkFDYixnQkFBZ0I7Z0JBQ2hCLG9CQUFvQjtnQkFDcEIsd0JBQXdCO2dCQUN4QiwrQkFBK0I7YUFDaEM7U0FDRixDQUFDLENBQUE7UUFFRixHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsbUJBQW1CO1NBQzlCLENBQUMsQ0FBQTtJQUVKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUM5QyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUseUJBQXlCO1lBQ2hDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBOUJZLFFBQUEsR0FBRyxPQThCZiJ9