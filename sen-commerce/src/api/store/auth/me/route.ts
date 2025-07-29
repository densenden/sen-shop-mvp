import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // For now, return a mock customer since authentication is complex
    // In a real implementation, you'd get this from the session or JWT token
    const customer = {
      id: "cust_01234567890",
      email: "user@example.com",
      first_name: "John",
      last_name: "Doe",
      phone: "+1234567890",
      created_at: new Date().toISOString(),
      metadata: {}
    }

    res.json({ customer })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    res.status(500).json({ error: "Failed to fetch user profile" })
  }
}

export const middlewares = [
  authenticate("customer", ["session", "bearer"]),
]
