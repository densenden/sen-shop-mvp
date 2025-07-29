"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const artwork_module_1 = require("../../../../modules/artwork-module");
const utils_1 = require("@medusajs/framework/utils");
const GET = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                error: "Artwork ID is required"
            });
        }
        console.log(`[Store API] Fetching artwork with ID: ${id}`);
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        if (!artworkModuleService) {
            return res.status(500).json({
                error: "Artwork service not available"
            });
        }
        // Get artwork by ID (without relations since artwork_collection is just an ID)
        const artwork = await artworkModuleService.retrieveArtwork(id);
        if (!artwork) {
            console.log(`[Store API] Artwork not found with ID: ${id}`);
            return res.status(404).json({
                error: "Artwork not found"
            });
        }
        console.log(`[Store API] Found artwork: ${artwork.title}`);
        // Get related products for this artwork
        let relatedProducts = [];
        try {
            console.log(`[Store API] Raw artwork.product_ids:`, artwork.product_ids, 'type:', typeof artwork.product_ids);
            // Handle different formats of product_ids (same as in list API)
            let productIds = [];
            if (artwork.product_ids) {
                if (Array.isArray(artwork.product_ids)) {
                    productIds = artwork.product_ids.filter(id => typeof id === 'string');
                }
                else if (typeof artwork.product_ids === 'string') {
                    try {
                        const parsed = JSON.parse(artwork.product_ids);
                        productIds = Array.isArray(parsed) ? parsed : [];
                    }
                    catch {
                        productIds = [artwork.product_ids];
                    }
                }
            }
            console.log(`[Store API] Resolved product IDs for artwork ${id}:`, productIds);
            if (productIds.length > 0) {
                console.log(`[Store API] Attempting to fetch products with IDs:`, productIds);
                // Try to fetch all products at once first
                try {
                    const allProducts = await productService.listProducts({
                        id: productIds
                    }, {
                        relations: ["variants"]
                    });
                    relatedProducts = allProducts;
                    console.log(`[Store API] Found ${relatedProducts.length} products via listProducts`);
                }
                catch (listError) {
                    console.log(`[Store API] listProducts failed, trying individual fetches:`, listError.message);
                    // Fallback: Try to fetch each product individually
                    const productPromises = productIds.map(async (productId) => {
                        try {
                            const product = await productService.retrieveProduct(productId, {
                                relations: ["variants"]
                            });
                            return product;
                        }
                        catch (error) {
                            console.log(`[Store API] Could not fetch product ${productId}:`, error.message);
                            return null;
                        }
                    });
                    const productResults = await Promise.all(productPromises);
                    relatedProducts = productResults.filter(p => p !== null);
                }
                console.log(`[Store API] Final result: Found ${relatedProducts.length} related products`);
                if (relatedProducts.length > 0) {
                    console.log(`[Store API] Product details:`, relatedProducts.map(p => ({ id: p.id, title: p.title })));
                }
            }
            else {
                console.log(`[Store API] No product_ids found for artwork ${id} - artwork.product_ids is:`, artwork.product_ids);
            }
        }
        catch (error) {
            console.error("Could not fetch related products:", error);
        }
        // Format response - only use fields that exist in the artwork model
        const response = {
            id: artwork.id,
            title: artwork.title,
            description: artwork.description,
            image_url: artwork.image_url,
            artwork_collection_id: artwork.artwork_collection_id,
            products: relatedProducts
        };
        res.json({ artwork: response });
    }
    catch (error) {
        console.error("[Store API] Error fetching artwork:", error);
        res.status(500).json({
            error: "Failed to fetch artwork",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmtzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdUVBQW1FO0FBR25FLHFEQUFtRDtBQUU1QyxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFFekIsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLHdCQUF3QjthQUNoQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5Q0FBeUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtRQUUxRCxNQUFNLG9CQUFvQixHQUF5QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFDLENBQUE7UUFDcEYsTUFBTSxjQUFjLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVoRixJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUMxQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsK0JBQStCO2FBQ3ZDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCwrRUFBK0U7UUFDL0UsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFOUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQ0FB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