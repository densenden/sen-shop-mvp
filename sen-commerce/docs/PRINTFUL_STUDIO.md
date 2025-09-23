Perfect — thanks for clarifying 🙌. You’re aiming for a Printful Studio inside Medusa that mirrors Printful’s real studio tabs, with a workflow centered around artwork-first creation rather than just “import a product and attach artwork later”.

Here’s a new PRD that incorporates your workflow, tabs, and full lifecycle (artwork → product/template → studio composer → publish to Printful → import into Medusa), plus management of existing Printful products, batch creation, and advanced “boost” functionality. I’ll also quote relevant Printful API URLs (v1 + v2 🧪) so Cursor can later scaffold calls.

⸻

PRD — Printful Studio (Medusa Extension)

0. Objective

Deliver a Printful Studio plugin for Medusa Admin that:
	•	Provides a tabbed Studio interface replicating Printful’s product creation workflow.
	•	Starts with artwork upload, then guides merchants through product/template selection, composition, pricing, and publishing.
	•	Uses Printful APIs (v1 & v2) to create products on Printful with full details, then imports them into Medusa as POD Products with synced images, descriptions, pricing, variants, and mockups.
	•	Allows batch creation, management of existing Printful products, and advanced controls (boost, automation).

⸻

1. Workflow Overview

Step 1 — Artwork Upload
	•	Upload design files to Medusa (studio_file_map).
	•	Store artwork metadata in DB (title, tags, preview).
	•	Upload to Printful Files API (v1: POST /files).
	•	Allow batch uploads.

Step 2 — Product / Template Selection
	•	Pick from Printful catalog:
	•	V2 🧪: GET /v2/catalog-products with filters.
	•	Variants: GET /v2/catalog-products/{id}/catalog-variants.
	•	Placements & techniques: GET /v2/catalog-products/{id}.
	•	Templates (not in v2 yet) → fallback to v1: GET /sync/products.

Step 3 — Product Creator Studio (Tabs)

Mirrors Printful’s studio tabs:
	1.	Artwork tab: Assign uploaded artwork to placements, scale/position (v2 placements/layers).
	2.	Product tab: Select variants, colors, sizes.
	3.	Design tab: Preview, swap techniques (DTG, embroidery).
	4.	Mockups tab: Generate previews with Printful’s mockup generator (v2 🧪 POST /v2/mockup-tasks).
	5.	Details tab: Add product title, description, tags.
	6.	Pricing tab: Set retail price, margins; pull base cost from Printful v2 prices (GET /v2/catalog-variants/{id}/prices).

Step 4 — Create Product on Printful
	•	Call Product creation APIs:
	•	v1 Sync Products: POST /sync/products with variants, files, placements.
	•	Include description, pricing, mockups.
	•	Attach uploaded files from Step 1.

Step 5 — Import into Medusa as POD Product
	•	After Printful confirms product creation, fetch:
	•	Product: GET /sync/products/{id}.
	•	Variants: GET /sync/variants/{id}.
	•	Create Medusa product:
	•	Type = POD.
	•	Sync title, description, images, variants, costs, retail prices.
	•	Attach Printful IDs to metadata (pf_sync_product_id, pf_variant_ids[]).

⸻

2. Management of Existing Products

Functions
	•	Sync from Printful → Medusa: Import all products from GET /sync/products.
	•	Edit in Studio: Re-open existing Printful product, adjust artwork/placements, regenerate mockups, re-sync pricing.
	•	Batch editing: Select multiple products to:
	•	Update pricing rules.
	•	Replace artwork.
	•	Regenerate mockups.
	•	Boost function: Mass-generate mockups for many variants or push new pricing across all products at once.

⸻

3. Admin Studio Tabs (UI Concept)
	1.	Dashboard
	•	KPIs: number of artworks, products, pending mockups, webhook health.
	•	Quick actions: “Upload Artwork”, “Start New Product”, “Sync Products”.
	2.	Artwork Manager
	•	Grid of uploaded artworks with previews.
	•	Upload new (batch supported).
	•	Edit metadata (title, tags).
	3.	Product Templates
	•	Explorer of Printful catalog (V2 🧪 for products, fallback to v1 for templates).
	•	Filters: category, type, technique, selling region.
	4.	Product Creator Studio (Multi-tab editor)
	•	Artwork → assign files.
	•	Product → choose variants/colors.
	•	Design → apply placement/technique.
	•	Mockups → generate previews.
	•	Details → title, desc, tags.
	•	Pricing → set retail, margins.
	5.	Products
	•	Table of all Medusa POD products linked to Printful.
	•	Actions: edit, re-sync, batch updates.
	6.	Orders
	•	View & manage Printful-linked orders (V2 🧪 Orders API: GET /v2/orders).
	•	Lifecycle actions: confirm, cancel, track shipments.
	7.	Webhooks
	•	Configure subscription (V2 🧪 POST /v2/webhooks).
	•	Logs table (replay events).
	8.	Settings
	•	API key, default region, auto-sync toggles.
	•	Enable/disable beta features.

⸻

4. Batch Options
	•	Artwork batch upload: drag & drop many files.
	•	Batch product creation: select multiple artworks + multiple catalog products → generate products automatically.
	•	Batch mockup generation: one artwork applied to many variants/colors at once.
	•	Batch pricing updates: apply markup rule to all products.
	•	Batch sync: refresh pricing & stock across all Printful-linked products.

⸻

5. Core API Usage Map
	•	Files (Artwork) → v1: POST /files, GET /files.
	•	Catalog → v2 🧪: GET /v2/catalog-products, GET /v2/catalog-products/{id}.
	•	Mockups → v2 🧪: POST /v2/mockup-tasks, GET /v2/mockup-tasks.
	•	Sync Products (create/manage) → v1: POST /sync/products, GET /sync/products.
	•	Orders → v2 🧪: POST /v2/orders, GET /v2/orders.
	•	Webhooks → v2 🧪: POST /v2/webhooks.

⸻

6. Acceptance Criteria
	•	Uploading artwork stores in Medusa DB + uploads to Printful Files.
	•	Creating a product via Studio tabs results in:
	•	A new Printful sync product with description, prices, mockups, variants.
	•	A corresponding Medusa POD Product with all details mirrored.
	•	Existing Printful products can be imported, edited, synced.
	•	Batch flows work for artwork, products, mockups, pricing.
	•	Webhooks update Medusa on stock/price/order changes.

⸻