"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const artwork_module_1 = require("../../../modules/artwork-module");
const GET = async (req, res) => {
    try {
        const { artwork_id } = req.query;
        console.log("Debug: Requested artwork_id:", artwork_id);
        const artworkModuleService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        if (!artworkModuleService) {
            return res.status(500).json({
                error: "Artwork module service not available"
            });
        }
        // Try different ways to find the artwork
        console.log("Debug: Trying listAndCountArtworks with id filter...");
        try {
            const [artworks1] = await artworkModuleService.listAndCountArtworks({ id: artwork_id });
            console.log("Debug: artworks1 length:", artworks1?.length);
            if (artworks1?.length > 0) {
                console.log("Debug: Found artwork1:", artworks1[0].id, artworks1[0].title);
            }
        }
        catch (error) {
            console.log("Debug: listAndCountArtworks with id failed:", error.message);
        }
        console.log("Debug: Trying listAndCountArtworks without filter...");
        try {
            const [allArtworks] = await artworkModuleService.listAndCountArtworks({});
            console.log("Debug: All artworks count:", allArtworks?.length);
            if (allArtworks?.length > 0) {
                console.log("Debug: First artwork:", allArtworks[0].id, allArtworks[0].title);
                const foundArtwork = allArtworks.find(a => a.id === artwork_id);
                if (foundArtwork) {
                    console.log("Debug: Found matching artwork:", foundArtwork.id, foundArtwork.title);
                }
                else {
                    console.log("Debug: No matching artwork found with ID:", artwork_id);
                }
            }
        }
        catch (error) {
            console.log("Debug: listAndCountArtworks without filter failed:", error.message);
        }
        console.log("Debug: Trying listArtworks...");
        try {
            const artworks3 = await artworkModuleService.listArtworks({});
            console.log("Debug: listArtworks count:", artworks3?.length);
            if (artworks3?.length > 0) {
                console.log("Debug: First listArtworks result:", artworks3[0].id, artworks3[0].title);
            }
        }
        catch (error) {
            console.log("Debug: listArtworks failed:", error.message);
        }
        res.json({
            success: true,
            requested_id: artwork_id,
            message: "Check server logs for debug info"
        });
    }
    catch (error) {
        console.error("Debug artwork error:", error);
        res.status(500).json({
            error: "Debug failed",
            message: error.message
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2RlYnVnLWFydHdvcmsvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esb0VBQWdFO0FBRXpELE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNuRSxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQTtRQUVoQyxPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFLFVBQVUsQ0FBQyxDQUFBO1FBRXZELE1BQU0sb0JBQW9CLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsK0JBQWMsQ0FBUSxDQUFBO1FBRXJFLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzFCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLEtBQUssRUFBRSxzQ0FBc0M7YUFDOUMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELHlDQUF5QztRQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLHNEQUFzRCxDQUFDLENBQUE7UUFDbkUsSUFBSSxDQUFDO1lBQ0gsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE1BQU0sb0JBQW9CLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQTtZQUN2RixPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUMxRCxJQUFJLFNBQVMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQyxD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