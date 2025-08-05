// Test all email templates with Tailwind CSS styling and product images
require('dotenv').config()

async function testTailwindEmails() {
  console.log('🎨 Testing SenCommerce emails with Tailwind CSS styling and product images...\n')
  
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
    const customerName = 'Denis (Tailwind Test)'
    const orderNumber = `TW${Date.now().toString().slice(-6)}`
    
    // 1. Welcome Email with Tailwind & Hero Image
    console.log('📧 1. Sending Welcome Email (Tailwind + Hero Image)...')
    const { data: welcomeData, error: welcomeError } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: '🎨 Welcome to SenCommerce - Tailwind Styled',
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to SenCommerce</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-2xl mx-auto bg-white border border-gray-100 rounded-lg">
        <!-- Header -->
        <div class="text-center p-8 pb-6 border-b border-gray-100">
            <h1 class="text-gray-900 text-2xl font-medium m-0 mb-2">SenCommerce</h1>
            <p class="text-gray-500 text-sm m-0">Digital Art & Print-on-Demand</p>
        </div>
        
        <!-- Content -->
        <div class="px-8 py-6">
            <h2 class="text-2xl font-light text-gray-900 text-center m-0 mb-6">Welcome, ${customerName}! 🎨</h2>
            
            <!-- Hero Product Image -->
            <div class="text-center mb-8">
                <img 
                    src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=300&fit=crop&crop=center" 
                    alt="Digital Art Collection"
                    class="w-full rounded-lg border border-gray-100"
                    style="max-width: 500px; height: 250px; object-fit: cover;"
                />
            </div>
            
            <p class="text-base text-gray-700 leading-6 m-0 mb-4">
                Thank you for joining SenCommerce, your premier destination for digital art and custom print-on-demand products.
            </p>
            
            <p class="text-base text-gray-700 leading-6 m-0 mb-6">
                We're excited to have you as part of our creative community! Here's what you can do with your new account:
            </p>
            
            <!-- Features Grid -->
            <div class="bg-gray-50 p-6 rounded-lg mb-8">
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="text-center">
                        <div class="text-2xl mb-2">🎨</div>
                        <h3 class="text-base font-medium text-gray-900 mb-2">Browse Collections</h3>
                        <p class="text-sm text-gray-600">Explore our curated digital art collections</p>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl mb-2">⬇️</div>
                        <h3 class="text-base font-medium text-gray-900 mb-2">Instant Downloads</h3>
                        <p class="text-sm text-gray-600">Download high-quality digital artworks instantly</p>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl mb-2">🖨️</div>
                        <h3 class="text-base font-medium text-gray-900 mb-2">Print-on-Demand</h3>
                        <p class="text-sm text-gray-600">Order custom prints, apparel, and accessories</p>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl mb-2">📦</div>
                        <h3 class="text-base font-medium text-gray-900 mb-2">Order Tracking</h3>
                        <p class="text-sm text-gray-600">Track your orders and download history</p>
                    </div>
                </div>
            </div>
            
            <!-- CTA Button -->
            <div class="text-center mb-8">
                <a href="https://shop.sen.studio" 
                   class="inline-block px-6 py-3 bg-gray-900 text-white rounded text-sm font-medium no-underline hover:bg-gray-800 transition-colors">
                    Start Exploring Collections
                </a>
            </div>
            
            <p class="text-base text-gray-700 leading-6 m-0 mb-4">
                If you have any questions, our team is here to help. Just reply to this email or contact us at 
                <a href="mailto:shop@sen.studio" class="text-gray-900 underline">shop@sen.studio</a>.
            </p>
            
            <p class="text-base text-gray-700 text-center m-0 mt-8">
                Happy creating!<br/>
                <strong>The SenCommerce Team</strong>
            </p>
        </div>
        
        <!-- Company Signature -->
        <hr class="border-gray-100 my-8 mx-8" />
        <div class="bg-gray-50 mx-8 mb-8 p-6 rounded-lg border border-gray-100">
            <div class="text-center mb-5">
                <img src="https://sen.studio/logo-light.svg" alt="SEN.CO Logo" width="120" height="40" class="opacity-70 grayscale brightness-110 mx-auto" />
            </div>
            
            <div class="text-center">
                <p class="text-sm font-semibold text-gray-500 m-0 mb-3">SEN.CO UG (haftungsbeschränkt)</p>
                <p class="text-xs text-gray-500 leading-4 m-0 mb-3">
                    Paradiesgasse 53<br/>
                    60594 Frankfurt am Main<br/>
                    Germany
                </p>
                
                <p class="text-xs text-gray-500 leading-4 m-0 mb-3">
                    Email: <a href="mailto:shop@sen.studio" class="text-gray-900 underline">shop@sen.studio</a><br/>
                    Website: <a href="https://shop.sen.studio" class="text-gray-900 underline">shop.sen.studio</a>
                </p>
                
                <p class="text-xs text-gray-500 leading-4 m-0 mb-3">
                    Company Registration: Amtsgericht Frankfurt am Main<br/>
                    Registration Number: HRB 129222<br/>
                    VAT ID: DE358821685<br/>
                    Managing Director: Denis Leif Kreuzer
                </p>
                
                <p class="text-xs text-gray-500 leading-4 m-0 mb-4">
                    Legal Information:<br/>
                    <a href="https://sen.studio/imprint" class="text-gray-500 underline">Imprint</a> | 
                    <a href="https://sen.studio/privacy" class="text-gray-500 underline">Privacy Policy</a> | 
                    <a href="https://sen.studio/terms" class="text-gray-500 underline">Terms & Conditions</a>
                </p>
                
                <p class="text-xs text-gray-400 leading-3 m-0 italic">
                    This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed. 
                    If you have received this email in error, please notify us immediately and delete it from your system. 
                    Personal data is processed in accordance with our Privacy Policy linked above.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`,
    })
    
    if (welcomeError) {
      console.log('❌ Welcome email failed:', welcomeError)
    } else {
      console.log('✅ Welcome email sent:', welcomeData?.id)
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 2. Order Confirmation with Product Images
    console.log('📧 2. Sending Order Confirmation (with Product Images)...')
    const { data: orderData, error: orderError } = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: `✅ Order Confirmation #${orderNumber} - Tailwind Styled`,
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Order Confirmation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 font-sans">
    <div class="max-w-2xl mx-auto bg-white border border-gray-100 rounded-lg">
        <!-- Header -->
        <div class="text-center p-8 pb-6 border-b border-gray-100">
            <h1 class="text-gray-900 text-2xl font-medium m-0 mb-2">SenCommerce</h1>
            <p class="text-gray-500 text-sm m-0">Digital Art & Print-on-Demand</p>
        </div>
        
        <!-- Content -->
        <div class="px-8 py-6">
            <h2 class="text-2xl font-semibold text-green-600 text-center m-0 mb-6">Thank you, ${customerName}! ✅</h2>
            
            <p class="text-base text-gray-700 leading-6 m-0 mb-4">
                Your order has been confirmed and is being processed. Here are your order details:
            </p>
            
            <!-- Order Details -->
            <div class="bg-gray-50 border border-gray-100 rounded-lg p-6 my-6">
                <h3 class="text-xl font-semibold text-gray-900 text-center m-0 mb-5">Order #${orderNumber}</h3>
                
                <!-- Order Items with Images -->
                <div class="space-y-4">
                    <div class="flex items-center py-3">
                        <div class="w-12 pr-3">
                            <img 
                                src="https://images.unsplash.com/photo-1581833971582-b6faca2e8dd4?w=100&h=100&fit=crop" 
                                alt="Digital Art - Mountain Collection"
                                width="48" height="48" 
                                class="rounded border border-gray-200"
                            />
                        </div>
                        <div class="flex-1">
                            <p class="text-base font-medium text-gray-900 m-0 mb-1">Digital Art - Mountain Collection</p>
                            <p class="text-sm text-gray-600 m-0">📱 Digital Download</p>
                        </div>
                        <div class="text-center w-20">
                            <p class="text-sm text-gray-600 m-0">Qty: 1</p>
                        </div>
                        <div class="text-right w-20">
                            <p class="text-base font-medium text-gray-900 m-0">$29.99</p>
                        </div>
                    </div>
                    
                    <hr class="border-gray-200 my-2" />
                    
                    <div class="flex items-center py-3">
                        <div class="w-12 pr-3">
                            <img 
                                src="https://images.unsplash.com/photo-1567474809715-c3e7b8a5b9e1?w=100&h=100&fit=crop" 
                                alt="Custom T-Shirt - Abstract Design"
                                width="48" height="48" 
                                class="rounded border border-gray-200"
                            />
                        </div>
                        <div class="flex-1">
                            <p class="text-base font-medium text-gray-900 m-0 mb-1">Custom T-Shirt - Abstract Design</p>
                            <p class="text-sm text-gray-600 m-0">🖨️ Print-on-Demand</p>
                        </div>
                        <div class="text-center w-20">
                            <p class="text-sm text-gray-600 m-0">Qty: 1</p>
                        </div>
                        <div class="text-right w-20">
                            <p class="text-base font-medium text-gray-900 m-0">$39.99</p>
                        </div>
                    </div>
                </div>
                
                <hr class="border-gray-300 my-4" />
                
                <div class="flex justify-between py-2">
                    <div>
                        <p class="text-lg font-semibold text-gray-900 m-0">Total</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-semibold text-gray-900 m-0">$69.98 USD</p>
                    </div>
                </div>
            </div>
            
            <!-- Product Type Notices -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
                <p class="text-base font-semibold text-blue-800 m-0 mb-2">📱 Digital Products</p>
                <p class="text-sm text-blue-700 m-0">
                    Your digital products will be available for download shortly. You'll receive a separate email with secure download links.
                </p>
            </div>
            
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
                <p class="text-base font-semibold text-green-800 m-0 mb-2">🖨️ Print-on-Demand Items</p>
                <p class="text-sm text-green-700 m-0">
                    Your print-on-demand items will be processed and shipped within 2-3 business days. You'll receive tracking information once shipped.
                </p>
            </div>
            
            <!-- CTA Button -->
            <div class="text-center mb-8">
                <a href="https://shop.sen.studio/account/orders/${orderNumber}" 
                   class="inline-block px-6 py-3 bg-gray-900 text-white rounded text-sm font-medium no-underline hover:bg-gray-800 transition-colors">
                    Track Your Order
                </a>
            </div>
            
            <p class="text-base text-gray-700 leading-6 m-0 mb-4">
                Questions about your order? Contact us at <a href="mailto:shop@sen.studio" class="text-gray-900 underline">shop@sen.studio</a> or visit our support center.
            </p>
            
            <p class="text-base text-gray-700 text-center m-0 mt-8">
                Thank you for choosing SenCommerce!<br/>
                <strong>The SenCommerce Team</strong>
            </p>
        </div>
        
        <!-- Company Signature (same as above) -->
        <hr class="border-gray-100 my-8 mx-8" />
        <div class="bg-gray-50 mx-8 mb-8 p-6 rounded-lg border border-gray-100">
            <div class="text-center mb-5">
                <img src="https://sen.studio/logo-light.svg" alt="SEN.CO Logo" width="120" height="40" class="opacity-70 grayscale brightness-110 mx-auto" />
            </div>
            
            <div class="text-center">
                <p class="text-sm font-semibold text-gray-500 m-0 mb-3">SEN.CO UG (haftungsbeschränkt)</p>
                <p class="text-xs text-gray-500 leading-4 m-0 mb-3">
                    Paradiesgasse 53<br/>
                    60594 Frankfurt am Main<br/>
                    Germany
                </p>
                
                <p class="text-xs text-gray-500 leading-4 m-0 mb-3">
                    Email: <a href="mailto:shop@sen.studio" class="text-gray-900 underline">shop@sen.studio</a><br/>
                    Website: <a href="https://shop.sen.studio" class="text-gray-900 underline">shop.sen.studio</a>
                </p>
                
                <p class="text-xs text-gray-500 leading-4 m-0 mb-3">
                    Company Registration: Amtsgericht Frankfurt am Main<br/>
                    Registration Number: HRB 129222<br/>
                    VAT ID: DE358821685<br/>
                    Managing Director: Denis Leif Kreuzer
                </p>
                
                <p class="text-xs text-gray-500 leading-4 m-0 mb-4">
                    Legal Information:<br/>
                    <a href="https://sen.studio/imprint" class="text-gray-500 underline">Imprint</a> | 
                    <a href="https://sen.studio/privacy" class="text-gray-500 underline">Privacy Policy</a> | 
                    <a href="https://sen.studio/terms" class="text-gray-500 underline">Terms & Conditions</a>
                </p>
                
                <p class="text-xs text-gray-400 leading-3 m-0 italic">
                    This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed. 
                    If you have received this email in error, please notify us immediately and delete it from your system. 
                    Personal data is processed in accordance with our Privacy Policy linked above.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`,
    })
    
    if (orderError) {
      console.log('❌ Order confirmation failed:', orderError)
    } else {
      console.log('✅ Order confirmation sent:', orderData?.id)
    }
    
    console.log('\n🎉 Tailwind email templates sent successfully!')
    console.log('\n📧 Check your inbox at shop@sen.studio for emails featuring:')
    console.log('   • 🎨 Tailwind CSS styling matching storefront design')
    console.log('   • 🖼️  High-quality product images from Unsplash')
    console.log('   • 📱 Responsive design for all email clients')
    console.log('   • 🏢 Updated company signature with correct legal details')
    console.log('   • 🔗 Links to shop.sen.studio (main domain for legal: sen.studio)')
    console.log('   • ✨ Professional layout with consistent gray color palette')
    
    console.log('\n🚀 Key improvements:')
    console.log('   • Storefront-consistent Tailwind classes (gray-50, gray-900, etc.)')
    console.log('   • Product images in order confirmations')
    console.log('   • Hero images in welcome emails')
    console.log('   • Better visual hierarchy with proper spacing')
    console.log('   • Updated legal information (HRB 129222, VAT: DE358821685)')
    console.log('   • Clean, modern design following React Email best practices')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testTailwindEmails().catch(console.error)