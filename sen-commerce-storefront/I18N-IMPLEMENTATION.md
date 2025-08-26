# Internationalization (i18n) Implementation Guide

## Overview

This document explains how internationalization is implemented in the SenCommerce storefront using Next.js 14 App Router with `next-intl` for all EU countries.

## Architecture

### Technology Stack
- **Next.js 14** with App Router
- **next-intl** - Modern i18n library for Next.js
- **TypeScript** - Type-safe translations
- **Browser-based locale detection** - Automatic language selection

### Supported Languages

The application supports **24 EU languages**, covering all EU member states:

| Code | Language | Country | Currency |
|------|----------|---------|----------|
| `en` | English | Malta, Ireland, Cyprus | EUR |
| `de` | Deutsch | Germany, Austria | EUR |
| `fr` | Français | France | EUR |
| `es` | Español | Spain | EUR |
| `it` | Italiano | Italy | EUR |
| `pt` | Português | Portugal | EUR |
| `nl` | Nederlands | Netherlands | EUR |
| `pl` | Polski | Poland | PLN |
| `cs` | Čeština | Czech Republic | CZK |
| `sk` | Slovenčina | Slovakia | EUR |
| `hu` | Magyar | Hungary | HUF |
| `ro` | Română | Romania | RON |
| `bg` | Български | Bulgaria | BGN |
| `hr` | Hrvatski | Croatia | EUR |
| `sl` | Slovenščina | Slovenia | EUR |
| `lv` | Latviešu | Latvia | EUR |
| `lt` | Lietuvių | Lithuania | EUR |
| `et` | Eesti | Estonia | EUR |
| `el` | Ελληνικά | Greece | EUR |
| `sv` | Svenska | Sweden | SEK |
| `da` | Dansk | Denmark | DKK |
| `fi` | Suomi | Finland | EUR |
| `mt` | Malti | Malta | EUR |
| `ga` | Gaeilge | Ireland | EUR |

## File Structure

```
sen-commerce-storefront/
├── i18n/
│   └── request.js              # next-intl configuration
├── messages/                   # Translation files
│   ├── en.json                # English (default)
│   ├── de.json                # German
│   ├── fr.json                # French
│   ├── es.json                # Spanish
│   ├── it.json                # Italian
│   ├── pt.json                # Portuguese
│   ├── nl.json                # Dutch
│   ├── pl.json                # Polish
│   ├── cs.json                # Czech
│   ├── sk.json                # Slovak
│   ├── hu.json                # Hungarian
│   ├── ro.json                # Romanian
│   ├── bg.json                # Bulgarian
│   ├── hr.json                # Croatian
│   ├── sl.json                # Slovenian
│   ├── lv.json                # Latvian
│   ├── lt.json                # Lithuanian
│   ├── et.json                # Estonian
│   ├── el.json                # Greek
│   ├── sv.json                # Swedish
│   ├── da.json                # Danish
│   ├── fi.json                # Finnish
│   ├── mt.json                # Maltese
│   └── ga.json                # Irish
├── app/
│   ├── [locale]/              # Locale-aware routes
│   │   ├── layout.tsx         # Locale layout wrapper
│   │   ├── page.tsx           # Homepage
│   │   ├── about/page.tsx     # About page
│   │   ├── products/[handle]/page.tsx
│   │   └── ...                # All other pages
│   └── components/
│       ├── Layout.tsx         # Main layout with i18n
│       └── LanguageSwitcher.tsx # Language selector
├── i18n.config.ts             # Locale configuration
├── middleware.ts              # Locale detection & routing
└── next.config.js             # Next.js config with next-intl
```

## How It Works

### 1. Locale Detection & Routing

**Automatic Detection:**
The middleware (`middleware.ts`) automatically detects the user's preferred language from:
1. **Browser language settings** (`Accept-Language` header)
2. **URL path** (e.g., `/de/products`)
3. **Fallback to English** if no match

**URL Structure:**
- Default locale (EN): `/products` 
- Other locales: `/de/products`, `/fr/products`, etc.
- The `localePrefix: 'as-needed'` configuration means English URLs don't need `/en/` prefix

### 2. Configuration Files

**i18n.config.ts:**
```typescript
export const locales = ['en', 'de', 'fr', 'es', ...] as const
export const defaultLocale: Locale = 'en'
export const localeNames: Record<Locale, string> = { ... }
export const localeCurrencies: Record<Locale, string> = { ... }
```

**middleware.ts:**
```typescript
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n.config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',    // EN doesn't need /en/ prefix
  localeDetection: true         // Auto-detect from browser
})
```

### 3. Translation Structure

Each translation file (`messages/{locale}.json`) contains structured content:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "currency": "USD"
  },
  "navigation": {
    "home": "Home",
    "products": "Products",
    "about": "About"
  },
  "home": {
    "hero": {
      "title": "Digital Art & Prints",
      "subtitle": "Curated collection..."
    }
  }
}
```

### 4. Using Translations in Components

**Basic Usage:**
```tsx
import { useTranslations } from 'next-intl'

function Component() {
  const t = useTranslations('navigation')
  return <h1>{t('home')}</h1>  // → "Home" (EN) or "Accueil" (FR)
}
```

**With Parameters:**
```tsx
const t = useTranslations('home')
return <p>{t('productsCount', { count: 5 })}</p>  // → "5 products"
```

**Multiple Namespaces:**
```tsx
const t = useTranslations()  // Access all namespaces
return (
  <div>
    <h1>{t('navigation.home')}</h1>
    <p>{t('home.hero.title')}</p>
  </div>
)
```

### 5. Language Switcher

Located in the footer under "Support" section:
- Dropdown with native language names
- Preserves current route when switching
- Shows triangle indicator for dropdown state
- Clean integration with footer design

```tsx
// LanguageSwitcher.tsx
const handleLocaleChange = (newLocale: Locale) => {
  const segments = pathname.split('/')
  segments[1] = newLocale
  const newPath = segments.join('/')
  router.push(newPath)  // Preserves route: /products → /de/products
}
```

### 6. Currency Formatting

Automatically formats prices based on user's locale and appropriate currency:

```tsx
const locale = useLocale()
const localeCurrency = localeCurrencies[locale] || 'EUR'

const formatPrice = (price: number) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: localeCurrency
  }).format(price / 100)
}
```

**Examples:**
- English: "$19.99 USD"
- German: "19,99 € EUR" 
- Polish: "89,99 zł PLN"
- Swedish: "199,99 kr SEK"

## Default Language Selection

The system determines the user's language in this priority order:

1. **URL Path**: If user visits `/de/products`, German is used
2. **Browser Language**: Reads `Accept-Language` header
   - `en-US, en` → English
   - `de-DE, de` → German
   - `fr-CA, fr` → French
   - `pl, en` → Polish
3. **Fallback**: English if no supported language detected

**Browser Language Detection Example:**
```
Accept-Language: de-DE,de;q=0.9,en;q=0.8
→ Redirects to /de/ (German)

Accept-Language: fr-FR,fr;q=0.9,en;q=0.8  
→ Redirects to /fr/ (French)

Accept-Language: zh-CN,zh;q=0.9
→ Uses /en/ (English fallback)
```

## SEO & Performance

### SEO Benefits
- **Hreflang support** - Search engines understand language variants
- **Locale-specific URLs** - `/de/products` ranks for German searches
- **Proper meta tags** - Each language gets appropriate meta content
- **Structured data** - Currency and location information

### Performance Optimizations
- **Translation files are code-split** - Only needed language loads
- **Static generation** - Pages pre-rendered for each locale
- **Efficient routing** - Minimal middleware overhead
- **Cached translations** - Browser caches translation files

## Adding New Languages

To add a new language (e.g., Norwegian):

1. **Add to configuration:**
```typescript
// i18n.config.ts
export const locales = [..., 'no'] as const
export const localeNames = {
  ..., 
  no: 'Norsk'
}
export const localeCurrencies = {
  ...,
  no: 'NOK'
}
```

2. **Create translation file:**
```bash
cp messages/en.json messages/no.json
# Translate content in messages/no.json
```

3. **That's it!** The system automatically:
   - Detects Norwegian browsers
   - Creates `/no/` routes
   - Formats currency as NOK
   - Shows "Norsk" in language switcher

## Translation Management

### Current Implementation
- **Manual translations** in JSON files
- **Type safety** through TypeScript
- **Structured namespaces** for organization
- **Parameter support** for dynamic content

### Recommended Workflow
1. **Update English first** (`messages/en.json`)
2. **Use translation service** (Google Translate, DeepL) for initial translations
3. **Native speaker review** for quality
4. **Test in browser** with each language
5. **Professional translation** for marketing content

### Translation Tools Integration
For scale, consider integrating with:
- **Crowdin** - Translation management platform
- **Lokalise** - Localization workflow
- **Weblate** - Open source translation tool

## Troubleshooting

### Common Issues

**1. "Couldn't find next-intl config file"**
- Ensure `i18n/request.js` exists
- Check `next.config.js` has `withNextIntl(nextConfig)`

**2. Translations not loading**
- Verify translation file exists: `messages/{locale}.json`
- Check JSON syntax is valid
- Ensure locale is in `locales` array

**3. Wrong locale detected**
- Check browser language settings
- Clear browser cache and cookies
- Test with different `Accept-Language` headers

**4. Build errors**
- Run `npm run build` to check for missing translations
- Fix TypeScript errors in translation keys
- Ensure all locales have required translation keys

### Debug Mode
Enable debug logging in development:
```typescript
// i18n/request.js
export default getRequestConfig(async ({ locale }) => {
  console.log('Loading locale:', locale) // Debug line
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
```

## Best Practices

### Translation Keys
- **Use nested structure**: `navigation.home` instead of `navigationHome`
- **Descriptive names**: `home.hero.title` instead of `homeTitle1`
- **Consistent casing**: Use camelCase throughout
- **Avoid HTML in translations**: Use components for markup

### Performance
- **Keep translation files small** - Split large files by feature
- **Use lazy loading** for rarely used translations  
- **Optimize images** with locale-specific assets when needed
- **Cache translation data** in production

### User Experience
- **Preserve user intent** - Keep same page when switching languages
- **Visual feedback** - Show loading states during language switches
- **Fallback gracefully** - Show English if translation missing
- **Test thoroughly** - Verify all features work in each language

This implementation provides a robust, scalable internationalization system that automatically serves your content in the user's preferred language while maintaining excellent performance and SEO benefits.