"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const printful_webhook_service_1 = require("../../../../modules/printful/services/printful-webhook-service");
// POST /webhooks/printful/order-updated
// Specific webhook endpoint for order status updates
async function POST(req, res) {
    try {
        const signature = req.headers['x-printful-signature'];
        const rawBody = JSON.stringify(req.body);
        const body = req.body;
        console.log('Received Printful order update webhook:', {
            orderId: body?.data?.order?.id,
            status: body?.data?.order?.status,
            trackingNumber: body?.data?.order?.tracking_number
        });
        const webhookService = new printful_webhook_service_1.PrintfulWebhookService(req.scope);
        const result = await webhookService.processWebhook(rawBody, signature);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message || 'Order update processed successfully'
            });
        }
        else {
            console.error('Order update webhook processing failed:', result.message);
            res.status(400).json({
                success: false,
                error: result.message || 'Order update processing failed'
            });
        }
    }
    catch (error) {
        console.error('Order update webhook endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3dlYmhvb2tzL3ByaW50ZnVsL29yZGVyLXVwZGF0ZWQvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFlQSxvQkFtQ0M7QUFqREQsNkdBQXVHO0FBWXZHLHdDQUF3QztBQUN4QyxxREFBcUQ7QUFDOUMsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLElBQUksQ0FBQztRQUNILE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQVcsQ0FBQTtRQUMvRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN4QyxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBZ0MsQ0FBQTtRQUVqRCxPQUFPLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxFQUFFO1lBQ3JELE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzlCLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNO1lBQ2pDLGNBQWMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxlQUFlO1NBQ25ELENBQUMsQ0FBQTtRQUVGLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQzVELE1BQU0sTUFBTSxHQUFHLE1BQU0sY0FBYyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFFdEUsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLHFDQUFxQzthQUNqRSxDQUFDLENBQUE7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMseUNBQXlDLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1lBQ3hFLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNuQixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsTUFBTSxDQUFDLE9BQU8sSUFBSSxnQ0FBZ0M7YUFDMUQsQ0FBQyxDQUFBO1FBQ0osQ0FBQztJQUVILENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDNUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsT0FBTyxFQUFFLEtBQUs7WUFDZCxLQUFLLEVBQUUsdUJBQXVCO1NBQy9CLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=