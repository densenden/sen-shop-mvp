/**
 * AI Content Generation Types
 */

export interface ContentVariation {
  type: 'short' | 'detailed' | 'story';
  content: string;
  title?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface ContentGenerationRequest {
  productName: string;
  artworkInfo?: {
    name: string;
    artist?: string;
    medium?: string;
    theme?: string;
    description?: string;
  };
  collectionInfo?: {
    name: string;
    description?: string;
    theme?: string;
  };
  podProviderInfo?: {
    provider: string;
    materials?: string[];
    dimensions?: string;
    printQuality?: string;
    specifications?: string;
  };
  seoKeywords?: string[];
  targetAudience?: string;
  brandVoice?: 'professional' | 'casual' | 'artistic' | 'trendy';
}

export interface ContentGenerationResponse {
  variations: ContentVariation[];
  seoData: SEOData;
  generatedAt: Date;
  cached: boolean;
}

export interface SEOData {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  urlSlug: string;
  altText?: string;
}

export interface ContentCache {
  key: string;
  content: ContentGenerationResponse;
  expiresAt: Date;
  createdAt: Date;
}

export interface AIServiceConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  retryAttempts: number;
  cacheExpiryHours: number;
}