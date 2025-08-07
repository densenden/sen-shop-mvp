"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_service_1 = __importDefault(require("../../../../services/email-service"));
async function POST(req, res) {
    try {
        const { email, password, first_name, last_name, phone } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }
        const customerService = req.scope.resolve("customerModule");
        // Create customer with account
        const customer = await customerService.createCustomer({
            email,
            password,
            first_name,
            last_name,
            phone,
            has_account: true,
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            customer_id: customer.id,
            email: customer.email
        }, process.env.JWT_SECRET || "supersecret", { expiresIn: "7d" });
        // Send welcome email (don't wait for it to complete)
        const emailService = new email_service_1.default();
        const customerName = first_name || email.split('@')[0] || 'New Customer';
        emailService.sendWelcomeEmail(email, customerName).catch(error => {
            console.error('[Registration] Failed to send welcome email:', error);
            // Don't fail registration if email fails
        });
        res.json({
            customer: {
                id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
                phone: customer.phone,
                created_at: customer.created_at,
            },
            token,
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        if (error.message?.includes("already exists")) {
            return res.status(409).json({
                error: "An account with this email already exists"
            });
        }
        res.status(500).json({
            error: "Failed to create account",
            details: error.message
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvcmVnaXN0ZXIvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFJQSxvQkFrRUM7QUFyRUQsZ0VBQThCO0FBQzlCLHVGQUE2RDtBQUV0RCxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFBO1FBRWxFLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsaUNBQWlDO2FBQ3pDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1FBRTNELCtCQUErQjtRQUMvQixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyxjQUFjLENBQUM7WUFDcEQsS0FBSztZQUNMLFFBQVE7WUFDUixVQUFVO1lBQ1YsU0FBUztZQUNULEtBQUs7WUFDTCxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDLENBQUE7UUFFRixxQkFBcUI7UUFDckIsTUFBTSxLQUFLLEdBQUcsc0JBQUcsQ0FBQyxJQUFJLENBQ3BCO1lBQ0UsV0FBVyxFQUFFLFFBQVEsQ0FBQyxFQUFFO1lBQ3hCLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztTQUN0QixFQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLGFBQWEsRUFDdkMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQ3BCLENBQUE7UUFFRCxxREFBcUQ7UUFDckQsTUFBTSxZQUFZLEdBQUcsSUFBSSx1QkFBWSxFQUFFLENBQUE7UUFDdkMsTUFBTSxZQUFZLEdBQUcsVUFBVSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksY0FBYyxDQUFBO1FBRXhFLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQy9ELE9BQU8sQ0FBQyxLQUFLLENBQUMsOENBQThDLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDcEUseUNBQXlDO1FBQzNDLENBQUMsQ0FBQyxDQUFBO1FBRUYsR0FBRyxDQUFDLElBQUksQ0FBQztZQUNQLFFBQVEsRUFBRTtnQkFDUixFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7Z0JBQ2YsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7Z0JBQy9CLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUztnQkFDN0IsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7YUFDaEM7WUFDRCxLQUFLO1NBQ04sQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBRTNDLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1lBQzlDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLEtBQUssRUFBRSwyQ0FBMkM7YUFDbkQsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSwwQkFBMEI7WUFDakMsT0FBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO1NBQ3ZCLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=