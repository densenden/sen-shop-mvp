"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const artwork_module_1 = require("../../../modules/artwork-module");
const GET = async (req, res) => {
    try {
        console.log("Fetching artwork collections for store...");
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const productModuleService = req.scope.resolve(utils_1.Modules.PRODUCT);
        // Get collections from the artwork module service
        const collections = await artworkModuleService.listArtworkCollections({});
        console.log("Collections found:", collections?.length || 0);
        // Get artworks and group them by collection
        let collectionsWithArtworks = collections || [];
        if (collections && collections.length > 0) {
            try {
                const artworks = await artworkModuleService.listArtworks({});
                console.log("Artworks found:", artworks?.length || 0);
                // Get all products
                const allProducts = await productModuleService.listProducts({}, {
                    relations: ["variants"]
                });
                console.log("Products found:", allProducts?.length || 0);
                // Create a map of artwork ID to products using artwork.product_ids
                const artworkProductMap = new Map();
                for (const artwork of artworks || []) {
                    if (artwork.product_ids && Array.isArray(artwork.product_ids)) {
                        const artworkProducts = [];
                        for (const productId of artwork.product_ids) {
                            const product = allProducts.find(p => p.id === productId);
                            if (product) {
                                artworkProducts.push({
                                    id: product.id,
                                    title: product.title,
                                    handle: product.handle || product.id,
                                    thumbnail: product.thumbnail,
                                    // Don't add mock pricing - let the frontend handle pricing display
                                });
                            }
                        }
                        artworkProductMap.set(artwork.id, artworkProducts);
                    }
                }
                // Group artworks by collection and add products
                collectionsWithArtworks = collections.map(collection => ({
                    ...collection,
                    artwork_count: artworks.filter(artwork => artwork.artwork_collection_id === collection.id).length,
                    artworks: artworks.filter(artwork => artwork.artwork_collection_id === collection.id).map(artwork => ({
                        ...artwork,
                        products: artworkProductMap.get(artwork.id) || []
                    })) || []
                }));
            }
            catch (artworkError) {
                console.log("Could not fetch artworks, returning collections without artworks:", artworkError.message);
                collectionsWithArtworks = collections.map(collection => ({
                    ...collection,
                    artwork_count: 0,
                    artworks: []
                }));
            }
        }
        res.json({
            collections: collectionsWithArtworks,
            count: collectionsWithArtworks.length
        });
    }
    catch (error) {
        console.error("Error fetching artwork collections for store:", error);
        res.json({
            collections: [],
            count: 0
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmstY29sbGVjdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscURBQW1EO0FBRW5ELG9FQUFnRTtBQUV6RCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQ0FBMkMsQ0FBQyxDQUFBO1FBQ3hELE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBUSxDQUFBO1FBQ3JFLE1BQU0sb0JBQW9CLEdBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUV0RixrREFBa0Q7UUFDbEQsTUFBTSxXQUFXLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUN6RSxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUE7UUFFM0QsNENBQTRDO1FBQzVDLElBQUksdUJBQXVCLEdBQUcsV0FBVyxJQUFJLEVBQUUsQ0FBQTtRQUMvQyxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQztnQkFDSCxNQUFNLFFBQVEsR0FBRyxNQUFNLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFBO2dCQUVyRCxtQkFBbUI7Z0JBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sb0JBQW9CLENB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