"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const printful_pod_product_service_1 = require("../../../modules/printful/services/printful-pod-product-service");
async function POST(req, res) {
    try {
        const { mappings, productId } = req.body;
        // Support both single product sync and batch sync
        if (productId) {
            // Single product sync from admin UI
            const service = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
            const products = await service.fetchStoreProducts();
            const pfProduct = products.find(p => p.id == productId);
            if (!pfProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found in Printful"
                });
            }
            // Use a default artwork ID for now - in real implementation this would be selected by user
            await service.syncPrintfulProduct(pfProduct, "default_artwork");
            return res.json({
                success: true,
                message: `Product "${pfProduct.name || pfProduct.id}" synced successfully`,
                product: {
                    id: productId,
                    name: pfProduct.name,
                    synced_at: new Date().toISOString(),
                    status: "synced"
                }
            });
        }
        // Batch sync (original functionality)
        if (!Array.isArray(mappings)) {
            return res.status(400).json({ error: "Missing or invalid mappings array or productId" });
        }
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
        return res.json({ success, failed, errors });
    }
    catch (error) {
        console.error("Sync error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to sync product"
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLXN5bmMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxvQkE0REM7QUF0RUQsa0hBQTJHO0FBVXBHLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFekMsa0RBQWtEO1FBQ2xELElBQUksU0FBUyxFQUFFLENBQUM7WUFDZCxvQ0FBb0M7WUFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSx3REFBeUIsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekQsTUFBTSxRQUFRLEdBQUcsTUFBTSxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUNwRCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUMsQ0FBQztZQUV4RCxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDMUIsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsT0FBTyxFQUFFLCtCQUErQjtpQkFDekMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUVELDJGQUEyRjtZQUMzRixNQUFNLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztZQUVoRSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7Z0JBQ2QsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsT0FBTyxFQUFFLFlBQVksU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsRUFBRSx1QkFBdUI7Z0JBQzFFLE9BQU8sRUFBRTtvQkFDUCxFQUFFLEVBQUUsU0FBUztvQkFDYixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7b0JBQ3BCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtvQkFDbkMsTUFBTSxFQUFFLFFBQVE7aUJBQ2pCO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELHNDQUFzQztRQUN0QyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQzdCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsZ0RBQWdELEVBQUUsQ0FBQyxDQUFDO1FBQzNGLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLHdEQUF5QixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN4RCxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQVUsRUFBRSxDQUFDO1FBQ2hELEtBQUssTUFBTSxFQUFFLGlCQUFpQixFQUFFLFNBQVMsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ3hELElBQUksQ0FBQztnQkFDSCxNQUFNLFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO2dCQUNwRCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNqRSxJQUFJLENBQUMsU0FBUztvQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7Z0JBQ2pFLE1BQU0sT0FBTyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDeEQsT0FBTyxFQUFFLENBQUM7WUFDWixDQUFDO1lBQUMsT0FBTyxDQUFNLEVBQUUsQ0FBQztnQkFDaEIsTUFBTSxFQUFFLENBQUM7Z0JBQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLGlCQUFpQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN2RCxDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNwQyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksd0JBQXdCO1NBQ25ELENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDIn0=