import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PrintfulWebhookService } from "../../../../modules/printful/services/printful-webhook-service"

interface PrintfulProductWebhookBody {
  data?: {
    product?: {
      id: string
      name: string
    }
  }
}

// POST /webhooks/printful/product-updated
// Specific webhook endpoint for product updates
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const signature = req.headers['x-printful-signature'] as string
    const rawBody = JSON.stringify(req.body)
    const body = req.body as PrintfulProductWebhookBody
    
    console.log('Received Printful product update webhook:', {
      productId: body?.data?.product?.id,
      productName: body?.data?.product?.name
    })

    const webhookService = new PrintfulWebhookService(req.scope)
    const result = await webhookService.processWebhook(rawBody, signature)

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: result.message || 'Product update processed successfully' 
      })
    } else {
      console.error('Product update webhook processing failed:', result.message)
      res.status(400).json({ 
        success: false, 
        error: result.message || 'Product update processing failed' 
      })
    }

  } catch (error: any) {
    console.error('Product update webhook endpoint error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}