import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { StripePaymentService } from "../../../services/stripe-payment"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { cart_id, provider_id, data } = req.body

    if (!cart_id || !provider_id) {
      return res.status(400).json({
        error: "cart_id and provider_id are required"
      })
    }

    if (provider_id !== "stripe") {
      return res.status(400).json({
        error: "Only Stripe payment provider is currently supported"
      })
    }

    // Create Stripe payment service instance
    const stripePaymentService = new StripePaymentService()

    // Validate that we have the Stripe API key
    if (!process.env.STRIPE_API_KEY || process.env.STRIPE_API_KEY.includes('REPLACE')) {
      console.warn("Stripe API key not configured - creating mock payment session for development")
      
      // Return a mock payment session for development/testing
      const mockPaymentSession = {
        id: `pi_mock_${Date.now()}`,
        client_secret: `pi_mock_${Date.now()}_secret_mock`,
        status: "succeeded",
        amount: data.amount,
        currency: data.currency
      }
      
      return res.json({
        payment_session: mockPaymentSession,
        message: "Mock payment session created (Stripe not configured)"
      })
    }

    // Create payment session with Stripe
    const paymentSession = await stripePaymentService.initiatePayment({
      amount: data.amount,
      currency: data.currency,
      customer: data.customer,
      billing_address: data.shipping_address, // Use shipping as billing for simplicity
      metadata: {
        cart_id,
        medusa_payment: "true"
      }
    })

    return res.json({
      payment_session: paymentSession,
      message: "Payment session created successfully"
    })

  } catch (error) {
    console.error("Payment session creation error:", error)
    return res.status(500).json({
      error: "Failed to create payment session",
      details: error.message
    })
  }
}