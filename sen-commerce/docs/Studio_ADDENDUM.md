Got it — here’s the Cursor-ready PRD addendum to enable parallel v1 + v2 usage in the same plugin, cleanly separated in the UI so you can test and compare all behaviors without conflicts.

PRD Addendum — Parallel v1 & v2 in printful-studio

0) Goals
	•	Run v1 and v2 side-by-side with zero shared state and clear UI separation.
	•	Allow operators to A/B compare data (catalog, pricing, availability, mockups, orders).
	•	Keep everything namespaced so legacy code can be removed later without impact.

⸻

1) Namespacing & Routing

1.1 Backend routes (hard-separated)

All existing printful-studio routes get two trees:
	•	v2 (beta)
	•	GET /printful-studio/v2/catalog/...
	•	POST /printful-studio/v2/mockups/...
	•	POST /printful-studio/v2/orders/...
	•	POST /printful-studio/v2/webhooks/...
	•	etc.
	•	v1 (stable)
	•	GET /printful-studio/v1/catalog/... (maps to v1 sync products/templates)
	•	POST /printful-studio/v1/mockups/... (if needed, or proxy to v2 generator behind v1 UI)
	•	POST /printful-studio/v1/orders/...
	•	POST /printful-studio/v1/webhooks/...
	•	etc.

Keep controllers/services duplicated where behavior differs. No conditionals switching versions inside a single service.

1.2 Services (one class per version)
	•	studio-client-v1.ts, studio-client-v2.ts
	•	studio-catalog-v1.ts, studio-catalog-v2.ts
	•	studio-mockups-v1.ts, studio-mockups-v2.ts
	•	studio-products-v1.ts, studio-products-v2.ts
	•	studio-pricing-v1.ts, studio-pricing-v2.ts
	•	studio-stock-v1.ts, studio-stock-v2.ts
	•	studio-orders-v1.ts, studio-orders-v2.ts
	•	studio-webhooks-v1.ts, studio-webhooks-v2.ts

1.3 Persistence (avoid collisions)

Add version-scoped link tables (or one table with a api_version column):
	•	studio_product_link → api_version: 'v1' | 'v2'
	•	studio_order_link → api_version
	•	studio_webhook_log → api_version
	•	studio_file_map → version-agnostic (files can be reused), but store source: 'uploaded' | 'v1' | 'v2'.

⸻

2) Admin UI — Clear, Parallel Surfaces

2.1 Top-level Studio switcher

At /printful-studio, show a two-tab switch at the very top:
	•	Printful Studio v2 (beta)
	•	Printful v1 (stable)

Each tab exposes the same sub-navigation, but wired to its versioned routes:
	•	Dashboard
	•	Artworks (shared) — artwork manager is common, but actions route to selected version’s composer.
	•	Catalog / Templates
	•	v2 tab: “Catalog (v2)”
	•	v1 tab: “Templates & Sync (v1)”
	•	Creator Studio (versioned)
	•	Mockups (versioned)
	•	Pricing & Stock (versioned)
	•	Importer (versioned)
	•	Orders (versioned)
	•	Webhooks (versioned)
	•	Settings (holds both credentials; separate sections per version)

2.2 Dual-Pane Compare mode (optional but powerful)

Add a toggle “Compare v1 vs v2” on Catalog and Pricing screens:
	•	Left pane calls /v1/..., right pane calls /v2/....
	•	Allow “Sync selection to both” (e.g., pick a catalog product on v2 and the UI auto-finds the closest v1 item for reference, or vice versa).
	•	Export a diff report (CSV/JSON) for pricing & availability differences.

⸻

3) Workflow (Artwork-first) for Each Version

v2 Workflow (beta)
	1.	Artworks: upload & pick artwork(s).
	2.	Catalog (v2): choose product & variants (rich placements/techniques).
	3.	Creator Studio (v2): assign artwork → placements/layers; save composer session (v2).
	4.	Mockups (v2): create async tasks; poll/view; attach.
	5.	Importer (v2):
	•	If v2 lacks “create product” flow needed, call v1 create under the hood but keep it in v2 Importer UI (clearly label).
	•	Import to Medusa as POD Product with full details (images, variants, pricing, desc).

v1 Workflow (stable)
	1.	Artworks: upload & pick artwork(s).
	2.	Templates/Sync (v1): choose base sync product/template.
	3.	Creator Studio (v1): map artwork to print areas supported by v1.
	4.	Mockups (v1): if no native generator, call v2 mockups behind v1 UI (label: “using v2 mockups”).
	5.	Importer (v1): create Sync Product (v1) and import to Medusa POD.

The UI always shows which engine it used for each step (badges: “v1”, “v2”, or “v1+v2 mockups”).

⸻

4) Batch Everywhere (per version)
	•	Artworks: multi-upload → start N build sessions (v1 or v2).
	•	Catalog/Templates: select many base products/variants → create multiple composer sessions.
	•	Creator Studio: apply a placement profile to many variants/products at once.
	•	Mockups: mass-generate tasks and mass-attach images.
	•	Pricing & Stock: apply markup rules, push price/stock sync for selected sets.
	•	Importer: batch create on Printful + batch import into Medusa.
	•	Orders: batch confirm/cancel drafts.

Each batch action respects the active version tab. (If Compare mode is on, require the operator to choose the target side.)

⸻

5) Settings & Secrets

Settings screen contains two cards:
	•	Printful v1: API key, store, defaults.
	•	Printful v2 (beta): API key (can be same), region, currency, feature toggles.

Add a Health check per version:
	•	GET /printful-studio/v1/health, GET /printful-studio/v2/health.

⸻

6) Telemetry & Safety
	•	Show rate limits separately: “v1 rate” vs “v2 rate” remaining/reset.
	•	Webhook pages split into v1 logs and v2 logs (filters by event type & date).
	•	On Importer, stamp Medusa product metadata with api_version: 'v1'|'v2' so you can later filter by origin.

⸻

7) Acceptance Criteria
	•	UI: Version switcher renders two full stacks; no leak of v1 data into v2 views or vice versa.
	•	Catalog: v2 shows richer data; v1 shows sync/templates; both can start creation.
	•	Creator Studio: can save independent composer sessions for v1 and v2.
	•	Mockups: v2 mockups fully functional; v1 path clearly labeled if it leverages v2 generator.
	•	Importer: can create at Printful via the selected version’s flow and import a correct Medusa POD product with all images, variants, descriptions, and pricing.
	•	Batch: all batch actions respect the active version context.
	•	Webhooks: separate configuration & logs; events processed into the correct link tables with api_version.
	•	Settings: both keys saved; both health checks pass independently.

⸻

8) Implementation Order (fastest path)
	1.	Scaffold routes/services duplicated by version (empty return payloads).
	2.	Admin: build top-level version switcher and place empty sub-tabs for both stacks.
	3.	Implement Artworks (shared) + Catalog v2 first (richest data), then Catalog v1.
	4.	Implement Creator Studio v2 + Mockups v2; wire Importer v2 (calling v1 create if required).
	5.	Implement v1 stack (templates/sync, creator, importer).
	6.	Add Batch actions across all tabs.
	7.	Add Orders, Pricing & Stock, and Webhooks for each version.
	8.	Finish with Compare mode (dual-pane) for Catalog and Pricing.

⸻
https://developers.printful.com/docs/v2-beta/ https://developers.printful.com/docs/#section/About-the-Printful-API 