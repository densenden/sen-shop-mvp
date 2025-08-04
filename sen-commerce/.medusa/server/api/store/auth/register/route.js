"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvcmVnaXN0ZXIvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFHQSxvQkF5REM7QUEzREQsZ0VBQThCO0FBRXZCLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUE7UUFFbEUsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLEtBQUssRUFBRSxpQ0FBaUM7YUFDekMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7UUFFM0QsK0JBQStCO1FBQy9CLE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBZSxDQUFDLGNBQWMsQ0FBQztZQUNwRCxLQUFLO1lBQ0wsUUFBUTtZQUNSLFVBQVU7WUFDVixTQUFTO1lBQ1QsS0FBSztZQUNMLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQTtRQUVGLHFCQUFxQjtRQUNyQixNQUFNLEtBQUssR0FBRyxzQkFBRyxDQUFDLElBQUksQ0FDcEI7WUFDRSxXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQUU7WUFDeEIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO1NBQ3RCLEVBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksYUFBYSxFQUN2QyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FDcEIsQ0FBQTtRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxRQUFRLEVBQUU7Z0JBQ1IsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUNmLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO2dCQUMvQixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVM7Z0JBQzdCLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztnQkFDckIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO2FBQ2hDO1lBQ0QsS0FBSztTQUNOLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUUzQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztZQUM5QyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixLQUFLLEVBQUUsMkNBQTJDO2FBQ25ELENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixLQUFLLEVBQUUsMEJBQTBCO1lBQ2pDLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztTQUN2QixDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyJ9