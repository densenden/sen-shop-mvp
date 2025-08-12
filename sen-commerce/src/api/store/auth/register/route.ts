import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import EmailService from "../../../../services/email-service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { email, password, first_name, last_name, phone } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      })
    }

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Check if customer already exists
    const existingCustomers = await customerModuleService.listCustomers({
      email: email
    })

    if (existingCustomers && existingCustomers.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists"
      })
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

    // Send welcome email (don't wait for it to complete)
    const emailService = new EmailService()
    const customerName = first_name || email.split('@')[0] || 'New Customer'
    
    emailService.sendWelcomeEmail(email, customerName).catch(error => {
      console.error('[Registration] Failed to send welcome email:', error)
      // Don't fail registration if email fails
    })

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
