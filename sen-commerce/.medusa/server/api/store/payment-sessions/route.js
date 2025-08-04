"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const stripe_payment_1 = require("../../../services/stripe-payment");
const POST = async (req, res) => {
    try {
        const { cart_id, provider_id, data } = req.body;
        if (!cart_id || !provider_id) {
            return res.status(400).json({
                error: "cart_id and provider_id are required"
            });
        }
        if (provider_id !== "stripe") {
            return res.status(400).json({
                error: "Only Stripe payment provider is currently supported"
            });
        }
        // Create Stripe payment service instance
        const stripePaymentService = new stripe_payment_1.StripePaymentService();
        // Validate that we have the Stripe API key
        if (!process.env.STRIPE_API_KEY || process.env.STRIPE_API_KEY.includes('REPLACE')) {
            console.warn("Stripe API key not configured - creating mock payment session for development");
            // Return a mock payment session for development/testing
            const mockPaymentSession = {
                id: `pi_mock_${Date.now()}`,
                client_secret: `pi_mock_${Date.now()}_secret_mock`,
                status: "succeeded",
                amount: data.amount,
                currency: data.currency
            };
            return res.json({
                payment_session: mockPaymentSession,
                message: "Mock payment session created (Stripe not configured)"
            });
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
        });
        return res.json({
            payment_session: paymentSession,
            message: "Payment session created successfully"
        });
    }
    catch (error) {
        console.error("Payment session creation error:", error);
        return res.status(500).json({
            error: "Failed to create payment session",
            details: error.message
        });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3BheW1lbnQtc2Vzc2lvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EscUVBQXVFO0FBRWhFLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxHQUFrQixFQUFFLEdBQW1CLEVBQUUsRUFBRTtJQUNwRSxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFBO1FBRS9DLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsc0NBQXNDO2FBQzlDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxJQUFJLFdBQVcsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM3QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUscURBQXFEO2FBQzdELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCx5Q0FBeUM7UUFDekMsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLHFDQUFvQixFQUFFLENBQUE7UUFFdkQsMkNBQTJDO1FBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUNsRixPQUFPLENBQUMsSUFBSSxDQUFDLCtFQUErRSxDQUFDLENBQUE7WUFFN0Ysd0RBQXdEO1lBQ3hELE1BQU0sa0JBQWtCLEdBQUc7Z0JBQ3pCLEVBQUUsRUFBRSxXQUFXLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDM0IsYUFBYSxFQUFFLFdBQVcsSUFBSSxDQUFDLEdBQUcsRUFBRSxjQUFjO2dCQUNsRCxNQUFNLEVBQUUsV0FBVztnQkFDbkIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7YUFDeEIsQ0FBQTtZQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDZCxlQUFlLEVBQUUsa0JBQWtCO2dCQUNuQyxPQUFPLEVBQUUsc0RBQXNEO2FBQ2hFLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxxQ0FBcUM7UUFDckMsTUFBTSxjQUFjLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7WUFDaEUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsZUFBZSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSx5Q0FBeUM7WUFDakYsUUFBUSxFQUFFO2dCQUNSLE9BQU87Z0JBQ1AsY0FBYyxFQUFFLE1BQU07YUFDdkI7U0FDRixDQUFDLENBQUE7UUFFRixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDZCxlQUFlLEVBQUUsY0FBYztZQUMvQixPQUFPLEVBQUUsc0NBQXNDO1NBQ2hELENBQUMsQ0FBQTtJQUVKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN2RCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFCLEtBQUssRUFBRSxrQ0FBa0M7WUFDekMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3ZCLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDLENBQUE7QUE5RFksUUFBQSxJQUFJLFFBOERoQiJ9