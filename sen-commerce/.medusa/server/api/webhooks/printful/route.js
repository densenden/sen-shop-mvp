"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const printful_webhook_service_1 = require("../../../modules/printful/services/printful-webhook-service");
// POST /webhooks/printful
// Main webhook endpoint for all Printful events
async function POST(req, res) {
    try {
        const signature = req.headers['x-printful-signature'];
        const rawBody = JSON.stringify(req.body);
        console.log('Received Printful webhook:', {
            headers: req.headers,
            body: req.body
        });
        const webhookService = new printful_webhook_service_1.PrintfulWebhookService(req.scope);
        const result = await webhookService.processWebhook(rawBody, signature);
        if (result.success) {
            res.status(200).json({
                success: true,
                message: result.message || 'Webhook processed successfully'
            });
        }
        else {
            console.error('Webhook processing failed:', result.message);
            res.status(400).json({
                success: false,
                error: result.message || 'Webhook processing failed'
            });
        }
    }
    catch (error) {
        console.error('Webhook endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
// GET /webhooks/printful
// Health check endpoint for webhook verification
async function GET(req, res) {
    res.status(200).json({
        status: 'OK',
        message: 'Printful webhook endpoint is active',
        timestamp: new Date().toISOString()
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3dlYmhvb2tzL3ByaW50ZnVsL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBS0Esb0JBaUNDO0FBSUQsa0JBTUM7QUEvQ0QsMEdBQW9HO0FBRXBHLDBCQUEwQjtBQUMxQixnREFBZ0Q7QUFDekMsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLElBQUksQ0FBQztRQUNILE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQVcsQ0FBQTtRQUMvRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUV4QyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFO1lBQ3hDLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTztZQUNwQixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7U0FDZixDQUFDLENBQUE7UUFFRixNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUM1RCxNQUFNLE1BQU0sR0FBRyxNQUFNLGNBQWMsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRXRFLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ25CLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNuQixPQUFPLEVBQUUsSUFBSTtnQkFDYixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sSUFBSSxnQ0FBZ0M7YUFDNUQsQ0FBQyxDQUFBO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMzRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDbkIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLE1BQU0sQ0FBQyxPQUFPLElBQUksMkJBQTJCO2FBQ3JELENBQUMsQ0FBQTtRQUNKLENBQUM7SUFFSCxDQUFDO0lBQUMsT0FBTyxLQUFVLEVBQUUsQ0FBQztRQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQy9DLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLHVCQUF1QjtTQUMvQixDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQztBQUVELHlCQUF5QjtBQUN6QixpREFBaUQ7QUFDMUMsS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ25CLE1BQU0sRUFBRSxJQUFJO1FBQ1osT0FBTyxFQUFFLHFDQUFxQztRQUM5QyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDcEMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyJ9