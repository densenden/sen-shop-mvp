# Digital Product Selling Workflow Guide

## Overview

This guide explains how to create and sell digital products (PDFs, images, etc.) in your Medusa store. Digital products require a different workflow than physical products because they need secure download delivery after purchase.

## The Complete Workflow

### 1. Upload Digital Files
First, upload your digital files through the admin panel:
- Navigate to `/admin/digital-products`
- Click "Add Digital Product"
- Upload your file (PDF, images, etc.)
- Set download limits and expiration (optional)

### 2. Create a Regular Product
Digital files must be linked to regular Medusa products:
- Create a product in the Products section as usual
- Set price, description, images
- **Important**: Digital products should have:
  - Inventory tracking disabled
  - No shipping requirements
  - Instant fulfillment

### 3. Link Digital Product to Regular Product
Currently, this requires manual API integration:

```javascript
// Example API call to link digital product to regular product
await fetch('/api/admin/products/prod_123/digital-products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    digital_product_id: 'dprod_456'
  })
})
```

### 4. Customer Purchase Flow

When a customer buys a digital product:

```
Customer adds to cart → Checkout → Payment → Order Confirmed → Download Link Generated
```

### 5. Download Delivery

After successful payment:
1. System generates a secure download token
2. Email sent to customer with download link
3. Link expires after set time/downloads

## Implementation Steps

### Step 1: Configure Product Type

In your product creation, ensure digital products are marked appropriately:

```javascript
// When creating a product
{
  title: "Premium Digital Artwork",
  is_digital: true, // Custom field
  requires_shipping: false,
  track_inventory: false
}
```

### Step 2: Order Completion Workflow

Create a workflow that triggers on order completion:

```javascript
// src/workflows/send-digital-products.ts
import { WorkflowManager } from "@medusajs/framework/workflows-sdk"

export const sendDigitalProductsWorkflow = WorkflowManager.create(
  "send-digital-products",
  function (workflowBuilder) {
    // 1. Check if order contains digital products
    // 2. Generate download tokens
    // 3. Send email with download links
    // 4. Record download access
  }
)
```

### Step 3: Download Endpoint

The customer accesses downloads via secure token:

```
GET /store/download/:token
```

This endpoint:
- Validates the token
- Checks download limits
- Redirects to file URL or streams file

## Database Structure

### Required Relations

1. **Product ↔ Digital Product** (One-to-Many)
   - One product can have multiple digital files
   - Example: Different formats (PDF, JPG, PNG)

2. **Order ↔ Digital Product Download** (One-to-Many)
   - Tracks each customer's access to files
   - Records download count and expiration

## Security Considerations

1. **Token Generation**
   - Use cryptographically secure random tokens
   - Set reasonable expiration times

2. **Download Limits**
   - Prevent sharing by limiting downloads
   - Track IP addresses if needed

3. **File Protection**
   - Store files in private bucket
   - Generate signed URLs for access

## Email Template Example

```html
<h1>Your Digital Products are Ready!</h1>
<p>Thank you for your purchase. Your downloads are available:</p>

<ul>
{{#each downloads}}
  <li>
    <strong>{{product_name}}</strong><br>
    <a href="{{download_url}}">Download Now</a><br>
    <small>Expires: {{expiry_date}} | Downloads remaining: {{downloads_left}}</small>
  </li>
{{/each}}
</ul>

<p>Please download your files before they expire.</p>
```

## Testing the Workflow

1. **Create Test Product**
   - Upload a small PDF as digital product
   - Create a $1 test product
   - Link them together

2. **Test Purchase**
   - Add to cart
   - Complete checkout
   - Verify download email

3. **Test Download**
   - Click download link
   - Verify file downloads
   - Check download counter

## Common Issues

### Issue: Downloads Not Working
- Check Supabase bucket permissions
- Verify token generation
- Check email sending configuration

### Issue: Multiple File Formats
- Create separate digital products for each format
- Link all to same product
- Customer gets access to all formats

## Next Implementation Steps

1. **Admin UI Enhancement**
   - Add digital product selector in product edit page
   - Show linked digital products
   - Bulk linking interface

2. **Customer Portal**
   - "My Downloads" page
   - Download history
   - Re-download capability

3. **Analytics**
   - Track download rates
   - Monitor failed downloads
   - Usage patterns

## API Reference

### Link Digital Product to Product
```
POST /api/admin/products/:id/digital-products
{
  "digital_product_id": "dprod_123"
}
```

### Remove Digital Product Link
```
DELETE /api/admin/products/:id/digital-products/:digital_product_id
```

### Get Product's Digital Products
```
GET /api/admin/products/:id/digital-products
```

### Customer Download
```
GET /api/store/download/:token
```

---

This workflow ensures secure delivery of digital products while maintaining flexibility for different use cases. 