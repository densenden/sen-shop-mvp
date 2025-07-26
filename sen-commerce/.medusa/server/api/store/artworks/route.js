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
            const [dbArtworks, dbCount] = await artworkModuleService.listAndCountArtworks({}, {
                relations: ["artwork_collection"],
            });
            // Enrich artworks with product data
            const enrichedArtworks = await Promise.all(dbArtworks.map(async (artwork) => {
                let products = [];
                if (Array.isArray(artwork.product_ids) && artwork.product_ids.length > 0) {
                    const productResult = await productService.listProducts({
                        id: artwork.product_ids,
                    });
                    products = productResult;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmtzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG9FQUFnRTtBQUdoRSxxREFBbUQ7QUFFbkQsc0JBQXNCO0FBQ2YsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixHQUFrQixFQUNsQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxDQUFDO1FBQ0gsTUFBTSxvQkFBb0IsR0FBeUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBQyxDQUFBO1FBQ3BGLE1BQU0sY0FBYyxHQUEwQixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFaEYsSUFBSSxRQUFRLEdBQVUsRUFBRSxDQUFBO1FBQ3hCLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUViLElBQUksQ0FBQztZQUNILE1BQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FDM0UsRUFBRSxFQUNGO2dCQUNFLFNBQVMsRUFBRSxDQUFDLG9CQUFvQixDQUFDO2FBQ2xDLENBQ0YsQ0FBQTtZQUVELG9DQUFvQztZQUNwQyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDeEMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7Z0JBQy9CLElBQUksUUFBUSxHQUFpQixFQUFFLENBQUE7Z0JBRS9CLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBQ3pFLE1BQU0sYUFBYSxHQUFpQixNQUFNLGNBQWMsQ0FBQyxZQUFZLENBQUM7d0JBQ3BFLEVBQUUsRUFBRSxPQUFPLENBQUMsV0FBdUI7cUJBQ3BDLENBQUMsQ0FBQTtvQkFDRixRQUFRLEdBQUcsYUFBYSxDQUFBO2dCQUMxQixDQUFDO2dCQUVELE9BQU87b0JBQ0wsR0FBRyxPQUFPO29CQUNWLFFBQVE7aUJBQ1QsQ0FBQTtZQUNILENBQUMsQ0FBQyxDQUNILENBQUE7WUFFRCxRQUFRLEdBQUcsZ0JBQWdCLENBQUE7WUFDM0IsS0FBSyxHQUFHLE9BQU8sQ0FBQTtRQUNqQixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBRXpELFFBQVEsR0FBRyxFQUFFLENBQUE7WUFDYixLQUFLLEdBQUcsQ0FBQyxDQUFBO1FBQ1gsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxRQUFRO1lBQ1IsS0FBSztTQUNOLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNqRSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsMEJBQTBCO1lBQ2pDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBMURZLFFBQUEsR0FBRyxPQTBEZiJ9