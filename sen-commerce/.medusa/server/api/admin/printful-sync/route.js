"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const printful_pod_product_service_1 = require("../../../modules/printful/services/printful-pod-product-service");
async function POST(req, res) {
    const { mappings } = req.body;
    if (!Array.isArray(mappings)) {
        res.status(400).json({ error: "Missing or invalid mappings array" });
        return;
    }
    // Instantiate service with Medusa v2 pattern (no repository)
    const service = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
    let success = 0, failed = 0, errors = [];
    for (const { printfulProductId, artworkId } of mappings) {
        try {
            const products = await service.fetchStoreProducts();
            const pfProduct = products.find(p => p.id === printfulProductId);
            if (!pfProduct)
                throw new Error("Product not found in Printful");
            await service.syncPrintfulProduct(pfProduct, artworkId);
            success++;
        }
        catch (e) {
            failed++;
            errors.push({ printfulProductId, error: e.message });
        }
    }
    res.json({ success, failed, errors });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXN5bmMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxvQkF1QkM7QUFqQ0Qsa0hBQTJHO0FBVXBHLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQXVCLENBQUM7SUFDakQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUM3QixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQ0FBbUMsRUFBRSxDQUFDLENBQUM7UUFDckUsT0FBTztJQUNULENBQUM7SUFFRCw2REFBNkQ7SUFDN0QsTUFBTSxPQUFPLEdBQUcsSUFBSSx3REFBeUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDeEQsSUFBSSxPQUFPLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFVLEVBQUUsQ0FBQztJQUNoRCxLQUFLLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsSUFBSSxRQUFRLEVBQUUsQ0FBQztRQUN4RCxJQUFJLENBQUM7WUFDSCxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ3BELE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLGlCQUFpQixDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDLFNBQVM7Z0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sT0FBTyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUN4RCxPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7UUFBQyxPQUFPLENBQU0sRUFBRSxDQUFDO1lBQ2hCLE1BQU0sRUFBRSxDQUFDO1lBQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLGlCQUFpQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUN2RCxDQUFDO0lBQ0gsQ0FBQztJQUNELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDeEMsQ0FBQyJ9