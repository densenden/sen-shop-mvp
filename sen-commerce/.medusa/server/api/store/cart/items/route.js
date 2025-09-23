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
            const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
            // Get variant price instead of using hardcoded fallback
            let unit_price = 0;
            let title = `Product ${variant_id}`;
            try {
                const [variant] = await productService.listProductVariants({ id: variant_id }, { relations: ["product"] });
                if (variant?.product) {
                    title = variant.product.title;
                    // Try to get price from price service
                    const query = req.scope.resolve("query");
                    const priceData = await query.graph({
                        entity: "product_variant_price_set",
                        fields: ["variant_id", "price_set_id"],
                        filters: { variant_id: variant_id }
                    });
                    if (priceData?.data?.[0]?.price_set_id) {
                        const pricingService = req.scope.resolve(utils_1.Modules.PRICING);
                        const prices = await pricingService.listPrices({
                            price_set_id: [priceData.data[0].price_set_id]
                        });
                        if (prices && prices.length > 0) {
                            const price = prices.find(p => p.currency_code === 'eur') || prices[0];
                            unit_price = price.amount;
                        }
                    }
                }
            }
            catch (priceError) {
                console.error("Error fetching variant price:", priceError);
            }
            // Only add to cart if we found a valid price
            if (unit_price > 0) {
                const lineItem = await cartService.addLineItems(cartId, [{
                        cart_id: cartId,
                        variant_id,
                        quantity,
                        unit_price,
                        title,
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
            else {
                res.status(400).json({
                    error: "Product price not found",
                    message: "Cannot add item to cart without a valid price"
                });
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnQvaXRlbXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscURBQW1EO0FBRW5ELGdEQUFnRDtBQUN6QyxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsSUFBSSxDQUFDO1FBQ0gsNENBQTRDO1FBQzVDLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUE7UUFFN0QsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUUvRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsZ0JBQWdCO2dCQUN2QixPQUFPLEVBQUUscUJBQXFCO2FBQy9CLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO1FBRXBELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUseUJBQXlCO2dCQUNoQyxPQUFPLEVBQUUsd0JBQXdCO2FBQ2xDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxJQUFJLENBQUM7WUFDSCw2Q0FBNkM7WUFDN0MsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsU0FBUyxDQUFDO2dCQUMxQyxPQUFPLEVBQUUsTUFBTTtnQkFDZixLQUFL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