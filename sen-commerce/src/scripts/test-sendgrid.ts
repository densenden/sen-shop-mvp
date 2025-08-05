import EmailService from '../services/email-service'
import { loadEnv } from '@medusajs/framework/utils'

// Load environment variables
loadEnv(process.env.NODE_ENV || 'development', process.cwd())

async function testSendGrid() {
  console.log('🧪 Testing SendGrid Integration...')
  
  const emailService = new EmailService()
  
  // Test 1: Connection test
  console.log('\n1. Testing SendGrid connection...')
  const connectionTest = await emailService.testConnection()
  if (connectionTest) {
    console.log('✅ SendGrid connection successful!')
  } else {
    console.log('❌ SendGrid connection failed!')
    return
  }
  
  // Test 2: Order confirmation email
  console.log('\n2. Testing order confirmation email...')
  const orderConfirmationData = {
    customerEmail: 'shop@sen.studio', // Send to yourself for testing
    customerName: 'Test Customer',
    orderId: 'order_test_123456789',
    totalAmount: 2999, // $29.99 in cents
    currencyCode: 'usd',
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
    ]
  }
  
  const orderEmailSent = await emailService.sendOrderConfirmation(orderConfirmationData)
  if (orderEmailSent) {
    console.log('✅ Order confirmation email sent!')
  } else {
    console.log('❌ Order confirmation email failed!')
  }
  
  // Test 3: Download links email
  console.log('\n3. Testing download links email...')
  const downloadLinksData = {
    ...orderConfirmationData,
    downloadLinks: [
      {
        productTitle: 'Digital Art - Mountain Landscape',
        downloadUrl: 'http://localhost:9000/api/store/download/test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    ]
  }
  
  const downloadEmailSent = await emailService.sendDigitalProductDownloadLinks(downloadLinksData)
  if (downloadEmailSent) {
    console.log('✅ Download links email sent!')
  } else {
    console.log('❌ Download links email failed!')
  }
  
  console.log('\n📧 SendGrid test completed! Check your email at shop@sen.studio')
  console.log('\n🔍 If emails are not received, check:')
  console.log('   - SendGrid API key is correct')
  console.log('   - shop@sen.studio is verified in SendGrid')
  console.log('   - Check spam folder')
  console.log('   - Check SendGrid activity logs')
}

// Run the test
testSendGrid().catch(console.error)