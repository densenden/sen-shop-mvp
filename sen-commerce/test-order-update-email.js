const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const orderUpdateHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Shipped</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #ffffff; margin: 0; padding: 0; line-height: 1.6; color: #374151;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 60px;">
      <img src="data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' version='1.1' viewBox='0 0 521.6 517.4'%3e%3cpath fill='%23000000' d='M226.4,0h1.6c3.3.4,5.6,3.2,5.6,6.3v183.4c0,2.4-1.4,4.7-3.5,5.8-.9.4-1.8.7-2.9.7s-2.8-.4-3.9-1.3L81.2,87.1l-8,9.3c-8.9,10.2-17.1,21.4-24.2,33.1l-6.2,10.1,65.9,50c2.8,2.1,3.4,6.2,1.2,8.9-1.2,1.6-3.2,2.5-5.1,2.5s-2.5-.3-3.8-1.3l-64.3-48.8-6.4,16c-9.1,22.7-14.6,46.6-16.7,71l-1.2,14.2h496.8l-1.2-14.2c-2-24.4-7.6-48.3-16.7-71l-6.4-16-64.3,48.8c-1.4,1.1-2.9,1.3-3.8,1.3-2,0-3.9-.9-5.1-2.5-2.1-2.8-1.6-6.8,1.2-8.9l65.9-50-6.2-10.1c-7.1-11.7-15.2-22.7-24.2-33.1l-8-9.3-142.1,107.8c-1.2.8-2.5,1.3-3.9,1.3s-2-.3-2.9-.7c-2.2-1.1-3.5-3.3-3.5-5.8V6.4c0-3.2,2.4-5.9,5.5-6.3h1.7c56.2,7.4,109.5,33.6,149.8,73.9l.4.4c3.7,3.7,7.4,7.6,10.9,11.7,42,47.7,65.3,108.9,65.3,172.5s-23.2,125.1-65.3,172.8c-3.5,3.9-7.2,7.9-10.9,11.7l-.4.4c-40.3,40.3-93.6,66.6-149.8,73.9h-.8q0-.1,0-.1h-.8c-3.2-.4-5.5-3.2-5.5-6.3v-183.4c0-2.4,1.4-4.7,3.5-5.8.9-.4,1.8-.7,2.9-.7s2.8.4,3.9,1.3l142.1,107.8,8-9.3c8.9-10.2,17.1-21.4,24.2-33.1l6.2-10.1-65.9-50c-1.8-1.4-2.4-3.3-2.5-4.2s-.1-2.9,1.2-4.7c1.2-1.6,3.2-2.5,5.1-2.5s2.5.3,3.8,1.3l64.3,48.8,6.4-16c9.1-22.7,14.6-46.6,16.7-71l1.2-14.2H12.5l1.2,14.2c2,24.4,7.6,48.3,16.7,71l6.4,16,64.3-48.8c1.4-1.1,2.9-1.3,3.8-1.3,2,0,3.9.9,5.1,2.5,1.4,1.8,1.4,3.8,1.3,4.7s-.7,2.9-2.5,4.2l-65.9,50,6.2,10.1c7.1,11.7,15.2,22.7,24.2,33.1l8,9.3,142.1-107.8c1.2-.8,2.5-1.3,3.9-1.3s2,.3,2.9.7c2.2,1.1,3.5,3.3,3.5,5.8v183.4c0,3.2-2.4,5.9-5.6,6.3h-1.6c-56.3-7.5-109.6-33.7-150-73.9l-.4-.4c-3.7-3.7-7.4-7.6-10.9-11.7C23.3,383.7,0,322.5,0,258.8H0C0,195,23.3,133.7,65.3,86c3.7-4.1,7.4-8,10.9-11.7l.4-.4C116.9,33.7,170.1,7.5,226.4,0M300.7,504.1l16.2-3.7c37-8.5,72.2-26,101.6-50.3l12.9-10.5-130.5-99.1v163.6h-.1,0ZM199.8,356.5l-109.5,83.1,12.9,10.5c29.4,24.3,64.6,41.6,101.6,50.3l16.2,3.7v-163.6l-21,16h-.1ZM300.7,177l130.5-99.1-12.9-10.5c-29.4-24.3-64.6-41.6-101.6-50.3l-16.2-3.7v163.6h.1,0ZM204.7,17.1c-37,8.5-72.2,26-101.6,50.3l-12.9,10.5,130.5,99.1V13.4l-16.2,3.7h.1,0Z'/%3e%3c/svg%3e" alt="SenCommerce" style="width: 32px; height: 32px; margin: 0 auto 20px auto; display: block;" />
      <h1 style="color: #1f2937; font-size: 24px; font-weight: 400; margin: 0; font-family: 'Inter', sans-serif;">Order Shipped</h1>
    </div>
    
    <!-- Content -->
    <div style="margin-bottom: 40px;">
      <p style="color: #374151; margin: 0 0 20px 0; font-family: 'Inter', sans-serif;">Hi Denis Kreuzer,</p>
      <p style="color: #374151; margin: 0 0 30px 0; font-family: 'Inter', sans-serif;">Great news! Your order has been shipped and is on its way to you.</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 500; margin: 30px 0 20px 0; font-family: 'Inter', sans-serif;">📦 Order Details</h2>
      <p style="color: #374151; margin: 5px 0; font-family: 'Inter', sans-serif;"><strong>Order Number:</strong> #SC-2024-TEST</p>
      <p style="color: #374151; margin: 5px 0; font-family: 'Inter', sans-serif;"><strong>Status:</strong> Shipped</p>
      <p style="color: #374151; margin: 5px 0; font-family: 'Inter', sans-serif;"><strong>Tracking Number:</strong> 1Z999AA1234567890</p>
      <p style="color: #374151; margin: 5px 0; font-family: 'Inter', sans-serif;"><strong>Estimated Delivery:</strong> ${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <h2 style="color: #1f2937; font-size: 18px; font-weight: 500; margin: 30px 0 20px 0; font-family: 'Inter', sans-serif;">What's Next?</h2>
      <p style="color: #374151; margin: 8px 0; font-family: 'Inter', sans-serif;">• Your package is on its way to your delivery address</p>
      <p style="color: #374151; margin: 8px 0; font-family: 'Inter', sans-serif;">• You can track your shipment using the tracking information above</p>
      <p style="color: #374151; margin: 8px 0; font-family: 'Inter', sans-serif;">• We'll send you another update when your package is delivered</p>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin: 60px 0 40px 0;">
      <p style="color: #9ca3af; font-size: 14px; margin: 0 0 20px 0; font-family: 'Inter', sans-serif;">Track your shipment or view order details</p>
      <a href="https://shop.sen.studio/orders/#SC-2024-TEST" style="background-color: #000000; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: 500; font-family: 'Inter', sans-serif; display: inline-block; margin-right: 15px;">View Order</a>
      <a href="https://www.ups.com/track?trackingNumber=1Z999AA1234567890" style="background-color: #6b7280; color: #ffffff; padding: 16px 32px; text-decoration: none; font-weight: 500; font-family: 'Inter', sans-serif; display: inline-block;">Track Package</a>
    </div>
    
    <!-- Signature -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 40px;">
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px; font-family: 'Inter', sans-serif;">
        Best regards,<br>
        <strong>SenCommerce Team</strong><br>
        E-commerce Solutions<br>
        <a href="https://shop.sen.studio" style="color: #374151; text-decoration: none;">shop.sen.studio</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0 0 15px 0; font-family: 'Inter', sans-serif;">SenCommerce ™ – Fast-track your e-commerce success with full-stack solutions</p>
      <p style="color: #d1d5db; font-size: 11px; line-height: 1.5; margin: 0; font-family: 'Inter', sans-serif;">
        <strong>SEN.CO UG (haftungsbeschränkt)</strong><br>
        Paradiesgasse 53, 60594 Frankfurt am Main, Germany<br>
        Phone: <a href="tel:+4915566179807" style="color: #d1d5db; text-decoration: none;">+49 15566179807</a> | 
        Email: <a href="mailto:shop@sen.studio" style="color: #d1d5db; text-decoration: none;">shop@sen.studio</a><br>
        Registered: Local Court Frankfurt am Main, HRB 129222<br>
        VAT ID: DE358821685
      </p>
    </div>
  </div>
</body>
</html>
`;

async function sendOrderUpdateTest() {
  const testRecipient = 'booking@deniskreuzer.dk';
  
  try {
    console.log('📦 Sending Order Update Email Test...');

    await resend.emails.send({
      from: 'SenCommerce <shop@sen.studio>',
      to: testRecipient,
      subject: '[TEST] Order Shipped - #SC-2024-TEST',
      html: orderUpdateHtml
    });
    
    console.log('✅ Order Update Email sent successfully!');
    console.log(`📬 Check your inbox at: ${testRecipient}`);

  } catch (error) {
    console.error('❌ Error sending order update email:', error);
    process.exit(1);
  }
}

sendOrderUpdateTest();