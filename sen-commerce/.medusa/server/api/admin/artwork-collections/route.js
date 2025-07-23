"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const artwork_module_1 = require("../../../modules/artwork-module");
console.log("[Medusa] Loaded /admin/artwork-collections route.ts");
async function GET(req, res) {
    try {
        console.log("Fetching artwork collections...");
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        console.log("Service resolved:", !!artworkModuleService);
        // Try to list collections without relations first
        const collections = await artworkModuleService.listArtworkCollections({});
        console.log("Collections found:", collections?.length || 0);
        // If successful, try to get artworks for each collection
        let collectionsWithArtworks = collections || [];
        if (collections && collections.length > 0) {
            try {
                const artworks = await artworkModuleService.listArtworks({});
                console.log("Artworks found:", artworks?.length || 0);
                // Group artworks by collection
                collectionsWithArtworks = collections.map(collection => ({
                    ...collection,
                    artworks: artworks.filter(artwork => artwork.artwork_collection_id === collection.id) || []
                }));
            }
            catch (artworkError) {
                console.log("Could not fetch artworks, returning collections without artworks:", artworkError.message);
            }
        }
        res.json(collectionsWithArtworks);
    }
    catch (error) {
        console.error("Error fetching artwork collections:", error);
        res.status(500).json({
            error: "Failed to fetch artwork collections",
            message: error.message
        });
    }
}
async function POST(req, res) {
    try {
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const body = req.body;
        console.log('[artwork-collections] POST body:', body);
        const artworkCollection = await artworkModuleService.createArtworkCollections(body);
        console.log('[artwork-collections] Created:', artworkCollection);
        res.json(artworkCollection);
    }
    catch (error) {
        console.error('[artwork-collections] Error:', error);
        res.status(500).json({
            error: 'Failed to create artwork collection',
            message: error.message || 'An unknown error occurred.'
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmstY29sbGVjdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFLQSxrQkFtQ0M7QUFFRCxvQkFnQkM7QUF6REQsb0VBQWdFO0FBRWhFLE9BQU8sQ0FBQyxHQUFHLENBQUMscURBQXFELENBQUMsQ0FBQztBQUU1RCxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFBO1FBQzlDLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBUSxDQUFBO1FBQ3JFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFFeEQsa0RBQWtEO1FBQ2xELE1BQU0sV0FBVyxHQUFHLE1BQU0sb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBRTNELHlEQUF5RDtRQUN6RCxJQUFJLHVCQUF1QixHQUFHLFdBQVcsSUFBSSxFQUFFLENBQUE7UUFDL0MsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQTtnQkFFckQsK0JBQStCO2dCQUMvQix1QkFBdUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdkQsR0FBRyxVQUFVO29CQUNiLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLHFCQUFxQixLQUFLLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO2lCQUM1RixDQUFDLENBQUMsQ0FBQTtZQUNMLENBQUM7WUFBQyxPQUFPLFlBQVksRUFBRSxDQUFDO2dCQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLG1FQUFtRSxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN4RyxDQUFDO1FBQ0gsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtJQUNuQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDM0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLHFDQUFxQztZQUM1QyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUM7QUFFTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFRLENBQUE7UUFDckUsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRXJELE1BQU0saUJBQWlCLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNuRixPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxFQUFFLGlCQUFpQixDQUFDLENBQUE7UUFDaEUsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNwRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUscUNBQXFDO1lBQzVDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLDRCQUE0QjtTQUN2RCxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyJ9