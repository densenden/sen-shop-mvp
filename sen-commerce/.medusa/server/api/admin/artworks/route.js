"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const artwork_module_1 = require("../../../modules/artwork-module");
async function GET(req, res) {
    try {
        console.log("Fetching artworks...");
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        console.log("Service resolved:", !!artworkModuleService);
        // Try to get artworks first
        const artworks = await artworkModuleService.listArtworks({});
        console.log("Artworks found:", artworks?.length || 0);
        // Return simple response without collections for now
        res.json({
            artworks: artworks || [],
            count: artworks?.length || 0
        });
    }
    catch (error) {
        console.error("Error fetching artworks:", error);
        res.status(500).json({
            error: "Failed to fetch artworks",
            message: error.message
        });
    }
}
async function POST(req, res) {
    try {
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const body = req.body;
        // Handle empty artwork_collection_id
        if (body.artwork_collection_id === "" || body.artwork_collection_id === null) {
            body.artwork_collection_id = undefined;
        }
        console.log("Creating artwork with data:", body);
        const artwork = await artworkModuleService.createArtworks(body);
        res.json(artwork);
    }
    catch (error) {
        console.error("Error creating artwork:", error);
        res.status(500).json({
            error: "Failed to create artwork",
            message: error.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmtzL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0Esa0JBc0JDO0FBRUQsb0JBb0JDO0FBOUNELG9FQUFnRTtBQUV6RCxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO1FBQ25DLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBUSxDQUFBO1FBQ3JFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUE7UUFFeEQsNEJBQTRCO1FBQzVCLE1BQU0sUUFBUSxHQUFHLE1BQU0sb0JBQW9CLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzVELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQTtRQUVyRCxxREFBcUQ7UUFDckQsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLFFBQVEsRUFBRSxRQUFRLElBQUksRUFBRTtZQUN4QixLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDO1NBQzdCLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNoRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsMEJBQTBCO1lBQ2pDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQztBQUVNLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLCtCQUFjLENBQVEsQ0FBQTtRQUNyRSxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO1FBRTVCLHFDQUFxQztRQUNyQyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLHFCQUFxQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQzdFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUE7UUFDeEMsQ0FBQztRQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDaEQsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDL0QsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNuQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDL0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLDBCQUEwQjtZQUNqQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==