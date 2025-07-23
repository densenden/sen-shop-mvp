import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email, password } = req.body as { email: string; password: string }

    if (!email || !password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      })
    }

    // Get customer service from Medusa v2
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    try {
      // In a real implementation, you would verify the password
      // For now, we'll just find the customer by email
      const customers = await customerModuleService.listCustomers({
        email: email
      })

      if (!customers || customers.length === 0) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        })
      }

      const customer = customers[0]

      // TODO: Implement proper password verification
      // For now, we'll create a simple session token
      const token = `customer_${customer.id}_${Date.now()}`

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
      })

    } catch (error) {
      console.error("Customer lookup error:", error)
      return res.status(401).json({ 
        message: "Invalid email or password" 
      })
    }

  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ 
      message: "Internal server error" 
    })
  }
}