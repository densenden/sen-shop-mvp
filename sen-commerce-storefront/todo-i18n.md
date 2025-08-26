## Goal
Implement localization (i18n) for:
1) **Storefront UI** in `/apps/sencommerce-storefront` (Next.js, App Router preferred).
2) **Transactional emails** via **Resend** using existing templates.

For now: no product/collection translations. We localize UI + one marketing page + email language selection.  
Locales: **en** (default), **de** (ready), and prepare empty EU language scaffolds: **fr, it, es, pt, nl, pl**.

---

## Tech context
- Storefront: Next.js (App Router if available), TypeScript.
- i18n: `i18next` + `react-i18next` with SSR.
- Routing: path based `/en/*`, `/de/*` (others scaffolded). Redirect `/` → best locale.
- Emails: **Resend**. We already have templates; choose template **per language** with safe fallback.
- Persist user language in Medusa customer `metadata.lang` and in a `lang` cookie for guests.

---

## Deliverables

### A) Storefront UI i18n
1. Add deps to `/apps/sencommerce-storefront`:
   - `i18next`, `react-i18next`, `i18next-resources-to-backend`
2. Create locales:

/apps/sencommerce-storefront/locales/
en/common.json
de/common.json
fr/common.json
it/common.json
es/common.json
pt/common.json
nl/common.json
pl/common.json
en/marketing.json
de/marketing.json
fr/marketing.json
it/marketing.json
es/marketing.json
pt/marketing.json
nl/marketing.json
pl/marketing.json

- Fill **en/de** with minimal keys (header/footer/buttons), others empty `{}`.

3. Create i18n init with SSR:
- `/apps/sencommerce-storefront/i18n/index.ts` that:
  - Initializes i18next once.
  - Uses `i18next-resources-to-backend` to load JSON from `/locales/{lng}/{ns}.json`.
  - Namespaces: `common`, `marketing`.

4. Locale middleware:
- `/apps/sencommerce-storefront/middleware.ts`
  - If path doesn’t start with `/en|/de|/fr|/it|/es|/pt|/nl|/pl`, detect preferred (cookie `lang`, then `Accept-Language`) and rewrite to `/<locale>/...`.
  - Maintains `lang` cookie.

5. LocaleSwitcher:
- `/apps/sencommerce-storefront/components/LocaleSwitcher.tsx`
  - Toggles language, preserves pathname after the first segment.

6. Price formatter:
- `/apps/sencommerce-storefront/lib/formatPrice.ts`
  ```ts
  export function formatPrice(cents: number, currency: string, locale: string) {
    const amount = (cents ?? 0) / 100
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount)
  }

	7.	Marketing page:

	•	Route /[locale]/about reading from marketing.json.
	•	Header/Footer/UI labels use common.json.

B) Email i18n via Resend
	1.	Config map for language → template IDs:

	•	Create /apps/server/src/config/email-templates.ts:

export type Lang = "en"|"de"|"fr"|"it"|"es"|"pt"|"nl"|"pl"
export const DEFAULT_LANG: Lang = "en"

// Example names: adjust to your Resend template slugs/IDs
export const EMAIL_TEMPLATES: Record<string, Partial<Record<Lang, string>>> = {
  "order-confirmation": {
    en: process.env.RESEND_TPL_ORDER_CONFIRM_EN!,
    de: process.env.RESEND_TPL_ORDER_CONFIRM_DE!,
    // others optional; fallback to EN if missing
  },
  "shipping-update": {
    en: process.env.RESEND_TPL_SHIP_UPDATE_EN!,
    de: process.env.RESEND_TPL_SHIP_UPDATE_DE!,
  },
}



	2.	Language resolution helpers:

	•	/apps/server/src/utils/email-lang.ts

import type { Lang } from "../config/email-templates"
import { DEFAULT_LANG } from "../config/email-templates"

// infer from customer metadata.lang, region, or fallback
export async function getCustomerLang(deps: any, customerIdOrEmail: string): Promise<Lang> {
  const { manager } = deps
  try {
    const repo = manager.getCustomRepository?.(/* CustomerRepository */) ?? null
    const customer = repo
      ? await repo.findOne({ where: [{ id: customerIdOrEmail }, { email: customerIdOrEmail }] })
      : null
    const meta = customer?.metadata
    const lang = (meta?.lang as Lang) || null
    if (lang) return lang
  } catch {}
  return DEFAULT_LANG
}



	3.	Template resolver:

	•	/apps/server/src/utils/email-templates.ts

import { EMAIL_TEMPLATES, DEFAULT_LANG } from "../config/email-templates"
import type { Lang } from "../config/email-templates"

export function resolveResendTemplateId(templateName: string, lang: Lang): string {
  const map = EMAIL_TEMPLATES[templateName] || {}
  return map[lang] || map[DEFAULT_LANG] || ""
}



	4.	Wiring Resend send:

	•	Wherever you send emails (order placed, etc.), update to:

import { getCustomerLang } from "../utils/email-lang"
import { resolveResendTemplateId } from "../utils/email-templates"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation(deps: any, order: any) {
  const lang = await getCustomerLang(deps, order.customer_id || order.email)
  const templateId = resolveResendTemplateId("order-confirmation", lang)

  if (!templateId) {
    // hard fallback: use EN template
    // (optional log)
  }

  await resend.emails.send({
    from: process.env.MAIL_FROM!,
    to: order.email,
    subject: lang === "de" ? "Bestellbestätigung" : "Order Confirmation",
    // If you use Resend Templates feature:
    // react: undefined,
    // html: undefined,
    // Use template by id:
    template_id: templateId || process.env.RESEND_TPL_ORDER_CONFIRM_EN!,
    // If you rely on variables:
    // headers/attachments as needed
  })
}



	5.	Persist language on signup/profile:

	•	Storefront action hitting Medusa customers API to set metadata.lang.
	•	Provide a minimal POST /api/account/lang route in storefront that calls Medusa server or directly calls Medusa Admin API (depending on your setup).

	6.	.env additions (example):

RESEND_API_KEY=...
MAIL_FROM="Studio Sen <shop@sen.studio>"
RESEND_TPL_ORDER_CONFIRM_EN=tpl_xxx_en
RESEND_TPL_ORDER_CONFIRM_DE=tpl_xxx_de
RESEND_TPL_SHIP_UPDATE_EN=tpl_xxx_en
RESEND_TPL_SHIP_UPDATE_DE=tpl_xxx_de


⸻

Files to create/modify

Storefront (/apps/sencommerce-storefront):
	•	i18n/index.ts (SSR-safe init)
	•	middleware.ts (locale detection + redirect + cookie)
	•	components/LocaleSwitcher.tsx
	•	lib/formatPrice.ts
	•	locales/en/common.json (filled)
	•	locales/de/common.json (filled)
	•	locales/{fr,it,es,pt,nl,pl}/common.json ({})
	•	locales/en/marketing.json (filled)
	•	locales/de/marketing.json (filled)
	•	locales/{fr,it,es,pt,nl,pl}/marketing.json ({})
	•	app/[locale]/about/page.tsx (reads marketing.json)
	•	Convert header/footer/menu to use t('...')

Server:
	•	/apps/server/src/config/email-templates.ts
	•	/apps/server/src/utils/email-lang.ts
	•	/apps/server/src/utils/email-templates.ts
	•	Update existing order email sending flow to use Resend + language.

Optional Storefront API route (if you proxy language save):
	•	/apps/sencommerce-storefront/app/api/account/lang/route.ts (POST) to update metadata.lang.

⸻

Acceptance Criteria
	•	Visiting / redirects to /en unless cookie lang=de or clear Accept-Language: de → /de.
	•	Header/footer/buttons source text from common.json.
	•	/en/about and /de/about render localized marketing.json.
	•	<LocaleSwitcher /> preserves path and swaps first segment.
	•	On signup/profile change, customer metadata.lang is persisted.
	•	When an order is placed, Resend uses the language-specific template ID; if missing for that lang, falls back to EN.
	•	formatPrice produces locale-correct currency strings.

⸻

Populate minimal translations (examples)

/apps/sencommerce-storefront/locales/en/common.json

{
  "brand": "Studio Sen Commerce",
  "nav_shop": "Shop",
  "nav_about": "About",
  "nav_cart": "Cart",
  "cta_checkout": "Checkout",
  "footer_rights": "All rights reserved."
}

/apps/sencommerce-storefront/locales/de/common.json

{
  "brand": "Studio Sen Commerce",
  "nav_shop": "Shop",
  "nav_about": "Über uns",
  "nav_cart": "Warenkorb",
  "cta_checkout": "Zur Kasse",
  "footer_rights": "Alle Rechte vorbehalten."
}

/apps/sencommerce-storefront/locales/en/marketing.json

{
  "headline": "Calm commerce, sharp design.",
  "subline": "A mindful storefront built with Medusa and Next.js."
}

/apps/sencommerce-storefront/locales/de/marketing.json

{
  "headline": "Ruhiger Handel, klares Design.",
  "subline": "Ein achtsamer Storefront mit Medusa und Next.js."
}

All other EU locale files: {}.

⸻

DX Notes
	•	Add NPM scripts for typecheck, dev:storefront, dev:server.
	•	Document how to add a new locale: create locales/{lng}/common.json + marketing.json, add to middleware allowlist, add templates in Resend map if needed.
	•	Keep all product/artwork/collection translations out of scope for now.
