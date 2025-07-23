import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email, password, first_name, last_name, phone } = req.body as { 
      email: string; 
      password: string; 
      first_name: string; 
      last_name: string; 
      phone?: string 
    }

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ 
        message: "Email, password, first name, and last name are required" 
      })
    }

    // Get customer service from Medusa v2
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    try {
      // Check if customer already exists
      const existingCustomers = await customerModuleService.listCustomers({
        email: email
      })

      if (existingCustomers && existingCustomers.length > 0) {
        return res.status(409).json({ 
          message: "Customer with this email already exists" 
        })
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
      })

      // Create a simple session token
      const token = `customer_${customer.id}_${Date.now()}`

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
      })

    } catch (error) {
      console.error("Customer creation error:", error)
      return res.status(500).json({ 
        message: "Failed to create customer account" 
      })
    }

  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ 
      message: "Internal server error" 
    })
  }
}