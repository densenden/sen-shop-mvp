# SenCommerce Pricing Documentation

**Last Updated**: 2025-11-05
**Status**: Critical - Contains identified bugs that need fixing

---

## Table of Contents

1. [Overview](#overview)
2. [Price Storage Format](#price-storage-format)
3. [Database Schema](#database-schema)
4. [Price Flow Architecture](#price-flow-architecture)
5. [POD Provider Integrations](#pod-provider-integrations)
6. [API Endpoints](#api-endpoints)
7. [Storefront Display](#storefront-display)
8. [Cart & Checkout](#cart--checkout)
9. [Payment Processing](#payment-processing)
10. [Identified Bugs](#identified-bugs)
11. [Best Practices](#best-practices)

---

## Overview

SenCommerce uses **Medusa v2** as its e-commerce framework, which follows a specific pricing convention:

- **Internal Storage**: All prices are stored in **CENTS** (smallest currency unit)
- **External APIs**: POD providers (Printful, Printify, Gelato) return prices in **DOLLARS**
- **Display**: Prices are shown to users in **DOLLARS** with 2 decimal places
- **Payment**: Payment processors (Stripe) expect amounts in **CENTS**

### Critical Rule
> **Always store prices in CENTS in the Medusa database. Always convert from DOLLARS to CENTS when receiving from POD APIs.**

---

## Price Storage Format

### Medusa Database (Internal)
```typescript
// Stored in the 'price' table
{
  amount: 2999,              // CENTS (integer)
  currency_code: "usd",      // Lowercase
  min_quantity: null,
  max_quantity: null
}
```

**Example**: $29.99 is stored as `2999` cents

### POD Provider APIs (External)
```typescript
// Printful API Response
{
  retail_price: "29.99",     // DOLLARS (string)
  currency: "USD"            // Uppercase
}

// Printify API Response
{
  price: 29.99,              // DOLLARS (number)
  currency: "USD"
}
```

### Conversion Functions
```typescript
// Dollars to Cents (for storage)
const cents = Math.round(dollars * 100);

// Cents to Dollars (for display)
const dollars = (cents / 100).toFixed(2);
```

---

## Database Schema

### Core Pricing Tables

#### `price` Table
Primary table for storing all prices.

**File**: `node_modules/@medusajs/pricing/dist/migrations/Migration20230929122253.js`

```sql
CREATE TABLE price (
  id TEXT PRIMARY KEY,
  title TEXT,
  price_set_id TEXT NOT NULL,  -- FK to price_set
  amount NUMERIC NOT NULL,      -- Price in CENTS
  currency_code TEXT NOT NULL,  -- e.g., 'usd', 'eur'
  min_quantity NUMERIC,
  max_quantity NUMERIC,
  rules_count INTEGER,
  raw_amount JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Fields**:
- `amount`: **NUMERIC** - Stores price in cents as integer
- `currency_code`: **TEXT** - Lowercase currency code (ISO 4217)

#### `price_set` Table
Links multiple prices to a product/variant.

```sql
CREATE TABLE price_set (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

A `price_set` can have multiple `price` records (e.g., different currencies, quantity tiers).

#### `price_list` Table
For managing promotional pricing and sales.

```sql
CREATE TABLE price_list (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  status ENUM('active', 'draft'),
  type ENUM('sale', 'override'),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ
);
```

### POD Provider Tables

#### Printful Product Table

**File**: `src/modules/printful/migrations/002_enhance_product_schema.sql`

```sql
CREATE TABLE printful_product (
  id TEXT PRIMARY KEY,
  external_id TEXT,
  base_price DECIMAL(10,2),      -- DOLLARS (2 decimal places)
  sale_price DECIMAL(10,2),      -- DOLLARS
  currency VARCHAR(3) DEFAULT 'USD',
  -- ... other fields
);

CREATE TABLE printful_variant (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  price DECIMAL(10,2),           -- DOLLARS
  currency VARCHAR(3) DEFAULT 'USD',
  -- ... other fields
);
```

**Key Difference**: Printful tables store prices in **DOLLARS** (DECIMAL), not cents.

---

## Price Flow Architecture

### Complete Price Journey

```
┌─────────────────────────────────────────────────────────────┐
│ 1. POD Provider API                                         │
│    Returns: { retail_price: "25.00", currency: "USD" }     │
│    Format: DOLLARS (string or float)                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POD Integration Service                                  │
│    Parses: parseFloat("25.00") = 25.00                     │
│    Stores in custom table: base_price = 25.00 (DECIMAL)    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼ **CONVERSION POINT** ⚠️
┌─────────────────────────────────────────────────────────────┐
│ 3. Product Creation Service                                 │
│    Converts: Math.round(25.00 * 100) = 2500                │
│    Creates Medusa product variant with price in CENTS       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Medusa Database                                          │
│    Stores: { amount: 2500, currency_code: "usd" }          │
│    Format: CENTS (integer)                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Store API Endpoint                                       │
│    Returns: { calculated_price: { amount: 2500, ... } }    │
│    Format: CENTS (as received from database)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Storefront Display                                       │
│    Formats: (2500 / 100).toFixed(2) = "25.00"              │
│    Shows: $25.00 or €25.00 to user                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Cart Service                                             │
│    Calculates: 2500 * quantity                              │
│    Stores: Total in CENTS                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Payment Processor (Stripe)                               │
│    Sends: { amount: 2500, currency: "usd" }                │
│    Charges: $25.00                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## POD Provider Integrations

### Printful

#### Price Retrieval
**File**: `src/modules/printful/services/printful-pod-product-service.ts`

```typescript
// Line 529-537: Mapping Printful response to POD product
variants: syncVariants.map((v: any) => ({
  id: v.id.toString(),
  name: v.name,
  price: parseFloat(v.retail_price),  // DOLLARS (from Printful API)
  currency: v.currency || 'USD',
}))
```

**Format**: Returns `retail_price` as string in DOLLARS.

#### Product Creation
**File**: `src/api/admin/printful-studio/composer/[sessionId]/create-product/route.ts`

```typescript
// Lines 298-316: CORRECT conversion to cents
const priceInCents = Math.round(parseFloat(retailPrice) * 100);

const createdVariant = await productService.createProductVariants(productId, [
  {
    title: variantName,
    prices: [{
      amount: priceInCents,        // ✅ CENTS
      currency_code: session.pricing?.currency?.toLowerCase() || 'usd'
    }]
  }
]);
```

**Status**: ✅ **CORRECT** - Properly converts to cents

### Printify

#### Price Retrieval
**File**: `src/modules/printify/services/printify-provider.ts`

```typescript
// Lines 346-362: Mapping Printify response
price: printifyProduct.variants?.[0]?.price || 0,  // DOLLARS (number)
variants: Array.isArray(printifyProduct.variants)
  ? printifyProduct.variants.map((v: any) => ({
      price: parseFloat(v.price) || 0,  // DOLLARS
      currency: 'USD',
    }))
```

**Format**: Returns `price` as number in DOLLARS.

**Issue**: ⚠️ No conversion to cents in the mapping layer.

### Gelato

#### Price Retrieval
**File**: `src/modules/gelato/services/gelato-provider.ts`

```typescript
// Lines 259-275: Mapping Gelato response
price: gelatoProduct.price || gelatoProduct.base_price || 0,  // DOLLARS
variants: gelatoProduct.variants?.map((v: any) => ({
  price: parseFloat(v.price || v.unit_price) || 0,  // DOLLARS
  currency: v.currency || 'USD',
}))
```

**Format**: Returns prices as numbers in DOLLARS.

**Issue**: ⚠️ No conversion to cents in the mapping layer.

---

## API Endpoints

### Product Creation

#### Printful Studio Composer
**Endpoint**: `POST /admin/printful-studio/composer/:sessionId/create-product`
**File**: `src/api/admin/printful-studio/composer/[sessionId]/create-product/route.ts`

**Price Handling**:
```typescript
// Line 121: Get retail price from session (DOLLARS)
const retailPrice = session.pricing!.retail_prices[variantId];

// Line 298: Convert to cents
const priceInCents = Math.round(parseFloat(retailPrice) * 100);

// Lines 314-316: Create variant with cents
prices: [{
  amount: priceInCents,
  currency_code: session.pricing?.currency?.toLowerCase() || 'usd'
}]
```

**Status**: ✅ **WORKING CORRECTLY**

#### Batch Product Creation (⚠️ BUG)
**Endpoint**: `POST /admin/printful-studio/batch/create-products`
**File**: `src/api/admin/printful-studio/batch/create-products/route.ts`

**Price Handling**:
```typescript
// Lines 114-122: Calculate retail price in DOLLARS
const baseCost = variant.price || 20;
let retailPrice = baseCost;
if (markupType === 'percentage') {
  retailPrice = baseCost * (1 + markupValue / 100);
} else {
  retailPrice = baseCost + markupValue;
}

// Line 126: Send to Printful in DOLLARS (correct)
retail_price: retailPrice.toFixed(2)

// Lines 204-224: Import to Medusa
// ⚠️ BUG: NO CONVERSION TO CENTS!
variants: fullProduct.variants.map((variant: any) => ({
  // Missing: prices: [{ amount: Math.round(variant.price * 100) }]
}))
```

**Status**: ❌ **BUG IDENTIFIED** - Missing cents conversion

#### Product Sync
**Endpoint**: `POST /admin/product-sync`
**File**: `src/api/admin/product-sync/route.ts`

**Price Handling**:
```typescript
// Lines 490-525: Multiple fallback conversion paths
if (variantPrice) {
  price = Math.round(parseFloat(variantPrice.toString()) * 100);  // ✅ CENTS
} else if (printfulProduct.price) {
  price = Math.round(parseFloat(printfulProduct.price.toString()) * 100);  // ✅ CENTS
} else if (retailPrice) {
  price = Math.round(retailPrice * 100);  // ✅ CENTS
}
```

**Status**: ✅ **WORKING CORRECTLY**

### Product Retrieval

#### Store Products
**Endpoint**: `GET /store/products`
**File**: `src/api/store/products/route.ts`

**Price Handling**:
```typescript
// Lines 161-170: Get price from price_set (stored in CENTS)
const eurPrice = variant.price_set?.prices?.find(p => p.currency_code === 'eur');
const fallbackPrice = variant.price_set?.prices?.[0];

variant.calculated_price = {
  amount: eurPrice?.amount || fallbackPrice?.amount || 10,  // CENTS
  currency_code: 'eur'
};

// Line 168 comment: "Default to 10 cents (€0.10) if no price found"
```

**Returns**: Prices in CENTS (as stored in database)

**Status**: ✅ **CORRECT**

---

## Storefront Display

### Product Page
**File**: `sen-commerce-storefront/app/[locale]/products/[handle]/page.tsx`

**Price Formatting**:
```typescript
// Lines 378-415: formatPrice function
const formatPrice = (variant: ProductVariant | null, product: Product) => {
  // Get price in CENTS from variant or product
  let price = 0;
  let currency = 'eur';

  if (variant.calculated_price) {
    price = variant.calculated_price.amount;  // CENTS
    currency = variant.calculated_price.currency_code;
  }
  // ... other fallbacks

  // Convert cents to dollars for display
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: safeCurrency.toUpperCase()
  }).format(safePrice / 100);  // ✅ Divide by 100 for display
}
```

**Display**: Shows formatted price like "$25.00" or "€25.00"

**Status**: ✅ **CORRECT**

---

## Cart & Checkout

### Cart Service
**File**: `sen-commerce-storefront/lib/cart.ts`

**Note**: Uses Medusa's built-in cart module which handles prices in CENTS.

### Checkout Complete
**File**: `src/api/store/checkout/complete/route.ts`

**Price Calculation**:
```typescript
// Lines 36-48: Calculate total from cart items
const itemsTotal = (cart_items || []).reduce((sum: number, item: any) => {
  const price = item.unit_price || item.price || item.total || 0;  // CENTS
  const quantity = item.quantity || 1;
  return sum + (price * quantity);  // CENTS * quantity
}, 0);

const total = itemsTotal > 0 ? itemsTotal : (cart_total || 2500);  // CENTS
```

**Status**: ✅ **CORRECT** - All calculations in cents

---

## Payment Processing

### Stripe Integration
**File**: `src/services/stripe-payment.ts`

**Payment Intent Creation**:
```typescript
// Lines 76-110: Create payment intent
const paymentIntent = await this.stripe.paymentIntents.create({
  amount: Math.round(amount),  // CENTS (expects integer)
  currency: currency.toLowerCase(),
  // ...
});
```

**Stripe API Expectation**: Amounts in smallest currency unit (cents for USD/EUR)

**Status**: ✅ **CORRECT**

### Printful Order Creation
**File**: `src/api/store/printful/orders/create/route.ts`

**Price Conversion Back to Dollars**:
```typescript
// Lines 129-131: Convert Medusa prices (CENTS) to Printful format (DOLLARS)
subtotal: order.subtotal ? ((order.subtotal) / 100).toFixed(2) : '55.50',
shipping: ((order.shipping_total || 0) / 100).toFixed(2),
tax: ((order.tax_total || 0) / 100).toFixed(2),

// Line 245: Convert item price from cents to dollars
retail_price: ((item.unit_price || 0) / 100).toFixed(2)
```

**Status**: ✅ **CORRECT** - Properly converts back to dollars for Printful API

---

## Identified Bugs

### 🔴 CRITICAL: Bug #1 - Batch Product Creation Missing Price Conversion

**Location**: `src/api/admin/printful-studio/batch/create-products/route.ts` (Lines 204-224)

**Issue**: When importing Printful products to Medusa after batch creation, variant prices are NOT converted from dollars to cents.

**Impact**: Products created via batch import will have prices **100x too low**.
Example: $25.00 stored as 25 cents = **displayed as $0.25**

**Current Code**:
```typescript
// Lines 204-224
const importedProduct = await productService.createProducts({
  title: fullProduct.name,
  // ...
  variants: fullProduct.variants.map((variant: any) => ({
    title: variant.name,
    sku: variant.sku,
    // ❌ MISSING: Price conversion!
  }))
});
```

**Required Fix**:
```typescript
variants: fullProduct.variants.map((variant: any) => ({
  title: variant.name,
  sku: variant.sku,
  // ✅ ADD THIS:
  prices: [{
    amount: Math.round(parseFloat(variant.retail_price || variant.price || 0) * 100),
    currency_code: 'usd'
  }]
}))
```

**Priority**: 🔴 **CRITICAL** - Fix immediately before batch importing products

---

### 🟡 WARNING: Bug #2 - POD Provider Price Mapping

**Locations**:
- `src/modules/printify/services/printify-provider.ts` (Lines 346-369)
- `src/modules/gelato/services/gelato-provider.ts` (Lines 259-275)

**Issue**: POD providers return prices in DOLLARS, but the mapping functions don't convert to CENTS. If these POD products are synced to Medusa without going through proper conversion paths, prices will be wrong.

**Impact**: Potential for prices to be stored as dollars when they should be cents (100x error).

**Recommendation**:
1. Add explicit price conversion in POD provider mapping functions, OR
2. Ensure all sync paths include conversion validation

**Priority**: 🟡 **Medium** - Add safeguards to prevent incorrect syncing

---

### 🟢 INFO: Currency Handling

**Location**: Multiple files

**Issue**: Currency codes are sometimes hardcoded (EUR), sometimes from session data (USD). No actual currency conversion logic exists (no exchange rates).

**Impact**: Products may have inconsistent currency codes. No multi-currency support currently.

**Examples**:
```typescript
// Hardcoded EUR: src/api/store/products/route.ts Line 169
currency_code: 'eur'

// From session: src/api/admin/printful-studio/composer/[sessionId]/create-product/route.ts Line 316
currency_code: session.pricing?.currency?.toLowerCase() || 'usd'
```

**Recommendation**: Implement proper multi-currency with exchange rates if needed.

**Priority**: 🟢 **Low** - Feature enhancement, not a bug

---

## Best Practices

### 1. Always Use Helper Functions

Create utility functions for price conversion:

```typescript
// utils/price.ts

/**
 * Converts price from dollars to cents (for storage in Medusa)
 * @param dollars - Price in dollars (e.g., 25.00)
 * @returns Price in cents (e.g., 2500)
 */
export function dollarsToCents(dollars: number | string): number {
  const price = typeof dollars === 'string' ? parseFloat(dollars) : dollars;
  return Math.round(price * 100);
}

/**
 * Converts price from cents to dollars (for display)
 * @param cents - Price in cents (e.g., 2500)
 * @returns Formatted price string (e.g., "25.00")
 */
export function centsToDoollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Formats price for display with currency symbol
 * @param cents - Price in cents
 * @param currencyCode - ISO 4217 currency code (lowercase)
 * @returns Formatted price (e.g., "$25.00")
 */
export function formatPrice(cents: number, currencyCode: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode.toUpperCase()
  }).format(cents / 100);
}

/**
 * Validates that a price is in correct cents format
 * @param price - Price to validate
 * @param source - Source identifier for logging
 * @throws Error if price is invalid
 */
export function validatePriceCents(price: number, source: string): void {
  if (!Number.isInteger(price)) {
    console.error(`[Price Validation] ${source}: Price must be an integer (cents), got ${price}`);
    throw new Error(`Invalid price format: ${price} must be in cents`);
  }
  if (price < 0) {
    console.error(`[Price Validation] ${source}: Price cannot be negative, got ${price}`);
    throw new Error(`Invalid price: ${price} cannot be negative`);
  }
  console.log(`[Price Validation] ${source}: ✅ Valid price ${price} cents`);
}
```

### 2. Add JSDoc Comments

Document price expectations in function signatures:

```typescript
/**
 * Creates a new product with POD integration
 * @param productData - Product information
 * @param retailPrice - Retail price in DOLLARS (will be converted to cents)
 * @returns Created product with price in CENTS
 */
async function createPODProduct(
  productData: ProductData,
  retailPrice: number
): Promise<Product> {
  const priceInCents = dollarsToCents(retailPrice);
  validatePriceCents(priceInCents, 'createPODProduct');
  // ... create product
}
```

### 3. Use TypeScript Branded Types

Prevent mixing dollars and cents at compile time:

```typescript
// types/price.ts

type Cents = number & { readonly __brand: 'Cents' };
type Dollars = number & { readonly __brand: 'Dollars' };

function cents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new Error('Cents must be an integer');
  }
  return value as Cents;
}

function dollars(value: number): Dollars {
  return value as Dollars;
}

function toCents(d: Dollars): Cents {
  return cents(Math.round(d * 100));
}

function toDollars(c: Cents): Dollars {
  return dollars(c / 100);
}

// Usage
const price: Dollars = dollars(25.00);
const stored: Cents = toCents(price);  // Type-safe conversion
```

### 4. Add Price Audit Endpoint

Create an admin endpoint to verify price integrity:

```typescript
// src/api/admin/audit-prices/route.ts

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productService = req.scope.resolve('productService');
  const products = await productService.list({});

  const issues: any[] = [];

  for (const product of products) {
    for (const variant of product.variants || []) {
      const price = variant.price_set?.prices?.[0]?.amount;

      // Check if price seems too low (likely stored as dollars instead of cents)
      if (price && price < 100) {
        issues.push({
          product_id: product.id,
          variant_id: variant.id,
          price,
          issue: 'Price too low - possibly stored as dollars instead of cents'
        });
      }

      // Check if price is not an integer
      if (price && !Number.isInteger(price)) {
        issues.push({
          product_id: product.id,
          variant_id: variant.id,
          price,
          issue: 'Price is not an integer - should be in cents'
        });
      }
    }
  }

  res.json({
    total_products: products.length,
    issues_found: issues.length,
    issues
  });
};
```

### 5. Log Price Conversions

Add detailed logging for debugging:

```typescript
function convertPODPriceToMedusa(podPrice: number, provider: string): number {
  console.log(`[Price Conversion] ${provider}: ${podPrice} dollars → converting to cents`);
  const cents = Math.round(podPrice * 100);
  console.log(`[Price Conversion] ${provider}: ${cents} cents (${(cents / 100).toFixed(2)} dollars)`);
  return cents;
}
```

### 6. Integration Tests

Add tests for price handling:

```typescript
// tests/pricing.test.ts

describe('Price Conversion', () => {
  it('should convert dollars to cents correctly', () => {
    expect(dollarsToCents(25.00)).toBe(2500);
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.50)).toBe(50);
  });

  it('should handle string input', () => {
    expect(dollarsToCents("25.00")).toBe(2500);
  });

  it('should round to nearest cent', () => {
    expect(dollarsToCents(25.005)).toBe(2501);
    expect(dollarsToCents(25.004)).toBe(2500);
  });
});

describe('Printful Product Creation', () => {
  it('should create product with price in cents', async () => {
    const retailPrice = 25.00; // dollars
    const product = await createPrintfulProduct({ retailPrice });

    const variant = product.variants[0];
    const price = variant.price_set.prices[0];

    expect(price.amount).toBe(2500); // cents
    expect(price.currency_code).toBe('usd');
  });
});
```

---

## Quick Reference

### Price Conversion Cheat Sheet

| Operation | Formula | Example |
|-----------|---------|---------|
| Dollars → Cents | `Math.round(dollars * 100)` | `25.00 → 2500` |
| Cents → Dollars | `(cents / 100).toFixed(2)` | `2500 → "25.00"` |
| Display Price | `Intl.NumberFormat(...).format(cents / 100)` | `2500 → "$25.00"` |

### Where Prices Are Stored

| Location | Format | Example |
|----------|--------|---------|
| Medusa `price` table | CENTS (integer) | `2500` |
| Printful database tables | DOLLARS (decimal) | `25.00` |
| Printful API response | DOLLARS (string) | `"25.00"` |
| Printify API response | DOLLARS (number) | `25.00` |
| Gelato API response | DOLLARS (number) | `25.00` |
| Stripe payment intent | CENTS (integer) | `2500` |

### Critical Checkpoints

✅ **Always convert at these points:**

1. **POD API → Medusa**: Multiply by 100
2. **Medusa → Display**: Divide by 100
3. **Medusa → Payment**: Keep in cents (no conversion)
4. **Medusa → POD Order**: Divide by 100

❌ **Never do:**

1. Store dollars in Medusa price table
2. Send cents to POD provider APIs
3. Double-convert (multiply by 100 twice)
4. Forget to round after multiplication

---

## Maintenance Checklist

### Before Deploying New Features

- [ ] Verify all POD price retrievals convert to cents
- [ ] Check product creation routes for price conversion
- [ ] Test display formatting divides by 100
- [ ] Confirm payment amounts are in cents
- [ ] Run price audit endpoint
- [ ] Check for hardcoded price values
- [ ] Verify currency code consistency

### Monthly Price Audit

- [ ] Run `/admin/audit-prices` endpoint
- [ ] Check for products with price < 100 cents ($1.00)
- [ ] Verify all prices are integers
- [ ] Review payment processor transaction amounts
- [ ] Compare Medusa prices with POD provider prices
- [ ] Check for currency code mismatches

---

## Support & Resources

### Medusa Documentation
- [Pricing Module](https://docs.medusajs.com/resources/commerce-modules/pricing)
- [Product Module](https://docs.medusajs.com/resources/commerce-modules/product)
- [Payment Processing](https://docs.medusajs.com/resources/commerce-modules/payment)

### POD Provider Documentation
- [Printful API - Pricing](https://developers.printful.com/docs/#section/Introduction)
- [Printify API - Products](https://developers.printify.com/#products)
- [Gelato API - Product Pricing](https://developers.gelato.com/)

### Stripe Documentation
- [Payment Intents - Amount](https://stripe.com/docs/api/payment_intents/create#create_payment_intent-amount)
- [Currency Handling](https://stripe.com/docs/currencies)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-05 | Initial documentation with bug identification |

---

## Contact

For questions or issues related to pricing:
- **Critical bugs**: Fix immediately and update this document
- **Feature requests**: Add to backlog with pricing impact assessment
- **Questions**: Reference this document first, then escalate

---

**End of Pricing Documentation**
