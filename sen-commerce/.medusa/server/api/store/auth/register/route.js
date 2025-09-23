"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
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
        const customerModuleService = req.scope.resolve(utils_1.Modules.CUSTOMER);
        // Check if customer already exists
        const existingCustomers = await customerModuleService.listCustomers({
            email: email
        });
        if (existingCustomers && existingCustomers.length > 0) {
            return res.status(409).json({
                error: "An account with this email already exists"
            });
        }
        // Create customer with account
        const customer = await customerModuleService.createCustomers({
            email,
            first_name,
            last_name,
            phone,
            has_account: true,
            metadata: {
                password_hash: password // TODO: Hash this properly
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvcmVnaXN0ZXIvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxvQkErRUM7QUFuRkQscURBQW1EO0FBQ25ELGdFQUE4QjtBQUM5Qix1RkFBNkQ7QUFFdEQsS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLElBQUksQ0FBQztRQUNILE1BQU0sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQTtRQUVsRSxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLGlDQUFpQzthQUN6QyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFakUsbUNBQW1DO1FBQ25DLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxhQUFhLENBQUM7WUFDbEUsS0FBSyxFQUFFLEtBQUs7U0FDYixDQUFDLENBQUE7UUFFRixJQUFJLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN0RCxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsMkNBQTJDO2FBQ25ELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCwrQkFBK0I7UUFDL0IsTUFBTSxRQUFRLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxlQUFlLENBQUM7WUFDM0QsS0FBSztZQUNMLFVBQVU7WUFDVixTQUFTO1lBQ1QsS0FBSztZQUNMLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLFFBQVEsRUFBRTtnQkFDUixhQUFhLEVBQUUsUUFBUSxDQUFDLDJCQUEyQjthQUNwRDtTQUNGLENBQUMsQ0FBQTtRQUVGLHFCQUFxQjtRQUNyQixNQUFNLEtBQUssR0FBRyxzQkFBRyxDQUFDLElBQUksQ0FDcEI7WUFDRSxXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDeEIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1NBQ3RCLEVBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksYUFBYSxFQUN2QyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FDcEIsQ0FBQTtRQUVELHFEQUFxRDtRQUNyRCxNQUFNLFlBQVksR0FBRyxJQUFJLHVCQUFZLEVBQUUsQ0FBQTtRQUN2QyxNQUFNLFlBQVksR0FBRyxVQUFVLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxjQUFjLENBQUE7UUFFeEUsWUFBWSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDL0QsT0FBTyxDQUFDLEtBQUssQ0FBQyw4Q0FBOEMsRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUNwRSx5Q0FBeUM7UUFDM0MsQ0FBQyxDQUFDLENBQUE7UUFFRixHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsUUFBUSxFQUFFO2dCQUNSLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDZixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7Z0JBQ3JCLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVTtnQkFDL0IsU0FBUyxFQUFFLFFBQVEsQ0FBQyxTQUFTO2dCQUM3QixLQUFLLEVBQUUsUUFBUSxDQUFDLEtBQUs7Z0JBQ3JCLFVBQVUsRUFBRSxRQUFRLENBQUMsVUFBVTthQUNoQztZQUNELEtBQUs7U0FDTixDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFFM0MsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7WUFDOUMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsS0FBSyxFQUFFLDJDQUEyQzthQUNuRCxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsS0FBSyxFQUFFLDBCQUEwQjtZQUNqQyxPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==