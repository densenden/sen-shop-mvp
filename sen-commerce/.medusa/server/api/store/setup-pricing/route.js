"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const utils_1 = require("@medusajs/framework/utils");
// POST /store/setup-pricing - Setup basic pricing for products (development only)
const POST = async (req, res) => {
    try {
        const pricingService = req.scope.resolve(utils_1.Modules.PRICING);
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        const remoteQuery = req.scope.resolve(utils_1.ContainerRegistrationKeys.QUERY);
        console.log("Setting up basic pricing for products...");
        // Get all products
        const products = await productService.listProducts({}, {
            relations: ["variants"]
        });
        console.log(`Found ${products.length} products`);
        const pricesCreated = [];
        // Create basic pricing for each variant
        for (const product of products) {
            if (product.variants && product.variants.length > 0) {
                for (const variant of product.variants) {
                    try {
                        // Create a basic price set for the variant
                        const priceSet = await pricingService.createPriceSets({
                            prices: [
                                {
                                    amount: 2000, // $20.00 in cents
                                    currency_code: "USD",
                                    rules: {}
                                },
                                {
                                    amount: 1800, // €18.00 in cents
                                    currency_code: "EUR",
                                    rules: {}
                                }
                            ]
                        });
                        // Link the price set to the variant using remote query
                        await remoteQuery.graph({
                            entity: "product_variant_price_set",
                            body: {
                                create: [
                                    {
                                        variant: variant.id,
                                        price_set: priceSet.id
                                    }
                                ]
                            }
                        });
                        pricesCreated.push({
                            product_id: product.id,
                            variant_id: variant.id,
                            price_set_id: priceSet.id
                        });
                        console.log(`Created and linked pricing for variant ${variant.id}`);
                    }
                    catch (error) {
                        console.error(`Error creating pricing for variant ${variant.id}:`, error.message);
                    }
                }
            }
        }
        res.json({
            success: true,
            message: `Created pricing for ${pricesCreated.length} variants`,
            prices_created: pricesCreated
        });
    }
    catch (error) {
        console.error("[Setup Pricing] Error:", error);
        res.status(500).json({
            error: "Failed to setup pricing",
            message: error.message
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3NldHVwLXByaWNpbmcvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscURBQThFO0FBRTlFLGtGQUFrRjtBQUMzRSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNoRixNQUFNLGNBQWMsR0FBMEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2hGLE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRXRFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMENBQTBDLENBQUMsQ0FBQTtRQUV2RCxtQkFBbUI7UUFDbkIsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRTtZQUNyRCxTQUFTLEVBQUUsQ0FBQyxVQUFVLENBQUM7U0FDeEIsQ0FBQyxDQUFBO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLFFBQVEsQ0FBQyxNQUFNLFdBQVcsQ0FBQyxDQUFBO1FBRWhELE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQTtRQUV4Qix3Q0FBd0M7UUFDeEMsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUMvQixJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BELEtBQUssTUFBTSxPQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUN2QyxJQUFJLENBQUM7d0JBQ0gsMkNBQTJDO3dCQUMzQyxNQUFNLFFBQVEsR0FBRyxNQUFNLGNBQWMsQ0FBQyxlQUFlLENBQUM7NEJBQ3BELE1BQU0sRUFBRTtnQ0FDTjtvQ0FDRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGtCQUFrQjtvQ0FDaEMsYUFBYSxFQUFFLEtBQUs7b0NBQ3BCLEtBQUssRUFBRSxFQUFFO2lDQUNWO2dDQUNEO29DQUNFLE1BQU0sRUFBRSxJQUFJLEVBQUUsa0JBQWtCO29DQUNoQyxhQUFhLEVBQUUsS0FBSztvQ0FDcEIsS0FBSyxFQUFFLEVBQUU7aUNBQ1Y7NkJBQ0Y7eUJBQ0YsQ0FBQyxDQUFBO3dCQUVGLHVEQUF1RDt3QkFDdkQsTUFBTSxXQUFXLENBQUMsS0FBSyxDQUFDOzRCQUN0QixNQUFNLEVBQUUsMkJBQTJCOzRCQUNuQyxJQUFJLEVBQUU7Z0NBQ0osTUFBTSxFQUFFO29DQUNOO3dDQUNFLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTt3Q0FDbkIsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFO3FDQUN2QjtpQ0FDRjs2QkFDRjt5QkFDRixDQUFDLENBQUE7d0JBRUYsYUFBYSxDQUFDLElBQUksQ0FBQzs0QkFDakIsVUFBVSxFQUFFLE9BQU8sQ0FBQyxFQUFFOzRCQUN0QixVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUU7NEJBQ3RCLFlBQVksRUFBRSxRQUFRLENBQUMsRUFBRTt5QkFDMUIsQ0FBQyxDQUFBO3dCQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsMENBQTBDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO29CQUNyRSxDQUFDO29CQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7d0JBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtvQkFDbkYsQ0FBQztnQkFDSCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUUsdUJBQXVCLGFBQWEsQ0FBQyxNQUFNLFdBQVc7WUFDL0QsY0FBYyxFQUFFLGFBQWE7U0FDOUIsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSx5QkFBeUI7WUFDaEMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3ZCLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDLENBQUE7QUE5RVksUUFBQSxJQUFJLFFBOEVoQiJ9