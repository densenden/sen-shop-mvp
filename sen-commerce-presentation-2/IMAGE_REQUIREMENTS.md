# SenCommerce Presentation - Image Requirements

This document lists all PNG images needed for the enhanced presentation.

## Overview

The presentation focuses on **automation** with two key features:
1. **Product Creation Automation** (idea → artwork → collection → products → available)
2. **Hybrid Translation** (23+ languages with zero database bloat)

---

## Required Images

### 1. workflow-diagram.png
**Slide:** Feature 1: Product Creation Automation
**Purpose:** Show the complete workflow from idea to live product
**Content:**
- Visual flow diagram with 4 steps:
  1. IDEA (artwork upload icon)
  2. COLLECTION (folder/organize icon)
  3. PRODUCTS (multiple product variants)
  4. AVAILABLE (storefront with checkmark)
- Include time indicators: 30s → 1min → 2min → 30s
- Show "Traditional: 2-3 hours" vs "SenCommerce: 4 minutes" comparison
- Use arrows to show flow between steps

**Style:** Clean, modern diagram with icons and time labels
**Dimensions:** 1920x1080 (16:9 aspect ratio)

---

### 2. admin-collection-creation.png
**Slide:** DEMO: Creating a Real Collection
**Purpose:** Screenshot or mockup of the admin interface showing collection creation
**Content:**
- Admin dashboard UI showing:
  - Artwork upload area (with meditation artwork example)
  - Collection form (name: "Wellness Collection")
  - Product generation options (T-shirts, mugs, posters checkboxes)
  - "Generate Products" button
- Highlight the key UI elements with circles or annotations
- Show the simplicity of the interface

**Style:** Actual screenshot or high-fidelity mockup
**Dimensions:** 1920x1080 (16:9 aspect ratio)

---

### 3. code-snippet-pod-manager.png
**Slide:** How It Works: Multi-POD Manager
**Purpose:** Show key code from PODProviderManager
**Content:**
- Code snippet from `sen-commerce/src/modules/printful/services/pod-provider-facade.ts`
- Highlight these sections:
  ```typescript
  export class PODProviderManager extends MedusaService({}) {
    private providers: Map<string, PODProvider> = new Map()

    constructor(container: any, options?: any) {
      // Initialize providers
      this.providers.set('printful', new PrintfulProvider(container))
      this.providers.set('printify', new PrintifyProvider(container))
      this.providers.set('gelato', new GelatoProvider(container))
    }

    getProvider(providerName?: string): PODProvider {
      const name = providerName || this.defaultProvider
      const provider = this.providers.get(name)
      return provider
    }
  }
  ```
- Use syntax highlighting
- Add annotations pointing to key features:
  - "Unified interface"
  - "Dynamic switching"
  - "3 providers registered"

**Style:** Dark theme code editor (VS Code style)
**Dimensions:** 1920x1080 (16:9 aspect ratio)

---

### 4. hybrid-translation-diagram.png
**Slide:** Hybrid Translation Architecture
**Purpose:** Visual representation of the two-layer translation system
**Content:**
- Two distinct layers shown side-by-side:

  **Layer 1: Static UI (next-intl)**
  - Icon: Document with translations
  - Elements: "Buttons, navigation, forms"
  - Badge: "Zero latency"

  **Layer 2: Dynamic Content (GT)**
  - Icon: Cloud with AI sparkles
  - Elements: "Product titles & descriptions"
  - Badge: "Real-time AI translation"

- Arrow showing both layers working together
- Bottom result: "Fast + No DB bloat + Scalable"

**Style:** Modern architecture diagram with icons
**Dimensions:** 1920x1080 (16:9 aspect ratio)

---

### 5. code-snippet-translation.png
**Slide:** How It Works: Hybrid Translation
**Purpose:** Show TranslatedContent component code
**Content:**
- Code snippet from `sen-commerce-storefront/components/TranslatedContent.tsx`
- Highlight this section:
  ```typescript
  export function TranslatedContent({ children, context }: TranslatedContentProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    // Hybrid approach: GT only for database content
    // Static UI text uses next-intl, dynamic DB content uses GT

    if (!mounted) {
      return <>{children}</>
    }

    return (
      <ErrorBoundary fallback={<>{children}</>}>
        <T context={context}>{children}</T>
      </ErrorBoundary>
    )
  }
  ```
- Add annotations:
  - "Dynamic import (SSR safe)"
  - "Client-side mounting"
  - "Error boundary"
  - "Context-aware translation"

**Style:** Dark theme code editor (VS Code style)
**Dimensions:** 1920x1080 (16:9 aspect ratio)

---

### 6. translation-demo-screenshot.png
**Slide:** DEMO: See Translation in Action
**Purpose:** Show the storefront with language selector and translated content
**Content:**
- Split screen showing:

  **Left side: English**
  - Product card with English title "Zen Meditation T-Shirt"
  - English description
  - Language selector showing "EN"

  **Right side: German**
  - Same product card with German title "Zen Meditation T-Shirt"
  - German description (translated)
  - Language selector showing "DE"

- Arrow between them showing the switch
- Badge: "No page reload!"

**Style:** Actual storefront screenshot or high-fidelity mockup
**Dimensions:** 1920x1080 (16:9 aspect ratio)

---

### 7. time-savings-chart.png
**Slide:** Results: Time Saved
**Purpose:** Visual chart comparing traditional vs SenCommerce
**Content:**
- Three comparison bars:

  1. **Product Creation**
     - Traditional: Long bar (2-3 hours)
     - SenCommerce: Tiny bar (4 minutes)
     - Savings: "97% time saved"

  2. **Multilingual Support**
     - Traditional: Manual effort bar
     - SenCommerce: Instant (automatic)
     - Savings: "100% time saved"

  3. **Database Storage**
     - Traditional: 23x storage
     - SenCommerce: 1x storage
     - Savings: "96% storage saved"

**Style:** Clean bar chart or infographic
**Dimensions:** 1920x1080 (16:9 aspect ratio)

---

## Image Specifications

### General Requirements:
- **Format:** PNG (with transparency where appropriate)
- **Resolution:** 1920x1080 pixels (16:9 aspect ratio)
- **Color scheme:** Match SenCommerce brand (use existing images as reference)
- **Text readability:** Ensure all text is large enough to read in presentation mode
- **Consistency:** Use similar visual style across all images

### Code Snippet Requirements:
- Use dark theme (similar to VS Code Dark+)
- Font: Fira Code or Consolas (monospace)
- Syntax highlighting for TypeScript
- Line numbers on the left
- File path shown at top
- Annotations in contrasting color (yellow or cyan)

### Diagram Requirements:
- Use icons for visual interest
- Clear flow arrows
- Labeled sections
- Consistent color coding:
  - Admin/Input: Blue
  - Processing: Purple
  - Output/Result: Green
  - Automation: Orange/Yellow accents

---

## Priority Order

Create images in this order for maximum presentation impact:

1. **HIGH PRIORITY** (Demo slides):
   - admin-collection-creation.png
   - translation-demo-screenshot.png
   - time-savings-chart.png

2. **MEDIUM PRIORITY** (Flow diagrams):
   - workflow-diagram.png
   - hybrid-translation-diagram.png

3. **NICE TO HAVE** (Code examples):
   - code-snippet-pod-manager.png
   - code-snippet-translation.png

---

## Tools & Resources

### Recommended Tools:
- **Diagrams:** Figma, Excalidraw, draw.io
- **Screenshots:** Use actual running application
- **Code snippets:** Carbon (carbon.now.sh) or use IDE screenshot
- **Charts:** Chart.js, D3.js, or Figma

### Existing Assets:
Check `sen-commerce-presentation-2/public/images/` for existing brand assets and visual style reference.

---

## Notes

- All images should tell the **automation story**
- Focus on **before/after** comparisons
- Highlight **time savings** visually
- Keep it **simple and clean** - avoid clutter
- Use **real data** where possible (actual admin UI, actual code)

---

## Questions?

If you need clarification on any image requirements, refer to:
- The presentation data: `sen-commerce-presentation-2/data/presentation.json`
- Existing images: `sen-commerce-presentation-2/public/images/`
- Actual code files referenced in each image requirement
