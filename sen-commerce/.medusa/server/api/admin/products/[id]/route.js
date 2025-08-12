"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const medusa_1 = require("@medusajs/medusa");
async function GET(req, res) {
    try {
        const { id } = req.params;
        console.log("Fetching product with ID:", id);
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        const pricingService = req.scope.resolve(utils_1.Modules.PRICING);
        const query = req.scope.resolve(utils_1.ContainerRegistrationKeys.QUERY);
        console.log("Services resolved:", !!productService, !!pricingService);
        try {
            // Fetch product with variants using the query service for better relations
            const { data: [product] } = await query.graph({
                entity: "product",
                filters: { id },
                fields: [
                    "id",
                    "title",
                    "description",
                    "status",
                    "metadata",
                    "created_at",
                    "updated_at",
                    "variants.*",
                    "variants.price_set.*",
                    "variants.price_set.prices.*"
                ],
            });
            console.log("Product fetched with pricing:", !!product);
            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }
            // Format variants with pricing
            const formattedVariants = (product.variants || []).map((variant) => {
                const prices = variant.price_set?.prices || [];
                const defaultPrice = prices.find((p) => p.currency_code === 'usd') || prices[0];
                return {
                    id: variant.id,
                    title: variant.title,
                    sku: variant.sku,
                    price_set_id: variant.price_set?.id,
                    price: defaultPrice?.amount || 0,
                    currency_code: defaultPrice?.currency_code || 'usd',
                    prices: prices.map((p) => ({
                        amount: p.amount,
                        currency_code: p.currency_code
                    })),
                    created_at: variant.created_at,
                    updated_at: variant.updated_at
                };
            });
            // Format response to match expected structure
            const formatted = {
                id: product.id,
                title: product.title,
                description: product.description,
                status: product.status,
                metadata: product.metadata || {},
                variants: formattedVariants,
                tags: product.tags || [],
                created_at: product.created_at,
                updated_at: product.updated_at
            };
            res.json({ product: formatted });
        }
        catch (productError) {
            console.error("Could not fetch real product:", productError);
            return res.status(404).json({ error: "Product not found" });
        }
    }
    catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            error: "Failed to fetch product",
            message: error.message
        });
    }
}
async function POST(req, res) {
    try {
        const { id } = req.params;
        const { title, subtitle, description, handle, status, thumbnail, images, metadata } = req.body;
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        // Prepare update data
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (subtitle !== undefined)
            updateData.subtitle = subtitle;
        if (description !== undefined)
            updateData.description = description;
        if (handle !== undefined)
            updateData.handle = handle;
        if (status !== undefined)
            updateData.status = status;
        if (thumbnail !== undefined)
            updateData.thumbnail = thumbnail;
        if (images !== undefined)
            updateData.images = images;
        if (metadata !== undefined)
            updateData.metadata = metadata;
        console.log(`[UPDATE PRODUCT] Updating product ${id} with:`, updateData);
        // Update the product
        await productService.updateProducts(id, updateData);
        // Fetch the updated product to return it
        const updatedProduct = await productService.retrieveProduct(id, {
            relations: ["variants", "tags", "metadata", "images"]
        });
        res.json({
            success: true,
            product: updatedProduct
        });
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            error: "Failed to update product",
            message: error.message
        });
    }
}
exports.middlewares = [
    (0, medusa_1.authenticate)("admin", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3RzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0Esa0JBb0ZDO0FBRUQsb0JBaURDO0FBM0lELHFEQUE4RTtBQUU5RSw2Q0FBZ0Q7QUFFekMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFNUMsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNoRixNQUFNLGNBQWMsR0FBMEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2hGLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWhFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUE7UUFFckUsSUFBSSxDQUFDO1lBQ0gsMkVBQTJFO1lBQzNFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQztnQkFDNUMsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDZixNQUFNLEVBQUU7b0JBQ04sSUFBSTtvQkFDSixPQUFPO29CQUNQLGFBQWE7b0JBQ2IsUUFBUTtvQkFDUixVQUFVO29C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