import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PrintfulWebhookService } from "../../../../modules/printful/services/printful-webhook-service"

interface PrintfulOrderWebhookBody {
  data?: {
    order?: {
      id: string
      status: string
      tracking_number?: string
    }
  }
}

// POST /webhooks/printful/order-updated
// Specific webhook endpoint for order status updates
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const signature = req.headers['x-printful-signature'] as string
    const rawBody = JSON.stringify(req.body)
    const body = req.body as PrintfulOrderWebhookBody
    
    console.log('Received Printful order update webhook:', {
      orderId: body?.data?.order?.id,
      status: body?.data?.order?.status,
      trackingNumber: body?.data?.order?.tracking_number
    })

    const webhookService = new PrintfulWebhookService(req.scope)
    const result = await webhookService.processWebhook(rawBody, signature)

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: result.message || 'Order update processed successfully' 
      })
    } else {
      console.error('Order update webhook processing failed:', result.message)
      res.status(400).json({ 
        success: false, 
        error: result.message || 'Order update processing failed' 
      })
    }

  } catch (error: any) {
    console.error('Order update webhook endpoint error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}