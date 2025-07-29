"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
async function POST(req, res) {
    try {
        // For now, just return a simple success response to let the frontend handle it with localStorage
        // This ensures the cart functionality works while we can implement proper Medusa cart later
        const { id: cartId } = req.params;
        const { variant_id, quantity = 1 } = req.body;
        // Return a simple success response - the frontend cart service will handle localStorage fallback
        res.json({
            success: true,
            message: "Item will be added to cart via localStorage fallback",
            cartId,
            variant_id,
            quantity
        });
    }
    catch (error) {
        console.error("Error in cart line items endpoint:", error);
        res.status(500).json({ error: "Failed to add item to cart", message: error.message });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2NhcnRzL1tpZF0vbGluZS1pdGVtcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUlBLG9CQW1CQztBQW5CTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsaUdBQWlHO1FBQ2pHLDRGQUE0RjtRQUM1RixNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUE7UUFDakMsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUVwRCxpR0FBaUc7UUFDakcsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLHNEQUFzRDtZQUMvRCxNQUFNO1lBQ04sVUFBVTtZQUNWLFFBQVE7U0FDVCxDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDMUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsNEJBQTRCLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZGLENBQUM7QUFDSCxDQUFDIn0=