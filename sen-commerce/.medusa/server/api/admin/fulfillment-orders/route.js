"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
async function GET(req, res) {
    try {
        const manager = req.scope.resolve("manager");
        // Get all orders with fulfillment information
        // This combines data from multiple sources:
        // 1. Medusa orders
        // 2. Printful fulfillment data
        // 3. Digital product downloads
        const orders = await manager.query(`
      SELECT 
        o.id as medusa_order_id,
        o.email as customer_email,
        o.display_id as order_number,
        o.total,
        o.currency_code,
        o.created_at,
        COALESCE(
          TRIM(CONCAT(COALESCE(sa.first_name, ''), ' ', COALESCE(sa.last_name, ''))),
          SPLIT_PART(o.email, '@', 1)
        ) as customer_name,
        
        -- Fulfillment type based on product metadata
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM line_item li 
            JOIN product p ON li.product_id = p.id 
            WHERE li.order_id = o.id 
            AND p.metadata->>'fulfillment_type' = 'printful_pod'
          ) THEN 'printful'
          WHEN EXISTS (
            SELECT 1 FROM line_item li 
            JOIN product p ON li.product_id = p.id 
            WHERE li.order_id = o.id 
            AND p.metadata->>'fulfillment_type' = 'digital'
          ) THEN 'digital'
          ELSE 'standard'
        END as provider_type,
        
        -- Try to determine status
        CASE 
          WHEN o.fulfillment_status = 'fulfilled' THEN 'delivered'
          WHEN o.fulfillment_status = 'shipped' THEN 'shipped'
          WHEN o.fulfillment_status = 'partially_fulfilled' THEN 'processing'
          WHEN o.payment_status = 'captured' THEN 'pending'
          ELSE 'pending'
        END as status,
        
        o.fulfillment_status,
        o.payment_status
        
      FROM "order" o
      LEFT JOIN shipping_address sa ON o.shipping_address_id = sa.id
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
        // Get additional fulfillment data from PrintfulOrderTracking if it exists
        const printfulTracking = await manager.query(`
      SELECT 
        medusa_order_id,
        printful_order_id,
        status as printful_status,
        tracking_number,
        tracking_url,
        shipped_at,
        estimated_delivery,
        updated_at
      FROM printful_order_tracking 
      WHERE deleted_at IS NULL
    `).catch(() => []);
        // Get digital download data
        const digitalDownloads = await manager.query(`
      SELECT 
        dd.order_id as medusa_order_id,
        COUNT(dd.id) as download_count,
        MAX(dd.created_at) as download_created_at,
        BOOL_AND(dd.is_active) as all_downloads_active
      FROM digital_product_download dd
      WHERE dd.deleted_at IS NULL
      GROUP BY dd.order_id
    `).catch(() => []);
        // Create lookup maps
        const printfulMap = new Map(printfulTracking.map(p => [p.medusa_order_id, p]));
        const digitalMap = new Map(digitalDownloads.map(d => [d.medusa_order_id, d]));
        // Combine the data
        const fulfillmentOrders = orders.map(order => {
            const printfulData = printfulMap.get(order.medusa_order_id);
            const digitalData = digitalMap.get(order.medusa_order_id);
            let status = order.status;
            let trackingNumber = null;
            let trackingUrl = null;
            let shippedAt = null;
            let estimatedDelivery = null;
            let printfulOrderId = null;
            // Override with more specific data if available
            if (printfulData) {
                printfulOrderId = printfulData.printful_order_id;
                trackingNumber = printfulData.tracking_number;
                trackingUrl = printfulData.tracking_url;
                shippedAt = printfulData.shipped_at;
                estimatedDelivery = printfulData.estimated_delivery;
                // Use Printful status if available
                if (printfulData.printful_status) {
                    switch (printfulData.printful_status.toLowerCase()) {
                        case 'confirmed':
                        case 'in_production':
                            status = 'processing';
                            break;
                        case 'shipped':
                            status = 'shipped';
                            break;
                        case 'delivered':
                            status = 'delivered';
                            break;
                        case 'cancelled':
                            status = 'cancelled';
                            break;
                    }
                }
            }
            // For digital products, they're immediately "delivered" when downloads are created
            if (order.provider_type === 'digital' && digitalData) {
                status = digitalData.all_downloads_active ? 'delivered' : 'cancelled';
            }
            return {
                id: `fulfillment_${order.medusa_order_id}`,
                medusa_order_id: order.medusa_order_id,
                printful_order_id: printfulOrderId,
                provider_type: order.provider_type,
                status,
                tracking_number: trackingNumber,
                tracking_url: trackingUrl,
                shipped_at: shippedAt,
                delivered_at: status === 'delivered' ? (shippedAt || order.created_at) : null,
                estimated_delivery: estimatedDelivery,
                customer_email: order.customer_email,
                customer_name: order.customer_name,
                total_amount: order.total ? parseFloat(order.total) / 100 : 0, // Convert from cents
                currency: order.currency_code?.toUpperCase() || 'USD',
                created_at: order.created_at,
                updated_at: printfulData?.updated_at || order.created_at,
                order_number: order.order_number
            };
        });
        // Calculate stats
        const stats = fulfillmentOrders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            acc.total += 1;
            return acc;
        }, {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            total: 0
        });
        res.json({
            orders: fulfillmentOrders,
            stats
        });
    }
    catch (error) {
        console.error("Error fetching fulfillment orders:", error);
        res.status(500).json({
            error: "Failed to fetch fulfillment orders",
            details: error.message,
            orders: [],
            stats: {
                pending: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                total: 0
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2Z1bGZpbGxtZW50LW9yZGVycy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLGtCQThMQztBQTlMTSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUE7UUFFNUMsOENBQThDO1FBQzlDLDRDQUE0QztRQUM1QyxtQkFBbUI7UUFDbkIsK0JBQStCO1FBQy9CLCtCQUErQjtRQUUvQixNQUFNLE1BQU0sR0FBRyxNQUFNLE9BQU8sQ0FBQyxLQUFLLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0tBK0NsQyxDQUFDLENBQUE7UUFFRiwwRUFBMEU7UUFDMUUsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLE9BQU8sQ0FBQyxLQUFLLENBQUM7Ozs7Ozs7Ozs7OztLQVk1QyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBRWxCLDRCQUE0QjtRQUM1QixNQUFNLGdCQUFnQixHQUFHLE1BQU0sT0FBTyxDQUFDLEtBQUssQ0FBQzs7Ozs7Ozs7O0tBUzVDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7UUFFbEIscUJBQXFCO1FBQ3JCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDOUUsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUU3RSxtQkFBbUI7UUFDbkIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzNDLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFBO1lBQzNELE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFBO1lBRXpELElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7WUFDekIsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFBO1lBQ3pCLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQTtZQUN0QixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUE7WUFDcEIsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUE7WUFDNUIsSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFBO1lBRTFCLGdEQUFnRDtZQUNoRCxJQUFJLFlBQVksRUFBRSxDQUFDO2dCQUNqQixlQUFlLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFBO2dCQUNoRCxjQUFjLEdBQUcsWUFBWSxDQUFDLGVBQWUsQ0FBQTtnQkFDN0MsV0FBVyxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUE7Z0JBQ3ZDLFNBQVMsR0FBRyxZQUFZLENBQUMsVUFBVSxDQUFBO2dCQUNuQyxpQkFBaUIsR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUE7Z0JBRW5ELG1DQUFtQztnQkFDbkMsSUFBSSxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUM7b0JBQ2pDLFFBQVEsWUFBWSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO3dCQUNuRCxLQUFLLFdBQVcsQ0FBQzt3QkFDakIsS0FBSyxlQUFlOzRCQUNsQixNQUFNLEdBQUcsWUFBWSxDQUFBOzRCQUNyQixNQUFLO3dCQUNQLEtBQUssU0FBUzs0QkFDWixNQUFNLEdBQUcsU0FBUyxDQUFBOzRCQUNsQixNQUFLO3dCQUNQLEtBQUssV0FBVzs0QkFDZCxNQUFNLEdBQUcsV0FBVyxDQUFBOzRCQUNwQixNQUFLO3dCQUNQLEtBQUssV0FBVzs0QkFDZCxNQUFNLEdBQUcsV0FBVyxDQUFBOzRCQUNwQixNQUFLO29CQUNULENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7WUFFRCxtRkFBbUY7WUFDbkYsSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLFNBQVMsSUFBSSxXQUFXLEVBQUUsQ0FBQztnQkFDckQsTUFBTSxHQUFHLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUE7WUFDdkUsQ0FBQztZQUVELE9BQU87Z0JBQ0wsRUFBRSxFQUFFLGVBQWUsS0FBSyxDQUFDLGVBQWUsRUFBRTtnQkFDMUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxlQUFlO2dCQUN0QyxpQkFBaUIsRUFBRSxlQUFlO2dCQUNsQyxhQUFhLEVBQUUsS0FBSyxDQUFDLGFBQWE7Z0JBQ2xDLE1BQU07Z0JBQ04sZUFBZSxFQUFFLGNBQWM7Z0JBQy9CLFlBQVksRUFBRSxXQUFXO2dCQUN6QixVQUFVLEVBQUUsU0FBUztnQkFDckIsWUFBWSxFQUFFLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtnQkFDN0Usa0JBQWtCLEVBQUUsaUJBQWlCO2dCQUNyQyxjQUFjLEVBQUUsS0FBSyxDQUFDLGNBQWM7Z0JBQ3BDLGFBQWEsRUFBRSxLQUFLLENBQUMsYUFBYTtnQkFDbEMsWUFBWSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUscUJBQXFCO2dCQUNwRixRQUFRLEVBQUUsS0FBSyxDQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsSUFBSSxLQUFLO2dCQUNyRCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7Z0JBQzVCLFVBQVUsRUFBRSxZQUFZLEVBQUUsVUFBVSxJQUFJLEtBQUssQ0FBQyxVQUFVO2dCQUN4RCxZQUFZLEVBQUUsS0FBSyxDQUFDLFlBQVk7YUFDakMsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsa0JBQWtCO1FBQ2xCLE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNwRCxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDaEQsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUE7WUFDZCxPQUFPLEdBQUcsQ0FBQTtRQUNaLENBQUMsRUFBRTtZQUNELE9BQU8sRUFBRSxDQUFDO1lBQ1YsVUFBVSxFQUFFLENBQUM7WUFDYixPQUFPLEVBQUUsQ0FBQztZQUNWLFNBQVMsRUFBRSxDQUFDO1lBQ1osU0FBUyxFQUFFLENBQUM7WUFDWixLQUFLLEVBQUUsQ0FBQztTQUNULENBQUMsQ0FBQTtRQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxNQUFNLEVBQUUsaUJBQWlCO1lBQ3pCLEtBQUs7U0FDTixDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDMUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLG9DQUFvQztZQUMzQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87WUFDdEIsTUFBTSxFQUFFLEVBQUU7WUFDVixLQUFLLEVBQUU7Z0JBQ0wsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsVUFBVSxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsU0FBUyxFQUFFLENBQUM7Z0JBQ1osU0FBUyxFQUFFLENBQUM7Z0JBQ1osS0FBSyxFQUFFLENBQUM7YUFDVDtTQUNGLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=