import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  try {
    // Get customer from authentication middleware
    const customerId = req.user?.customer_id
    
    if (!customerId) {
      res.status(401).json({
        error: "Authentication required"
      })
      return
    }

    const customerService = req.scope.resolve("customerModule")
    const customer = await customerService.retrieveCustomer(customerId)

    if (!customer) {
      res.status(404).json({
        error: "Customer not found"
      })
      return
    }

    res.json({
      email_notifications: customer.email_notifications ?? true,
      marketing_emails: customer.marketing_emails ?? true,
      email: customer.email
    })
  } catch (error) {
    console.error("Get email preferences error:", error)
    res.status(500).json({
      error: "Failed to retrieve email preferences",
      details: error.message
    })
  }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  try {
    const customerId = req.user?.customer_id
    
    if (!customerId) {
      res.status(401).json({
        error: "Authentication required"
      })
      return
    }

    const { email_notifications, marketing_emails } = req.body

    if (typeof email_notifications !== 'boolean' && typeof marketing_emails !== 'boolean') {
      res.status(400).json({
        error: "At least one preference must be provided (email_notifications or marketing_emails)"
      })
      return
    }

    const customerService = req.scope.resolve("customerModule")
    
    const updateData: any = {}
    if (typeof email_notifications === 'boolean') {
      updateData.email_notifications = email_notifications
    }
    if (typeof marketing_emails === 'boolean') {
      updateData.marketing_emails = marketing_emails
    }

    const updatedCustomer = await customerService.updateCustomers(customerId, updateData)

    res.json({
      message: "Email preferences updated successfully",
      preferences: {
        email_notifications: updatedCustomer.email_notifications,
        marketing_emails: updatedCustomer.marketing_emails
      }
    })
  } catch (error) {
    console.error("Update email preferences error:", error)
    res.status(500).json({
      error: "Failed to update email preferences",
      details: error.message
    })
  }
}