const { render } = require('@react-email/render');
const { Resend } = require('resend');
const { createElement } = require('react');

// Import email components
const { OrderConfirmationEmail } = require('./src/emails/OrderConfirmationEmail.tsx');
const { DigitalDownloadEmail } = require('./src/emails/DigitalDownloadEmail.tsx');
const { WelcomeEmail } = require('./src/emails/WelcomeEmail.tsx');
const { PaymentConfirmationEmail } = require('./src/emails/PaymentConfirmationEmail.tsx');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmails() {
  const testRecipient = 'booking@deniskreuzer.dk';
  
  try {
    console.log('🚀 Starting email tests...\n');

    // Test data
    const customerName = 'Denis Kreuzer';
    const orderId = 'order_test_123';
    const orderNumber = '#SC-2024-TEST';
    const storeUrl = 'https://shop.sen.studio';

    // 1. Welcome Email
    console.log('📧 Sending Welcome Email...');
    const welcomeHtml = await render(
      createElement(WelcomeEmail, {
        customerName,
        storeUrl
      })
    );
    
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: `[TEST] Welcome to SenCommerce, ${customerName}!`,
      html: welcomeHtml
    });
    console.log('✅ Welcome Email sent\n');

    // 2. Payment Confirmation Email
    console.log('📧 Sending Payment Confirmation Email...');
    const paymentHtml = await render(
      createElement(PaymentConfirmationEmail, {
        customerName,
        orderId,
        orderNumber,
        paymentAmount: 2999, // $29.99
        currencyCode: 'USD',
        paymentMethod: 'Credit Card',
        transactionId: 'txn_123456789',
        storeUrl
      })
    );
    
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: `[TEST] Payment Confirmed - Order ${orderNumber}`,
      html: paymentHtml
    });
    console.log('✅ Payment Confirmation Email sent\n');

    // 3. Order Confirmation Email
    console.log('📧 Sending Order Confirmation Email...');
    const orderHtml = await render(
      createElement(OrderConfirmationEmail, {
        customerName,
        orderId,
        orderNumber,
        items: [
          {
            title: 'Digital Artwork - Abstract Design',
            quantity: 1,
            unitPrice: 1999, // $19.99
            fulfillmentType: 'digital'
          },
          {
            title: 'Custom T-Shirt - Large',
            quantity: 2,
            unitPrice: 2499, // $24.99
            fulfillmentType: 'printful_pod'
          }
        ],
        totalAmount: 6997, // $69.97
        currencyCode: 'USD',
        storeUrl
      })
    );
    
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: `[TEST] Order Confirmation ${orderNumber}`,
      html: orderHtml
    });
    console.log('✅ Order Confirmation Email sent\n');

    // 4. Digital Download Email
    console.log('📧 Sending Digital Download Email...');
    const downloadHtml = await render(
      createElement(DigitalDownloadEmail, {
        customerName,
        customerEmail: testRecipient,
        orderId,
        orderNumber,
        downloadLinks: [
          {
            productTitle: 'Digital Artwork - Abstract Design',
            downloadUrl: 'https://shop.sen.studio/downloads/secure-token-123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // 7 days from now
          },
          {
            productTitle: 'Digital Wallpaper Collection',
            downloadUrl: 'https://shop.sen.studio/downloads/secure-token-456',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() // 7 days from now
          }
        ],
        storeUrl
      })
    );
    
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: `[TEST] Your Digital Downloads Are Ready - ${orderNumber}`,
      html: downloadHtml
    });
    console.log('✅ Digital Download Email sent\n');

    console.log('🎉 All test emails sent successfully!');
    console.log(`📬 Check your inbox at: ${testRecipient}`);

  } catch (error) {
    console.error('❌ Error sending test emails:', error);
    process.exit(1);
  }
}

sendTestEmails();