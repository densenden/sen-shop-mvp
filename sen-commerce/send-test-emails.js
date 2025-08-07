const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple HTML email templates for testing
const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to SenCommerce</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ffffff; margin: 0; padding: 0; line-height: 1.6; color: #374151;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 60px;">
      <div style="width: 32px; height: 32px; background-color: #000000; border-radius: 4px; margin: 0 auto 20px auto;"></div>
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 400; margin: 0; font-family: 'Inter', sans-serif;">Welcome to SenCommerce</h1>
    </div>
    
    <!-- Content -->
    <div style="margin-bottom: 40px;">
      <p style="color: #374151; margin: 0 0 20px 0; font-family: 'Inter', sans-serif;">Hi Denis Kreuzer,</p>
      <p style="color: #374151; margin: 0 0 30px 0; font-family: 'Inter', sans-serif;">Thank you for joining SenCommerce, your premier destination for digital art and custom print-on-demand products.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 500; margin: 30px 0 20px 0; font-family: 'Inter', sans-serif;">Your Creative Journey Starts Here</h2>
      <p style="color: #374151; margin: 0 0 30px 0; font-family: 'Inter', sans-serif;">Explore our curated collections and find your perfect artwork.</p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin: 60px 0 40px 0;">
      <a href="https://shop.sen.studio" style="background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: 500; font-family: 'Inter', sans-serif; display: inline-block;">Browse Collections</a>
    </div>
    
    <!-- Signature -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
        Best regards,<br>
        <strong>SenCommerce Team</strong><br>
        E-commerce Solutions<br>
        <a href="https://shop.sen.studio" style="color: #ea580c;">shop.sen.studio</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">SenCommerce ™ – Fast-track your e-commerce success with full-stack solutions</p>
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.4; margin: 12px 0 0 0;">
        <strong>SEN.CO UG (haftungsbeschränkt)</strong><br>
        Paradiesgasse 53, 60594 Frankfurt am Main, Germany<br>
        Phone: <a href="tel:+4915566179807" style="color: #d1d5db;">+49 15566179807</a> | 
        Email: <a href="mailto:shop@sen.studio" style="color: #d1d5db;">shop@sen.studio</a><br>
        Registered: Local Court Frankfurt am Main, HRB 129222<br>
        VAT ID: DE358821685
      </p>
    </div>
  </div>
</body>
</html>
`;

const orderConfirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmed</title>
</head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://shop.sen.studio/logo.svg" alt="SenCommerce" style="width: 25px; height: 25px; margin-bottom: 15px;">
      <h1 style="color: #1f2937; font-size: 28px; font-weight: 300; margin: 0; letter-spacing: 0.5px;">Order Confirmed</h1>
    </div>
    
    <!-- Content -->
    <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hi Denis Kreuzer,</p>
    <p style="color: #374151; margin-bottom: 25px;">Thank you for your order! We're excited to get your products to you. Your order has been confirmed and is being processed.</p>
    
    <!-- Order Details -->
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <h2 style="color: #ea580c; font-size: 20px; font-weight: 500; margin: 0 0 15px 0;">Order Details</h2>
      <p style="color: #374151; margin: 5px 0;"><strong>Order Number:</strong> #SC-2024-TEST</p>
      <p style="color: #374151; margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p style="color: #374151; margin: 5px 0;"><strong>Total:</strong> $69.97 USD</p>
    </div>
    
    <!-- Items -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #1f2937; font-size: 20px; font-weight: 500; margin: 0 0 15px 0;">Items Ordered</h2>
      <div style="margin-bottom: 15px;">
        <p style="color: #374151; font-weight: 500; margin: 0;">1x Digital Artwork - Abstract Design</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">📱 Digital Download - $19.99</p>
      </div>
      <div>
        <p style="color: #374151; font-weight: 500; margin: 0;">2x Custom T-Shirt - Large</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">🖨️ Print-on-Demand - $49.98</p>
      </div>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://shop.sen.studio/orders/#SC-2024-TEST" style="background-color: #ea580c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Track Your Order</a>
    </div>
    
    <!-- Signature -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
        Best regards,<br>
        <strong>SenCommerce Team</strong><br>
        E-commerce Solutions<br>
        <a href="https://shop.sen.studio" style="color: #ea580c;">shop.sen.studio</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">SenCommerce ™ – Fast-track your e-commerce success with full-stack solutions</p>
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.4; margin: 12px 0 0 0;">
        <strong>SEN.CO UG (haftungsbeschränkt)</strong><br>
        Paradiesgasse 53, 60594 Frankfurt am Main, Germany<br>
        Phone: <a href="tel:+4915566179807" style="color: #d1d5db;">+49 15566179807</a> | 
        Email: <a href="mailto:shop@sen.studio" style="color: #d1d5db;">shop@sen.studio</a><br>
        Registered: Local Court Frankfurt am Main, HRB 129222<br>
        VAT ID: DE358821685
      </p>
    </div>
  </div>
</body>
</html>
`;

const paymentConfirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Confirmed</title>
</head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://shop.sen.studio/logo.svg" alt="SenCommerce" style="width: 25px; height: 25px; margin-bottom: 15px;">
      <h1 style="color: #1f2937; font-size: 28px; font-weight: 300; margin: 0; letter-spacing: 0.5px;">Payment Confirmed</h1>
    </div>
    
    <!-- Content -->
    <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hi Denis Kreuzer,</p>
    <p style="color: #374151; margin-bottom: 25px;">Great news! We've successfully processed your payment for order #SC-2024-TEST. 💳</p>
    
    <!-- Payment Details -->
    <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <h2 style="color: #15803d; font-size: 20px; font-weight: 500; margin: 0 0 15px 0;">✅ Payment Confirmed</h2>
      <div style="display: flex; justify-content: space-between; margin: 10px 0;">
        <span style="color: #166534; font-weight: 500; font-size: 14px;">Order Number:</span>
        <span style="color: #15803d; font-weight: 600; font-size: 14px;">#SC-2024-TEST</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 10px 0;">
        <span style="color: #166534; font-weight: 500; font-size: 14px;">Payment Amount:</span>
        <span style="color: #15803d; font-weight: 600; font-size: 14px;">$29.99 USD</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 10px 0;">
        <span style="color: #166534; font-weight: 500; font-size: 14px;">Payment Method:</span>
        <span style="color: #15803d; font-weight: 600; font-size: 14px;">Credit Card</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 10px 0;">
        <span style="color: #166534; font-weight: 500; font-size: 14px;">Payment Date:</span>
        <span style="color: #15803d; font-weight: 600; font-size: 14px;">${new Date().toLocaleDateString()}</span>
      </div>
    </div>
    
    <!-- What's Next -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #1f2937; font-size: 20px; font-weight: 500; margin: 0 0 15px 0;">What Happens Next?</h2>
      <p style="color: #374151; font-size: 14px; margin: 8px 0;">✅ Your payment has been processed successfully</p>
      <p style="color: #374151; font-size: 14px; margin: 8px 0;">📦 Your order is now being prepared for fulfillment</p>
      <p style="color: #374151; font-size: 14px; margin: 8px 0;">📧 You'll receive order confirmation and tracking information shortly</p>
      <p style="color: #374151; font-size: 14px; margin: 8px 0;">💾 Digital products will be available for download within minutes</p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://shop.sen.studio/account/orders/order_test_123" style="background-color: #ea580c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Order Details</a>
    </div>
    
    <!-- Signature -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
        Best regards,<br>
        <strong>SenCommerce Team</strong><br>
        E-commerce Solutions<br>
        <a href="https://shop.sen.studio" style="color: #ea580c;">shop.sen.studio</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">SenCommerce ™ – Fast-track your e-commerce success with full-stack solutions</p>
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.4; margin: 12px 0 0 0;">
        <strong>SEN.CO UG (haftungsbeschränkt)</strong><br>
        Paradiesgasse 53, 60594 Frankfurt am Main, Germany<br>
        Phone: <a href="tel:+4915566179807" style="color: #d1d5db;">+49 15566179807</a> | 
        Email: <a href="mailto:shop@sen.studio" style="color: #d1d5db;">shop@sen.studio</a><br>
        Registered: Local Court Frankfurt am Main, HRB 129222<br>
        VAT ID: DE358821685
      </p>
    </div>
  </div>
</body>
</html>
`;

const digitalDownloadHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Digital Downloads Ready</title>
</head>
<body style="font-family: 'Inter', Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="https://shop.sen.studio/logo.svg" alt="SenCommerce" style="width: 25px; height: 25px; margin-bottom: 15px;">
      <h1 style="color: #1f2937; font-size: 28px; font-weight: 300; margin: 0; letter-spacing: 0.5px;">Digital Downloads Ready</h1>
    </div>
    
    <!-- Content -->
    <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Hi Denis Kreuzer,</p>
    <p style="color: #374151; margin-bottom: 25px;">Great news! Your digital products from order <strong>#SC-2024-TEST</strong> are now ready for download.</p>
    
    <!-- Download Notice -->
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
      <h2 style="color: #ea580c; font-size: 20px; font-weight: 500; margin: 0 0 15px 0;">📱 Digital Downloads Ready</h2>
      <p style="color: #374151; margin: 0;">Click the download links below to access your digital products. These links are secure and will expire in 7 days.</p>
    </div>
    
    <!-- Download Links -->
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h2 style="color: #1f2937; font-size: 20px; font-weight: 500; margin: 0 0 15px 0;">Your Downloads</h2>
      
      <div style="margin-bottom: 20px;">
        <p style="color: #374151; font-weight: 500; margin: 0 0 5px 0;">Digital Artwork - Abstract Design</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Expires: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        <a href="https://shop.sen.studio/downloads/secure-token-123" style="background-color: #ea580c; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Download Now</a>
      </div>
      
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      
      <div>
        <p style="color: #374151; font-weight: 500; margin: 0 0 5px 0;">Digital Wallpaper Collection</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Expires: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
        <a href="https://shop.sen.studio/downloads/secure-token-456" style="background-color: #ea580c; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">Download Now</a>
      </div>
    </div>
    
    <!-- Important Information -->
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h3 style="color: #d97706; font-weight: 600; font-size: 16px; margin: 0 0 10px 0;">⚠️ Important Information</h3>
      <p style="color: #92400e; font-size: 14px; margin: 8px 0;">• Download links expire in 7 days for security</p>
      <p style="color: #92400e; font-size: 14px; margin: 8px 0;">• Please download your files immediately and save them locally</p>
      <p style="color: #92400e; font-size: 14px; margin: 8px 0;">• Contact us if you need help accessing your downloads</p>
    </div>
    
    <!-- Support -->
    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">Need assistance? We're here to help!</p>
      <a href="https://shop.sen.studio/support" style="background-color: #6b7280; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Contact Support</a>
    </div>
    
    <!-- Signature -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
        Best regards,<br>
        <strong>SenCommerce Team</strong><br>
        E-commerce Solutions<br>
        <a href="https://shop.sen.studio" style="color: #ea580c;">shop.sen.studio</a>
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 15px 0 0 0;">SenCommerce ™ – Fast-track your e-commerce success with full-stack solutions</p>
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.4; margin: 12px 0 0 0;">
        <strong>SEN.CO UG (haftungsbeschränkt)</strong><br>
        Paradiesgasse 53, 60594 Frankfurt am Main, Germany<br>
        Phone: <a href="tel:+4915566179807" style="color: #d1d5db;">+49 15566179807</a> | 
        Email: <a href="mailto:shop@sen.studio" style="color: #d1d5db;">shop@sen.studio</a><br>
        Registered: Local Court Frankfurt am Main, HRB 129222<br>
        VAT ID: DE358821685
      </p>
    </div>
  </div>
</body>
</html>
`;

async function sendTestEmails() {
  const testRecipient = 'booking@deniskreuzer.dk';
  
  try {
    console.log('🚀 Starting email tests...\n');

    // 1. Welcome Email
    console.log('📧 Sending Welcome Email...');
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: '[TEST] Welcome to SenCommerce, Denis!',
      html: welcomeHtml
    });
    console.log('✅ Welcome Email sent\n');

    // 2. Payment Confirmation Email
    console.log('📧 Sending Payment Confirmation Email...');
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: '[TEST] Payment Confirmed - Order #SC-2024-TEST',
      html: paymentConfirmationHtml
    });
    console.log('✅ Payment Confirmation Email sent\n');

    // 3. Order Confirmation Email
    console.log('📧 Sending Order Confirmation Email...');
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: '[TEST] Order Confirmation #SC-2024-TEST',
      html: orderConfirmationHtml
    });
    console.log('✅ Order Confirmation Email sent\n');

    // 4. Digital Download Email
    console.log('📧 Sending Digital Download Email...');
    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: '[TEST] Your Digital Downloads Are Ready - #SC-2024-TEST',
      html: digitalDownloadHtml
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