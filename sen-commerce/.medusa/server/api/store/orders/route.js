"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middlewares = void 0;
exports.GET = GET;
const medusa_1 = require("@medusajs/medusa");
async function GET(req, res) {
    try {
        // For now, return mock orders since order management is complex
        // In a real implementation, you'd fetch orders from the database for the authenticated customer
        const orders = [
            {
                id: "order_01234567890",
                display_id: 1001,
                status: "completed",
                fulfillment_status: "fulfilled",
                payment_status: "captured",
                total: 2500,
                subtotal: 2000,
                tax_total: 200,
                shipping_total: 300,
                currency_code: "usd",
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString(),
                items: [
                    {
                        id: "item_01234567890",
                        title: "Digital Artwork - Abstract Design",
                        quantity: 1,
                        unit_price: 2000,
                        total: 2000,
                        thumbnail: "/placeholder-artwork.jpg",
                        product_id: "prod_01234567890",
                        variant_id: "variant_01234567890",
                        metadata: {
                            fulfillment_type: "digital_download",
                            digital_download_url: "/store/download/token123",
                            artwork_id: "artwork_01234567890"
                        }
                    }
                ],
                shipping_address: {
                    id: "addr_01234567890",
                    first_name: "John",
                    last_name: "Doe",
                    address_1: "123 Main St",
                    city: "New York",
                    province: "NY",
                    postal_code: "10001",
                    country_code: "us",
                    phone: "+1234567890"
                },
                tracking_links: []
            }
        ];
        res.json({ orders });
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
}
exports.middlewares = [
    (0, medusa_1.authenticate)("customer", ["session", "bearer"]),
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL29yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSxrQkF1REM7QUF6REQsNkNBQStDO0FBRXhDLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxJQUFJLENBQUM7UUFDSCxnRUFBZ0U7UUFDaEUsZ0dBQWdHO1FBQ2hHLE1BQU0sTUFBTSxHQUFHO1lBQ2I7Z0JBQ0UsRUFBRSxFQUFFLG1CQUFtQjtnQkFDdkIsVUFBVSxFQUFFLElBQUk7Z0JBQ2hCLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixrQkFBa0IsRUFBRSxXQUFXO2dCQUMvQixjQUFjLEVBQUUsVUFBVTtnQkFDMUIsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsU0FBUyxFQUFFLEdBQUc7Z0JBQ2QsY0FBYyxFQUFFLEdBQUc7Z0JBQ25CLGFBQWEsRUFBRSxLQUFLO2dCQUNwQixVQUFVLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUU7Z0JBQ3hFLFVBQVUsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtnQkFDcEMsS0FBSyxFQUFFO29CQUNMO3dCQUNFLEVBQUUsRUFBRSxrQkFBa0I7d0JBQ3RCLEtBQUssRUFBRSxtQ0FBbUM7d0JBQzFDLFFBQVEsRUFBRSxDQUFDO3dCQUNYLFVBQVUsRUFBRSxJQUFJO3dCQUNoQixLQUFLLEVBQUUsSUFBSTt3QkFDWCxTQUFTLEVBQUUsMEJBQTBCO3dCQUNyQyxVQUFVLEVBQUUsa0JBQWtCO3dCQUM5QixVQUFVLEVBQUUscUJBQXFCO3dCQUNqQyxRQUFRLEVBQUU7NEJBQ1IsZ0JBQWdCLEVBQUUsa0JBQWtCOzRCQUNwQyxvQkFBb0IsRUFBRSwwQkFBMEI7NEJBQ2hELFVBQVUsRUFBRSxxQkFBcUI7eUJBQ2xDO3FCQUNGO2lCQUNGO2dCQUNELGdCQUFnQixFQUFFO29CQUNoQixFQUFFLEVBQUUsa0JBQWtCO29CQUN0QixVQUFVLEVBQUUsTUFBTTtvQkFDbEIsU0FBUyxFQUFFLEtBQUs7b0JBQ2hCLFNBQVMsRUFBRSxhQUFhO29CQUN4QixJQUFJLEVBQUUsVUFBVTtvQkFDaEIsUUFBUSxFQUFFLElBQUk7b0JBQ2QsV0FBVyxFQUFFLE9BQU87b0JBQ3BCLFlBQVksRUFBRSxJQUFJO29CQUNsQixLQUFLLEVBQUUsYUFBYTtpQkFDckI7Z0JBQ0QsY0FBYyxFQUFFLEVBQUU7YUFDbkI7U0FDRixDQUFBO1FBRUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUE7SUFDdEIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHdCQUF3QixFQUFFLENBQUMsQ0FBQTtJQUMzRCxDQUFDO0FBQ0gsQ0FBQztBQUVZLFFBQUEsV0FBVyxHQUFHO0lBQ3pCLElBQUEscUJBQVksRUFBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7Q0FDaEQsQ0FBQSJ9