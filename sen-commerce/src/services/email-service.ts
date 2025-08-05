import sgMail from '@sendgrid/mail'

interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

interface OrderConfirmationData {
  customerEmail: string
  customerName: string
  orderId: string
  totalAmount: number
  currencyCode: string
  items: Array<{
    title: string
    quantity: number
    unitPrice: number
    fulfillmentType?: string
  }>
  downloadLinks?: Array<{
    productTitle: string
    downloadUrl: string
    expiresAt: string
  }>
}

class EmailService {
  private sendGridApiKey: string
  private fromEmail: string
  private storeUrl: string

  constructor() {
    this.sendGridApiKey = process.env.SENDGRID_API_KEY || ''
    this.fromEmail = process.env.SENDGRID_FROM || 'shop@sen.studio'
    this.storeUrl = process.env.STORE_URL || 'http://localhost:3000'
    
    if (!this.sendGridApiKey) {
      console.warn('[EmailService] SENDGRID_API_KEY not configured')
      return
    }
    
    sgMail.setApiKey(this.sendGridApiKey)
    console.log('[EmailService] Initialized with SendGrid')
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    if (!this.sendGridApiKey) {
      console.log('[EmailService] SendGrid not configured, logging email instead')
      this.logEmailContent('Order Confirmation', data)
      return false
    }

    try {
      const emailContent = this.generateOrderConfirmationEmail(data)
      
      const msg = {
        to: data.customerEmail,
        from: this.fromEmail,
        subject: `Order Confirmation #${data.orderId.slice(-8)}`,
        text: emailContent.text,
        html: emailContent.html,
      }

      await sgMail.send(msg)
      console.log(`[EmailService] Order confirmation sent to ${data.customerEmail}`)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send order confirmation:', error)
      return false
    }
  }

  async sendDigitalProductDownloadLinks(data: OrderConfirmationData): Promise<boolean> {
    if (!this.sendGridApiKey) {
      console.log('[EmailService] SendGrid not configured, logging email instead')
      this.logEmailContent('Digital Download Links', data)
      return false
    }

    if (!data.downloadLinks || data.downloadLinks.length === 0) {
      console.log('[EmailService] No download links to send')
      return false
    }

    try {
      const emailContent = this.generateDownloadLinksEmail(data)
      
      const msg = {
        to: data.customerEmail,
        from: this.fromEmail,
        subject: `Your Digital Downloads - Order #${data.orderId.slice(-8)}`,
        text: emailContent.text,
        html: emailContent.html,
      }

      await sgMail.send(msg)
      console.log(`[EmailService] Download links sent to ${data.customerEmail}`)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send download links:', error)
      return false
    }
  }

  private generateOrderConfirmationEmail(data: OrderConfirmationData): { text: string; html: string } {
    const orderTotal = (data.totalAmount / 100).toFixed(2)
    const itemsList = data.items.map(item => 
      `- ${item.title} x${item.quantity} - $${(item.unitPrice * item.quantity / 100).toFixed(2)}`
    ).join('\n')

    const hasDigitalProducts = data.items.some(item => item.fulfillmentType === 'digital')
    const hasPrintProducts = data.items.some(item => item.fulfillmentType === 'printful_pod')

    const text = `
Dear ${data.customerName},

Thank you for your order! Your order #${data.orderId.slice(-8)} has been confirmed.

Order Details:
${itemsList}

Total: $${orderTotal} ${data.currencyCode.toUpperCase()}

${hasDigitalProducts ? 'Your digital products will be available for download shortly. Check your email for download links.' : ''}

${hasPrintProducts ? 'Your print-on-demand items will be processed and shipped within 2-3 business days.' : ''}

You can track your order at: ${this.storeUrl}/account

Best regards,
The SenCommerce Team
    `.trim()

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
        .content { padding: 20px 0; }
        .order-details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .total { font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
            <p>Order #${data.orderId.slice(-8)}</p>
        </div>
        
        <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Thank you for your order! Your order has been confirmed.</p>
            
            <div class="order-details">
                <h3>Order Details:</h3>
                ${data.items.map(item => `
                    <p>- ${item.title} x${item.quantity} - $${(item.unitPrice * item.quantity / 100).toFixed(2)}</p>
                `).join('')}
                <p class="total">Total: $${orderTotal} ${data.currencyCode.toUpperCase()}</p>
            </div>
            
            ${hasDigitalProducts ? '<p><strong>Your digital products will be available for download shortly. Check your email for download links.</strong></p>' : ''}
            
            ${hasPrintProducts ? '<p><strong>Your print-on-demand items will be processed and shipped within 2-3 business days.</strong></p>' : ''}
            
            <p>You can track your order at: <a href="${this.storeUrl}/account">${this.storeUrl}/account</a></p>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The SenCommerce Team</p>
        </div>
    </div>
</body>
</html>
    `

    return { text, html }
  }

  private generateDownloadLinksEmail(data: OrderConfirmationData): { text: string; html: string } {
    if (!data.downloadLinks) {
      throw new Error('No download links provided')
    }

    const downloadList = data.downloadLinks.map(link => 
      `- ${link.productTitle}: ${link.downloadUrl} (expires ${link.expiresAt})`
    ).join('\n')

    const text = `
Dear ${data.customerName},

Your digital products are ready for download!

Order #${data.orderId.slice(-8)}

Downloads:
${downloadList}

Important:
- Download links expire after 7 days or 3 downloads
- Please save your files immediately after downloading
- If you have any issues, contact us at ${this.fromEmail}

Best regards,
The SenCommerce Team
    `.trim()

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Digital Downloads</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px 0; }
        .download-item { background-color: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .download-btn { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
        .warning { background-color: #fff3cd; padding: 10px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Digital Downloads</h1>
            <p>Order #${data.orderId.slice(-8)}</p>
        </div>
        
        <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your digital products are ready for download!</p>
            
            ${data.downloadLinks.map(link => `
                <div class="download-item">
                    <h3>${link.productTitle}</h3>
                    <p><a href="${link.downloadUrl}" class="download-btn">Download Now</a></p>
                    <p><small>Expires: ${link.expiresAt}</small></p>
                </div>
            `).join('')}
            
            <div class="warning">
                <p><strong>Important:</strong></p>
                <ul>
                    <li>Download links expire after 7 days or 3 downloads</li>
                    <li>Please save your files immediately after downloading</li>
                    <li>If you have any issues, contact us at ${this.fromEmail}</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>Best regards,<br>The SenCommerce Team</p>
        </div>
    </div>
</body>
</html>
    `

    return { text, html }
  }

  private logEmailContent(type: string, data: any): void {
    console.log(`[EmailService] ${type} email content (SendGrid not configured):`)
    console.log('To:', data.customerEmail)
    console.log('From:', this.fromEmail)
    console.log('Data:', JSON.stringify(data, null, 2))
  }

  async sendWelcomeEmail(customerEmail: string, customerName: string): Promise<boolean> {
    if (!this.sendGridApiKey) {
      console.log('[EmailService] SendGrid not configured, logging welcome email instead')
      console.log(`Welcome email for ${customerName} <${customerEmail}>`)
      return false
    }

    try {
      const emailContent = this.generateWelcomeEmail(customerName)
      
      const msg = {
        to: customerEmail,
        from: this.fromEmail,
        subject: 'Welcome to SenCommerce - Your Digital Art Journey Begins!',
        text: emailContent.text,
        html: emailContent.html,
      }

      await sgMail.send(msg)
      console.log(`[EmailService] Welcome email sent to ${customerEmail}`)
      return true
    } catch (error) {
      console.error('[EmailService] Failed to send welcome email:', error)
      return false
    }
  }

  private generateWelcomeEmail(customerName: string): { text: string; html: string } {
    const text = `
Dear ${customerName},

Welcome to SenCommerce!

Thank you for joining our digital art community. We're excited to have you on board!

What you can do with your account:
- Browse our exclusive digital art collections
- Purchase and download high-quality digital artworks
- Order custom print-on-demand products
- Track your orders and download history
- Access exclusive member content

Explore our latest collections: ${this.storeUrl}

If you have any questions, feel free to reach out to us at ${this.fromEmail}

Happy creating!
The SenCommerce Team
    `.trim()

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to SenCommerce</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .features { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .feature-item { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
        .feature-item:last-child { border-bottom: none; }
        .cta-button { display: inline-block; background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; background-color: #f9f9f9; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to SenCommerce!</h1>
            <p>Your Digital Art Journey Begins</p>
        </div>
        
        <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for joining our digital art community. We're excited to have you on board!</p>
            
            <div class="features">
                <h3>What you can do with your account:</h3>
                <div class="feature-item">🎨 Browse our exclusive digital art collections</div>
                <div class="feature-item">⬇️ Purchase and download high-quality digital artworks</div>
                <div class="feature-item">🖨️ Order custom print-on-demand products</div>
                <div class="feature-item">📦 Track your orders and download history</div>
                <div class="feature-item">⭐ Access exclusive member content</div>
            </div>
            
            <div style="text-align: center;">
                <a href="${this.storeUrl}" class="cta-button">Explore Collections</a>
            </div>
            
            <p>If you have any questions, feel free to reach out to us at <a href="mailto:${this.fromEmail}">${this.fromEmail}</a></p>
        </div>
        
        <div class="footer">
            <p>Happy creating!<br><strong>The SenCommerce Team</strong></p>
        </div>
    </div>
</body>
</html>
    `

    return { text, html }
  }

  async testConnection(): Promise<boolean> {
    if (!this.sendGridApiKey) {
      console.log('[EmailService] SendGrid not configured for testing')
      return false
    }

    try {
      // Send a test email to verify configuration
      const msg = {
        to: this.fromEmail, // Send to self for testing
        from: this.fromEmail,
        subject: 'SendGrid Test - SenCommerce',
        text: 'This is a test email to verify SendGrid configuration.',
        html: '<p>This is a test email to verify SendGrid configuration.</p>'
      }

      await sgMail.send(msg)
      console.log('[EmailService] Test email sent successfully')
      return true
    } catch (error) {
      console.error('[EmailService] Test email failed:', error)
      return false
    }
  }
}

export default EmailService