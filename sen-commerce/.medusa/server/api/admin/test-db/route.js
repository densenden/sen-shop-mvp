"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const artwork_module_1 = require("../../../modules/artwork-module");
async function GET(req, res) {
    try {
        console.log("Testing database connection...");
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        console.log("Artwork module service resolved:", !!artworkModuleService);
        // Check what methods are available on the service
        const serviceMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(artworkModuleService));
        console.log("Available service methods:", serviceMethods);
        let collections = [];
        let artworks = [];
        let error_info = null;
        // Try to list collections
        try {
            collections = await artworkModuleService.listArtworkCollections({});
            console.log("Collections found:", collections?.length || 0);
        }
        catch (collectionsError) {
            console.error("Collections error:", collectionsError);
            error_info = { collections_error: collectionsError.message };
        }
        // Try to list artworks  
        try {
            artworks = await artworkModuleService.listArtworks({});
            console.log("Artworks found:", artworks?.length || 0);
        }
        catch (artworksError) {
            console.error("Artworks error:", artworksError);
            error_info = { ...error_info, artworks_error: artworksError.message };
        }
        res.json({
            success: true,
            service_methods: serviceMethods,
            collections_count: collections?.length || 0,
            artworks_count: artworks?.length || 0,
            collections: collections || [],
            artworks: artworks || [],
            error_info
        });
    }
    catch (error) {
        console.error("Database test error:", error);
        res.status(500).json({
            error: "Database test failed",
            message: error.message,
            stack: error.stack
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Rlc3QtZGIvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxrQkFrREM7QUFwREQsb0VBQWdFO0FBRXpELEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGdDQUFnQyxDQUFDLENBQUE7UUFFN0MsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFRLENBQUE7UUFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtRQUV2RSxrREFBa0Q7UUFDbEQsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFBO1FBQzlGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEVBQUUsY0FBYyxDQUFDLENBQUE7UUFFekQsSUFBSSxXQUFXLEdBQVUsRUFBRSxDQUFBO1FBQzNCLElBQUksUUFBUSxHQUFVLEVBQUUsQ0FBQTtRQUN4QixJQUFJLFVBQVUsR0FBUSxJQUFJLENBQUE7UUFFMUIsMEJBQTBCO1FBQzFCLElBQUksQ0FBQztZQUNILFdBQVcsR0FBRyxNQUFNLG9CQUFvQixDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ25FLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQTtRQUM3RCxDQUFDO1FBQUMsT0FBTyxnQkFBZ0IsRUFBRSxDQUFDO1lBQzFCLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtZQUNyRCxVQUFVLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUM5RCxDQUFDO1FBRUQseUJBQXlCO1FBQ3pCLElBQUksQ0FBQztZQUNILFFBQVEsR0FBRyxNQUFNLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDdkQsQ0FBQztRQUFDLE9BQU8sYUFBYSxFQUFFLENBQUM7WUFDdkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FBQTtZQUMvQyxVQUFVLEdBQUcsRUFBRSxHQUFHLFVBQVUsRUFBRSxjQUFjLEVBQUUsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3ZFLENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsT0FBTyxFQUFFLElBQUk7WUFDYixlQUFlLEVBQUUsY0FBYztZQUMvQixpQkFBaUIsRUFBRSxXQUFXLEVBQUUsTUFBTSxJQUFJLENBQUM7WUFDM0MsY0FBYyxFQUFFLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQztZQUNyQyxXQUFXLEVBQUUsV0FBVyxJQUFJLEVBQUU7WUFDOUIsUUFBUSxFQUFFLFFBQVEsSUFBSSxFQUFFO1lBQ3hCLFVBQVU7U0FDWCxDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDNUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLHNCQUFzQjtZQUM3QixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87WUFDdEIsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO1NBQ25CLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=