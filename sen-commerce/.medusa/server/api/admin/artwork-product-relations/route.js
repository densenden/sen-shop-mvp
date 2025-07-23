"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.DELETE = DELETE;
// In-memory storage for relations (in production, use database)
let artworkProductRelations = [];
async function GET(req, res) {
    try {
        const { artwork_id, product_id, product_type } = req.query;
        let filteredRelations = artworkProductRelations;
        if (artwork_id) {
            filteredRelations = filteredRelations.filter(r => r.artwork_id === artwork_id);
        }
        if (product_id) {
            filteredRelations = filteredRelations.filter(r => r.product_id === product_id);
        }
        if (product_type) {
            filteredRelations = filteredRelations.filter(r => r.product_type === product_type);
        }
        res.json({ relations: filteredRelations });
    }
    catch (error) {
        console.error("Error fetching artwork-product relations:", error);
        res.status(500).json({ error: "Failed to fetch relations" });
    }
}
async function POST(req, res) {
    try {
        const { artwork_id, product_id, product_type, is_primary = false, position = 0 } = req.body;
        if (!artwork_id || !product_id || !product_type) {
            return res.status(400).json({ error: "artwork_id, product_id, and product_type are required" });
        }
        // Check if relation already exists
        const existingRelation = artworkProductRelations.find(r => r.artwork_id === artwork_id && r.product_id === product_id);
        if (existingRelation) {
            return res.status(400).json({ error: "Relation already exists" });
        }
        // If this is primary, unset other primary relations for the same product
        if (is_primary) {
            artworkProductRelations.forEach(r => {
                if (r.product_id === product_id) {
                    r.is_primary = false;
                }
            });
        }
        const newRelation = {
            id: `rel_${Date.now()}`,
            artwork_id,
            product_id,
            product_type,
            is_primary,
            position,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        artworkProductRelations.push(newRelation);
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
        if (!artwork_id || !product_id) {
            return res.status(400).json({ error: "artwork_id and product_id are required" });
        }
        const initialLength = artworkProductRelations.length;
        artworkProductRelations = artworkProductRelations.filter(r => !(r.artwork_id === artwork_id && r.product_id === product_id));
        if (artworkProductRelations.length === initialLength) {
            return res.status(404).json({ error: "Relation not found" });
        }
        res.json({ deleted: true });
    }
    catch (error) {
        console.error("Error deleting artwork-product relation:", error);
        res.status(500).json({ error: "Failed to delete relation" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2FydHdvcmstcHJvZHVjdC1yZWxhdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFnQkEsa0JBcUJDO0FBRUQsb0JBNENDO0FBRUQsd0JBc0JDO0FBOUZELGdFQUFnRTtBQUNoRSxJQUFJLHVCQUF1QixHQUE2QixFQUFFLENBQUE7QUFFbkQsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUE7UUFFMUQsSUFBSSxpQkFBaUIsR0FBRyx1QkFBdUIsQ0FBQTtRQUUvQyxJQUFJLFVBQVUsRUFBRSxDQUFDO1lBQ2YsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUMsQ0FBQTtRQUNoRixDQUFDO1FBQ0QsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNmLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDLENBQUE7UUFDaEYsQ0FBQztRQUNELElBQUksWUFBWSxFQUFFLENBQUM7WUFDakIsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsQ0FBQTtRQUNwRixDQUFDO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUE7SUFDNUMsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENB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