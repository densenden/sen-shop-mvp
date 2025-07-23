"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
async function POST(req, res) {
    try {
        const { email, password, first_name, last_name, phone } = req.body;
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                message: "Email, password, first name, and last name are required"
            });
        }
        // Get customer service from Medusa v2
        const customerModuleService = req.scope.resolve(utils_1.Modules.CUSTOMER);
        try {
            // Check if customer already exists
            const existingCustomers = await customerModuleService.listCustomers({
                email: email
            });
            if (existingCustomers && existingCustomers.length > 0) {
                return res.status(409).json({
                    message: "Customer with this email already exists"
                });
            }
            // Create new customer
            const customer = await customerModuleService.createCustomers({
                email,
                first_name,
                last_name,
                phone,
                metadata: {
                    // Store password hash here in a real implementation
                    // For now, we'll just store a placeholder
                    password_set: true
                }
            });
            // Create a simple session token
            const token = `customer_${customer.id}_${Date.now()}`;
            res.status(201).json({
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
            console.error("Customer creation error:", error);
            return res.status(500).json({
                message: "Failed to create customer account"
            });
        }
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2F1dGgvcmVnaXN0ZXIvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSxvQkF3RUM7QUExRUQscURBQW1EO0FBRTVDLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxJQUFJLENBQUM7UUFDSCxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQU03RCxDQUFBO1FBRUQsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JELE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSx5REFBeUQ7YUFDbkUsQ0FBQyxDQUFBO1FBQ0osQ0FBQztRQUVELHNDQUFzQztRQUN0QyxNQUFNLHFCQUFxQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUVqRSxJQUFJLENBQUM7WUFDSCxtQ0FBbUM7WUFDbkMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLHFCQUFxQixDQUFDLGFBQWEsQ0FBQztnQkFDbEUsS0FBSyxFQUFFLEtBQUs7YUFDYixDQUFDLENBQUE7WUFFRixJQUFJLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDdEQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFDMUIsT0FBTyxFQUFFLHlDQUF5QztpQkFDbkQsQ0FBQyxDQUFBO1lBQ0osQ0FBQztZQUVELHNCQUFzQjtZQUN0QixNQUFNLFFBQVEsR0FBRyxNQUFNLHFCQUFxQixDQUFDLGVBQWUsQ0FBQztnQkFDM0QsS0FBSztnQkFDTCxVQUFVO2dCQUNWLFNBQVM7Z0JBQ1QsS0FBSztnQkFDTCxRQUFRLEVBQUU7b0JBQ1Isb0RBQW9EO29CQUNwRCwwQ0FBMEM7b0JBQzFDLFlBQVksRUFBRSxJQUFJO2lCQUNuQjthQUNGLENBQUMsQ0FBQTtZQUVGLGdDQUFnQztZQUNoQyxNQUFNLEtBQUssR0FBRyxZQUFZLFFBQVEsQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUE7WUFFckQsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ25CLFFBQVEsRUFBRTtvQkFDUixFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQUU7b0JBQ2YsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO29CQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7b0JBQy9CLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUztvQkFDN0IsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLO29CQUNyQixVQUFVLEVBQUUsUUFBUSxDQUFDLFVBQVU7aUJBQ2hDO2dCQUNELEtBQUs7YUFDTixDQUFDLENBQUE7UUFFSixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDaEQsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDMUIsT0FBTyxFQUFFLG1DQUFtQzthQUM3QyxDQUFDLENBQUE7UUFDSixDQUFDO0lBRUgsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzNDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLE9BQU8sRUFBRSx1QkFBdUI7U0FDakMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztBQUNILENBQUMifQ==