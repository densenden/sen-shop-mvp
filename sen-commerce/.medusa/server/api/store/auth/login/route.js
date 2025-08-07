"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function POST(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }
        // Get customer service from Medusa v2
        const customerModuleService = req.scope.resolve(utils_1.Modules.CUSTOMER);
        try {
            // In a real implementation, you would verify the password
            // For now, we'll just find the customer by email
            const customers = await customerModuleService.listCustomers({
                email: email
            });
            if (!customers || customers.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }
            const customer = customers[0];
            // TODO: Implement proper password verification
            // Create a JWT token
            const token = jsonwebtoken_1.default.sign({
                customer_id: customer.id,
                email: customer.email,
                type: 'customer'
            }, process.env.JWT_SECRET || "supersecret", { expiresIn: '7d' });
            res.json({
                customer: {
                    id: customer.id,
                    email: customer.email,
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    phone: customer.phone,
                    created_at: customer.created_at
                },
                token
            });
        }
        catch (error) {
            console.error("Customer lookup error:", error);
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvbG9naW4vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFJQSxvQkFpRUM7QUFwRUQscURBQW1EO0FBQ25ELGdFQUE4QjtBQUV2QixLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLENBQUMsSUFBMkMsQ0FBQTtRQUUzRSxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDeEIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLGlDQUFpQzthQUMzQyxDQUFDLENBQUE7UUFDSixDQUFDO1FBRUQsc0NBQXNDO1FBQ3RDLE1BQU0scUJBQXFCLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBRWpFLElBQUksQ0FBQztZQUNILDBEQUEwRDtZQUMxRCxpREFBaUQ7WUFDakQsTUFBTSxTQUFTLEdBQUcsTUFBTSxxQkFBcUIsQ0FBQyxhQUFhLENBQUM7Z0JBQzFELEtBQUssRUFBRSxLQUFLO2FBQ2IsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUN6QyxPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUMxQixPQUFPLEVBQUUsMkJBQTJCO2lCQUNyQyxDQUFDLENBQUE7WUFDSixDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRTdCLCtDQUErQztZQUMvQyxxQkFBcUI7WUFDckIsTUFBTSxLQUFLLEdBQUcsc0JBQUcsQ0FBQyxJQUFJLENBQ3BCO2dCQUNFLFdBQVcsRUFBRSxRQUFRLENBQUMsRUFBRTtnQkFDeEIsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO2dCQUNyQixJQUFJLEVBQUUsVUFBVTthQUNqQixFQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLGFBQWEsRUFDdkMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQ3BCLENBQUE7WUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO2dCQUNQLFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7b0JBQ2YsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO29CQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7b0JBQy9CLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUztvQkFDN0IsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO29CQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7aUJBQ2hDO2dCQUNELEtBQUs7YUFDTixDQUFDLENBQUE7UUFFSixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDOUMsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLDJCQUEyQjthQUNyQyxDQUFDLENBQUE7UUFDSixDQUFDO0lBRUgsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNwQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixPQUFPLEVBQUUsdUJBQXVCO1NBQ2pDLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=