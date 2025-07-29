import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // For now, return mock addresses since customer management is complex
    // In a real implementation, you'd fetch addresses from the database for the authenticated customer
    const addresses = [
      {
        id: "addr_01234567890",
        first_name: "John",
        last_name: "Doe",
        company: "Acme Corp",
        address_1: "123 Main St",
        address_2: "Apt 4B",
        city: "New York",
        province: "NY",
        postal_code: "10001",
        country_code: "us",
        phone: "+1234567890",
        is_default_shipping: true,
        is_default_billing: false
      },
      {
        id: "addr_09876543210",
        first_name: "John",
        last_name: "Doe",
        address_1: "456 Oak Ave",
        city: "Los Angeles",
        province: "CA",
        postal_code: "90210",
        country_code: "us",
        phone: "+1987654321",
        is_default_shipping: false,
        is_default_billing: true
      }
    ]

    res.json({ addresses })
  } catch (error) {
    console.error("Error fetching addresses:", error)
    res.status(500).json({ error: "Failed to fetch addresses" })
  }
}

export const middlewares = [
  authenticate("customer", ["session", "bearer"]),
]
