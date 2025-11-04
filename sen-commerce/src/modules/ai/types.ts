/**
 * AI Content Generation Types
 */

export interface ContentGenerationRequest {
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

export interface ContentVariation {
  title: string
  description: string
  seo_title?: string
  meta_description?: string
  keywords?: string[]
  url_slug?: string
  bullet_points?: string[]
  tags?: string[]
}

export interface ContentGenerationResponse {
  variations: ContentVariation[]
  cached: boolean
  generated_at: string
  cache_key?: string
  generation_stats?: {
    variations_generated: number
    tone_used: string
    length_setting: string
    seo_optimized: boolean
  }
}

export interface OpenAIServiceConfig {
  model: string
  maxTokens: number
  temperature: number
  retryAttempts: number
  cacheExpiryHours: number
}
