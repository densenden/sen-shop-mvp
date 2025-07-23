"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const artwork_module_1 = require("../../../modules/artwork-module");
const GET = async (req, res) => {
    try {
        console.log("Fetching artwork collections for store...");
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        // Get collections from the artwork module service
        const collections = await artworkModuleService.listArtworkCollections({});
        console.log("Collections found:", collections?.length || 0);
        // Get artworks and group them by collection
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
                collectionsWithArtworks = collections.map(collection => ({
                    ...collection,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2FydHdvcmstY29sbGVjdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esb0VBQWdFO0FBRXpELE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNuRSxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUE7UUFDeEQsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFRLENBQUE7UUFFckUsa0RBQWtEO1FBQ2xELE1BQU0sV0FBVyxHQUFHLE1BQU0sb0JBQW9CLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDekUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBRTNELDRDQUE0QztRQUM1QyxJQUFJLHVCQUF1QixHQUFHLFdBQVcsSUFBSSxFQUFFLENBQUE7UUFDL0MsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQTtnQkFFckQsK0JBQStCO2dCQUMvQix1QkFBdUIsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDdkQsR0FBRyxVQUFVO29CQUNiLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLHFCQUFxQixLQUFLLFVBQVUsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO2lCQUM1RixDQUFDLENBQUMsQ0FBQTtZQUNMLENBQUM7WUFBQyxPQUFPLFlBQVksRUFBRSxDQUFDO2dCQUN0QixPQUFPLENBQUMsR0FBRyxDQUFDLG1FQUFtRSxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDdEcsdUJBQXVCLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3ZELEdBQUcsVUFBVTtvQkFDYixRQUFRLEVBQUUsRUFBRTtpQkFDYixDQUFDLENBQUMsQ0FBQTtZQUNMLENBQUM7UUFDSCxDQUFDO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLFdBQVcsRUFBRSx1QkFBdUI7WUFDcEMsS0FBSyxFQUFFLHVCQUF1QixDQUFDLE1BQU07U0FDdEMsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLCtDQUErQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBRXJFLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxXQUFXLEVBQUUsRUFBRTtZQUNmLEtBQUssRUFBRSxDQUFDO1NBQ1QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQTNDWSxRQUFBLEdBQUcsT0EyQ2YifQ==