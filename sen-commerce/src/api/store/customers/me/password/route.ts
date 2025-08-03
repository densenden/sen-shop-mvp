import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return res.status(400).json({
        error: "Current password and new password are required"
      })
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        error: "New password must be at least 6 characters long"
      })
    }

    // Check for publishable API key
    const publishableKey = req.headers['x-publishable-api-key']
    if (!publishableKey) {
      return res.status(401).json({
        error: "Publishable API key required"
      })
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: "Authorization header required"
      })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret")
    } catch (error) {
      return res.status(401).json({
        error: "Invalid token"
      })
    }

    const customerService = req.scope.resolve(Modules.CUSTOMER)
    
    // Get customer
    const customer = await customerService.retrieveCustomer(decoded.customer_id)
    
    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }

    // Verify current password
    const storedPassword = customer.metadata?.password
    if (!storedPassword || !await bcrypt.compare(current_password, storedPassword)) {
      return res.status(400).json({
        error: "Current password is incorrect"
      })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 10)

    // Update customer with new password
    await customerService.updateCustomers([{
      id: customer.id,
      metadata: {
        ...customer.metadata,
        password: hashedNewPassword
      }
    }])

    res.json({
      message: "Password updated successfully"
    })
  } catch (error) {
    console.error("Password change error:", error)
    res.status(500).json({
      error: "Failed to change password",
      details: error.message
    })
  }
}