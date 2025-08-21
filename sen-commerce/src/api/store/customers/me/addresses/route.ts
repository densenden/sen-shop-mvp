import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /store/customers/me/addresses - Get customer addresses
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const customer_id = req.query.customer_id as string
    const customer_email = req.query.customer_email as string
    
    if (!customer_id && !customer_email) {
      return res.status(400).json({ error: "Customer ID or email required" })
    }
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get customer with addresses
    const filters: any = {}
    if (customer_id) filters.id = customer_id
    if (customer_email) filters.email = customer_email
    
    const { data: customers } = await query.graph({
      entity: "customer",
      filters,
      fields: [
        "id",
        "email",
        "addresses.*"
      ],
    })
    
    const customer = customers?.[0]
    if (!customer) {
      return res.json({ addresses: [] })
    }
    
    const addresses = (customer.addresses || []).map((addr: any) => ({
      id: addr.id,
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      company: addr.company || "",
      address_1: addr.address_1 || "",
      address_2: addr.address_2 || "",
      city: addr.city || "",
      province: addr.province || addr.state || "",
      postal_code: addr.postal_code || "",
      country_code: addr.country_code || "",
      phone: addr.phone || "",
      is_default_shipping: addr.is_default_shipping || false,
      is_default_billing: addr.is_default_billing || false
    }))
    
    res.json({ addresses })
    
  } catch (error) {
    console.error("Error fetching addresses:", error)
    res.status(500).json({ error: "Failed to fetch addresses" })
  }
}

// POST /store/customers/me/addresses - Create new address
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { customer_id, customer_email, ...addressData } = req.body
    
    if (!customer_id && !customer_email) {
      return res.status(400).json({ error: "Customer ID or email required" })
    }
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const customerModule = req.scope.resolve("customerModule")
    
    // Get customer
    const filters: any = {}
    if (customer_id) filters.id = customer_id
    if (customer_email) filters.email = customer_email
    
    const { data: customers } = await query.graph({
      entity: "customer",
      filters,
      fields: ["id", "email"],
    })
    
    const customer = customers?.[0]
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }
    
    // Create address for customer
    const address = await customerModule.createAddresses({
      customer_id: customer.id,
      first_name: addressData.first_name || "",
      last_name: addressData.last_name || "",
      company: addressData.company || "",
      address_1: addressData.address_1 || "",
      address_2: addressData.address_2 || "",
      city: addressData.city || "",
      province: addressData.province || addressData.state || "",
      postal_code: addressData.postal_code || "",
      country_code: addressData.country_code || "US",
      phone: addressData.phone || "",
      is_default_shipping: addressData.is_default_shipping || false,
      is_default_billing: addressData.is_default_billing || false
    })
    
    res.json({ address })
    
  } catch (error) {
    console.error("Error creating address:", error)
    res.status(500).json({ error: "Failed to create address" })
  }
}

// PUT /store/customers/me/addresses/:id - Update address
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const addressId = req.params.id
    const updateData = req.body
    
    const customerModule = req.scope.resolve("customerModule")
    
    // Update address
    const [address] = await customerModule.updateAddresses(addressId, updateData)
    
    res.json({ address })
    
  } catch (error) {
    console.error("Error updating address:", error)
    res.status(500).json({ error: "Failed to update address" })
  }
}

// DELETE /store/customers/me/addresses/:id - Delete address
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const addressId = req.params.id
    
    const customerModule = req.scope.resolve("customerModule")
    
    // Delete address
    await customerModule.deleteAddresses(addressId)
    
    res.json({ success: true })
    
  } catch (error) {
    console.error("Error deleting address:", error)
    res.status(500).json({ error: "Failed to delete address" })
  }
}