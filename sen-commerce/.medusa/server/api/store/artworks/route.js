"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const artwork_module_1 = require("../../../modules/artwork-module");
const utils_1 = require("@medusajs/framework/utils");
// GET /store/artworks
const GET = async (req, res) => {
    try {
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
        let artworks = [];
        let count = 0;
        try {
            const [dbArtworks, dbCount] = await artworkModuleService.listAndCountArtworks({}, {});
            // Enrich artworks with product data
            const enrichedArtworks = await Promise.all(dbArtworks.map(async (artwork) => {
                let products = [];
                console.log(`Processing artwork ${artwork.id}, product_ids:`, artwork.product_ids, 'type:', typeof artwork.product_ids);
                // Handle different formats of product_ids
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
                console.log(`Resolved product IDs for artwork ${artwork.id}:`, productIds);
                if (productIds.length > 0) {
                    try {
                        const productResult = await productService.listProducts({
                            id: productIds,
                        });
                        products = productResult;
                        console.log(`Found ${products.length} products for artwork ${artwork.id}`);
                    }
                    catch (productError) {
                        console.error(`Error fetching products for artwork ${artwork.id}:`, productError.message);
                    }
                }
                return {
                    ...artwork,
                    products,
                };
            }));
            artworks = enrichedArtworks;
            count = dbCount;
        }
        catch (error) {
            console.error("Could not fetch artworks:", error.message);
            artworks = [];
            count = 0;
        }
        res.json({
            artworks,
            count,
        });
    }
    catch (error) {
        console.error("[Store Artworks] Error fetching artworks:", error);
        res.status(500).json({
            error: "Failed to fetch artworks",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmtzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG9FQUFnRTtBQUdoRSxxREFBbUQ7QUFFbkQsc0JBQXNCO0FBQ2YsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixHQUFrQixFQUNsQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxDQUFDO1FBQ0gsTUFBTSxvQkFBb0IsR0FBeUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBQyxDQUFBO1FBQ3BGLE1BQU0sY0FBYyxHQUEwQixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFaEYsSUFBSSxRQUFRLEdBQVUsRUFBRSxDQUFBO1FBQ3hCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUViLElBQUksQ0FBQztZQUNILE1BQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FDM0UsRUFBRSxFQUNGLEVBQUUsQ0FDSCxDQUFBO1lBRUQsb0NBQW9DO1lBQ3BDLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUN4QyxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtnQkFDL0IsSUFBSSxRQUFRLEdBQWlCLEVBQUUsQ0FBQTtnQkFFL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsT0FBTyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7Z0JBRXZILDBDQUEwQztnQkFDMUMsSUFBSSxVQUFVLEdBQWEsRUFBRSxDQUFBO2dCQUM3QixJQUFJLE9BQU8sQ0FBQyxXQUFXLEVB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