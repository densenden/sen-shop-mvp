import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

interface ContentGenerationRequest {
  product_context: {
    name?: string
    artwork_title?: string
    product_type?: string
    materials?: string[]
    target_audience?: string
    keywords?: string[]
    provider?: string
  }
  generation_options?: {
    variation_count?: number
    tone?: 'professional' | 'casual' | 'creative' | 'luxury'
    length?: 'short' | 'medium' | 'long'
    include_seo?: boolean
    focus_keywords?: string[]
  }
  output_format?: 'json' | 'text'
}

interface ContentVariation {
  title: string
  description: string
  seo_title?: string
  meta_description?: string
  keywords?: string[]
  url_slug?: string
  bullet_points?: string[]
  tags?: string[]
}

/**
 * POST /api/admin/ai/generate-content
 * Generate AI-powered content variations for POD products
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      product_context,
      generation_options = {},
      output_format = 'json'
    } = req.body as ContentGenerationRequest

    if (!product_context) {
      return res.status(400).json({
        message: "Product context is required for content generation"
      })
    }

    const {
      variation_count = 3,
      tone = 'professional',
      length = 'medium',
      include_seo = true,
      focus_keywords = []
    } = generation_options

    // Validate variation count
    if (variation_count < 1 || variation_count > 5) {
      return res.status(400).json({
        message: "Variation count must be between 1 and 5"
      })
    }

    // Check cache first (in production, use Redis or database)
    const cacheKey = generateCacheKey(product_context, generation_options)
    const cachedContent = await getCachedContent(cacheKey)

    if (cachedContent) {
      return res.json({
        variations: cachedContent.variations,
        cached: true,
        generated_at: cachedContent.generated_at,
        cache_key: cacheKey
      })
    }

    // Generate content variations
    const variations = await generateContentVariations(
      product_context,
      {
        variation_count,
        tone,
        length,
        include_seo,
        focus_keywords
      }
    )

    // Cache the results for 24 hours
    await cacheContent(cacheKey, variations)

    const response = {
      variations,
      cached: false,
      generated_at: new Date().toISOString(),
      cache_key: cacheKey,
      generation_stats: {
        variations_generated: variations.length,
        tone_used: tone,
        length_setting: length,
        seo_optimized: include_seo
      }
    }

    if (output_format === 'text') {
      // Return plain text format for easy copying
      const textOutput = variations.map((variation, index) =>
        formatVariationAsText(variation, index + 1)
      ).join('\n\n---\n\n')

      res.setHeader('Content-Type', 'text/plain')
      res.send(textOutput)
    } else {
      res.json(response)
    }

  } catch (error: any) {
    console.error("Error generating AI content:", error)
    res.status(500).json({
      message: "Failed to generate AI content",
      error: error.message
    })
  }
}

/**
 * GET /api/admin/ai/generate-content/cache/[key]
 * Retrieve cached content by cache key
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cacheKey = req.params.key

    if (!cacheKey) {
      return res.status(400).json({
        message: "Cache key is required"
      })
    }

    const cachedContent = await getCachedContent(cacheKey)

    if (!cachedContent) {
      return res.status(404).json({
        message: "Cached content not found or expired"
      })
    }

    res.json({
      variations: cachedContent.variations,
      cached: true,
      generated_at: cachedContent.generated_at,
      cache_key: cacheKey
    })

  } catch (error: any) {
    console.error("Error retrieving cached content:", error)
    res.status(500).json({
      message: "Failed to retrieve cached content",
      error: error.message
    })
  }
}

/**
 * Generate content variations using AI (mock implementation)
 * In production, this would call OpenAI API
 */
async function generateContentVariations(
  context: any,
  options: any
): Promise<ContentVariation[]> {
  const { variation_count, tone, length, include_seo, focus_keywords } = options
  const variations: ContentVariation[] = []

  // Mock AI content generation
  for (let i = 0; i < variation_count; i++) {
    const variation = await generateSingleVariation(context, options, i)
    variations.push(variation)
  }

  return variations
}

/**
 * Generate a single content variation
 */
async function generateSingleVariation(
  context: any,
  options: any,
  index: number
): Promise<ContentVariation> {
  const { tone, length, include_seo } = options
  const productName = context.name || context.artwork_title || 'Custom Product'
  const productType = context.product_type || 'T-Shirt'
  const materials = context.materials || ['Cotton']

  // Base content templates
  const titleTemplates = {
    professional: [
      `Premium ${productType} - ${productName}`,
      `High-Quality ${productType} featuring ${productName}`,
      `Custom ${productType} with ${productName} Design`
    ],
    casual: [
      `Cool ${productType} - ${productName}`,
      `Awesome ${productType} with ${productName}`,
      `${productName} ${productType} - Perfect for You`
    ],
    creative: [
      `Artistic ${productType}: ${productName}`,
      `Express Yourself with ${productName} ${productType}`,
      `Unique ${productName} Design on Premium ${productType}`
    ],
    luxury: [
      `Exclusive ${productType} Collection - ${productName}`,
      `Luxury ${productType} featuring ${productName}`,
      `Premium Designer ${productType} - ${productName}`
    ]
  }

  const descriptionTemplates = {
    short: {
      professional: `High-quality ${productType.toLowerCase()} made from premium ${materials[0].toLowerCase()}. Features the stunning ${productName} design.`,
      casual: `Super comfy ${productType.toLowerCase()} with an amazing ${productName} design. Made from soft ${materials[0].toLowerCase()}.`,
      creative: `Transform your style with this artistic ${productType.toLowerCase()}. The ${productName} design brings creativity to life.`,
      luxury: `Indulge in luxury with this exclusive ${productType.toLowerCase()}. The ${productName} design epitomizes sophistication.`
    },
    medium: {
      professional: `This premium ${productType.toLowerCase()} combines exceptional quality with striking design. Crafted from high-grade ${materials[0].toLowerCase()}, it features the captivating ${productName} artwork that makes a statement. Perfect for those who appreciate both comfort and style.`,
      casual: `Get ready to turn heads with this awesome ${productType.toLowerCase()}! The ${productName} design is absolutely stunning, and the soft ${materials[0].toLowerCase()} material feels amazing. It's perfect for everyday wear or special occasions.`,
      creative: `Express your unique personality with this one-of-a-kind ${productType.toLowerCase()}. The ${productName} design is a masterpiece that transforms ordinary clothing into wearable art. Made from quality ${materials[0].toLowerCase()} for lasting comfort.`,
      luxury: `Experience unparalleled elegance with this exclusive ${productType.toLowerCase()}. The sophisticated ${productName} design reflects impeccable taste, while the premium ${materials[0].toLowerCase()} ensures exceptional comfort and durability.`
    },
    long: {
      professional: `Discover the perfect fusion of quality and design with this exceptional ${productType.toLowerCase()}. Meticulously crafted from premium ${materials[0].toLowerCase()}, this piece features the remarkable ${productName} artwork that showcases artistic excellence. The attention to detail in both material selection and design execution ensures this ${productType.toLowerCase()} stands out from the crowd. Whether you're looking to make a statement or simply enjoy superior comfort, this piece delivers on all fronts. The durable construction means it will maintain its beauty and fit wash after wash, making it a valuable addition to any wardrobe.`,
      casual: `This incredible ${productType.toLowerCase()} is everything you've been looking for! The ${productName} design is absolutely gorgeous and really pops against the soft ${materials[0].toLowerCase()} fabric. We're talking serious comfort here - the kind that makes you never want to take it off. It's perfect for hanging out with friends, running errands, or just lounging around. Plus, the quality is amazing, so you know it's going to last through countless wears and washes. Trust us, once you put this on, it's going to become your new favorite.`,
      creative: `Step into a world where fashion meets art with this extraordinary ${productType.toLowerCase()}. The ${productName} design isn't just printed on fabric - it's a canvas for self-expression, a conversation starter, and a piece of wearable creativity. Every thread of the premium ${materials[0].toLowerCase()} has been chosen to complement the artistic vision, creating a harmonious blend of comfort and visual impact. This isn't just clothing; it's a statement about who you are and what you value. The unique design ensures you'll never blend into the crowd, while the superior quality means this artistic masterpiece will be part of your story for years to come.`,
      luxury: `Elevate your wardrobe with this exquisite ${productType.toLowerCase()} that represents the pinnacle of sophisticated design and premium craftsmanship. The ${productName} artwork has been carefully selected and expertly rendered to create a piece that transcends ordinary fashion. Constructed from the finest ${materials[0].toLowerCase()} available, every aspect of this garment speaks to discerning taste and appreciation for quality. The luxurious feel against your skin, the impeccable fit, and the stunning visual impact combine to create an experience that goes beyond mere clothing. This is an investment in your personal style, a piece that will command attention and admiration while providing unmatched comfort and durability.`
    }
  }

  const titles = titleTemplates[tone] || titleTemplates.professional
  const descriptions = descriptionTemplates[length][tone] || descriptionTemplates[length].professional

  const title = titles[index % titles.length]
  const description = descriptions

  const variation: ContentVariation = {
    title,
    description,
    bullet_points: generateBulletPoints(context, productType, materials),
    tags: generateTags(context, productType)
  }

  if (include_seo) {
    variation.seo_title = generateSEOTitle(title, context)
    variation.meta_description = generateMetaDescription(description)
    variation.keywords = generateKeywords(context, options.focus_keywords)
    variation.url_slug = generateURLSlug(title)
  }

  return variation
}

/**
 * Generate bullet points for product features
 */
function generateBulletPoints(context: any, productType: string, materials: string[]): string[] {
  const basePoints = [
    `Premium ${materials[0].toLowerCase()} construction`,
    `Unique ${context.artwork_title || context.name || 'custom'} design`,
    `Comfortable and durable`,
    `Perfect for casual or special occasions`
  ]

  const additionalPoints = [
    'Machine washable for easy care',
    'Available in multiple sizes',
    'Fade-resistant printing',
    'Ethically sourced materials',
    'Designed for long-lasting wear'
  ]

  // Combine base points with some additional ones
  return [...basePoints, ...additionalPoints.slice(0, 2)]
}

/**
 * Generate relevant tags
 */
function generateTags(context: any, productType: string): string[] {
  const baseTags = [productType.toLowerCase(), 'custom design', 'print on demand']

  if (context.artwork_title) {
    baseTags.push(context.artwork_title.toLowerCase().replace(/\s+/g, '-'))
  }

  if (context.target_audience) {
    baseTags.push(context.target_audience.toLowerCase())
  }

  const additionalTags = ['unique', 'comfortable', 'stylish', 'quality', 'gift']

  return [...baseTags, ...additionalTags.slice(0, 3)]
}

/**
 * Generate SEO-optimized title
 */
function generateSEOTitle(title: string, context: any): string {
  const maxLength = 60
  let seoTitle = title

  if (context.keywords && context.keywords.length > 0) {
    seoTitle = `${title} | ${context.keywords[0]}`
  }

  return seoTitle.length > maxLength ? seoTitle.substring(0, maxLength - 3) + '...' : seoTitle
}

/**
 * Generate meta description
 */
function generateMetaDescription(description: string): string {
  const maxLength = 155
  return description.length > maxLength
    ? description.substring(0, maxLength - 3) + '...'
    : description
}

/**
 * Generate keywords
 */
function generateKeywords(context: any, focusKeywords: string[]): string[] {
  const keywords = [...(focusKeywords || [])]

  if (context.product_type) {
    keywords.push(context.product_type.toLowerCase())
  }

  if (context.materials) {
    keywords.push(...context.materials.map((m: string) => m.toLowerCase()))
  }

  keywords.push('custom', 'design', 'print on demand', 'unique')

  return [...new Set(keywords)] // Remove duplicates
}

/**
 * Generate URL slug
 */
function generateURLSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Generate cache key for content
 */
function generateCacheKey(context: any, options: any): string {
  const hash = require('crypto')
    .createHash('md5')
    .update(JSON.stringify({ context, options }))
    .digest('hex')

  return `ai_content_${hash}`
}

/**
 * Mock cache implementation (in production, use Redis)
 */
const contentCache = new Map<string, any>()

async function getCachedContent(cacheKey: string): Promise<any> {
  const cached = contentCache.get(cacheKey)

  if (!cached) return null

  // Check if expired (24 hours)
  const expiresAt = new Date(cached.generated_at)
  expiresAt.setHours(expiresAt.getHours() + 24)

  if (new Date() > expiresAt) {
    contentCache.delete(cacheKey)
    return null
  }

  return cached
}

async function cacheContent(cacheKey: string, variations: ContentVariation[]): Promise<void> {
  contentCache.set(cacheKey, {
    variations,
    generated_at: new Date().toISOString()
  })
}

/**
 * Format variation as plain text
 */
function formatVariationAsText(variation: ContentVariation, index: number): string {
  let text = `Variation ${index}:\n\n`
  text += `Title: ${variation.title}\n\n`
  text += `Description: ${variation.description}\n\n`

  if (variation.bullet_points && variation.bullet_points.length > 0) {
    text += 'Features:\n'
    variation.bullet_points.forEach(point => {
      text += `• ${point}\n`
    })
    text += '\n'
  }

  if (variation.seo_title) {
    text += `SEO Title: ${variation.seo_title}\n`
  }

  if (variation.meta_description) {
    text += `Meta Description: ${variation.meta_description}\n`
  }

  if (variation.keywords && variation.keywords.length > 0) {
    text += `Keywords: ${variation.keywords.join(', ')}\n`
  }

  if (variation.url_slug) {
    text += `URL Slug: ${variation.url_slug}\n`
  }

  if (variation.tags && variation.tags.length > 0) {
    text += `Tags: ${variation.tags.join(', ')}\n`
  }

  return text
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]