"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELETE = exports.POST = exports.GET = void 0;
const digital_product_1 = require("../../../../../modules/digital-product");
// Simple in-memory storage for now (replace with database later)
const productDigitalProductLinks = {};
// GET /admin/products/:id/digital-products - Get linked digital products
const GET = async (req, res) => {
    try {
        const { id } = req.params;
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Get linked IDs from our storage
        const linkedIds = productDigitalProductLinks[id] || [];
        // Fetch the actual digital products
        let digitalProducts = [];
        if (linkedIds.length > 0) {
            digitalProducts = await digitalProductService.listDigitalProducts({
                id: linkedIds
            });
        }
        res.json({
            product_id: id,
            digital_products: digitalProducts
        });
    }
    catch (error) {
        console.error("Error fetching product digital products:", error);
        res.status(500).json({
            error: error.message || "Failed to fetch digital products"
        });
    }
};
exports.GET = GET;
// POST /admin/products/:id/digital-products - Link a digital product
const POST = async (req, res) => {
    try {
        const { id: productId } = req.params;
        const { digital_product_id } = req.body;
        if (!digital_product_id) {
            return res.status(400).json({ error: "digital_product_id is required" });
        }
        const digitalProductService = req.scope.resolve(digital_product_1.DIGITAL_PRODUCT_MODULE);
        // Verify digital product exists
        const [digitalProduct] = await digitalProductService.listDigitalProducts({
            id: digital_product_id
        });
        if (!digitalProduct) {
            return res.status(404).json({ error: "Digital product not found" });
        }
        // Initialize array if needed
        if (!productDigitalProductLinks[productId]) {
            productDigitalProductLinks[productId] = [];
        }
        // Add the link if not already present
        if (!productDigitalProductLinks[productId].includes(digital_product_id)) {
            productDigitalProductLinks[productId].push(digital_product_id);
        }
        res.json({
            message: "Digital product linked successfully",
            product_id: productId,
            digital_product_id: digital_product_id,
            total_linked: productDigitalProductLinks[productId].length
        });
    }
    catch (error) {
        console.error("Error linking digital product:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            error: error.message || "Failed to link digital product"
        });
    }
};
exports.POST = POST;
// DELETE /admin/products/:id/digital-products/:digitalProductId - Remove link
const DELETE = async (req, res) => {
    try {
        const { id: productId, digitalProductId } = req.params;
        // Remove from our storage
        if (productDigitalProductLinks[productId]) {
            productDigitalProductLinks[productId] = productDigitalProductLinks[productId].filter(id => id !== digitalProductId);
        }
        res.json({
            message: "Digital product unlinked successfully",
            product_id: productId,
            digital_product_id: digitalProductId
        });
    }
    catch (error) {
        console.error("Error unlinking digital product:", error);
        res.status(500).json({
            error: error.message || "Failed to unlink digital product"
        });
    }
};
exports.DELETE = DELETE;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb2R1Y3RzL1tpZF0vZGlnaXRhbC1wcm9kdWN0cy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSw0RUFBK0U7QUFHL0UsaUVBQWlFO0FBQ2pFLE1BQU0sMEJBQTBCLEdBQTZCLEVBQUUsQ0FBQTtBQUUvRCx5RUFBeUU7QUFDbEUsTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixHQUFrQixFQUNsQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFDekIsTUFBTSxxQkFBcUIsR0FDekIsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsd0NBQXNCLENBQUMsQ0FBQTtRQUUzQyxrQ0FBa0M7UUFDbEMsTUFBTSxTQUFTLEdBQUcsMEJBQTBCLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFBO1FBRXRELG9DQUFvQztRQUNwQyxJQUFJLGVBQWUsR0FBVSxFQUFFLENBQUE7UUFDL0IsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3pCLGVBQWUsR0FBRyxNQUFNLHFCQUFxQixDQUFDLG1CQUFtQixDQUFDO2dCQUNoRSxFQUFFLEVBQUUsU0FBUzthQUNkLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsVUFBVSxFQUFFLEVBQUU7WUFDZCxnQkFBZ0IsRUFBRSxlQUFlO1NBQ2xDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQywwQ0FBMEMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNoRSxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxrQ0FBa0M7U0FDM0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQTlCWSxRQUFBLEdBQUcsT0E4QmY7QUFFRCxxRUFBcUU7QUFDOUQsTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUN2QixHQUVFLEVBQ0YsR0FBbUIsRUFDbkIsRUFBRTtJQUNGLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUNwQyxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFBO1FBRXZDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsZ0NBQWdDLEVBQUUsQ0FBQyxDQUFBO1FBQzFFLENBQUM7UUFFRCxNQUFNLHFCQUFxQixHQUN6QixHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx3Q0FBc0IsQ0FBQyxDQUFBO1FBRTNDLGdDQUFnQztRQUNoQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQztZQUN2RSxFQUFFLEVBQUUsa0JBQWtCO1NBQ3ZCLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLDJCQUEyQixFQUFFLENBQUMsQ0FBQTtRQUNyRSxDQUFDO1FBRUQsNkJBQTZCO1FBQzdCLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQzNDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUM1QyxDQUFDO1FBRUQsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDO1lBQ3hFLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO1FBQ2hFLENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsT0FBTyxFQUFFLHFDQUFxQztZQUM5QyxVQUFVLEVBQUUsU0FBUztZQUNyQixrQkFBa0IsRUFBRSxrQkFBa0I7WUFDdEMsWUFBWSxFQUFFLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU07U0FDM0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3RELE9BQU8sQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUMxQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxnQ0FBZ0M7U0FDekQsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQWpEWSxRQUFBLElBQUksUUFpRGhCO0FBRUQsOEVBQThFO0FBQ3ZFLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFDekIsR0FBa0IsRUFDbEIsR0FBbUIsRUFDbkIsRUFBRTtJQUNGLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQTtRQUV0RCwwQkFBMEI7UUFDMUIsSUFBSSwwQkFBMEIsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1lBQzFDLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxHQUFHLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sQ0FDbEYsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssZ0JBQWdCLENBQzlCLENBQUE7UUFDSCxDQUFDO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLE9BQU8sRUFBRSx1Q0FBdUM7WUFDaEQsVUFBVSxFQUFFLFNBQVM7WUFDckIsa0JBQWtCLEVBQUUsZ0JBQWdCO1NBQ3JDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN4RCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxrQ0FBa0M7U0FDM0QsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQTtBQXpCWSxRQUFBLE1BQU0sVUF5QmxCIn0=