"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.PUT = exports.GET = void 0;
const digital_product_1 = require("../../../../modules/digital-product");
// GET /admin/digital-products/:id - Get a single digital product
const GET = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Requested digital product id:", id);
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        const [digitalProduct] = await digitalProductService.listDigitalProducts({ id });
        console.log("Result from listDigitalProducts:", digitalProduct);
        if (!digitalProduct) {
            return res.status(404).json({ error: "Digital product not found" });
        }
        res.json({ digital_product: digitalProduct });
    }
    catch (error) {
        console.error("Error fetching digital product:", error);
        res.status(500).json({
            error: error.message || "Failed to fetch digital product"
        });
    }
};
exports.GET = GET;
// PUT /admin/digital-products/:id - Update a digital product
const PUT = async (req, res) => {
    try {
        const { id } = req.params;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Update the digital product  
        const updateData = { ...req.body };
        await digitalProductService.updateDigitalProducts({
            id,
            ...updateData
        });
        // Fetch and return updated product
        const [updatedProduct] = await digitalProductService.listDigitalProducts({
            filters: { id }
        });
        res.json({ digital_product: updatedProduct });
    }
    catch (error) {
        console.error("Error updating digital product:", error);
        res.status(500).json({
            error: error.message || "Failed to update digital product"
        });
    }
};
exports.PUT = PUT;
// DELETE /admin/digital-products/:id - Delete a digital product
const DELETE = async (req, res) => {
    try {
        const { id } = req.params;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Use the service method that also deletes the file
        await digitalProductService.deleteDigitalProductWithFile(id);
        res.json({
            message: "Digital product deleted successfully",
            id
        });
    }
    catch (error) {
        console.error("Error deleting digital product:", error);
        res.status(500).json({
            error: error.message || "Failed to delete digital product"
        });
    }
};
exports.DELETE = DELETE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2RpZ2l0YWwtcHJvZHVjdHMvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx5RUFBNEU7QUFHNUUsaUVBQWlFO0FBQzFELE1BQU0sR0FBRyxHQUFHLEtBQUssRUFDdEIsR0FBa0IsRUFDbEIsR0FBbUIsRUFDbkIsRUFBRTtJQUNGLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFBO1FBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDaEQsTUFBTSxxQkFBcUIsR0FDekIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsd0NBQXNCLENBQUMsQ0FBQTtRQUUzQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDaEYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsRUFBRSxjQUFjLENBQUMsQ0FBQTtRQUUvRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDcEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSwyQkFBMkIsRUFBRSxDQUFDLENBQUE7UUFDckUsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtJQUMvQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDdkQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksaUNBQWlDO1NBQzFELENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDLENBQUE7QUF4QlksUUFBQSxHQUFHLE9Bd0JmO0FBRUQsNkRBQTZEO0FBQ3RELE1BQU0sR0FBRyxHQUFHLEtBQUssRUFDdEIsR0FLRSxFQUNGLEdBQW1CLEVBQ25CLEVBQUU7SUFDRixJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUN6QixNQUFNLHFCQUFxQixHQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBRTNDLCtCQUErQjtRQUMvQixNQUFNLFVBQVUsR0FBUSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ3ZDLE1BQU0scUJBQXFCLENBQUMscUJBQXFCLENBQUM7WUFDaEQsRUFBRTtZQUNGLEdBQUcsVUFBVTtTQUNkLENBQUMsQ0FBQTtRQUVGLG1DQUFtQztRQUNuQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQztZQUN2RSxPQUFPLEVBQUUsRUFBRSxFQUFFLEVBQUU7U0FDaEIsQ0FBQyxDQUFBO1FBRUYsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLGVBQWUsRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFBO0lBQy9DLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN2RCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxrQ0FBa0M7U0FDM0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQWpDWSxRQUFBLEdBQUcsT0FpQ2Y7QUFFRCxnRUFBZ0U7QUFDekQsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUN6QixHQUFrQixFQUNsQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFDekIsTUFBTSxxQkFBcUIsR0FDekIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsd0NBQXNCLENBQUMsQ0FBQTtRQUUzQyxvREFBb0Q7UUFDcEQsTUFBTSxxQkFBcUIsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUU1RCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsT0FBTyxFQUFFLHNDQUFzQztZQUMvQyxFQUFFO1NBQ0gsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3ZELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLGtDQUFrQztTQUMzRCxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBdEJZLFFBQUEsTUFBTSxVQXNCbEIifQ==