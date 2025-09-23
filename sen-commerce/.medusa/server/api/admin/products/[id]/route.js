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
                    "subtitle",
                    "description",
                    "handle",
                    "status",
                    "thumbnail",
                    "images.*",
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
            // Debug logging for images
            console.log(`[Product API] Product ${id} details:`);
            console.log(`  - Title: ${product.title}`);
            console.log(`  - Thumbnail: ${product.thumbnail}`);
            console.log(`  - Images: ${product.images?.length || 0}`);
            console.log(`  - Image details:`, product.images);
            console.log(`  - Metadata keys:`, Object.keys(product.metadata || {}));
            // Format response to match expected structure
            const formatted = {
                id: product.id,
                title: product.title,
                subtitle: product.subtitle,
                description: product.description,
                handle: product.handle,
                status: product.status,
                thumbnail: product.thumbnail,
                images: product.images || [],
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
        // Handle empty handle - generate from title or skip update
        if (handle !== undefined) {
            if (handle && handle.trim() !== '') {
                updateData.handle = handle.trim();
            }
            else if (title && title.trim() !== '') {
                // Generate handle from title if handle is empty but title exists
                const generatedHandle = title.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-+|-+$/g, '');
                if (generatedHandle) {
                    updateData.handle = generatedHandle;
                }
                // If we can't generate a handle, don't update it
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3RzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0Esa0JBb0dDO0FBRUQsb0JBb0VDO0FBOUtELHFEQUE4RTtBQUU5RSw2Q0FBZ0Q7QUFFekMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFNUMsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNoRixNQUFNLGNBQWMsR0FBMEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2hGLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWhFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUE7UUFFckUsSUFBSSxDQUFDO1lBQ0gsMkVBQTJFO1lBQzNFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQztnQkFDNUMsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRTtnQkFDZixNQUFNLEVBQUU7b0JBQ04sSUFBSTtvQkFDSixPQUFPO29CQUNQLFVBQVU7b0JBQ1YsYUFBYTtvQkFDYixRQUFRO29C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