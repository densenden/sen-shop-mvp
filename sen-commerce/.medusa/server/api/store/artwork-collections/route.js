"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const utils_1 = require("@medusajs/framework/utils");
const artwork_module_1 = require("../../../modules/artwork-module");
const GET = async (req, res) => {
    try {
        console.log("Fetching artwork collections for store...");
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const query = req.scope.resolve(utils_1.ContainerRegistrationKeys.QUERY);
        // Get collections from the artwork module service
        const collections = await artworkModuleService.listArtworkCollections({});
        console.log("Collections found:", collections?.length || 0);
        // Get artworks and group them by collection
        let collectionsWithArtworks = collections || [];
        if (collections && collections.length > 0) {
            try {
                const artworks = await artworkModuleService.listArtworks({});
                console.log("Artworks found:", artworks?.length || 0);
                // Get all products with pricing using query service
                const { data: allProducts } = await query.graph({
                    entity: 'product',
                    fields: [
                        'id',
                        'title',
                        'handle',
                        'thumbnail',
                        'variants.*',
                        'variants.price_set.*',
                        'variants.price_set.prices.*'
                    ]
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
                                // Get price from first variant with proper price set data
                                const firstVariant = product.variants?.[0];
                                const prices = firstVariant?.price_set?.prices || [];
                                const eurPrice = prices.find((p) => p.currency_code === 'eur') || prices[0];
                                const price = eurPrice?.amount || 0;
                                const currencyCode = 'eur'; // Force EUR
                                artworkProducts.push({
                                    id: product.id,
                                    title: product.title,
                                    handle: product.handle || product.id,
                                    thumbnail: product.thumbnail,
                                    price: price,
                                    currency_code: currencyCode
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmstY29sbGVjdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscURBQXFFO0FBQ3JFLG9FQUFnRTtBQUV6RCxNQUFNLEdBQUcsR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDbkUsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQ0FBMkMsQ0FBQyxDQUFBO1FBQ3hELE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBUSxDQUFBO1FBQ3JFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFBO1FBRWhFLGtEQUFrRDtRQUNsRCxNQUFNLFdBQVcsR0FBRyxNQUFNLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3pFLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQTtRQUUzRCw0Q0FBNEM7UUFDNUMsSUFBSSx1QkFBdUIsR0FBRyxXQUFXLElBQUksRUFBRSxDQUFBO1FBQy9DLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDO2dCQUNILE1BQU0sUUFBUSxHQUFHLE1BQU0sb0JBQW9CLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFBO2dCQUM1RCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUE7Z0JBRXJELG9EQUFvRDtnQkFDcEQsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxNQUFNLEtBQUssQ0FBQyxLQUFLLENBQUM7b0JBQzlDLE1BQU0sRUFBRSxTQUFTO29CQUNqQixNQUFNLEVBQUU7d0JBQ04sSUFBSTt3QkFDSixPQUFPO3dCQUNQLFFBQVE7d0JBQ1IsV0FBVzt3QkFDWCxZQUFZO3dCQUNaLHNCQUFzQjt3QkFDdEIsNkJBQTZCO3FCQUM5QjtpQkFDRixDQUFDLENBQUE7Z0JBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFBO2dCQUV4RCxtRUFBbUU7Z0JBQ25FLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtnQkFDbkMsS0FBSyxNQUFNLE9BQU8sSUFBSSxRQUFRLElBQUksRUFBRSxFQUFFLENBQUM7b0JBQ3JDLElBQUksT0FBTyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO3dCQUM5RCxNQUFNLGVBQWUsR0FBVSxFQUFFLENBQUE7d0JBQ2pDLEtBQUssTUFBTSxTQUFTLElBQUksT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDOzRCQUM1QyxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQTs0QkFDekQsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQ0FDWiwwREFBMEQ7Z0NBQzFELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQ0FDMUMsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLFNBQVMsRUFBRSxNQUFNLElBQUksRUFBRSxDQUFBO2dDQUNwRCxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsYUFBYSxLQUFLLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQ0FDaEYsTUFBTSxLQUFLLEdBQUcsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUE7Z0NBQ25DLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQSxDQUFDLFlBQVk7Z0NBRXZDLGVBQWUsQ0FBQyxJQUFJLENBQUM7b0NBQ25CLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRTtvQ0FDZCxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7b0NBQ3BCLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxFQUFFO29DQUNwQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7b0NBQzVCLEtBQUssRUFBRSxLQUFLO29DQUNaLGFBQWEsRUFBRSxZQUFZO2lDQUM1QixDQUFDLENBQUE7NEJBQ0osQ0FBQzt3QkFDSCxDQUFDO3dCQUNELGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLGVBQWUsQ0FBQyxDQUFBO29CQUNwRCxDQUFDO2dCQUNILENBQUM7Z0JBRUQsZ0RBQWdEO2dCQUNoRCx1QkFBdUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdkQsR0FBRyxVQUFVO29CQUNiLGFBQWEsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLHFCQUFxQixLQUFLLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNO29CQUNqRyxRQUFRLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsS0FBSyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDcEcsR0FBRyxPQUFPO3dCQUNWLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7cUJBQ2xELENBQUMsQ0FBQyxJQUFJLEVBQUU7aUJBQ1YsQ0FBQyxDQUFDLENBQUE7WUFDTCxDQUFDO1lBQUMsT0FBTyxZQUFZLEVBQUUsQ0FBQztnQkFDdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtRUFBbUUsRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBQ3RHLHVCQUF1QixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN2RCxHQUFHLFVBQVU7b0JBQ2IsYUFBYSxFQUFFLENBQUM7b0JBQ2hCLFFBQVEsRUFBRSxFQUFFO2lCQUNiLENBQUMsQ0FBQyxDQUFBO1lBQ0wsQ0FBQztRQUNILENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsV0FBVyxFQUFFLHVCQUF1QjtZQUNwQyxLQUFLLEVBQUUsdUJBQXVCLENBQUMsTUFBTTtTQUN0QyxDQUFDLENBQUE7SUFFSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0NBQStDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFckUsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLFdBQVcsRUFBRSxFQUFFO1lBQ2YsS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBN0ZZLFFBQUEsR0FBRyxPQTZGZiJ9