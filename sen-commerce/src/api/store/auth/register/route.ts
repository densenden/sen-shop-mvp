import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import jwt from "jsonwebtoken"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email, password, first_name, last_name, phone } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      })
    }

    const customerService = req.scope.resolve("customerModule")
    
    // Create customer with account
    const customer = await customerService.createCustomer({
      email,
      password,
      first_name,
      last_name,
      phone,
      has_account: true,
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        customer_id: customer.id,
        email: customer.email 
      },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "7d" }
    )

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
    })
  } catch (error) {
    console.error("Registration error:", error)
    
    if (error.message?.includes("already exists")) {
      return res.status(409).json({
        error: "An account with this email already exists"
      })
    }
    
    res.status(500).json({
      error: "Failed to create account",
      details: error.message
    })
  }
}
