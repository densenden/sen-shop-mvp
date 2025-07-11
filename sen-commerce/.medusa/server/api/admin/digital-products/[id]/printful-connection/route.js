"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = exports.DELETE = exports.POST = void 0;
const digital_product_1 = require("../../../../../modules/digital-product");
const printful_pod_product_service_1 = require("../../../../../modules/printful/services/printful-pod-product-service");
// POST /admin/digital-products/:id/printful-connection
// Connect a digital product to Printful products
const POST = async (req, res) => {
    try {
        const { id } = req.params;
        const { printful_product_ids } = req.body;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Validate that the Printful products exist
        const printfulService = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
        for (const printfulId of printful_product_ids) {
            // Check if Printful product exists (you might want to check both local and remote)
            const exists = await printfulService.findPrintfulProduct(printfulId) ||
                await printfulService.getStoreProduct(printfulId);
            if (!exists) {
                return res.status(400).json({
                    error: `Printful product ${printfulId} not found`
                });
            }
        }
        // Update the digital product with Printful connections
        await digitalProductService.updateDigitalProducts({
            id,
            printful_product_ids: printful_product_ids
        });
        // Fetch and return updated product
        const [updatedProduct] = await digitalProductService.listDigitalProducts({
            filters: { id }
        });
        res.json({
            success: true,
            digital_product: updatedProduct,
            message: `Connected to ${printful_product_ids.length} Printful product(s)`
        });
    }
    catch (error) {
        console.error("Error connecting digital product to Printful:", error);
        res.status(500).json({
            error: error.message || "Failed to connect to Printful products"
        });
    }
};
exports.POST = POST;
// DELETE /admin/digital-products/:id/printful-connection
// Remove connection to Printful products
const DELETE = async (req, res) => {
    try {
        const { id } = req.params;
        const { printful_product_id } = req.query;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Get current digital product
        const [digitalProduct] = await digitalProductService.listDigitalProducts({
            filters: { id }
        });
        if (!digitalProduct) {
            return res.status(404).json({ error: "Digital product not found" });
        }
        let updatedIds = [];
        if (printful_product_id) {
            // Remove specific Printful product connection
            const currentIds = digitalProduct.printful_product_ids || [];
            updatedIds = Array.isArray(currentIds) ? currentIds.filter((pid) => pid !== printful_product_id) : [];
        }
        else {
            // Remove all connections
            updatedIds = [];
        }
        // Update the digital product
        await digitalProductService.updateDigitalProducts({
            id,
            printful_product_ids: updatedIds
        });
        // Fetch and return updated product
        const [updatedProduct] = await digitalProductService.listDigitalProducts({
            filters: { id }
        });
        res.json({
            success: true,
            digital_product: updatedProduct,
            message: printful_product_id ?
                `Removed connection to Printful product ${printful_product_id}` :
                "Removed all Printful connections"
        });
    }
    catch (error) {
        console.error("Error removing Printful connection:", error);
        res.status(500).json({
            error: error.message || "Failed to remove Printful connection"
        });
    }
};
exports.DELETE = DELETE;
// GET /admin/digital-products/:id/printful-connection
// Get connected Printful products with details
const GET = async (req, res) => {
    try {
        const { id } = req.params;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Get digital product
        const [digitalProduct] = await digitalProductService.listDigitalProducts({
            filters: { id }
        });
        if (!digitalProduct) {
            return res.status(404).json({ error: "Digital product not found" });
        }
        const printfulProductIds = digitalProduct.printful_product_ids || [];
        if (printfulProductIds.length === 0) {
            return res.json({
                connected_products: [],
                count: 0
            });
        }
        // Fetch details of connected Printful products
        const printfulService = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
        const connectedProducts = [];
        for (const printfulId of (Array.isArray(printfulProductIds) ? printfulProductIds : [])) {
            try {
                // Try to get from local database first
                let product = await printfulService.findPrintfulProduct(printfulId);
                if (!product) {
                    // If not found locally, try to get from Printful API
                    const storeProduct = await printfulService.getStoreProduct(printfulId);
                    if (storeProduct) {
                        product = {
                            id: printfulId,
                            name: storeProduct.name,
                            thumbnail_url: storeProduct.thumbnail_url,
                            description: storeProduct.description || null
                        };
                    }
                }
                if (product) {
                    connectedProducts.push({
                        id: printfulId,
                        name: product.name,
                        thumbnail_url: product.thumbnail_url,
                        description: product.description,
                        status: 'connected'
                    });
                }
            }
            catch (error) {
                console.warn(`Could not fetch Printful product ${printfulId}:`, error);
                // Add placeholder for broken connection
                connectedProducts.push({
                    id: printfulId,
                    name: "Unknown Product",
                    status: "connection_error"
                });
            }
        }
        res.json({
            connected_products: connectedProducts,
            count: connectedProducts.length
        });
    }
    catch (error) {
        console.error("Error fetching Printful connections:", error);
        res.status(500).json({
            error: error.message || "Failed to fetch Printful connections"
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2RpZ2l0YWwtcHJvZHVjdHMvW2lkXS9wcmludGZ1bC1jb25uZWN0aW9uL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDRFQUErRTtBQUMvRSx3SEFBaUg7QUFHakgsdURBQXVEO0FBQ3ZELGlEQUFpRDtBQUMxQyxNQUFNLElBQUksR0FBRyxLQUFLLEVBQ3ZCLEdBRUUsRUFDRixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFDekIsTUFBTSxFQUFFLG9CQUFvQixFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQTtRQUV6QyxNQUFNLHFCQUFxQixHQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBRTNDLDRDQUE0QztRQUM1QyxNQUFNLGVBQWUsR0FBRyxJQUFJLHdEQUF5QixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUVoRSxLQUFLLE1BQU0sVUFBVSxJQUFJLG9CQUFvQixFQUFFLENBQUM7WUFDOUMsbUZBQW1GO1lBQ25GLE1BQU0sTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDLG1CQUFtQixDQUFDLFVBQVUsQ0FBQztnQkFDdEQsTUFBTSxlQUFlLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBRS9ELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDWixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUMxQixLQUFLLEVBQUUsb0JBQW9CLFVBQVUsWUFBWTtpQkFDbEQsQ0FBQyxDQUFBO1lBQ0osQ0FBQztRQUNILENBQUM7UUFFRCx1REFBdUQ7UUFDdkQsTUFBTSxxQkFBcUIsQ0FB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