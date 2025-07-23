import Stripe from "stripe"

type PaymentProviderOptions = {
  apiKey: string
  webhookSecret?: string
  apiVersion?: string
  capture?: boolean
}

interface PaymentSession {
  id: string
  amount: number
  currency: string
  provider_id: string
  data: Record<string, any>
  status: string
}

interface PaymentContext {
  amount: number
  currency: string
  customer?: {
    id: string
    email?: string
  }
  billing_address?: any
  shipping_address?: any
  metadata?: Record<string, any>
}

export class StripePaymentService {
  private stripe: Stripe
  private options: PaymentProviderOptions

  constructor(options?: PaymentProviderOptions) {
    this.options = {
      apiKey: process.env.STRIPE_API_KEY!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      apiVersion: "2023-10-16",
      capture: true,
      ...options,
    }

    this.stripe = new Stripe(this.options.apiKey, {
      apiVersion: this.options.apiVersion as any,
    })
  }

  static identifier = "stripe"

  async getPaymentStatus(paymentData: Record<string, any>): Promise<string> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentData.payment_intent_id
      )
      
      switch (paymentIntent.status) {
        case "succeeded":
          return "captured"
        case "processing":
          return "pending"
        case "requires_payment_method":
        case "requires_confirmation":
          return "pending"
        case "canceled":
          return "canceled"
        default:
          return "pending"
      }
    } catch (error) {
      console.error("[Stripe] Error getting payment status:", error)
      return "error"
    }
  }

  async initiatePayment(context: PaymentContext): Promise<PaymentSession> {
    try {
      const { amount, currency, customer, billing_address, metadata = {} } = context

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          ...metadata,
          medusa_payment: "true",
        },
      }

      if (customer?.email) {
        paymentIntentData.receipt_email = customer.email
      }

      if (billing_address) {
        paymentIntentData.shipping = {
          address: {
            line1: billing_address.address_1,
            line2: billing_address.address_2 || undefined,
            city: billing_address.city,
            state: billing_address.province,
            postal_code: billing_address.postal_code,
            country: billing_address.country_code?.toUpperCase(),
          },
          name: `${billing_address.first_name} ${billing_address.last_name}`,
        }
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData)

      return {
        id: paymentIntent.id,
        amount: amount,
        currency: currency,
        provider_id: "stripe",
        data: {
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
        },
        status: "pending",
      }
    } catch (error) {
      console.error("[Stripe] Error initiating payment:", error)
      throw new Error(`Failed to initiate Stripe payment: ${error.message}`)
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, any>,
    context: Record<string, any> = {}
  ): Promise<{ status: string; data: Record<string, any> }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentSessionData.payment_intent_id
      )

      return {
        status: paymentIntent.status === "succeeded" ? "authorized" : "pending",
        data: {
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
        },
      }
    } catch (error) {
      console.error("[Stripe] Error authorizing payment:", error)
      return {
        status: "error",
        data: { error: error.message },
      }
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, any>,
    context: Record<string, any> = {}
  ): Promise<{ status: string; data: Record<string, any> }> {
    try {
      if (!this.options.capture) {
        // If auto-capture is disabled, manually capture
        const paymentIntent = await this.stripe.paymentIntents.capture(
          paymentSessionData.payment_intent_id
        )

        return {
          status: paymentIntent.status === "succeeded" ? "captured" : "pending",
          data: {
            payment_intent_id: paymentIntent.id,
            status: paymentIntent.status,
          },
        }
      }

      // Auto-capture is enabled, just verify status
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentSessionData.payment_intent_id
      )

      return {
        status: paymentIntent.status === "succeeded" ? "captured" : "pending",
        data: {
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
        },
      }
    } catch (error) {
      console.error("[Stripe] Error capturing payment:", error)
      return {
        status: "error",
        data: { error: error.message },
      }
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, any>
  ): Promise<{ status: string; data: Record<string, any> }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(
        paymentSessionData.payment_intent_id
      )

      return {
        status: "canceled",
        data: {
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status,
        },
      }
    } catch (error) {
      console.error("[Stripe] Error canceling payment:", error)
      return {
        status: "error",
        data: { error: error.message },
      }
    }
  }

  async refundPayment(
    paymentSessionData: Record<string, any>,
    refundAmount: number
  ): Promise<{ status: string; data: Record<string, any> }> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentSessionData.payment_intent_id,
        amount: Math.round(refundAmount),
      })

      return {
        status: "refunded",
        data: {
          refund_id: refund.id,
          payment_intent_id: paymentSessionData.payment_intent_id,
          amount: refund.amount,
        },
      }
    } catch (error) {
      console.error("[Stripe] Error refunding payment:", error)
      return {
        status: "error",
        data: { error: error.message },
      }
    }
  }

  async retrievePayment(
    paymentSessionData: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentSessionData.payment_intent_id
      )

      return {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        client_secret: paymentIntent.client_secret,
      }
    } catch (error) {
      console.error("[Stripe] Error retrieving payment:", error)
      throw new Error(`Failed to retrieve Stripe payment: ${error.message}`)
    }
  }

  async updatePayment(
    paymentSessionData: Record<string, any>,
    context: PaymentContext
  ): Promise<PaymentSession> {
    try {
      const { amount, currency } = context

      const paymentIntent = await this.stripe.paymentIntents.update(
        paymentSessionData.payment_intent_id,
        {
          amount: Math.round(amount),
          currency: currency.toLowerCase(),
        }
      )

      return {
        id: paymentIntent.id,
        amount: amount,
        currency: currency,
        provider_id: "stripe",
        data: {
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
        },
        status: "pending",
      }
    } catch (error) {
      console.error("[Stripe] Error updating payment:", error)
      throw new Error(`Failed to update Stripe payment: ${error.message}`)
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, any>
  ): Promise<{ status: string; data: Record<string, any> }> {
    return this.cancelPayment(paymentSessionData)
  }
}

export default StripePaymentService