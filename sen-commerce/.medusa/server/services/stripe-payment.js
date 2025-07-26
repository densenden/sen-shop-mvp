"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripePaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
class StripePaymentService {
    constructor(options) {
        this.options = {
            apiKey: process.env.STRIPE_API_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            apiVersion: "2023-10-16",
            capture: true,
            ...options,
        };
        this.stripe = new stripe_1.default(this.options.apiKey, {
            apiVersion: this.options.apiVersion,
        });
    }
    async getPaymentStatus(paymentData) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentData.payment_intent_id);
            switch (paymentIntent.status) {
                case "succeeded":
                    return "captured";
                case "processing":
                    return "pending";
                case "requires_payment_method":
                case "requires_confirmation":
                    return "pending";
                case "canceled":
                    return "canceled";
                default:
                    return "pending";
            }
        }
        catch (error) {
            console.error("[Stripe] Error getting payment status:", error);
            return "error";
        }
    }
    async initiatePayment(context) {
        try {
            const { amount, currency, customer, billing_address, metadata = {} } = context;
            const paymentIntentData = {
                amount: Math.round(amount),
                currency: currency.toLowerCase(),
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    ...metadata,
                    medusa_payment: "true",
                },
            };
            if (customer?.email) {
                paymentIntentData.receipt_email = customer.email;
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
                };
            }
            const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);
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
            };
        }
        catch (error) {
            console.error("[Stripe] Error initiating payment:", error);
            throw new Error(`Failed to initiate Stripe payment: ${error.message}`);
        }
    }
    async authorizePayment(paymentSessionData, context = {}) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentSessionData.payment_intent_id);
            return {
                status: paymentIntent.status === "succeeded" ? "authorized" : "pending",
                data: {
                    payment_intent_id: paymentIntent.id,
                    status: paymentIntent.status,
                },
            };
        }
        catch (error) {
            console.error("[Stripe] Error authorizing payment:", error);
            return {
                status: "error",
                data: { error: error.message },
            };
        }
    }
    async capturePayment(paymentSessionData, context = {}) {
        try {
            if (!this.options.capture) {
                // If auto-capture is disabled, manually capture
                const paymentIntent = await this.stripe.paymentIntents.capture(paymentSessionData.payment_intent_id);
                return {
                    status: paymentIntent.status === "succeeded" ? "captured" : "pending",
                    data: {
                        payment_intent_id: paymentIntent.id,
                        status: paymentIntent.status,
                    },
                };
            }
            // Auto-capture is enabled, just verify status
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentSessionData.payment_intent_id);
            return {
                status: paymentIntent.status === "succeeded" ? "captured" : "pending",
                data: {
                    payment_intent_id: paymentIntent.id,
                    status: paymentIntent.status,
                },
            };
        }
        catch (error) {
            console.error("[Stripe] Error capturing payment:", error);
            return {
                status: "error",
                data: { error: error.message },
            };
        }
    }
    async cancelPayment(paymentSessionData) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.cancel(paymentSessionData.payment_intent_id);
            return {
                status: "canceled",
                data: {
                    payment_intent_id: paymentIntent.id,
                    status: paymentIntent.status,
                },
            };
        }
        catch (error) {
            console.error("[Stripe] Error canceling payment:", error);
            return {
                status: "error",
                data: { error: error.message },
            };
        }
    }
    async refundPayment(paymentSessionData, refundAmount) {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: paymentSessionData.payment_intent_id,
                amount: Math.round(refundAmount),
            });
            return {
                status: "refunded",
                data: {
                    refund_id: refund.id,
                    payment_intent_id: paymentSessionData.payment_intent_id,
                    amount: refund.amount,
                },
            };
        }
        catch (error) {
            console.error("[Stripe] Error refunding payment:", error);
            return {
                status: "error",
                data: { error: error.message },
            };
        }
    }
    async retrievePayment(paymentSessionData) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentSessionData.payment_intent_id);
            return {
                payment_intent_id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                client_secret: paymentIntent.client_secret,
            };
        }
        catch (error) {
            console.error("[Stripe] Error retrieving payment:", error);
            throw new Error(`Failed to retrieve Stripe payment: ${error.message}`);
        }
    }
    async updatePayment(paymentSessionData, context) {
        try {
            const { amount, currency } = context;
            const paymentIntent = await this.stripe.paymentIntents.update(paymentSessionData.payment_intent_id, {
                amount: Math.round(amount),
                currency: currency.toLowerCase(),
            });
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
            };
        }
        catch (error) {
            console.error("[Stripe] Error updating payment:", error);
            throw new Error(`Failed to update Stripe payment: ${error.message}`);
        }
    }
    async deletePayment(paymentSessionData) {
        return this.cancelPayment(paymentSessionData);
    }
}
exports.StripePaymentService = StripePaymentService;
StripePaymentService.identifier = "stripe";
exports.default = StripePaymentService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaXBlLXBheW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2VydmljZXMvc3RyaXBlLXBheW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0RBQTJCO0FBOEIzQixNQUFhLG9CQUFvQjtJQUkvQixZQUFZLE9BQWdDO1FBQzFDLElBQUksQ0FBQyxPQUFPLEdBQUc7WUFDYixNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFlO1lBQ25DLGFBQWEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQjtZQUNoRCxVQUFVLEVBQUUsWUFBWTtZQUN4QixPQUFPLEVBQUUsSUFBSTtZQUNiLEdBQUcsT0FBTztTQUNYLENBQUE7UUFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksZ0JBQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtZQUM1QyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFpQjtTQUMzQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBSUQsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFdBQWdDO1FBQ3JELElBQUksQ0FBQztZQUNILE1BQU0sYUFBYSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUM3RCxXQUFXLENBQUMsaUJBQWlCLENBQzlCLENBQUE7WUFFRCxRQUFRLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDN0IsS0FBSyxXQUFXO29CQUNkLE9BQU8sVUFBVSxDQUFBO2dCQUNuQixLQUFLLFlBQVk7b0JBQ2YsT0FBTyxTQUFTLENBQUE7Z0JBQ2xCLEtBQUsseUJBQXlCLENBQUM7Z0JBQy9CLEtBQUssdUJBQXVCO29CQUMxQixPQUFPLFNBQVMsQ0FBQTtnQkFDbEIsS0FBSyxVQUFVO29CQUNiLE9BQU8sVUFBVSxDQUFBO2dCQUNuQjtvQkFDRSxPQUFPLFNBQVMsQ0FBQTtZQUNwQixDQUFDO1FB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