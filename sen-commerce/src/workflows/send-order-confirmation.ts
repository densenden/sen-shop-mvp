import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk"
import { createStep } from "@medusajs/workflows-sdk"

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
    
    // For now, just log the confirmation email
    // In production, integrate with SendGrid or another email service
    const emailContent = `
Dear ${data.customer_name},

Thank you for your order! Your order #${data.order_id.slice(-8)} has been confirmed.

Order Details:
${data.items.map(item => 
  `- ${item.title} x${item.quantity} - $${(item.unit_price * item.quantity / 100).toFixed(2)}`
).join('\n')}

Total: $${(data.total_amount / 100).toFixed(2)} ${data.currency_code.toUpperCase()}

${data.items.some(item => item.fulfillment_type === 'digital') ? 
  'Your digital products will be available for download in your account shortly.' : ''}

${data.items.some(item => item.fulfillment_type === 'printful_pod') ? 
  'Your print-on-demand items will be processed and shipped within 2-3 business days.' : ''}

You can track your order at: http://localhost:3000/account

Best regards,
The SenCommerce Team
    `;
    
    console.log(`[Order Confirmation] Email content prepared:`, emailContent);
    
    // Return success
    return {
      success: true,
      email_sent: true,
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