import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { authenticateCustomer } from "../../../../../lib/auth-helpers"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Authenticate customer
    const { customer, error } = await authenticateCustomer(req)
    if (error || !customer) {
      return res.status(401).json({
        error: error || "Authentication failed"
      })
    }

    const customerService = req.scope.resolve(Modules.CUSTOMER)
    const orderService = req.scope.resolve(Modules.ORDER)

    // Get customer orders
    let orders = []
    try {
      orders = await orderService.listOrders({ customer_id: customer.id })
    } catch (error) {
      console.log("Could not fetch orders:", error.message)
    }

    // Prepare export data
    const exportData = {
      export_date: new Date().toISOString(),
      customer_info: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        metadata: {
          has_account: customer.metadata?.has_account || false
          // Exclude password from export for security
        }
      },
      orders: orders.map(order => ({
        id: order.id,
        display_id: order.display_id,
        status: order.status,
        total: order.total,
        currency_code: order.currency_code,
        created_at: order.created_at,
        items: order.items?.map(item => ({
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total
        })) || []
      })),
      summary: {
        total_orders: orders.length,
        account_created: customer.created_at,
        data_exported: new Date().toISOString()
      }
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="customer-data-${customer.email}-${new Date().toISOString().split('T')[0]}.json"`)
    
    res.json(exportData)
  } catch (error) {
    console.error("Data export error:", error)
    res.status(500).json({
      error: "Failed to export data",
      details: error.message
    })
  }
}