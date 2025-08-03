import { MedusaRequest } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

export interface AuthenticatedRequest extends MedusaRequest {
  customer?: any
}

export async function authenticateCustomer(req: MedusaRequest): Promise<{ customer: any; error?: string }> {
  try {
    // Check for publishable API key
    const publishableKey = req.headers['x-publishable-api-key']
    if (!publishableKey) {
      return { customer: null, error: "Publishable API key required" }
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { customer: null, error: "Authorization header required" }
    }

    const token = authHeader.split(' ')[1]
    
    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret")
    } catch (error) {
      return { customer: null, error: "Invalid token" }
    }

    // Get customer service
    const customerService = req.scope.resolve(Modules.CUSTOMER)
    
    // Fetch customer
    const customer = await customerService.retrieveCustomer(decoded.customer_id)
    
    if (!customer) {
      return { customer: null, error: "Customer not found" }
    }

    return { customer }
  } catch (error) {
    console.error("Authentication error:", error)
    return { customer: null, error: `Authentication failed: ${error.message}` }
  }
}