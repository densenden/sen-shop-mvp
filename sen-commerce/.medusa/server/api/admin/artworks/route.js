"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const artwork_module_1 = require("../../../modules/artwork-module");
async function GET(req, res) {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const artworks = await artworkModuleService.listArtworks();
    const collections = await artworkModuleService.listArtworkCollections();
    const collectionsMap = new Map(collections.map(c => [c.id, c]));
    const artworksWithCollections = artworks.map(artwork => ({
        ...artwork,
        artwork_collection: collectionsMap.get(artwork.artwork_collection_id)
    }));
    res.json({ artworks: artworksWithCollections });
}
async function POST(req, res) {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const body = req.body;
    const artwork = await artworkModuleService.createArtworks(body);
    res.json(artwork);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmtzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0Esa0JBYUM7QUFFRCxvQkFLQztBQXRCRCxvRUFBZ0U7QUFFekQsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBQyxDQUFBO0lBQzlELE1BQU0sUUFBUSxHQUFHLE1BQU0sb0JBQW9CLENBQUMsWUFBWSxFQUFFLENBQUE7SUFFMUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxzQkFBc0IsRUFBRSxDQUFBO0lBQ3ZFLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0lBRS9ELE1BQU0sdUJBQXVCLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkQsR0FBRyxPQUFPO1FBQ1Ysa0JBQWtCLEVBQUUsY0FBYyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUM7S0FDdEUsQ0FBQyxDQUFDLENBQUE7SUFFSCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQTtBQUNqRCxDQUFDO0FBRU0sS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBQyxDQUFBO0lBQzlELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFXLENBQUE7SUFDNUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDL0QsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNuQixDQUFDIn0=