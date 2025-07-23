"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
const artwork_module_1 = require("../../../../modules/artwork-module");
// GET /admin/artworks/:id
async function GET(req, res) {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const { id } = req.params;
    try {
        // Use retrieveArtwork instead of listArtworks with filters
        const artwork = await artworkModuleService.retrieveArtwork(id);
        if (!artwork) {
            return res.status(404).json({ error: "Artwork not found" });
        }
        // Ensure product_ids is always an array
        const artworkData = {
            ...artwork,
            product_ids: artwork.product_ids || []
        };
        res.json({ artwork: artworkData });
    }
    catch (error) {
        console.error("Error fetching artwork:", error);
        res.status(500).json({ error: error.message });
    }
}
// PUT /admin/artworks/:id
async function PUT(req, res) {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const { id } = req.params;
    const body = req.body;
    try {
        // Handle empty artwork_collection_id
        if (body.artwork_collection_id === "" || body.artwork_collection_id === null) {
            body.artwork_collection_id = undefined;
        }
        // Ensure product_ids is properly formatted for storage
        const updateData = {
            ...body,
            product_ids: body.product_ids || []
        };
        console.log("Updating artwork with data:", updateData);
        const updated = await artworkModuleService.updateArtworks({ id, ...updateData });
        res.json(updated);
    }
    catch (error) {
        console.error("Error updating artwork:", error);
        res.status(500).json({ error: error.message });
    }
}
// DELETE /admin/artworks/:id
async function DELETE(req, res) {
    const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
    const { id } = req.params;
    try {
        await artworkModuleService.deleteArtworks(id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmtzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSxrQkF1QkM7QUFHRCxrQkF3QkM7QUFHRCx3QkFVQztBQXBFRCx1RUFBbUU7QUFJbkUsMEJBQTBCO0FBQ25CLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLCtCQUFjLENBQVEsQ0FBQTtJQUNyRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtJQUV6QixJQUFJLENBQUM7UUFDSCwyREFBMkQ7UUFDM0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFOUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUE7UUFDN0QsQ0FBQztRQUVELHdDQUF3QztRQUN4QyxNQUFNLFdBQVcsR0FBRztZQUNsQixHQUFHLE9BQU87WUFDVixXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVcsSUFBSSxFQUFFO1NBQ3ZDLENBQUE7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ2hELENBQUM7QUFDSCxDQUFDO0FBRUQsMEJBQTBCO0FBQ25CLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLCtCQUFjLENBQVEsQ0FBQTtJQUNyRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtJQUN6QixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO0lBRTVCLElBQUksQ0FBQztRQUNILHFDQUFxQztRQUNyQyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLHFCQUFxQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQzdFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUE7UUFDeEMsQ0FBQztRQUVELHVEQUF1RDtRQUN2RCxNQUFNLFVBQVUsR0FBRztZQUNqQixHQUFHLElBQUk7WUFDUCxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFO1NBQ3BDLENBQUE7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLFVBQVUsQ0FBQyxDQUFBO1FBQ3RELE1BQU0sT0FBTyxHQUFHLE1BQU0sb0JBQW9CLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsVUFBVSxFQUFFLENBQUMsQ0FBQTtRQUNoRixHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0lBQ25CLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUMvQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUNoRCxDQUFDO0FBQ0gsQ0FBQztBQUVELDZCQUE2QjtBQUN0QixLQUFLLFVBQVUsTUFBTSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDbEUsTUFBTSxvQkFBb0IsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFRLENBQUE7SUFDckUsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7SUFFekIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxvQkFBb0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDN0MsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7SUFDaEQsQ0FBQztBQUNILENBQUMifQ==