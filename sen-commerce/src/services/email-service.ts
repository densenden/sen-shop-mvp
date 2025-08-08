import { Resend } from 'resend'
import { render } from '@react-email/render'
import { WelcomeEmail } from '../emails/WelcomeEmail'
import { OrderConfirmationEmail } from '../emails/OrderConfirmationEmail'
import { DigitalDownloadEmail } from '../emails/DigitalDownloadEmail'
import { PaymentConfirmationEmail } from '../emails/PaymentConfirmationEmail'

interface OrderItem {
  title: string
  quantity: number
  unitPrice: number
  fulfillmentType?: string
}

interface DownloadLink {
  productTitle: string
  downloadUrl: string
  expiresAt: string
}

interface OrderConfirmationData {
  customerEmail: string
  customerName: string
  orderId: string
  orderNumber: string
  items: OrderItem[]
  totalAmount: number
  currencyCode: string
}

interface DigitalDownloadData {
  customerEmail: string
  customerName: string
  orderId: string
  orderNumber: string
  downloadLinks: DownloadLink[]
}

interface PaymentConfirmationData {
  customerEmail: string
  customerName: string
  orderId: string
  orderNumber: string
  paymentAmount: number
  currencyCode: string
  paymentMethod: string
  transactionId?: string
}

class EmailService {
  private resend: Resend
  private fromEmail: string
  private storeUrl: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    this.fromEmail = process.env.EMAIL_FROM || 'shop@sen.studio'
    this.storeUrl = process.env.STORE_URL || 'https://shop.sen.studio'
    
    if (!apiKey) {
      console.warn('[EmailService] RESEND_API_KEY not configured - emails will be logged instead')
      this.resend = null as any
      return
    }
    
    this.resend = new Resend(apiKey)
    console.log('[EmailService] Initialized with Resend')
  }

  async sendWelcomeEmail(customerEmail: string, customerName: string, checkPreferences = false): Promise<boolean> {
    // Welcome emails are always sent regardless of marketing preferences
    // as they are part of the registration process
    if (!this.resend) {
      console.log('[EmailService] Resend not configured, logging welcome email instead')
      console.log(`Welcome email for ${customerName} <${customerEmail}>`)
      return false
    }

    try {
      const html = await render(WelcomeEmail({ 
        customerName, 
        storeUrl: this.storeUrl 
      }))

      const { data, error } = await this.resend.emails.send({
        from: `SenCommerce <${this.fromEmail}>`,
        to: customerEmail,
        subject: 'Welcome to SenCommerce - Your Digital Art Journey Begins! 🎨',
        html,
      })

      if (error) {
        console.error('[EmailService] Welcome email error:', error)
        return false
      }

      console.log(`[EmailService] Welcome email sent to ${customerEmail}`, data?.id)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send welcome email:', error)
      return false
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    if (!this.resend) {
      console.log('[EmailService] Resend not configured, logging order confirmation instead')
      console.log(`Order confirmation for ${data.customerName} <${data.customerEmail}>:`, data)
      return false
    }

    try {
      const html = await render(OrderConfirmationEmail({
        ...data,
        storeUrl: this.storeUrl
      }))

      const { data: result, error } = await this.resend.emails.send({
        from: `SenCommerce <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Order Confirmation #${data.orderNumber} - SenCommerce`,
        html,
      })

      if (error) {
        console.error('[EmailService] Order confirmation email error:', error)
        return false
      }

      console.log(`[EmailService] Order confirmation sent to ${data.customerEmail}`, result?.id)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send order confirmation:', error)
      return false
    }
  }

  async sendDigitalDownloadLinks(data: DigitalDownloadData): Promise<boolean> {
    if (!this.resend) {
      console.log('[EmailService] Resend not configured, logging download links instead')
      console.log(`Download links for ${data.customerName} <${data.customerEmail}>:`, data.downloadLinks)
      return false
    }

    if (!data.downloadLinks || data.downloadLinks.length === 0) {
      console.log('[EmailService] No download links to send')
      return false
    }

    try {
      const html = await render(DigitalDownloadEmail({
        ...data,
        storeUrl: this.storeUrl
      }))

      const { data: result, error } = await this.resend.emails.send({
        from: `SenCommerce <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Your Digital Downloads Are Ready! 🎨 - Order #${data.orderNumber}`,
        html,
      })

      if (error) {
        console.error('[EmailService] Download links email error:', error)
        return false
      }

      console.log(`[EmailService] Download links sent to ${data.customerEmail}`, result?.id)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send download links:', error)
      return false
    }
  }

  async sendPaymentConfirmation(data: PaymentConfirmationData): Promise<boolean> {
    if (!this.resend) {
      console.log('[EmailService] Resend not configured, logging payment confirmation instead')
      console.log(`Payment confirmation for ${data.customerName} <${data.customerEmail}>:`, data)
      return false
    }

    try {
      const html = await render(PaymentConfirmationEmail({
        ...data,
        storeUrl: this.storeUrl
      }))

      const { data: result, error } = await this.resend.emails.send({
        from: `SenCommerce <${this.fromEmail}>`,
        to: data.customerEmail,
        subject: `Payment Confirmed 💳 - Order #${data.orderNumber}`,
        html,
      })

      if (error) {
        console.error('[EmailService] Payment confirmation email error:', error)
        return false
      }

      console.log(`[EmailService] Payment confirmation sent to ${data.customerEmail}`, result?.id)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send payment confirmation:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.resend) {
      console.log('[EmailService] Resend not configured for testing')
      return false
    }

    try {
      // Send a simple test email
      const { data, error } = await this.resend.emails.send({
        from: `SenCommerce <${this.fromEmail}>`,
        to: this.fromEmail, // Send to self for testing
        subject: 'Resend Test - SenCommerce Email Service',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #2563eb;">SenCommerce Email Test</h1>
            <p>This is a test email to verify Resend configuration.</p>
            <p><strong>Status:</strong> ✅ Email service is working correctly!</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
        `,
      })

      if (error) {
        console.error('[EmailService] Test email error:', error)
        return false
      }

      console.log('[EmailService] Test email sent successfully', data?.id)
      return true
    } catch (error) {
      console.error('[EmailService] Test email failed:', error)
      return false
    }
  }
}

export default EmailService