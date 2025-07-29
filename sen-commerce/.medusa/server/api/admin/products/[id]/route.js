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
        console.log("Product service resolved:", !!productService);
        try {
            // Fetch single product by ID
            const product = await productService.retrieveProduct(id, {
                relations: ["variants", "tags", "metadata"]
            });
            console.log("Product fetched:", !!product);
            if (!product) {
                return res.status(404).json({ error: "Product not found" });
            }
            // Format response to match expected structure
            const formatted = {
                id: product.id,
                title: product.title,
                description: product.description,
                status: product.status,
                metadata: product.metadata || {},
                variants: product.variants || [],
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
        const { title, description, metadata } = req.body;
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        // Update the product
        await productService.updateProducts(id, {
            title,
            description,
            metadata
        });
        // Fetch the updated product to return it
        const updatedProduct = await productService.retrieveProduct(id, {
            relations: ["variants", "tags", "metadata"]
        });
        res.json({ product: updatedProduct });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3RzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS0Esa0JBK0NDO0FBRUQsb0JBZ0NDO0FBckZELHFEQUFtRDtBQUVuRCw2Q0FBZ0Q7QUFFekMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFFNUMsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNoRixPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQTtRQUUxRCxJQUFJLENBQUM7WUFDSCw2QkFBNkI7WUFDN0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxjQUFjLENBQUMsZUFBZSxDQUFDLEVBQUUsRUFBRTtnQkFDdkQsU0FBUyxFQUFFLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUM7YUFDNUMsQ0FBQyxDQUFBO1lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7WUFFMUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNiLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO1lBQzdELENBQUM7WUFFRCw4Q0FBOEM7WUFDOUMsTUFBTSxTQUFTLEdBQUc7Z0JBQ2hCLEVBQUUsRUFBRSxPQUFPLENB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