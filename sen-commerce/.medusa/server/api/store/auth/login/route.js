"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
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
            // For now, we'll create a simple session token
            const token = `customer_${customer.id}_${Date.now()}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvbG9naW4vcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxvQkF5REM7QUEzREQscURBQW1EO0FBRTVDLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUEyQyxDQUFBO1FBRTNFLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUMxQixPQUFPLEVBQUUsaUNBQWlDO2FBQzNDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFFRCxzQ0FBc0M7UUFDdEMsTUFBTSxxQkFBcUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7UUFFakUsSUFBSSxDQUFDO1lBQ0gsMERBQTBEO1lBQzFELGlEQUFpRDtZQUNqRCxNQUFNLFNBQVMsR0FBRyxNQUFNLHFCQUFxQixDQUFDLGFBQWEsQ0FBQztnQkFDMUQsS0FBSyxFQUFFLEtBQUs7YUFDYixDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3pDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQzFCLE9BQU8sRUFBRSwyQkFBMkI7aUJBQ3JDLENBQUMsQ0FBQTtZQUNKLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFFN0IsK0NBQStDO1lBQy9DLCtDQUErQztZQUMvQyxNQUFNLEtBQUssR0FBRyxZQUFZLFFBQVEsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUE7WUFFckQsR0FBRyxDQUFDLElBQUksQ0FBQztnQkFDUCxRQUFRLEVBQUU7b0JBQ1IsRUFBRSxFQUFFLFFBQVEsQ0FBQyxFQUFFO29CQUNmLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztvQkFDckIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO29CQUMvQixTQUFTLEVBQUUsUUFBUSxDQUFDLFNBQVM7b0JBQzdCLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSztvQkFDckIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxVQUFVO2lCQUNoQztnQkFDRCxLQUFLO2FBQ04sQ0FBQyxDQUFBO1FBRUosQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQzlDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSwyQkFBMkI7YUFDckMsQ0FBQyxDQUFBO1FBQ0osQ0FBQztJQUVILENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDcEMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkIsT0FBTyxFQUFFLHVCQUF1QjtTQUNqQyxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyJ9