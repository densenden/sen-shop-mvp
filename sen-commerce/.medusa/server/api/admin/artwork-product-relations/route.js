"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
exports.POST = POST;
exports.DELETE = DELETE;
const medusa_1 = require("@medusajs/medusa");
async function GET(req, res) {
    try {
        const { artwork_id, product_id, product_type } = req.query;
        const artworkModuleService = req.scope.resolve("artworkModuleService");
        // Build filters
        const filters = {};
        if (artwork_id)
            filters.artwork_id = artwork_id;
        if (product_id)
            filters.product_id = product_id;
        if (product_type)
            filters.product_type = product_type;
        const relations = await artworkModuleService.listArtworkProductRelations({
            filters
        });
        res.json({ relations });
    }
    catch (error) {
        console.error("Error fetching artwork-product relations:", error);
        res.status(500).json({ error: "Failed to fetch relations" });
    }
}
async function POST(req, res) {
    try {
        const { artwork_id, product_id, product_type, is_primary = false, position = 0 } = req.body;
        const artworkModuleService = req.scope.resolve("artworkModuleService");
        if (!artwork_id || !product_id || !product_type) {
            return res.status(400).json({ error: "artwork_id, product_id, and product_type are required" });
        }
        // Check if relation already exists
        const existingRelations = await artworkModuleService.listArtworkProductRelations({
            filters: { artwork_id, product_id }
        });
        if (existingRelations.length > 0) {
            return res.status(400).json({ error: "Relation already exists" });
        }
        // If this is primary, unset other primary relations for the same product
        if (is_primary) {
            const productRelations = await artworkModuleService.listArtworkProductRelations({
                filters: { product_id }
            });
            for (const relation of productRelations) {
                if (relation.is_primary) {
                    await artworkModuleService.updateArtworkProductRelations({
                        id: relation.id,
                        is_primary: false
                    });
                }
            }
        }
        const newRelation = await artworkModuleService.createArtworkProductRelations({
            artwork_id,
            product_id,
            product_type,
            is_primary,
            position
        });
        res.json({ relation: newRelation });
    }
    catch (error) {
        console.error("Error creating artwork-product relation:", error);
        res.status(500).json({ error: "Failed to create relation" });
    }
}
async function DELETE(req, res) {
    try {
        const { artwork_id, product_id } = req.query;
        const artworkModuleService = req.scope.resolve("artworkModuleService");
        if (!artwork_id || !product_id) {
            return res.status(400).json({ error: "artwork_id and product_id are required" });
        }
        // Find the relation to delete
        const relations = await artworkModuleService.listArtworkProductRelations({
            filters: { artwork_id, product_id }
        });
        if (relations.length === 0) {
            return res.status(404).json({ error: "Relation not found" });
        }
        // Delete the relation
        await artworkModuleService.deleteArtworkProductRelations(relations[0].id);
        res.json({ deleted: true });
    }
    catch (error) {
        console.error("Error deleting artwork-product relation:", error);
        res.status(500).json({ error: "Failed to delete relation" });
    }
}
exports.middlewares = [
    (0, medusa_1.authenticate)("admin", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmstcHJvZHVjdC1yZWxhdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBY0Esa0JBb0JDO0FBRUQsb0JBK0NDO0FBRUQsd0JBMEJDO0FBOUdELDZDQUErQztBQWF4QyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQTtRQUMxRCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUE7UUFFdEUsZ0JBQWdCO1FBQ2hCLE1BQU0sT0FBTyxHQUFRLEVBQUUsQ0FBQTtRQUN2QixJQUFJLFVBQVU7WUFBRSxPQUFPLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtRQUMvQyxJQUFJLFVBQVU7WUFBRSxPQUFPLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtRQUMvQyxJQUFJLFlBQVk7WUFBRSxPQUFPLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQTtRQUVyRCxNQUFNLFNBQVMsR0FBRyxNQUFNLG9CQUFvQixDQUFDLDJCQUEyQixDQUFDO1lBQ3ZFLE9BQU87U0FDUixDQUFDLENBQUE7UUFFRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQTtJQUN6QixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkNBQTJDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDakUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsMkJBQTJCLEVBQUUsQ0FBQyxDQUFBO0lB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