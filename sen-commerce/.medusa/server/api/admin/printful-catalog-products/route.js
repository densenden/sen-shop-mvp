"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const printful_pod_product_service_1 = require("../../../modules/printful/services/printful-pod-product-service");
const artwork_module_1 = require("../../../modules/artwork-module");
async function GET(req, res) {
    // Removed admin check: now any user (even not logged in) can access this endpoint
    try {
        const service = new printful_pod_product_service_1.PrintfulPodProductService(req.scope);
        const products = await service.fetchCatalogProducts();
        const { id } = req.query;
        // --- Join artwork info for each product ---
        // Get all artworks (for mapping product_ids)
        const artworkService = req.scope.resolve(artwork_module_1.ARTWORK_MODULE);
        const artworks = await artworkService.listArtworks();
        // Build a map: productId -> artwork
        const productIdToArtwork = new Map();
        for (const artwork of artworks) {
            if (Array.isArray(artwork.product_ids)) {
                for (const pid of artwork.product_ids) {
                    productIdToArtwork.set(pid, artwork);
                }
            }
        }
        // Add artwork info to each product
        const productsWithArtwork = products.map((p) => {
            const linkedArtwork = productIdToArtwork.get(String(p.id));
            return {
                ...p,
                artwork_id: linkedArtwork ? linkedArtwork.id : undefined,
                artwork_title: linkedArtwork ? linkedArtwork.title : undefined,
            };
        });
        if (id) {
            // Find the product with the matching id (as string)
            const product = productsWithArtwork.find((p) => String(p.id) === String(id));
            if (product) {
                res.json({ product });
            }
            else {
                res.status(404).json({ error: "Product not found" });
            }
        }
        else {
            res.json({ products: productsWithArtwork });
        }
    }
    catch (error) {
        console.error("Error fetching Printful products:", error);
        res.status(500).json({ error: error.message || "Failed to fetch Printful products" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3ByaW50ZnVsLWNhdGFsb2ctcHJvZHVjdHMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSxrQkE2Q0M7QUFqREQsa0hBQTJHO0FBRTNHLG9FQUFnRTtBQUV6RCxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0Qsa0ZBQWtGO0lBQ2xGLElBQUksQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLElBQUksd0RBQXlCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ3hELE1BQU0sUUFBUSxHQUFHLE1BQU0sT0FBTyxDQUFDLG9CQUFvQixFQUFFLENBQUE7UUFDckQsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUE7UUFFeEIsNkNBQTZDO1FBQzdDLDZDQUE2QztRQUM3QyxNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQywrQkFBYyxDQUFDLENBQUE7UUFDeEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQUMsWUFBWSxFQUFFLENBQUE7UUFDcEQsb0NBQW9DO1FBQ3BDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUNwQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQy9CLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztnQkFDdkMsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3RDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUE7Z0JBQ3RDLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUNELG1DQUFtQztRQUNuQyxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRTtZQUNsRCxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzFELE9BQU87Z0JBQ0wsR0FBRyxDQUFDO2dCQUNKLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7Z0JBQ3hELGFBQWEsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDL0QsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUNQLG9EQUFvRDtZQUNwRCxNQUFNLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7WUFDakYsSUFBSSxPQUFPLEVBQUUsQ0FBQztnQkFDWixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQTtZQUN2QixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO1lBQ3RELENBQUM7UUFDSCxDQUFDO2FBQU0sQ0FBQztZQUNOLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO1FBQzdDLENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3pELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksbUNBQW1DLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZGLENBQUM7QUFDSCxDQUFDIn0=