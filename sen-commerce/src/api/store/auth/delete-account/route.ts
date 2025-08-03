import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
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
    
    // Get customer to verify existence
    const customer = await customerService.retrieveCustomer(decoded.customer_id)
    
    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }

    // Delete customer
    await customerService.deleteCustomers([customer.id])

    res.json({
      message: "Account deleted successfully"
    })
  } catch (error) {
    console.error("Account deletion error:", error)
    res.status(500).json({
      error: "Failed to delete account",
      details: error.message
    })
  }
}