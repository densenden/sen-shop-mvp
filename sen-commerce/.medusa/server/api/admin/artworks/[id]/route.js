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
// PUT /admin/artworks/:id - Single Source of Truth approach
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
        console.log(`[Artwork PUT] Updating artwork ${id} with product_ids:`, updateData.product_ids);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmtzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSxrQkF1QkM7QUFHRCxrQkF5QkM7QUFHRCx3QkFVQztBQXJFRCx1RUFBbUU7QUFJbkUsMEJBQTBCO0FBQ25CLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLCtCQUFjLENBQVEsQ0FBQTtJQUNyRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtJQUV6QixJQUFJLENBQUM7UUFDSCwyREFBMkQ7UUFDM0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFOUQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ2IsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUE7UUFDN0QsQ0FBQztRQUVELHdDQUF3QztRQUN4QyxNQUFNLFdBQVcsR0FBRztZQUNsQixHQUFHLE9BQU87WUFDVixXQUFXLEVBQUUsT0FBTyxDQUFDLFdBQVcsSUFBSSxFQUFFO1NBQ3ZDLENBQUE7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ2hELENBQUM7QUFDSCxDQUFDO0FBRUQsNERBQTREO0FBQ3JELEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLCtCQUFjLENBQVEsQ0FBQTtJQUNyRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtJQUN6QixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO0lBRTVCLElBQUksQ0FBQztRQUNILHFDQUFxQztRQUNyQyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsS0FBSyxFQUFFLElBQUksSUFBSSxDQUFDLHFCQUFxQixLQUFLLElBQUksRUFBRSxDQUFDO1lBQzdFLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxTQUFTLENBQUE7UUFDeEMsQ0FBQztRQUVELHVEQUF1RDtRQUN2RCxNQUFNLFVBQVUsR0FBRztZQUNqQixHQUFHLElBQUk7WUFDUCxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFO1NBQ3BDLENBQUE7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxFQUFFLG9CQUFvQixFQUFFLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQTtRQUM3RixNQUFNLE9BQU8sR0FBRyxNQUFNLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLFVBQVUsRUFBRSxDQUFDLENBQUE7UUFFaEYsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUNuQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDL0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUE7SUFDaEQsQ0FBQztBQUNILENBQUM7QUFFRCw2QkFBNkI7QUFDdEIsS0FBSyxVQUFVLE1BQU0sQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2xFLE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBUSxDQUFBO0lBQ3JFLE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO0lBRXpCLElBQUksQ0FBQztRQUNILE1BQU0sb0JBQW9CLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQzdDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ2hELENBQUM7QUFDSCxDQUFDIn0=