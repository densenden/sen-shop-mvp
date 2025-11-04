/**
 * OpenAI Service for Backend
 * GPT-4 integration for ecommerce content generation
 */

import OpenAI from 'openai'
import type {
  ContentGenerationRequest,
  ContentVariation,
  OpenAIServiceConfig
} from '../types'

export class OpenAIContentService {
  private openai: OpenAI | null = null
  private config: OpenAIServiceConfig
  private apiKeyAvailable: boolean

  constructor(config?: Partial<OpenAIServiceConfig>) {
    // Check for API key - support both naming conventions
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_SECRET_KEY
    this.apiKeyAvailable = !!apiKey

    if (this.apiKeyAvailable) {
      this.openai = new OpenAI({ apiKey })
    }

    // Default configuration optimized for ecommerce
    this.config = {
      model: 'gpt-4o-mini', // Using gpt-4o-mini for JSON support and lower cost
      maxTokens: 2000,
      temperature: 0.7,
      retryAttempts: 3,
      cacheExpiryHours: 24,
      ...config
    }
  }

  /**
   * Analyze artwork image and generate description using GPT-4 Vision
   */
  async analyzeArtworkImage(imageUrl: string): Promise<string> {
    // If OpenAI API is not available, return a basic description
    if (!this.apiKeyAvailable || !this.openai) {
      console.warn('[OpenAI] API key not available, skipping image analysis')
      return ''
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // gpt-4o-mini supports vision
        messages: [
          {
            role: 'system',
            content: 'You are an art critic and image analyzer. Describe artworks concisely, focusing on visual elements, style, colors, mood, and main subjects. Keep descriptions under 100 words.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this artwork image. Provide a short, engaging description (2-3 sentences) that describes what you see, the style, colors, mood, and main visual elements. Be concise and artistic in your language.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low' // Use low detail for faster processing
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })

      const description = completion.choices[0]?.message?.content || ''
      console.log('[OpenAI] Image analysis completed:', description.substring(0, 100) + '...')
      return description.trim()
    } catch (error) {
      console.error('[OpenAI] Image analysis failed:', error)
      return ''
    }
  }

  /**
   * Generate content variations with OpenAI
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentVariation[]> {
    const {
      product_context,
      generation_options = {}
    } = request

    const {
      variation_count = 3,
      tone = 'professional',
      length = 'medium',
      include_seo = true,
      focus_keywords = []
    } = generation_options

    // If OpenAI API is available, try to use it
    if (this.apiKeyAvailable && this.openai) {
      try {
        return await this.generateWithOpenAI(
          product_context,
          { variation_count, tone, length, include_seo, focus_keywords }
        )
      } catch (error) {
        console.error('OpenAI generation failed, falling back to mock:', error)
        // Fall through to mock generation
      }
    }

    // Fallback to mock generation
    return this.generateMockContent(
      product_context,
      { variation_count, tone, length, include_seo, focus_keywords }
    )
  }

  /**
   * Generate content using OpenAI GPT-4
   */
  private async generateWithOpenAI(
    context: any,
    options: any
  ): Promise<ContentVariation[]> {
    const prompt = this.buildPrompt(context, options)

    const completion = await this.openai!.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ecommerce copywriter specializing in print-on-demand products.
Generate compelling, SEO-optimized product content that converts browsers into buyers.
Return valid JSON only, no additional text.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No content received from OpenAI')
    }

    try {
      const parsed = JSON.parse(responseContent)
      return parsed.variations || []
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      throw new Error('Invalid JSON response from OpenAI')
    }
  }

  /**
   * Build the prompt for OpenAI
   */
  private buildPrompt(context: any, options: any): string {
    const artworkTitle = context.artwork_title || context.name || 'Artwork'
    const artworkDescription = context.artwork_description || ''
    const artworkTags = context.artwork_tags || []
    const collectionName = context.collection_name || ''
    const collectionDescription = context.collection_description || ''
    const collectionTopic = context.collection_topic || ''
    const collectionPurpose = context.collection_purpose || ''
    const brandStory = context.brand_story || ''
    const genesisStory = context.genesis_story || ''
    const designPhilosophy = context.design_philosophy || ''
    const coreValues = context.core_values || []
    const visualThemes = context.visual_themes || []
    const lifestyleConcepts = context.lifestyle_concepts || []
    const targetAudienceMessaging = context.target_audience_messaging || ''
    const brandTagline = context.brand_tagline || ''
    const productType = context.product_type || 'Product'
    const keywords = context.keywords || []
    const materials = context.materials || ['Premium materials']

    // Build rich context string
    let contextDetails = `Artwork Title: ${artworkTitle}\n`

    if (artworkDescription) {
      contextDetails += `Artwork Description: ${artworkDescription}\n`
    }

    if (artworkTags.length > 0) {
      contextDetails += `Artwork Tags: ${artworkTags.join(', ')}\n`
    }

    if (collectionName) {
      contextDetails += `\nCOLLECTION CONTEXT:\n`
      contextDetails += `Collection Name: ${collectionName}\n`

      if (collectionDescription) {
        contextDetails += `Collection Description: ${collectionDescription}\n`
      }

      if (collectionTopic) {
        contextDetails += `Collection Topic: ${collectionTopic}\n`
      }

      if (collectionPurpose) {
        contextDetails += `Collection Purpose: ${collectionPurpose}\n`
      }

      if (brandStory) {
        contextDetails += `Brand Story: ${brandStory}\n`
      }

      if (genesisStory) {
        contextDetails += `Genesis Story: ${genesisStory}\n`
      }

      if (designPhilosophy) {
        contextDetails += `Design Philosophy: ${designPhilosophy}\n`
      }

      if (coreValues.length > 0) {
        contextDetails += `Core Values: ${coreValues.join(', ')}\n`
      }

      if (visualThemes.length > 0) {
        contextDetails += `Visual Themes: ${visualThemes.join(', ')}\n`
      }

      if (lifestyleConcepts.length > 0) {
        contextDetails += `Lifestyle Concepts: ${lifestyleConcepts.join(', ')}\n`
      }

      if (targetAudienceMessaging) {
        contextDetails += `Target Audience: ${targetAudienceMessaging}\n`
      }

      if (brandTagline) {
        contextDetails += `Brand Tagline: ${brandTagline}\n`
      }
    }

    contextDetails += `\nProduct Type: ${productType}\n`
    contextDetails += `Materials: ${materials.join(', ')}\n`

    if (keywords.length > 0) {
      contextDetails += `Keywords: ${keywords.join(', ')}\n`
    }

    return `Generate ${options.variation_count} compelling ecommerce product variations for a print-on-demand product featuring unique artwork.

CONTEXT:
${contextDetails}

WRITING GUIDELINES:
- Tone: ${options.tone}
- Length: ${options.length} (${this.getLengthGuidance(options.length)})
- Focus on the ARTWORK and its story, NOT technical product specs
- Create titles that emphasize the artwork/design, not the product type
- Write descriptions as 3 engaging paragraphs that:
  1. Introduce the artwork's story, meaning, and the collection's BRAND STORY/VALUES - make it feel like a movement
  2. Connect emotionally - how wearing/owning this makes them part of the brand's community and values
  3. Call to action - invite them to join, express themselves, or be part of something bigger
- HEAVILY emphasize collection brand story, core values, lifestyle concepts, and target audience messaging
- Make the customer feel they're joining a community or movement, not just buying a product
- Use "we", "us", "together" language to build belonging
- Reference the brand philosophy, tagline, and genesis story when available
- Avoid technical jargon like model numbers, material codes, or manufacturer names
- Use ${options.tone} language that sells belonging to a tribe/movement

TITLE REQUIREMENTS:
- Focus on the artwork name/theme first
- Keep product type subtle (e.g., "${artworkTitle} Art Print" not "Custom Product With ${artworkTitle}")
- Under 70 characters
- Emotionally compelling and memorable

DESCRIPTION REQUIREMENTS:
- Write in 3 distinct paragraphs (use \\n\\n to separate)
- Paragraph 1: Lead with artwork story + collection brand values/philosophy - paint the vision of the movement/community
- Paragraph 2: Make them feel what it's like to wear/own this - the emotional benefit of belonging to the brand tribe
- Paragraph 3: Strong call to action - "join us", "be part of", "express your values", "show the world" - invite them into the community
- MUST reference brand story, core values, lifestyle concepts when available - this is critical!
- Use inclusive "we/us/our community" language throughout
- Mention product quality naturally, but don't make it the focus
- ${this.getLengthGuidance(options.length)}

Return JSON in this EXACT format:
{
  "variations": [
    {
      "title": "Artwork-focused title (under 70 characters)",
      "description": "Three engaging paragraphs separated by \\n\\n",
      "seo_title": "SEO optimized title (under 60 characters)",
      "meta_description": "Meta description (under 155 characters)",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "url_slug": "seo-friendly-url-slug",
      "bullet_points": ["Feature 1", "Feature 2", "Feature 3"],
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}

CRITICAL:
- Generate exactly ${options.variation_count} variations
- Each variation must be UNIQUE and offer different angles/perspectives
- NO technical product names or model numbers in titles
- Focus on artwork first, product second
- Make it irresistible and emotionally engaging`
  }

  /**
   * Get length guidance based on setting
   */
  private getLengthGuidance(length: string): string {
    switch (length) {
      case 'short':
        return '50-100 words, concise and punchy'
      case 'medium':
        return '100-200 words, balanced detail'
      case 'long':
        return '200-300 words, comprehensive and detailed'
      default:
        return '100-200 words'
    }
  }

  /**
   * Generate mock content (fallback when OpenAI is unavailable)
   */
  private async generateMockContent(
    context: any,
    options: any
  ): Promise<ContentVariation[]> {
    const { variation_count, tone, length, include_seo } = options
    const variations: ContentVariation[] = []

    for (let i = 0; i < variation_count; i++) {
      variations.push(this.generateMockVariation(context, options, i))
    }

    return variations
  }

  /**
   * Generate a single mock variation
   */
  private generateMockVariation(
    context: any,
    options: any,
    index: number
  ): ContentVariation {
    const { tone, length, include_seo } = options
    const productName = context.name || context.artwork_title || 'Custom Product'
    const productType = context.product_type || 'T-Shirt'
    const materials = context.materials || ['Cotton']

    // Title templates
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

    // Description templates
    const descriptionTemplates = {
      short: {
        professional: `High-quality ${productType.toLowerCase()} made from premium ${materials[0].toLowerCase()}. Features the stunning ${productName} design.`,
        casual: `Super comfy ${productType.toLowerCase()} with an amazing ${productName} design. Made from soft ${materials[0].toLowerCase()}.`,
        creative: `Transform your style with this artistic ${productType.toLowerCase()}. The ${productName} design brings creativity to life.`,
        luxury: `Indulge in luxury with this exclusive ${productType.toLowerCase()}. The ${productName} design epitomizes sophistication.`
      },
      medium: {
        professional: `The ${productName} artwork represents more than just a design - it's a symbol of the values and vision we share as a community. This collection was born from a desire to create meaningful connections through art that speaks to who we are and what we believe in.\n\nWhen you wear this ${productType.toLowerCase()}, you're not just wearing premium ${materials[0].toLowerCase()} - you're expressing your alignment with a movement that values authenticity, creativity, and self-expression. Every detail has been crafted to help you feel confident in showing the world what you stand for.\n\nJoin us in celebrating bold design and meaningful expression. Together, we're building a community of individuals who refuse to settle for ordinary. Wear this piece and let it be your invitation to others to join something bigger than themselves.`,
        casual: `The ${productName} design comes from our shared love of art that means something real. We created this collection to bring together people who see the world differently and aren't afraid to show it. This ${productType.toLowerCase()} is your badge of belonging to that tribe.\n\nEvery time you wear this, made with quality ${materials[0].toLowerCase()}, you're telling the world you're part of our community - one that values creativity, connection, and living authentically. It feels incredible to wear something that represents who you truly are.\n\nBe part of the movement. Join us and thousands of others who are expressing their true selves and connecting over shared values. This isn't just clothing - it's your membership to a community that gets you.`,
        creative: `The ${productName} design was born from our collective vision - a community united by the belief that art can change perspectives and bring people together. This ${productType.toLowerCase()} carries the story of our tribe, our values, and our commitment to authentic self-expression.\n\nWearing this piece, crafted from quality ${materials[0].toLowerCase()}, means you're part of something larger - a movement of artists, dreamers, and free thinkers who refuse to conform. You'll feel the connection to our shared philosophy with every wear, knowing you're representing values that matter.\n\nJoin our community and make your voice heard. Together, we're creating a world where creativity and individuality are celebrated. Wear this as your declaration that you belong to a tribe that sees the extraordinary in the everyday.`,
        luxury: `The ${productName} artwork embodies the sophisticated philosophy that defines our exclusive community - where discerning taste meets meaningful expression. We've built this collection for those who understand that true luxury lies not just in quality, but in belonging to something exceptional.\n\nCrafted from premium ${materials[0].toLowerCase()}, this ${productType.toLowerCase()} represents your membership in a select circle that values both aesthetic excellence and authentic connection. When you wear this, you're signaling your place among those who refuse to compromise on either quality or values.\n\nBecome part of our distinguished community. Together, we're redefining what it means to express refinement through art that carries deeper meaning. This piece is your invitation to join a movement where excellence and authenticity converge.`
      },
      long: {
        professional: `Discover the perfect fusion of quality and design with this exceptional ${productType.toLowerCase()}. Meticulously crafted from premium ${materials[0].toLowerCase()}, this piece features the remarkable ${productName} artwork that showcases artistic excellence. The attention to detail in both material selection and design execution ensures this ${productType.toLowerCase()} stands out from the crowd. Whether you're looking to make a statement or simply enjoy superior comfort, this piece delivers on all fronts.`,
        casual: `This incredible ${productType.toLowerCase()} is everything you've been looking for! The ${productName} design is absolutely gorgeous and really pops against the soft ${materials[0].toLowerCase()} fabric. We're talking serious comfort here - the kind that makes you never want to take it off. It's perfect for hanging out with friends, running errands, or just lounging around. Plus, the quality is amazing, so you know it's going to last.`,
        creative: `Step into a world where fashion meets art with this extraordinary ${productType.toLowerCase()}. The ${productName} design isn't just printed on fabric - it's a canvas for self-expression, a conversation starter, and a piece of wearable creativity. Every thread of the premium ${materials[0].toLowerCase()} has been chosen to complement the artistic vision, creating a harmonious blend of comfort and visual impact.`,
        luxury: `Elevate your wardrobe with this exquisite ${productType.toLowerCase()} that represents the pinnacle of sophisticated design and premium craftsmanship. The ${productName} artwork has been carefully selected and expertly rendered to create a piece that transcends ordinary fashion. Constructed from the finest ${materials[0].toLowerCase()} available, every aspect speaks to discerning taste and appreciation for quality.`
      }
    }

    const titles = titleTemplates[tone] || titleTemplates.professional
    const descriptions = descriptionTemplates[length][tone] || descriptionTemplates[length].professional

    const title = titles[index % titles.length]
    const description = descriptions

    const variation: ContentVariation = {
      title,
      description,
      bullet_points: [
        `Premium ${materials[0].toLowerCase()} construction`,
        `Unique ${productName} design`,
        `Comfortable and durable`,
        `Perfect for casual or special occasions`,
        'Machine washable for easy care',
        'Fade-resistant printing'
      ],
      tags: [productType.toLowerCase(), 'custom design', 'print on demand', 'unique', 'quality']
    }

    if (include_seo) {
      variation.seo_title = this.generateSEOTitle(title, context)
      variation.meta_description = this.generateMetaDescription(description)
      variation.keywords = this.generateKeywords(context, options.focus_keywords)
      variation.url_slug = this.generateURLSlug(title)
    }

    return variation
  }

  /**
   * Generate SEO title
   */
  private generateSEOTitle(title: string, context: any): string {
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
  private generateMetaDescription(description: string): string {
    const maxLength = 155
    return description.length > maxLength
      ? description.substring(0, maxLength - 3) + '...'
      : description
  }

  /**
   * Generate keywords
   */
  private generateKeywords(context: any, focusKeywords: string[]): string[] {
    const keywords = [...(focusKeywords || [])]

    if (context.product_type) {
      keywords.push(context.product_type.toLowerCase())
    }

    if (context.materials) {
      keywords.push(...context.materials.map((m: string) => m.toLowerCase()))
    }

    keywords.push('custom', 'design', 'print on demand', 'unique')

    return [...new Set(keywords)]
  }

  /**
   * Generate URL slug
   */
  private generateURLSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Check if OpenAI is available
   */
  isOpenAIAvailable(): boolean {
    return this.apiKeyAvailable
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; usingMock: boolean; model: string } {
    return {
      available: this.apiKeyAvailable,
      usingMock: !this.apiKeyAvailable,
      model: this.config.model
    }
  }
}

// Singleton instance
let serviceInstance: OpenAIContentService | null = null

export function getOpenAIService(): OpenAIContentService {
  if (!serviceInstance) {
    serviceInstance = new OpenAIContentService()
  }
  return serviceInstance
}
