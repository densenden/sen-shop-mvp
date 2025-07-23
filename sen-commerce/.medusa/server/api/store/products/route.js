"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const GET = async (req, res) => {
    try {
        // Get query parameters for filtering
        const { limit = 20, offset = 0, handle, tag, collection_id, category_id } = req.query;
        // Try to get real products from the database
        let products = [];
        let count = 0;
        try {
            const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
            // Build filter object
            const filters = {};
            if (handle)
                filters.handle = handle;
            if (tag)
                filters.tags = { name: tag };
            if (collection_id)
                filters.collection_id = collection_id;
            if (category_id)
                filters.category_id = category_id;
            // Try to get real products
            const result = await productService.listProducts(filters, {
                relations: ["variants", "images", "tags", "categories"],
                take: Number(limit),
                skip: Number(offset)
            });
            products = result || [];
            count = products.length;
        }
        catch (productError) {
            console.log("Could not fetch real products, using mock data:", productError.message);
            // Fall back to mock data
            const mockProducts = [
                {
                    id: "prod_01",
                    title: "Sample Digital Art",
                    description: "Beautiful digital artwork for your collection",
                    status: "published",
                    metadata: {
                        fulfillment_type: "digital_download",
                        file_size: 2048576,
                        mime_type: "image/png"
                    },
                    variants: [{
                            id: "var_01",
                            title: "Digital Download",
                            price: 1999,
                            sku: "digital-art-01"
                        }],
                    tags: ["digital", "art"],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: "prod_02",
                    title: "Custom T-Shirt",
                    description: "Print-on-demand custom t-shirt",
                    status: "published",
                    metadata: {
                        fulfillment_type: "printful_pod",
                        printful_product_id: "123",
                        source_provider: "printful"
                    },
                    variants: [{
                            id: "var_02",
                            title: "Medium",
                            price: 2999,
                            sku: "tshirt-med-01"
                        }],
                    tags: ["printful", "clothing"],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            products = mockProducts;
            count = mockProducts.length;
        }
        res.json({
            products: products || [],
            count: count || 0,
            limit: Number(limit),
            offset: Number(offset)
        });
    }
    catch (error) {
        console.error("[Store Products] Error fetching products:", error);
        res.status(500).json({
            error: "Failed to fetch products",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Byb2R1Y3RzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHFEQUFtRDtBQUU1QyxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gscUNBQXFDO1FBQ3JDLE1BQU0sRUFDSixLQUFLLEdBQUcsRUFBRSxFQUNWLE1BQU0sR0FBRyxDQUFDLEVBQ1YsTUFBTSxFQUNOLEdBQUcsRUFDSCxhQUFhLEVBQ2IsV0FBVyxFQUNaLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQTtRQUViLDZDQUE2QztRQUM3QyxJQUFJLFFBQVEsR0FBVSxFQUFFLENBQUE7UUFDeEIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFBO1FBRWIsSUFBSSxDQUFDO1lBQ0gsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUVoRixzQkFBc0I7WUFDdEIsTUFBTSxPQUFPLEdBQVEsRUFBRSxDQUFBO1lBQ3ZCLElBQUksTUFBTTtnQkFBRSxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtZQUNuQyxJQUFJLEdBQUc7Z0JBQUUsT0FBTyxDQUFDLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQTtZQUNyQyxJQUFJLGFBQWE7Z0JBQUUsT0FBTyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUE7WUFDeEQsSUFBSSxXQUFXO2dCQUFFLE9BQU8sQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO1lBRWxELDJCQUEyQjtZQUMzQixNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFO2dCQUN4RCxTQUFTLEVBQUUsQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFF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