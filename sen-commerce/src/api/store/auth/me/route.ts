import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: "Unauthorized - No token provided"
      })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret")
    } catch (error) {
      return res.status(401).json({
        error: "Unauthorized - Invalid token"
      })
    }

    const customerService = req.scope.resolve(Modules.CUSTOMER)
    
    // Fetch customer by ID
    const customer = await customerService.retrieveCustomer(decoded.customer_id)
    
    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }

    res.json({
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        created_at: customer.created_at,
        metadata: customer.metadata
      }
    })
  } catch (error) {
    console.error("Auth me error:", error)
    res.status(500).json({
      error: "Failed to fetch user profile",
      details: error.message
    })
  }
}
