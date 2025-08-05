import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { createStep } from "@medusajs/workflows-sdk"
import EmailService from "../services/email-service"

// Types for the workflow
interface OrderConfirmationData {
  order_id: string
  customer_email: string
  customer_name: string
  total_amount: number
  currency_code: string
  items: Array<{
    title: string
    quantity: number
    unit_price: number
    fulfillment_type?: string
  }>
}

// Step to send confirmation email
const sendOrderConfirmationEmailStep = createStep(
  "send-order-confirmation-email",
  async (data: OrderConfirmationData) => {
    console.log(`[Order Confirmation] Sending email to ${data.customer_email}`)
    console.log(`[Order Confirmation] Order ID: ${data.order_id}`)
    console.log(`[Order Confirmation] Total: ${data.total_amount/100} ${data.currency_code.toUpperCase()}`)
    
    const emailService = new EmailService()
    
    const emailData = {
      customerEmail: data.customer_email,
      customerName: data.customer_name,
      orderId: data.order_id,
      totalAmount: data.total_amount,
      currencyCode: data.currency_code,
      items: data.items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        fulfillmentType: item.fulfillment_type
      }))
    }
    
    const emailSent = await emailService.sendOrderConfirmation(emailData)
    
    // Return success
    return {
      success: true,
      email_sent: emailSent,
      recipient: data.customer_email,
      order_id: data.order_id
    }
  }
)

// Main workflow
export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  (data: OrderConfirmationData) => {
    const result = sendOrderConfirmationEmailStep(data)
    
    return {
      success: true,
      order_id: data.order_id,
      email_result: result
    }
  }
)

export default sendOrderConfirmationWorkflow