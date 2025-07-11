"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
const pod_provider_facade_1 = require("../../../../../modules/printful/services/pod-provider-facade");
const printful_pod_product_service_1 = require("../../../../../modules/printful/services/printful-pod-product-service");
// GET /admin/printful-products/enhanced/:id
// Get single enhanced product with full details
async function GET(req, res) {
    try {
        const { id } = req.params;
        const { provider } = req.query;
        const printfulService = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
        // Try to get from local database first
        const localProduct = await printfulService.findPrintfulProduct(id);
        if (localProduct) {
            // We have a local enhanced product, return it
            res.json({
                product: localProduct
            });
            return;
        }
        // If not found locally, try to get from POD provider
        const podManager = new pod_provider_facade_1.PODProviderManager(req.scope);
        const product = await podManager.getProduct(id, provider);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Add enhanced data structure
        const enhancedProduct = {
            ...product,
            variants: product.variants || [],
            files: [], // Files will be fetched from separate endpoint
            sync_logs: [],
            metadata: product.metadata || {},
            // Add default enhanced fields
            video_url: null,
            additional_images: [],
            seo_title: null,
            seo_description: null,
            tags: [],
            category: null,
            base_price: product.price,
            sale_price: null,
            status: 'active',
            provider_type: provider || 'printful',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        res.json({
            product: enhancedProduct
        });
    }
    catch (error) {
        console.error('Error fetching enhanced product:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch enhanced product' });
    }
}
// PUT /admin/printful-products/enhanced/:id
// Update enhanced product with description, video, photos
async function PUT(req, res) {
    try {
        const { id } = req.params;
        const { name, description, thumbnail_url, video_url, additional_images, seo_title, seo_description, tags, category, base_price, sale_price, status, artwork_id, provider } = req.body;
        const printfulService = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
        // Check if product exists locally
        let localProduct = await printfulService.findPrintfulProduct(id);
        if (localProduct) {
            // Update existing local product
            const updatedProduct = await printfulService.updatePrintfulProducts({
                id,
                name,
                description,
                thumbnail_url,
                video_url,
                additional_images,
                seo_title,
                seo_description,
                tags,
                category,
                base_price,
                sale_price,
                status,
                artwork_id,
                provider_type: provider || 'printful'
            });
            res.json({
                success: true,
                product: updatedProduct,
                message: 'Enhanced product updated successfully'
            });
        }
        else {
            // Product doesn't exist locally, create it
            const createdProduct = await printfulService.createPrintfulProducts({
                printful_product_id: id,
                name,
                description,
                thumbnail_url,
                video_url,
                additional_images,
                seo_title,
                seo_description,
                tags,
                category,
                base_price,
                sale_price,
                status: status || 'active',
                artwork_id,
                provider_type: provider || 'printful'
            });
            res.json({
                success: true,
                product: createdProduct,
                message: 'Enhanced product created successfully'
            });
        }
    }
    catch (error) {
        console.error('Error updating enhanced product:', error);
        res.status(500).json({ error: error.message || 'Failed to update enhanced product' });
    }
}
// DELETE /admin/printful-products/enhanced/:id
// Delete enhanced product and all related data
async function DELETE(req, res) {
    try {
        const { id } = req.params;
        const { provider } = req.query;
        const printfulService = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
        // Check if product exists locally
        const localProduct = await printfulService.findPrintfulProduct(id);
        if (localProduct) {
            // Delete from local database
            await printfulService.deletePrintfulProducts(id);
        }
        // Optionally delete from provider (be careful with this)
        // const podManager = new PODProviderManager(req.scope)
        // await podManager.deleteProduct(id, provider)
        res.json({
            success: true,
            message: 'Enhanced product deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting enhanced product:', error);
        res.status(500).json({ error: error.message || 'Failed to delete enhanced product' });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXByb2R1Y3RzL2VuaGFuY2VkL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSxrQkF3REM7QUFJRCxrQkFpRkM7QUFJRCx3QkE0QkM7QUFsTEQsc0dBQWlHO0FBQ2pHLHdIQUFpSDtBQUVqSCw0Q0FBNEM7QUFDNUMsZ0RBQWdEO0FBQ3pDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUN6QixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQVksQ0FBQTtRQUVyQyxNQUFNLGVBQWUsR0FBRyxJQUFJLHdEQUF5QixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUVoRSx1Q0FBdUM7UUFDdkMsTUFBTSxZQUFZLEdBQUcsTUFBTSxlQUFlLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFbEUsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNqQiw4Q0FBOEM7WUFDOUMsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDUCxPQUFPLEVBQUUsWUFBWTthQUN0QixDQUFDLENBQUE7WUFDRixPQUFNO1FBQ1IsQ0FBQztRQUVELHFEQUFxRDtRQUNyRCxNQUFNLFVBQVUsR0FBRyxJQUFJLHdDQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNwRCxNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBRXpELElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENB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