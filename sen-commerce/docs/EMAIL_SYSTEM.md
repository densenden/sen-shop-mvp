# SenCommerce Email System

## Overview

The SenCommerce platform uses **Resend** with **React Email** templates for all email communications. This provides beautiful, responsive email templates with better deliverability than traditional email services.

## Email Types

### 1. Welcome Email 🎨
- **Trigger**: User registration
- **Template**: `WelcomeEmail.tsx`
- **Features**: Welcome message, feature overview, call-to-action
- **Always sent**: Regardless of marketing preferences

### 2. Order Confirmation ✅
- **Trigger**: Successful order placement
- **Template**: `OrderConfirmationEmail.tsx`
- **Features**: Order details, item breakdown, fulfillment notices
- **Respects**: Email notification preferences

### 3. Digital Download Links 📱
- **Trigger**: Digital products in order
- **Template**: `DigitalDownloadEmail.tsx`
- **Features**: Secure download links, expiry warnings, usage guidelines
- **Respects**: Email notification preferences

### 4. Payment Confirmation 💳
- **Trigger**: Successful payment processing
- **Template**: `PaymentConfirmationEmail.tsx`
- **Features**: Payment details, transaction ID, next steps
- **Respects**: Email notification preferences

## Configuration

### Environment Variables
```bash
# Required
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=shop@sen.studio
STORE_URL=http://localhost:9000

# Optional
NODE_ENV=development
```

### Get Resend API Key
1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys section
3. Create new API key
4. Add to `.env` file

## Email Preferences

Customers can control their email preferences:

### Preference Types
- **Email Notifications**: Order confirmations, download links, payment confirmations
- **Marketing Emails**: Promotional emails, newsletters (future feature)

### API Endpoints
- `GET /api/store/customers/me/email-preferences` - Get preferences
- `POST /api/store/customers/me/email-preferences` - Update preferences

### Example Request
```bash
curl -X POST http://localhost:9000/api/store/customers/me/email-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "email_notifications": true,
    "marketing_emails": false
  }'
```

## Testing

### Basic Test
```bash
node test-resend-basic.js
```

### Admin API Tests
```bash
# Test connection
curl -X POST http://localhost:9000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "connection-test"}'

# Test welcome email
curl -X POST http://localhost:9000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "welcome", "email": "shop@sen.studio"}'

# Test order confirmation
curl -X POST http://localhost:9000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "order-confirmation", "email": "shop@sen.studio"}'

# Test download links
curl -X POST http://localhost:9000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "download-links", "email": "shop@sen.studio"}'

# Test payment confirmation
curl -X POST http://localhost:9000/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "payment-confirmation", "email": "shop@sen.studio"}'
```

## Email Flow

### User Registration
1. User registers account
2. `WelcomeEmail` sent immediately
3. No preference check (always sent)

### Order Process
1. Order placed → `OrderConfirmationEmail`
2. Payment processed → `PaymentConfirmationEmail`
3. Digital products → `DigitalDownloadEmail`
4. Each email checks user preferences

### Email Service Architecture
```
src/services/email-service.ts     # Main service
src/emails/                       # React Email templates
  ├── components/
  │   ├── Layout.tsx             # Common layout
  │   └── Button.tsx             # Reusable button
  ├── WelcomeEmail.tsx
  ├── OrderConfirmationEmail.tsx
  ├── DigitalDownloadEmail.tsx
  └── PaymentConfirmationEmail.tsx
```

## Design System

### Colors
- **Primary**: `#2563eb` (Blue)
- **Success**: `#059669` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Text**: `#374151` (Gray)
- **Muted**: `#64748b` (Slate)

### Typography
- **Font**: Inter (web font)
- **Fallback**: Arial, sans-serif
- **Sizes**: 12px-32px

### Components
- Responsive design (600px max-width)
- Consistent spacing and styling
- Professional SenCommerce branding
- Mobile-friendly layouts

## Integration Points

### Registration
- `src/api/store/auth/register/route.ts`
- Calls `emailService.sendWelcomeEmail()`

### Order Processing
- `src/workflows/send-order-confirmation.ts`
- Calls `emailService.sendOrderConfirmation()`

### Digital Products
- `src/subscribers/handle-digital-products.ts`
- Calls `emailService.sendDigitalDownloadLinks()`

### Customer Model
- Added `email_notifications` field
- Added `marketing_emails` field
- Both default to `true`

## Security & Privacy

### Email Preferences
- Customers can opt-out of marketing emails
- Transactional emails (orders, payments) always sent
- Preferences stored in customer record

### Data Protection
- No sensitive data in email logs
- Secure token-based download links
- GDPR-compliant preference management

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check `RESEND_API_KEY` in `.env`
   - Verify domain authentication in Resend
   - Check console logs for errors

2. **Templates not rendering**
   - Ensure React Email packages installed
   - Check template syntax
   - Verify import paths

3. **Preferences not working**
   - Check customer model migration
   - Verify API endpoint authentication
   - Test with admin user

### Logs
- Email service logs all send attempts
- Success/failure status logged
- Error details in console

## Future Enhancements

- Newsletter/marketing email campaigns
- Email templates for print order updates
- A/B testing for email content
- Email analytics and metrics
- Unsubscribe landing page