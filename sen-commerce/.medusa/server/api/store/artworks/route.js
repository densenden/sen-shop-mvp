"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const artwork_module_1 = require("../../../modules/artwork-module");
const utils_1 = require("@medusajs/framework/utils");
// GET /store/artworks
const GET = async (req, res) => {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const productService = req.scope.resolve(utils_1.Modules.PRODUCT);
    const [artworks, count] = await artworkModuleService.listAndCountArtworks({}, {
        relations: ["artwork_collection"],
    });
    // Enrich artworks with product data
    const enrichedArtworks = await Promise.all(artworks.map(async (artwork) => {
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
    res.json({
        artworks: enrichedArtworks,
        count,
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmtzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG9FQUFnRTtBQUdoRSxxREFBbUQ7QUFFbkQsc0JBQXNCO0FBQ2YsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixHQUFrQixFQUNsQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsTUFBTSxvQkFBb0IsR0FBeUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBQyxDQUFBO0lBQ3BGLE1BQU0sY0FBYyxHQUEwQixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsT0FBTyxDQUFDLENBQUE7SUFFaEYsTUFBTSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsR0FBRyxNQUFNLG9CQUFvQixDQUFDLG9CQUFvQixDQUN2RSxFQUFFLEVBQ0Y7UUFDRSxTQUFTLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztLQUNsQyxDQUNGLENBQUE7SUFFRCxvQ0FBb0M7SUFDcEMsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQ3hDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQzdCLElBQUksUUFBUSxHQUFpQixFQUFFLENBQUE7UUFFL0IsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN6RSxNQUFNLGFBQWEsR0FBaUIsTUFBTSxjQUFjLENBQUMsWUFBWSxDQUFDO2dCQUNwRSxFQUFFLEVBQUUsT0FBTyxDQUFDLFdBQXVCO2FBQ3BDLENBQUMsQ0FBQTtZQUNGLFFBQVEsR0FBRyxhQUFhLENBQUE7UUFDMUIsQ0FBQztRQUVELE9BQU87WUFDTCxHQUFHLE9BQU87WUFDVixRQUFRO1NBQ1QsQ0FBQTtJQUNILENBQUMsQ0FBQyxDQUNILENBQUE7SUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsUUFBUSxFQUFFLGdCQUFnQjtRQUMxQixLQUFLO0tBQ04sQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBckNZLFFBQUEsR0FBRyxPQXFDZiJ9