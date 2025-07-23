# Backend API Endpoints (Admin & Store)

> **For new developers:**
> 
> An API endpoint is a URL on the backend server that allows the frontend or other systems to interact with the database and business logic. Endpoints are grouped by purpose (like products, artworks, orders) and are usually split into **admin** (for management) and **store** (for customer-facing) routes. Use this list to understand what data you can fetch, create, update, or delete from the backend.

---

## Digital Products Module

### Admin Endpoints (`/admin/`)
- `GET    /admin/digital-products`  
  List all digital products
- `POST   /admin/digital-products`  
  Upload new digital product
- `GET    /admin/digital-products/:id`  
  Get single digital product by ID
- `PUT    /admin/digital-products/:id`  
  Update product settings
- `DELETE /admin/digital-products/:id`  
  Delete product and file
- `POST   /admin/products/:id/digital-products`  
  Link a digital product to a regular product
- `DELETE /admin/products/:id/digital-products`  
  Unlink a digital product from a product

### Store Endpoints (`/store/`)
- `GET    /store/download/:token`  
  Download a digital product file using a secure token

---

## Artwork & Collections Module

### Admin Endpoints (`/admin/`)
- `GET    /admin/artworks`  
  List artworks (with optional relations)
- `POST   /admin/artworks`  
  Create one or more artworks
- `GET    /admin/artworks/:id`  
  Retrieve artwork by ID
- `PUT    /admin/artworks/:id`  
  Update artwork
- `DELETE /admin/artworks/:id`  
  Soft delete artwork
- `GET    /admin/artwork-collections`  
  List artwork collections
- `POST   /admin/artwork-collections`  
  Create a new artwork collection
- `POST   /admin/uploads`  
  Upload artwork files (images, etc.)

### Store Endpoints (`/store/`)
- `GET    /store/artworks`  
  Public listing of artworks (with product enrichment)

---

## Printful POD Integration

### Admin Endpoints (`/admin/`)
- `GET    /admin/printful-products/enhanced`  
  List enhanced Printful products
- `POST   /admin/printful-products/enhanced`  
  Create a new Printful product
- `GET    /admin/printful-products/enhanced/:id`  
  Get Printful product by ID
- `PUT    /admin/printful-products/enhanced/:id`  
  Update Printful product
- `DELETE /admin/printful-products/enhanced/:id`  
  Delete Printful product
- `GET    /admin/printful-products/enhanced/:id/files`  
  List files for a Printful product
- `POST   /admin/printful-products/enhanced/:id/files`  
  Add a file to a Printful product
- `GET    /admin/printful-products/enhanced/:id/files/:file_id`  
  Get a specific file for a Printful product
- `PUT    /admin/printful-products/enhanced/:id/files/:file_id`  
  Update a file for a Printful product
- `DELETE /admin/printful-products/enhanced/:id/files/:file_id`  
  Delete a file from a Printful product
- `GET    /admin/printful-catalog-products`  
  List Printful catalog products (legacy)
- `POST   /admin/printful-products/:id/link-artwork`  
  Link an artwork to a Printful product (legacy)

### Webhook Endpoints
- `POST   /webhooks/printful`  
  Receive Printful webhook events
- `POST   /webhooks/printful/order-updated`  
  Receive order update events
- `POST   /webhooks/printful/product-updated`  
  Receive product update events

---

## General Notes
- All **admin** endpoints require authentication (admin login).
- **Store** endpoints are public or require customer login, depending on the route.
- For more details on request/response formats, see the module documentation or ask a senior developer. 