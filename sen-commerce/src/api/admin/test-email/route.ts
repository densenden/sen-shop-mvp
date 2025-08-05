import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import EmailService from "../../../services/email-service"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  try {
    const { type = 'connection-test', email = 'shop@sen.studio' } = req.body

    const emailService = new EmailService()

    if (type === 'connection-test') {
      const result = await emailService.testConnection()
      res.json({
        success: result,
        message: result ? 'Resend connection successful' : 'Resend connection failed',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (type === 'welcome') {
      const result = await emailService.sendWelcomeEmail(email, 'Test Customer')
      res.json({
        success: result,
        message: result ? 'Welcome email sent' : 'Failed to send welcome email',
        email,
        timestamp: new Date().toISOString()
      })
      return
    }

    if (type === 'order-confirmation') {
      const testOrderData = {
        customerEmail: email,
        customerName: 'Test Customer',
        orderId: `order_test_${Date.now()}`,
        orderNumber: `TC${Date.now().toString().slice(-6)}`,
        items: [
          {
            title: 'Digital Art - Mountain Landscape',
            quantity: 1,
            unitPrice: 1999,
            fulfillmentType: 'digital'
          },
          {
            title: 'T-Shirt Print - Abstract Design',
            quantity: 1,
            unitPrice: 1000,
            fulfillmentType: 'printful_pod'
          }
        ],
        totalAmount: 2999,
        currencyCode: 'usd'
      }

      const result = await emailService.sendOrderConfirmation(testOrderData)
      res.json({
        success: result,
        message: result ? 'Order confirmation email sent' : 'Failed to send order confirmation',
        email,
        orderNumber: testOrderData.orderNumber,
        timestamp: new Date().toISOString()
      })
      return
    }

    if (type === 'download-links') {
      const testDownloadData = {
        customerEmail: email,
        customerName: 'Test Customer',
        orderId: `order_test_${Date.now()}`,
        orderNumber: `TC${Date.now().toString().slice(-6)}`,
        downloadLinks: [
          {
            productTitle: 'Digital Art - Mountain Landscape',
            downloadUrl: `${process.env.STORE_URL || 'http://localhost:9000'}/api/store/download/test-token-${Date.now()}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          },
          {
            productTitle: 'Digital Art Collection - Abstract Pack',
            downloadUrl: `${process.env.STORE_URL || 'http://localhost:9000'}/api/store/download/test-token-${Date.now() + 1}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          }
        ]
      }

      const result = await emailService.sendDigitalDownloadLinks(testDownloadData)
      res.json({
        success: result,
        message: result ? 'Download links email sent' : 'Failed to send download links',
        email,
        orderNumber: testDownloadData.orderNumber,
        downloadCount: testDownloadData.downloadLinks?.length || 0,
        timestamp: new Date().toISOString()
      })
      return
    }

    if (type === 'payment-confirmation') {
      const testPaymentData = {
        customerEmail: email,
        customerName: 'Test Customer',
        orderId: `order_test_${Date.now()}`,
        orderNumber: `TC${Date.now().toString().slice(-6)}`,
        paymentAmount: 2999,
        currencyCode: 'usd',
        paymentMethod: 'Credit Card (**** 4242)',
        transactionId: `txn_test_${Date.now()}`
      }

      const result = await emailService.sendPaymentConfirmation(testPaymentData)
      res.json({
        success: result,
        message: result ? 'Payment confirmation email sent' : 'Failed to send payment confirmation',
        email,
        orderNumber: testPaymentData.orderNumber,
        timestamp: new Date().toISOString()
      })
      return
    }

    res.status(400).json({
      success: false,
      message: 'Invalid email type. Use: connection-test, welcome, order-confirmation, download-links, or payment-confirmation',
      validTypes: ['connection-test', 'welcome', 'order-confirmation', 'download-links', 'payment-confirmation']
    })

  } catch (error) {
    console.error('[Admin] Email test error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}