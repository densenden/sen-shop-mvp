// Test all templates with the new company signature
require('dotenv').config()

async function testCompanySignature() {
  console.log('🏢 Testing SenCommerce templates with company signature...\n')
  
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    console.log('❌ RESEND_API_KEY not configured')
    return
  }
  
  try {
    const { Resend } = require('resend')
    const resend = new Resend(apiKey)
    
    const fromEmail = 'shop@sen.studio'
    const testEmail = 'shop@sen.studio'
    const customerName = 'Denis (Signature Test)'
    const orderNumber = `SIG${Date.now().toString().slice(-6)}`
    
    // Enhanced Welcome Email with Company Signature
    console.log('📧 Sending Welcome Email with Company Signature...')
    const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to SenCommerce</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 20px 0; background-color: #f6f9fc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { color: #2563eb; font-size: 32px; font-weight: 700; margin: 0 0 8px 0; }
        .tagline { color: #64748b; font-size: 14px; margin: 0; }
        .greeting { font-size: 24px; font-weight: 600; color: #1e293b; margin: 0 0 24px 0; text-align: center; }
        .content { padding: 0 20px; }
        .paragraph { font-size: 16px; line-height: 24px; color: #374151; margin: 0 0 16px 0; }
        .cta-section { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        
        /* Company Signature Styles */
        .signature-divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 24px 0; }
        .signature-section { background-color: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .signature-logo { text-align: center; margin-bottom: 20px; }
        .company-logo { opacity: 0.7; filter: grayscale(100%) brightness(1.2); }
        .company-info { text-align: center; }
        .company-name { font-size: 14px; font-weight: 600; color: #64748b; margin: 0 0 12px 0; }
        .address-text { font-size: 12px; color: #64748b; line-height: 16px; margin: 0 0 12px 0; }
        .contact-text { font-size: 12px; color: #64748b; line-height: 16px; margin: 0 0 12px 0; }
        .registration-text { font-size: 11px; color: #64748b; line-height: 14px; margin: 0 0 12px 0; }
        .legal-links { font-size: 11px; color: #64748b; line-height: 14px; margin: 0 0 16px 0; }
        .disclaimer { font-size: 10px; color: #9ca3af; line-height: 13px; margin: 0; font-style: italic; }
        .signature-link { color: #2563eb; text-decoration: underline; }
        .legal-link { color: #64748b; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">SenCommerce</h1>
            <p class="tagline">Digital Art & Print-on-Demand</p>
        </div>
        
        <div class="content">
            <h2 class="greeting">Welcome, ${customerName}! 🎨</h2>
            
            <p class="paragraph">
                Thank you for joining SenCommerce, your premier destination for digital art and custom print-on-demand products.
            </p>
            
            <p class="paragraph">
                We're excited to have you as part of our creative community! Start exploring our collections and discover amazing digital artwork.
            </p>
            
            <div class="cta-section">
                <a href="https://shop.sen.studio" class="cta-button">Start Exploring Collections</a>
            </div>
            
            <p class="paragraph">
                If you have any questions, our team is here to help. Just reply to this email or contact us directly.
            </p>
        </div>
        
        <!-- Company Signature -->
        <hr class="signature-divider">
        <div class="signature-section">
            <div class="signature-logo">
                <svg width="120" height="40" viewBox="0 0 120 40" class="company-logo" style="opacity: 0.7; filter: grayscale(100%) brightness(1.2);">
                    <text x="10" y="25" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#64748b">SEN.CO</text>
                </svg>
            </div>
            
            <div class="company-info">
                <p class="company-name">SEN.CO UG (haftungsbeschränkt)</p>
                <p class="address-text">
                    Paradiesgasse 53<br/>
                    60594 Frankfurt am Main<br/>
                    Germany
                </p>
                
                <p class="contact-text">
                    Email: <a href="mailto:shop@sen.studio" class="signature-link">shop@sen.studio</a><br/>
                    Website: <a href="https://shop.sen.studio" target="_blank" rel="noopener noreferrer" class="signature-link">shop.sen.studio</a>
                </p>
                
                <p class="registration-text">
                    Company Registration: Amtsgericht Frankfurt am Main<br/>
                    Registration Number: [Insert HRB number]<br/>
                    Managing Director: Denis Leif Kreuzer
                </p>
                
                <p class="legal-links">
                    Legal Information:<br/>
                    <a href="https://shop.sen.studio/imprint" target="_blank" rel="noopener noreferrer" class="legal-link">Imprint</a> | 
                    <a href="https://shop.sen.studio/privacy" target="_blank" rel="noopener noreferrer" class="legal-link">Privacy Policy</a> | 
                    <a href="https://shop.sen.studio/terms" target="_blank" rel="noopener noreferrer" class="legal-link">Terms & Conditions</a>
                </p>
                
                <p class="disclaimer">
                    This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed. 
                    If you have received this email in error, please notify us immediately and delete it from your system. 
                    Personal data is processed in accordance with our Privacy Policy linked above.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`
    
    const { data: welcomeData, error: welcomeError } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: '🎨 Welcome to SenCommerce - With Company Signature',
      html: welcomeHtml,
    })
    
    if (welcomeError) {
      console.log('❌ Welcome email failed:', welcomeError)
    } else {
      console.log('✅ Welcome email with signature sent:', welcomeData?.id)
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test Order Confirmation with Signature
    console.log('📧 Sending Order Confirmation with Company Signature...')
    const orderHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 20px 0; background-color: #f6f9fc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px; }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { color: #2563eb; font-size: 32px; font-weight: 700; margin: 0 0 8px 0; }
        .tagline { color: #64748b; font-size: 14px; margin: 0; }
        .greeting { font-size: 24px; font-weight: 600; color: #16a34a; margin: 0 0 24px 0; text-align: center; }
        .content { padding: 0 20px; }
        .paragraph { font-size: 16px; line-height: 24px; color: #374151; margin: 0 0 16px 0; }
        .order-section { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
        .order-title { font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 20px 0; text-align: center; }
        .cta-section { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 16px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        
        /* Company Signature Styles */
        .signature-divider { border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 24px 0; }
        .signature-section { background-color: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .signature-logo { text-align: center; margin-bottom: 20px; }
        .company-logo { opacity: 0.7; filter: grayscale(100%) brightness(1.2); }
        .company-info { text-align: center; }
        .company-name { font-size: 14px; font-weight: 600; color: #64748b; margin: 0 0 12px 0; }
        .address-text { font-size: 12px; color: #64748b; line-height: 16px; margin: 0 0 12px 0; }
        .contact-text { font-size: 12px; color: #64748b; line-height: 16px; margin: 0 0 12px 0; }
        .registration-text { font-size: 11px; color: #64748b; line-height: 14px; margin: 0 0 12px 0; }
        .legal-links { font-size: 11px; color: #64748b; line-height: 14px; margin: 0 0 16px 0; }
        .disclaimer { font-size: 10px; color: #9ca3af; line-height: 13px; margin: 0; font-style: italic; }
        .signature-link { color: #2563eb; text-decoration: underline; }
        .legal-link { color: #64748b; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">SenCommerce</h1>
            <p class="tagline">Digital Art & Print-on-Demand</p>
        </div>
        
        <div class="content">
            <h2 class="greeting">Thank you, ${customerName}! ✅</h2>
            
            <p class="paragraph">
                Your order has been confirmed and is being processed. Here are your order details:
            </p>
            
            <div class="order-section">
                <h3 class="order-title">Order #${orderNumber}</h3>
                <p style="text-align: center; color: #374151;">
                    📱 Digital Art - Mountain Collection: $29.99<br/>
                    🖨️ Custom T-Shirt - Abstract Design: $39.99<br/>
                    <strong>Total: $69.98 USD</strong>
                </p>
            </div>
            
            <div class="cta-section">
                <a href="https://shop.sen.studio/account/orders" class="cta-button">Track Your Order</a>
            </div>
            
            <p class="paragraph">
                Questions about your order? Contact us and we'll help you right away.
            </p>
        </div>
        
        <!-- Company Signature -->
        <hr class="signature-divider">
        <div class="signature-section">
            <div class="signature-logo">
                <svg width="120" height="40" viewBox="0 0 120 40" class="company-logo" style="opacity: 0.7; filter: grayscale(100%) brightness(1.2);">
                    <text x="10" y="25" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#64748b">SEN.CO</text>
                </svg>
            </div>
            
            <div class="company-info">
                <p class="company-name">SEN.CO UG (haftungsbeschränkt)</p>
                <p class="address-text">
                    Paradiesgasse 53<br/>
                    60594 Frankfurt am Main<br/>
                    Germany
                </p>
                
                <p class="contact-text">
                    Email: <a href="mailto:shop@sen.studio" class="signature-link">shop@sen.studio</a><br/>
                    Website: <a href="https://shop.sen.studio" target="_blank" rel="noopener noreferrer" class="signature-link">shop.sen.studio</a>
                </p>
                
                <p class="registration-text">
                    Company Registration: Amtsgericht Frankfurt am Main<br/>
                    Registration Number: [Insert HRB number]<br/>
                    Managing Director: Denis Leif Kreuzer
                </p>
                
                <p class="legal-links">
                    Legal Information:<br/>
                    <a href="https://shop.sen.studio/imprint" target="_blank" rel="noopener noreferrer" class="legal-link">Imprint</a> | 
                    <a href="https://shop.sen.studio/privacy" target="_blank" rel="noopener noreferrer" class="legal-link">Privacy Policy</a> | 
                    <a href="https://shop.sen.studio/terms" target="_blank" rel="noopener noreferrer" class="legal-link">Terms & Conditions</a>
                </p>
                
                <p class="disclaimer">
                    This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed. 
                    If you have received this email in error, please notify us immediately and delete it from your system. 
                    Personal data is processed in accordance with our Privacy Policy linked above.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`
    
    const { data: orderData, error: orderError } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: `✅ Order Confirmation #${orderNumber} - With Company Signature`,
      html: orderHtml,
    })
    
    if (orderError) {
      console.log('❌ Order confirmation failed:', orderError)
    } else {
      console.log('✅ Order confirmation with signature sent:', orderData?.id)
    }
    
    console.log('\n🎉 Company signature templates sent!')
    console.log('\n📧 Check your inbox at shop@sen.studio for emails with:')
    console.log('   • Professional SEN.CO company signature')
    console.log('   • Light grey styled logo')
    console.log('   • Complete company registration details')
    console.log('   • Legal links (Imprint, Privacy, Terms)')
    console.log('   • Confidentiality disclaimer')
    console.log('   • Frankfurt am Main address')
    console.log('   • Managing Director: Denis Leif Kreuzer')
    
    console.log('\n✨ All email templates now include:')
    console.log('   • SEN.CO UG (haftungsbeschränkt) branding')
    console.log('   • Professional legal compliance')
    console.log('   • Consistent company signature across all emails')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testCompanySignature().catch(console.error)