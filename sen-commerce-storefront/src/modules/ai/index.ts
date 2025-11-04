/**
 * AI Module Exports
 * Central export file for AI content generation functionality
 */

// Services
export { OpenAIService } from './services/openai-service';
export { MemoryCacheService, DatabaseCacheService, memoryCacheService, databaseCacheService } from './services/cache-service';

// Types
export type {
  ContentVariation,
  ContentGenerationRequest,
  ContentGenerationResponse,
  SEOData,
  ContentCache,
  AIServiceConfig
} from './types/content-generation';

// Create a default configured AI service instance
import { OpenAIService } from './services/openai-service';
import { memoryCacheService } from './services/cache-service';

export const aiService = new OpenAIService({
  cacheService: memoryCacheService,
  config: {
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
    retryAttempts: 3,
    cacheExpiryHours: 24
  }
});

// Re-export default service
export default aiService;