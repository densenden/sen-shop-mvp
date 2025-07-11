"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUT = PUT;
const printful_pod_product_service_1 = require("../../../../modules/printful/services/printful-pod-product-service");
// Handle updating a single Printful product
async function PUT(req, res) {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!id || !name) {
            return res.status(400).json({ error: "Missing id or name" });
        }
        // Use the service to update the product
        const service = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
        const updated = await service.updatePrintfulProducts({ id, name, description });
        if (!updated) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json({ product: updated });
    }
    catch (error) {
        console.error("Error updating Printful product:", error);
        res.status(500).json({ error: error.message || "Failed to update Printful product" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXByb2R1Y3RzL1tpZF0vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFTQSxrQkFrQkM7QUEzQkQscUhBQThHO0FBUTlHLDRDQUE0QztBQUNyQyxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFDekIsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBeUIsQ0FBQTtRQUMzRCxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDakIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxDQUFDLENBQUE7UUFDOUQsQ0FBQztRQUNELHdDQUF3QztRQUN4QyxNQUFNLE9BQU8sR0FBRyxJQUFJLHdEQUF5QixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN4RCxNQUFNLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQTtRQUMvRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtRQUM3RCxDQUFDO1FBQ0QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ2hDLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDeEQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxtQ0FBbUMsRUFBRSxDQUFDLENBQUE7SUFDdkYsQ0FBQztBQUNILENBQUMifQ==