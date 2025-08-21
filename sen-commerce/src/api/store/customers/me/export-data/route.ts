import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /store/customers/me/export-data - Export customer data
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const customer_id = req.query.customer_id as string
    const customer_email = req.query.customer_email as string
    
    if (!customer_id && !customer_email) {
      return res.status(400).json({ error: "Customer ID or email required" })
    }
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Build filters
    const filters: any = {}
    if (customer_id) filters.id = customer_id
    if (customer_email) filters.email = customer_email
    
    // Get complete customer data
    const { data: customers } = await query.graph({
      entity: "customer",
      filters,
      fields: [
        "id",
        "email",
        "first_name",
        "last_name",
        "phone",
        "created_at",
        "updated_at",
        "metadata",
        "addresses.*"
      ],
    })
    
    const customer = customers?.[0]
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" })
    }
    
    // Get customer's orders
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { 
        customer_id: customer.id
      },
      fields: [
        "id",
        "display_id",
        "status",
        "email",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "currency_code",
        "created_at",
        "payment_status",
        "fulfillment_status",
        "items.*",
        "items.product.title",
        "items.product.handle",
        "shipping_address.*",
        "billing_address.*"
      ],
    })
    
    // Prepare export data
    const exportData = {
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        phone: customer.phone || "",
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        metadata: customer.metadata || {}
      },
      addresses: (customer.addresses || []).map((addr: any) => ({
        first_name: addr.first_name || "",
        last_name: addr.last_name || "",
        company: addr.company || "",
        address_1: addr.address_1 || "",
        address_2: addr.address_2 || "",
        city: addr.city || "",
        province: addr.province || "",
        postal_code: addr.postal_code || "",
        country_code: addr.country_code || "",
        phone: addr.phone || ""
      })),
      orders: (orders || []).map((order: any) => ({
        order_id: order.id,
        order_number: order.display_id,
        status: order.status,
        total: order.total || 0,
        currency: order.currency_code,
        created_at: order.created_at,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        items: (order.items || []).map((item: any) => ({
          product_name: item.product?.title || item.title || "Product",
          quantity: item.quantity || 1,
          price: item.unit_price || 0,
          total: item.total || 0
        })),
        shipping_address: order.shipping_address ? {
          name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
          address: order.shipping_address.address_1,
          city: order.shipping_address.city,
          postal_code: order.shipping_address.postal_code,
          country: order.shipping_address.country_code
        } : null
      })),
      export_date: new Date().toISOString()
    }
    
    // Convert to JSON string with pretty formatting
    const jsonData = JSON.stringify(exportData, null, 2)
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="customer-data-${customer.email}-${Date.now()}.json"`)
    
    res.send(jsonData)
    
  } catch (error) {
    console.error("Error exporting customer data:", error)
    res.status(500).json({ error: "Failed to export customer data" })
  }
}