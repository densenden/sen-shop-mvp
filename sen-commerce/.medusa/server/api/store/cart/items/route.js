"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const utils_1 = require("@medusajs/framework/utils");
// POST /api/store/cart/items - Add item to cart
const POST = async (req, res) => {
    try {
        const cartService = req.scope.resolve(utils_1.Modules.CART);
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        const cartId = req.session?.cart_id || req.headers["x-cart-id"];
        if (!cartId) {
            return res.status(404).json({
                error: "Cart not found",
                message: "No cart ID provided"
            });
        }
        const { product_id, variant_id, quantity = 1, metadata = {} } = req.body;
        if (!product_id || !variant_id) {
            return res.status(400).json({
                error: "Missing required fields",
                message: "product_id and variant_id are required"
            });
        }
        // Get product and variant details for line item
        const product = await productService.retrieveProduct(product_id, {
            relations: ["variants"]
        });
        const variant = product.variants?.find(v => v.id === variant_id);
        if (!variant) {
            return res.status(404).json({
                error: "Variant not found",
                message: "Specified variant not found for this product"
            });
        }
        // Default price in cents (e.g., $20.00)
        const unitPrice = 2000;
        // Add line item to cart using Medusa v2 API
        await cartService.addLineItems(cartId, [
            {
                title: `${product.title} - ${variant.title || 'Default'}`,
                subtitle: product.subtitle || undefined,
                thumbnail: product.thumbnail || undefined,
                variant_id,
                quantity,
                unit_price: unitPrice,
                product_id,
                product_title: product.title,
                product_description: product.description || undefined,
                product_subtitle: product.subtitle || undefined,
                product_handle: product.handle || undefined,
                variant_sku: variant.sku || undefined,
                variant_title: variant.title || undefined,
                metadata: {
                    ...metadata,
                    product_id
                }
            }
        ]);
        // Retrieve updated cart with relations
        const cart = await cartService.retrieveCart(cartId, {
            relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
        });
        res.json({
            cart,
            message: "Item added to cart successfully"
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnQvaXRlbXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEscURBQW1EO0FBRW5ELGdEQUFnRDtBQUN6QyxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxXQUFXLEdBQXVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN2RSxNQUFNLGNBQWMsR0FBMEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRWhGLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7UUFFL0QsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ1osT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLGdCQUFnQjtnQkFDdkIsT0FBTyxFQUFFLHFCQUFxQjthQUMvQixDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsTUFBTSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsUUFBUSxHQUFHLENBQUMsRUFBRSxRQUFRLEdBQUcsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUUvRSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDL0IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLHlCQUF5QjtnQkFDaEMsT0FBTyxFQUFFLHdDQUF3QzthQUNsRCxDQUFDLENB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