"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const artwork_module_1 = require("../../../../../modules/artwork-module");
// POST /admin/printful-products/:id/link-artwork
// Links a Printful product to an artwork by updating the artwork's product_ids field
async function POST(req, res) {
    try {
        const body = req.body;
        const artwork_id = body.artwork_id;
        const { id: printfulProductId } = req.params;
        if (!printfulProductId || !artwork_id) {
            return res.status(400).json({ error: "Missing id or artwork_id" });
        }
        // Resolve the artwork service
        const artworkService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        // Fetch the artwork
        const artwork = await artworkService.retrieveArtwork(artwork_id);
        if (!artwork) {
            return res.status(404).json({ error: "Artwork not found" });
        }
        // Ensure printfulProductId is a string
        const printfulProductIdStr = Array.isArray(printfulProductId) ? printfulProductId[0] : printfulProductId;
        // Add the Printful product ID to the artwork's product_ids array (avoid duplicates)
        const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : [];
        if (!productIds.includes(printfulProductIdStr)) {
            productIds.push(printfulProductIdStr);
        }
        console.log("Updating artwork with product_ids:", productIds);
        // Use the same update pattern as the working artwork PUT route
        const updateData = { product_ids: productIds };
        const updated = await artworkService.updateArtworks({ id: artwork_id, ...updateData });
        console.log("Update result:", updated);
        res.json({ success: true, updated });
    }
    catch (error) {
        console.error("Error linking artwork:", error);
        res.status(500).json({ error: error.message || "Failed to link artwork" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXByb2R1Y3RzL1tpZF0vbGluay1hcnR3b3JrL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBTUEsb0JBeUNDO0FBOUNELDBFQUFzRTtBQUd0RSxpREFBaUQ7QUFDakQscUZBQXFGO0FBQzlFLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBVyxDQUFBO1FBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUE7UUFDbEMsTUFBTSxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFFNUMsSUFBSSxDQUFDLGlCQUFpQixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDdEMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSwwQkFBMEIsRUFBRSxDQUFDLENBQUE7UUFDcEUsQ0FBQztRQUVELDhCQUE4QjtRQUM5QixNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFRLENBQUE7UUFFL0Qsb0JBQW9CO1FBQ3BCLE1BQU0sT0FBTyxHQUFHLE1BQU0sY0FBYyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUNoRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtRQUM3RCxDQUFDO1FBRUQsdUNBQXVDO1FBQ3ZDLE1BQU0sb0JBQW9CLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUE7UUFFeEcsb0ZBQW9GO1FBQ3BGLE1BQU0sVUFBVSxHQUFhLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUE7UUFDMUYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDO1lBQy9DLFVBQVUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtRQUN2QyxDQUFDO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsRUFBRSxVQUFVLENBQUMsQ0FBQTtRQUU3RCwrREFBK0Q7UUFDL0QsTUFBTSxVQUFVLEdBQUcsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLENBQUE7UUFDOUMsTUFBTSxPQUFPLEdBQUcsTUFBTyxjQUFzQixDQUFDLGNBQWMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsR0FBRyxVQUFVLEVBQUUsQ0FBQyxDQUFBO1FBRS9GLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFFdEMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtJQUN0QyxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksd0JBQXdCLEVBQUUsQ0FBQyxDQUFBO0lBQzVFLENBQUM7QUFDSCxDQUFDIn0=