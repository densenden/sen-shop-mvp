"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const printful_webhook_service_1 = require("../../../../modules/printful/services/printful-webhook-service");
// POST /webhooks/printful/product-updated
// Specific webhook endpoint for product updates
async function POST(req, res) {
    try {
        const signature = req.headers['x-printful-signature'];
        const rawBody = JSON.stringify(req.body);
        const body = req.body;
        console.log('Received Printful product update webhook:', {
            productId: body?.data?.product?.id,
            productName: body?.data?.product?.name
        });
        const webhookService = new printful_webhook_service_1.PrintfulWebhookService(req.scope);
        const result = await webhookService.processWebhook(rawBody, signature);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message || 'Product update processed successfully'
            });
        }
        else {
            console.error('Product update webhook processing failed:', result.message);
            res.status(400).json({
                success: false,
                error: result.message || 'Product update processing failed'
            });
        }
    }
    catch (error) {
        console.error('Product update webhook endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3dlYmhvb2tzL3ByaW50ZnVsL3Byb2R1Y3QtdXBkYXRlZC9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWNBLG9CQWtDQztBQS9DRCw2R0FBdUc7QUFXdkcsMENBQTBDO0FBQzFDLGdEQUFnRDtBQUN6QyxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBVyxDQUFBO1FBQy9ELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3hDLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFrQyxDQUFBO1FBRW5ELE9BQU8sQ0FBQyxHQUFHLENBQUMsMkNBQTJDLEVBQUU7WUFDdkQsU0FBUyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDbEMsV0FBVyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUk7U0FDdkMsQ0FBQyxDQUFBO1FBRUYsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDNUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxjQUFjLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUV0RSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNuQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbkIsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLElBQUksdUNBQXVDO2FBQ25FLENBQUMsQ0FBQTtRQUNKLENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDMUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLGtDQUFrQzthQUM1RCxDQUFDLENBQUE7UUFDSixDQUFDO0lBRUgsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsT0FBTyxDQUFDLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUM5RCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSx1QkFBdUI7U0FDL0IsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==