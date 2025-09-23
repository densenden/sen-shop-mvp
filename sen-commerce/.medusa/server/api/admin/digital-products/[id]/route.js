"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = DELETE;
exports.GET = GET;
const digital_product_1 = require("../../../../modules/digital-product");
// DELETE /admin/digital-products/[id] - Delete a digital product
async function DELETE(req, res) {
    try {
        const { id } = req.params;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Delete the digital product and its file
        await digitalProductService.deleteDigitalProductWithFile(id);
        res.json({ success: true, message: "Digital product deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting digital product:", error);
        res.status(500).json({ error: error.message || "Failed to delete digital product" });
    }
}
// GET /admin/digital-products/[id] - Get a specific digital product
async function GET(req, res) {
    try {
        const { id } = req.params;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        const [digitalProduct] = await digitalProductService.listDigitalProducts({
            id
        });
        if (!digitalProduct) {
            return res.status(404).json({ error: "Digital product not found" });
        }
        res.json({ digital_product: digitalProduct });
    }
    catch (error) {
        console.error("Error fetching digital product:", error);
        res.status(500).json({ error: error.message || "Failed to fetch digital product" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2RpZ2l0YWwtcHJvZHVjdHMvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU1BLHdCQWFDO0FBR0Qsa0JBa0JDO0FBdkNELHlFQUE0RTtBQUk1RSxpRUFBaUU7QUFDMUQsS0FBSyxVQUFVLE1BQU0sQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2xFLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO1FBQ3pCLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsd0NBQXNCLENBQUMsQ0FBQTtRQUV2RSwwQ0FBMEM7UUFDMUMsTUFBTSxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUU1RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsc0NBQXNDLEVBQUUsQ0FBQyxDQUFBO0lBQzlFLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLGtDQUFrQyxFQUFFLENBQUMsQ0FBQTtJQUN0RixDQUFDO0FBQ0gsQ0FBQztBQUVELG9FQUFvRTtBQUM3RCxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFDekIsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBRXZFLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxNQUFNLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDO1lBQ3ZFLEVBQUU7U0FDSCxDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSwyQkFBMkIsRUFBRSxDQUFDLENBQUE7UUFDckUsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUMvQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxpQ0FBaUMsRUFBRSxDQUFDLENBQUE7SUFDckYsQ0FBQztBQUNILENBQUMifQ==