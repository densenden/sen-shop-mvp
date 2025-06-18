# SendGrid Setup for Digital Products

## 1. Get SendGrid API Key

1. Sign up for SendGrid at https://sendgrid.com
2. Go to Settings → API Keys
3. Create a new API Key with "Full Access"
4. Copy the key (you'll only see it once!)

## 2. Add Environment Variables

Add these to your `.env` file:

```
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM=noreply@yourdomain.com

# Store URL for download links
STORE_URL=http://localhost:8000
```

## 3. Verify Sender Email

In SendGrid:
1. Go to Settings → Sender Authentication
2. Verify the email address you'll send from
3. Complete domain authentication (recommended)

## 4. Email Templates

SendGrid will use these templates:
- `order-placed` - When order is confirmed
- `digital-product-download` - With download links

---

Your digital product email system is now configured! 