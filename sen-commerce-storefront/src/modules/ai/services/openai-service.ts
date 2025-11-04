/**
 * OpenAI Service
 * Task 4.2: GPT-4 service for ecommerce content generation
 */

import OpenAI from 'openai';
import {
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentVariation,
  SEOData,
  AIServiceConfig,
  ContentCache
} from '../types/content-generation';

interface CacheService {
  get(key: string): Promise<any> | any;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

interface OpenAIServiceOptions {
  apiKey?: string;
  cacheService?: CacheService;
  config?: Partial<AIServiceConfig>;
}

export class OpenAIService {
  private openai: OpenAI;
  private cacheService?: CacheService;
  private config: AIServiceConfig;

  constructor(options: OpenAIServiceOptions = {}) {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: options.apiKey || process.env.OPENAI_API_KEY
    });

    this.cacheService = options.cacheService;

    // Default configuration optimized for ecommerce
    this.config = {
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.7,
      retryAttempts: 3,
      cacheExpiryHours: 24,
      ...options.config
    };
  }

  /**
   * Generate content with 3 variations and SEO optimization
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = await this.getCachedContent(cacheKey);

    if (cached) {
      return {
        ...cached.content,
        cached: true
      };
    }

    try {
      // Generate content using OpenAI with retry logic
      const response = await this.generateWithRetry(request);

      // Cache the response
      if (this.cacheService) {
        await this.cacheContent(cacheKey, response);
      }

      return {
        ...response,
        cached: false
      };
    } catch (error) {
      console.error('OpenAI content generation failed:', error);

      // Return fallback content
      return this.generateFallbackContent(request);
    }
  }

  /**
   * Generate content with exponential backoff retry logic
   */
  private async generateWithRetry(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await this.callOpenAI(request);
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.retryAttempts) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await this.sleep(delay);

          console.warn(`OpenAI attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        }
      }
    }

    throw lastError;
  }

  /**
   * Make the actual OpenAI API call
   */
  private async callOpenAI(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    const prompt = this.buildPrompt(request);

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ecommerce copywriter specializing in print-on-demand products.
          Generate compelling, SEO-optimized product content that converts browsers into buyers.
          Return valid JSON with the exact structure requested.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No content received from OpenAI');
    }

    try {
      const parsed = JSON.parse(responseContent);
      return {
        variations: parsed.variations || [],
        seoData: parsed.seoData || {},
        generatedAt: new Date(),
        cached: false
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  /**
   * Build the prompt for content generation
   */
  private buildPrompt(request: ContentGenerationRequest): string {
    const contextParts = [];

    // Product information
    contextParts.push(`Product: ${request.productName}`);

    // Artwork context
    if (request.artworkInfo) {
      const { name, artist, medium, theme, description } = request.artworkInfo;
      contextParts.push(`Artwork: "${name}"${artist ? ` by ${artist}` : ''}`);
      if (medium) contextParts.push(`Medium: ${medium}`);
      if (theme) contextParts.push(`Theme: ${theme}`);
      if (description) contextParts.push(`Art Description: ${description}`);
    }

    // Collection context
    if (request.collectionInfo) {
      const { name, description, theme } = request.collectionInfo;
      contextParts.push(`Collection: ${name}`);
      if (theme) contextParts.push(`Collection Theme: ${theme}`);
      if (description) contextParts.push(`Collection: ${description}`);
    }

    // POD provider specifications
    if (request.podProviderInfo) {
      const { provider, materials, dimensions, printQuality, specifications } = request.podProviderInfo;
      contextParts.push(`Provider: ${provider}`);
      if (materials?.length) contextParts.push(`Materials: ${materials.join(', ')}`);
      if (dimensions) contextParts.push(`Dimensions: ${dimensions}`);
      if (printQuality) contextParts.push(`Print Quality: ${printQuality}`);
      if (specifications) contextParts.push(`Specifications: ${specifications}`);
    }

    // SEO and targeting
    if (request.seoKeywords?.length) {
      contextParts.push(`Target Keywords: ${request.seoKeywords.join(', ')}`);
    }
    if (request.targetAudience) {
      contextParts.push(`Target Audience: ${request.targetAudience}`);
    }

    const brandVoice = request.brandVoice || 'professional';
    const context = contextParts.join('\n');

    return `
Generate 3 product description variations and SEO data for this print-on-demand product.

Context:
${context}

Brand Voice: ${brandVoice}

Return JSON in this exact format:
{
  "variations": [
    {
      "type": "short",
      "content": "Brief, punchy description (2-3 sentences, social media friendly)",
      "title": "Short catchy title",
      "metaDescription": "Brief meta description",
      "keywords": ["relevant", "keywords"]
    },
    {
      "type": "detailed",
      "content": "Detailed technical description (4-6 sentences, specifications focus)",
      "title": "Detailed product title with specifications",
      "metaDescription": "Detailed meta description",
      "keywords": ["technical", "detailed", "keywords"]
    },
    {
      "type": "story",
      "content": "Story-driven description (3-5 sentences, emotional connection)",
      "title": "Emotional story-driven title",
      "metaDescription": "Story-driven meta description",
      "keywords": ["emotional", "story", "keywords"]
    }
  ],
  "seoData": {
    "metaTitle": "Primary SEO title (under 60 characters)",
    "metaDescription": "Primary meta description (under 160 characters)",
    "keywords": ["primary", "seo", "keywords", "max 10"],
    "urlSlug": "seo-friendly-url-slug"
  }
}

Focus on ecommerce conversion, highlight unique value proposition, and ensure all content is ready for immediate use.
`;
  }

  /**
   * Generate fallback content when OpenAI fails
   */
  private generateFallbackContent(request: ContentGenerationRequest): ContentGenerationResponse {
    const productName = request.productName;
    const artworkName = request.artworkInfo?.name || 'artwork';
    const provider = request.podProviderInfo?.provider || 'premium';

    const variations: ContentVariation[] = [
      {
        type: 'short',
        content: `${productName} featuring ${artworkName}. High-quality print perfect for any space.`,
        title: productName,
        metaDescription: `${productName} - High-quality print`,
        keywords: ['print', 'art', 'quality']
      },
      {
        type: 'detailed',
        content: `This ${productName} showcases ${artworkName} with ${provider} quality printing. Made with premium materials and fade-resistant inks for lasting beauty. Perfect for home or office decoration.`,
        title: `${productName} - Premium Quality Print`,
        metaDescription: `Premium ${productName} with high-quality printing and materials`,
        keywords: ['premium', 'quality', 'print', 'materials']
      },
      {
        type: 'story',
        content: `Transform your space with this stunning ${productName}. Each piece tells a unique story through ${artworkName}, bringing character and style to your environment.`,
        title: `${productName} - Transform Your Space`,
        metaDescription: `Transform your space with stunning ${productName}`,
        keywords: ['transform', 'space', 'stunning', 'style']
      }
    ];

    const seoData: SEOData = {
      metaTitle: `${productName} - Premium Art Print`,
      metaDescription: `High-quality ${productName} featuring ${artworkName}. Premium printing and materials.`,
      keywords: ['art print', 'premium', 'quality', 'decoration'],
      urlSlug: this.generateUrlSlug(productName)
    };

    return {
      variations,
      seoData,
      generatedAt: new Date(),
      cached: false
    };
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(request: ContentGenerationRequest): string {
    // Create a hash-like key from the main request properties
    const keyParts = [
      request.productName,
      request.artworkInfo?.name || '',
      request.artworkInfo?.artist || '',
      request.collectionInfo?.name || '',
      request.podProviderInfo?.provider || '',
      request.brandVoice || '',
      (request.seoKeywords || []).join(',')
    ];

    return `ai_content_${keyParts.join('_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`;
  }

  /**
   * Generate SEO-friendly URL slug
   */
  generateUrlSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Cache management
   */
  private async getCachedContent(key: string): Promise<ContentCache | null> {
    if (!this.cacheService) return null;

    try {
      const cached = await this.cacheService.get(key);
      if (!cached) return null;

      // Check if cache is expired
      const expiresAt = new Date(cached.expiresAt);
      if (expiresAt < new Date()) {
        // Cache expired, remove it
        await this.cacheService.delete(key);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  private async cacheContent(key: string, content: ContentGenerationResponse): Promise<void> {
    if (!this.cacheService) return;

    try {
      const expiresAt = new Date(Date.now() + this.config.cacheExpiryHours * 60 * 60 * 1000);

      const cacheEntry: ContentCache = {
        key,
        content,
        expiresAt,
        createdAt: new Date()
      };

      await this.cacheService.set(key, cacheEntry);
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  /**
   * Utility to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rate limit status (for monitoring)
   */
  getRateLimitStatus(): { limited: boolean; status: string } {
    // This would be enhanced to track actual rate limits
    return {
      limited: false,
      status: 'Available'
    };
  }

  /**
   * Clear cache (for testing/maintenance)
   */
  async clearCache(): Promise<void> {
    if (this.cacheService) {
      await this.cacheService.clear();
    }
  }
}