"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const pod_provider_facade_1 = require("../../../../modules/printful/services/pod-provider-facade");
// GET /admin/printful-products/enhanced
// Get all enhanced Printful products with full details
async function GET(req, res) {
    try {
        const podManager = new pod_provider_facade_1.PODProviderManager(req.scope);
        const { provider, include_variants, include_files } = req.query;
        // Get products from specified provider or default
        const products = await podManager.fetchProducts(provider);
        // If additional details are requested, fetch them
        const enhancedProducts = await Promise.all(products.map(async (product) => {
            const enhancedProduct = { ...product };
            if (include_variants === 'true') {
                // Add variant information
                enhancedProduct.variants = product.variants || [];
            }
            if (include_files === 'true') {
                // Add file information (mockups, designs, etc.)
                enhancedProduct.files = [];
                // This would be implemented to fetch files from database
            }
            return enhancedProduct;
        }));
        res.json({
            products: enhancedProducts,
            count: enhancedProducts.length,
            provider: provider || 'printful'
        });
    }
    catch (error) {
        console.error('Error fetching enhanced products:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch enhanced products' });
    }
}
// POST /admin/printful-products/enhanced
// Create new enhanced product with all features
async function POST(req, res) {
    try {
        const podManager = new pod_provider_facade_1.PODProviderManager(req.scope);
        const { name, description, image_url, video_url, additional_images, artwork_id, provider, seo_title, seo_description, tags, category, variants, files } = req.body;
        // Validate required fields
        if (!name || !image_url) {
            return res.status(400).json({ error: 'Name and image_url are required' });
        }
        // Create product data
        const productData = {
            name,
            description,
            image_url,
            artwork_id,
            variants
        };
        // Create the product
        const product = await podManager.createProduct(productData, provider);
        // Store additional data in local database
        // This would involve creating records in printful_product_file, etc.
        res.status(201).json({
            success: true,
            product,
            message: 'Enhanced product created successfully'
        });
    }
    catch (error) {
        console.error('Error creating enhanced product:', error);
        res.status(500).json({ error: error.message || 'Failed to create enhanced product' });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXByb2R1Y3RzL2VuaGFuY2VkL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBS0Esa0JBb0NDO0FBSUQsb0JBaURDO0FBN0ZELG1HQUE4RjtBQUU5Rix3Q0FBd0M7QUFDeEMsdURBQXVEO0FBQ2hELEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxNQUFNLFVBQVUsR0FBRyxJQUFJLHdDQUFrQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNwRCxNQUFNLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFZLENBQUE7UUFFdEUsa0RBQWtEO1FBQ2xELE1BQU0sUUFBUSxHQUFHLE1BQU0sVUFBVSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUV6RCxrREFBa0Q7UUFDbEQsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDeEUsTUFBTSxlQUFlLEdBQVEsRUFBRSxHQUFHLE9BQU8sRUFBRSxDQUFBO1lBRTNDLElBQUksZ0JBQWdCLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQ2hDLDBCQUEwQjtnQkFDMUIsZUFBZSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQTtZQUNuRCxDQUFDO1lBRUQsSUFBSSxhQUFhLEtBQUssTUFBTSxFQUFFLENBQUM7Z0JBQzdCLGdEQUFnRDtnQkFDaEQsZUFBZSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUE7Z0JBQzFCLHlEQUF5RDtZQUMzRCxDQUFDO1lBRUQsT0FBTyxlQUFlLENBQUE7UUFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVILEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxRQUFRLEVBQUUsZ0JBQWdCO1lBQzFCLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNO1lBQzlCLFFBQVEsRUFBRSxRQUFRLElBQUksVUFBVTtTQUNqQyxDQUFDLENBQUE7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3pELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksbUNBQW1DLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZGLENBQUM7QUFDSCxDQUFDO0FBRUQseUNBQXlDO0FBQ3pDLGdEQUFnRDtBQUN6QyxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSx3Q0FBa0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDcEQsTUFBTSxFQUNKLElBQUksRUFDSixXQUFXLEVBQ1gsU0FBUyxFQUNULFNBQVMsRUFDVCxpQkFBaUIsRUFDakIsVUFBVSxFQUNWLFFBQVEsRUFDUixTQUFTLEVBQ1QsZUFBZSxFQUNmLElBQUksRUFDSixRQUFRLEVBQ1IsUUFBUSxFQUNSLEtBQUssRUFDTixHQUFHLEdBQUcsQ0FBQyxJQUFXLENBQUE7UUFFbkIsMkJBQTJCO1FBQzNCLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN4QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLGlDQUFpQyxFQUFFLENBQUMsQ0FBQTtRQUMzRSxDQUFDO1FBRUQsc0JBQXNCO1FBQ3RCLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUk7WUFDSixXQUFXO1lBQ1gsU0FBUztZQUNULFVBQVU7WUFDVixRQUFRO1NBQ1QsQ0FBQTtRQUVELHFCQUFxQjtRQUNyQixNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxhQUFhLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFBO1FBRXJFLDBDQUEwQztRQUMxQyxxRUFBcUU7UUFFckUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPO1lBQ1AsT0FBTyxFQUFFLHVDQUF1QztTQUNqRCxDQUFDLENBQUE7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3hELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksbUNBQW1DLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZGLENBQUM7QUFDSCxDQUFDIn0=