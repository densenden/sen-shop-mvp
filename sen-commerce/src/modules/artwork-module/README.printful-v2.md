# Printful API v2 (Beta) Integration Guide

This guide explains how to use the new Printful API v2 for your Mesa project, focusing on catalog import, product availability, and automated order fulfillment.

---

## 🛒 1. Authentication & Setup

- **OAuth 2 Private Token**: Use Private Tokens (or Public Apps) with specific permissions ("scopes"). Create tokens in the [Printful Developer Portal](https://developers.printful.com/docs/v2-beta/#section/Authorization).
- **Required Headers:**
  ```http
  Authorization: Bearer <TOKEN>
  X-PF-Store-Id: <Store-ID>  # Only for account-wide tokens
  ```

---

## 📦 2. Catalog Import

- `GET /v2/catalog-products` – List all catalog products with HATEOAS links.
- `GET /v2/catalog-products/{id}/catalog-variants` – Get variants (size, color, stock) for a product.
- More endpoints for images, prices, availability, mockup styles, shipping regions, etc.
- To filter by region (e.g., Germany):
  - Use parameter `selling_region_name=germany` for `/catalog-products/{id}/catalog-categories`.

---

## ✅ 3. Product Publishing (Make Product Available)

1. Select a Printful catalog product → Get a Variant ID (e.g., `catalog_variant_id`).
2. `POST /v2/files` – Upload your print file (PNG/JPEG, at least 300 DPI).
3. `POST /v2/orders` – Create an order directly at Printful (auto-publish if you don't need a shop flow).
   - In the body: `order_items` with `source: "catalog"`, `catalog_variant_id`, `file_ids`, `quantity`, `retail_price`, etc.

---

## 🔄 4. Automated Order Submission

- `POST /v2/orders` – Send order to Printful as soon as it's created in Mesa. Response includes Printful Order ID.
- `PATCH /v2/orders/{order_id}` – Update shipping address, `external_id`, or shipping method.
- `POST /v2/orders/{order_id}/confirmation` – Confirm the order at Printful and start fulfillment.

---

## 🔔 5. Webhooks – Automatic Fulfillment

Enable webhooks for events like:
- `order_created`, `shipment_sent`, `catalog_stock_updated`
- `POST /v2/webhooks/{eventType}` with `url` and optional params (e.g., products)

**Example use cases:**
- `order_created` → Set status in Mesa
- `shipment_sent` → Send tracking info
- `catalog_stock_updated` → Sync inventory

---

## 🧩 6. Additional Endpoints

- `/v2/order-estimation-tasks`: Estimate costs & taxes for carts
- `/v2/shipping-rates`: Get shipping costs
- `/v2/countries`: List shipping regions
- `/v2/stores`: Get available stores (for account tokens)

---

## ✅ Mesa Integration Steps

| Step | Task |
|------|------|
| 1 | Create Private Token, set up token-based auth |
| 2 | `GET /catalog-products` – Import catalog |
| 3 | For each product, fetch variants & images |
| 4 | Make products selectable in Mesa |
| 5 | On order, `POST /orders` with variant & file IDs |
| 6 | After order, `POST /orders/{id}/confirmation` |
| 7 | Implement webhooks for `order_created`, `shipment_sent` |

---

## ✅ Important for German Context

- Use `selling_region_name=germany` where appropriate
- Set shipping and prices in EUR
- Sync shipping countries & costs for Germany

---

## Summary

With this setup, you can:
- Import Printful catalogs and make products available in Mesa
- Seamlessly trigger and manage orders at Printful
- Process automatic status updates via webhooks

---

[Back to Main README](../../../../README.md) 