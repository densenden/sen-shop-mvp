import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PrintfulWebhookService } from "../../../modules/printful/services/printful-webhook-service"

// POST /webhooks/printful
// Main webhook endpoint for all Printful events
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const signature = req.headers['x-printful-signature'] as string
    const rawBody = JSON.stringify(req.body)
    
    console.log('Received Printful webhook:', {
      headers: req.headers,
      body: req.body
    })

    const webhookService = new PrintfulWebhookService(req.scope)
    const result = await webhookService.processWebhook(rawBody, signature)

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: result.message || 'Webhook processed successfully' 
      })
    } else {
      console.error('Webhook processing failed:', result.message)
      res.status(400).json({ 
        success: false, 
        error: result.message || 'Webhook processing failed' 
      })
    }

  } catch (error: any) {
    console.error('Webhook endpoint error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    })
  }
}

// GET /webhooks/printful
// Health check endpoint for webhook verification
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({ 
    status: 'OK',
    message: 'Printful webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}