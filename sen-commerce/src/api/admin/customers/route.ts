import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerService = req.scope.resolve(Modules.CUSTOMER)
    
    // Get query parameters for pagination and filtering
    const { 
      offset = 0, 
      limit = 50, 
      email, 
      first_name, 
      last_name 
    } = req.query
    
    // Build filters
    const filters: any = {}
    if (email) filters.email = email
    if (first_name) filters.first_name = first_name
    if (last_name) filters.last_name = last_name
    
    // Fetch customers
    const customers = await customerService.listCustomers(filters, {
      skip: Number(offset),
      take: Number(limit),
      order: { created_at: 'DESC' }
    })
    
    // Get total count for pagination
    const total = await customerService.listCustomers(filters, { 
      skip: 0, 
      take: 0 
    })
    
    res.json({
      customers,
      count: customers.length,
      total: total.length,
      offset: Number(offset),
      limit: Number(limit)
    })
  } catch (error) {
    console.error("Error fetching customers:", error)
    res.status(500).json({
      error: "Failed to fetch customers",
      details: error.message
    })
  }
}

// Get specific customer by ID
export async function GET_BY_ID(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const customerService = req.scope.resolve(Modules.CUSTOMER)
    
    const customer = await customerService.retrieveCustomer(id)
    
    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }
    
    res.json({ customer })
  } catch (error) {
    console.error("Error fetching customer:", error)
    res.status(500).json({
      error: "Failed to fetch customer",
      details: error.message
    })
  }
}