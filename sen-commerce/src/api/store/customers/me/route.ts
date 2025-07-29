import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { first_name, last_name, phone, email } = req.body as {
      first_name?: string
      last_name?: string
      phone?: string
      email?: string
    }

    // For now, return the updated customer data
    // In a real implementation, you'd update the customer in the database
    const customer = {
      id: "cust_01234567890",
      email: email || "user@example.com",
      first_name: first_name || "John",
      last_name: last_name || "Doe",
      phone: phone || "+1234567890",
      created_at: new Date().toISOString(),
      metadata: {}
    }

    res.json({ customer })
  } catch (error) {
    console.error("Error updating customer profile:", error)
    res.status(500).json({ error: "Failed to update customer profile" })
  }
}

export const middlewares = [
  authenticate("customer", ["session", "bearer"]),
]
