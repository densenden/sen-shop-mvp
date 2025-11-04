/**
 * OpenAI Service Tests
 * Task 4.1: Focused tests for AI content generation functionality
 */

import { OpenAIService } from '../services/openai-service';
import { ContentGenerationRequest, ContentGenerationResponse } from '../types/content-generation';

// Mock OpenAI with proper constructor
const mockChatCompletions = {
  create: jest.fn()
};

const mockOpenAIInstance = {
  chat: {
    completions: mockChatCompletions
  }
};

// Mock the OpenAI constructor
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAIInstance);
});

// Mock cache storage
const mockCache = new Map<string, any>();
const mockCacheService = {
  get: jest.fn((key: string) => mockCache.get(key)),
  set: jest.fn((key: string, value: any, ttl?: number) => {
    mockCache.set(key, value);
    return Promise.resolve();
  }),
  delete: jest.fn((key: string) => {
    mockCache.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockCache.clear();
    return Promise.resolve();
  })
};

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockCache.clear();
    mockChatCompletions.create.mockReset();

    // Create service instance with mocked dependencies
    service = new OpenAIService({
      apiKey: 'test-api-key',
      cacheService: mockCacheService
    });
  });

  describe('Content Generation with Mocked OpenAI Responses', () => {
    it('should generate 3 content variations with different styles', async () => {
      // Mock successful OpenAI response
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              variations: [
                {
                  type: 'short',
                  content: 'Stylish art print perfect for modern homes. High-quality materials.',
                  title: 'Modern Art Print',
                  metaDescription: 'Stylish art print for modern homes',
                  keywords: ['art', 'print', 'modern', 'home decor']
                },
                {
                  type: 'detailed',
                  content: 'This exceptional art print showcases contemporary design with premium materials including cotton blend fabric and fade-resistant inks. Perfect for living rooms, bedrooms, or office spaces.',
                  title: 'Premium Contemporary Art Print - High Quality Home Decor',
                  metaDescription: 'Premium contemporary art print with high-quality materials',
                  keywords: ['premium', 'contemporary', 'art print', 'home decor', 'cotton blend']
                },
                {
                  type: 'story',
                  content: 'Transform your space with this captivating piece that tells a story of modern artistry. Each print captures the essence of contemporary design, bringing sophistication to any room.',
                  title: 'Captivating Modern Art Story Print',
                  metaDescription: 'Transform your space with captivating modern art',
                  keywords: ['transform', 'captivating', 'modern art', 'sophistication']
                }
              ],
              seoData: {
                metaTitle: 'Modern Art Print - Premium Home Decor',
                metaDescription: 'Stylish modern art print with premium materials for contemporary homes',
                keywords: ['modern art', 'art print', 'home decor', 'contemporary'],
                urlSlug: 'modern-art-print-premium-home-decor'
              }
            })
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockOpenAIResponse);

      const request: ContentGenerationRequest = {
        productName: 'Modern Art Print',
        artworkInfo: {
          name: 'Abstract Harmony',
          artist: 'Artist Name',
          medium: 'Digital Art',
          theme: 'Modern'
        },
        podProviderInfo: {
          provider: 'printful',
          materials: ['Cotton Blend'],
          dimensions: '12x16 inches',
          printQuality: 'High Resolution'
        }
      };

      const result = await service.generateContent(request);

      expect(result.variations).toHaveLength(3);
      expect(result.variations[0].type).toBe('short');
      expect(result.variations[1].type).toBe('detailed');
      expect(result.variations[2].type).toBe('story');
      expect(result.seoData.metaTitle).toBeDefined();
      expect(result.seoData.keywords).toBeDefined();
      expect(result.cached).toBe(false);
    });

    it('should handle OpenAI API failures with fallback', async () => {
      // Mock API failure
      mockChatCompletions.create.mockRejectedValue(new Error('API Error'));

      const request: ContentGenerationRequest = {
        productName: 'Test Product'
      };

      const result = await service.generateContent(request);

      // Should return fallback content
      expect(result.variations).toHaveLength(3);
      expect(result.variations[0].content).toContain('Test Product');
      expect(result.seoData.metaTitle).toContain('Test Product');
    });
  });

  describe('Caching Mechanism', () => {
    it('should cache generated content for 24 hours', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              variations: [
                { type: 'short', content: 'Short description', title: 'Title', keywords: [] }
              ],
              seoData: {
                metaTitle: 'Test',
                metaDescription: 'Test desc',
                keywords: ['test'],
                urlSlug: 'test'
              }
            })
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockOpenAIResponse);

      const request: ContentGenerationRequest = {
        productName: 'Test Product'
      };

      // First call - should call OpenAI and cache
      const result1 = await service.generateContent(request);
      expect(result1.cached).toBe(false);
      expect(mockCacheService.set).toHaveBeenCalled();

      // Set up cache to return the cached content
      const cacheKey = service.generateCacheKey(request);
      mockCacheService.get.mockReturnValue({
        content: result1,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });

      // Second call - should use cache
      const result2 = await service.generateContent(request);
      expect(result2.cached).toBe(true);
      expect(mockChatCompletions.create).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should invalidate expired cache', async () => {
      const request: ContentGenerationRequest = {
        productName: 'Test Product'
      };

      // Set up expired cache entry
      const cacheKey = service.generateCacheKey(request);
      mockCacheService.get.mockReturnValue({
        content: { variations: [], seoData: {} },
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      });

      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              variations: [{ type: 'short', content: 'New content' }],
              seoData: { metaTitle: 'New', metaDescription: 'New', keywords: [], urlSlug: 'new' }
            })
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockOpenAIResponse);

      const result = await service.generateContent(request);

      expect(result.cached).toBe(false);
      expect(mockCacheService.delete).toHaveBeenCalledWith(cacheKey);
      expect(mockChatCompletions.create).toHaveBeenCalled();
    });
  });

  describe('SEO Optimization Logic', () => {
    it('should extract and optimize keywords from content context', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              variations: [
                { type: 'short', content: 'Premium vintage art print' }
              ],
              seoData: {
                metaTitle: 'Vintage Art Print - Premium Home Decor',
                metaDescription: 'Premium vintage art print for sophisticated home decoration',
                keywords: ['vintage art', 'art print', 'premium', 'home decor', 'wall art'],
                urlSlug: 'vintage-art-print-premium-home-decor'
              }
            })
          }
        }]
      };

      mockChatCompletions.create.mockResolvedValue(mockOpenAIResponse);

      const request: ContentGenerationRequest = {
        productName: 'Vintage Art Print',
        artworkInfo: {
          name: 'Vintage Poster',
          theme: 'Retro'
        },
        seoKeywords: ['vintage', 'retro', 'wall art']
      };

      const result = await service.generateContent(request);

      expect(result.seoData.keywords).toContain('vintage art');
      expect(result.seoData.metaTitle).toContain('Vintage');
      expect(result.seoData.urlSlug).toMatch(/^[a-z0-9-]+$/); // Should be URL-friendly
      expect(result.seoData.metaDescription.length).toBeLessThanOrEqual(160); // SEO best practice
    });

    it('should generate SEO-optimized URL slugs', () => {
      const testCases = [
        { input: 'Modern Art Print - Premium Quality!', expected: 'modern-art-print-premium-quality' },
        { input: 'Vintage Poster (Large Size)', expected: 'vintage-poster-large-size' },
        { input: 'Abstract & Contemporary Design', expected: 'abstract-contemporary-design' }
      ];

      testCases.forEach(({ input, expected }) => {
        const slug = service.generateUrlSlug(input);
        expect(slug).toBe(expected);
        expect(slug).toMatch(/^[a-z0-9-]+$/);
      });
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    it('should retry on transient failures with exponential backoff', async () => {
      // Mock transient failures followed by success
      mockChatCompletions.create
        .mockRejectedValueOnce(new Error('Rate limited'))
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          choices: [{
            message: {
              content: JSON.stringify({
                variations: [{ type: 'short', content: 'Success after retries' }],
                seoData: { metaTitle: 'Success', metaDescription: 'Success', keywords: [], urlSlug: 'success' }
              })
            }
          }]
        });

      const request: ContentGenerationRequest = {
        productName: 'Test Product'
      };

      const startTime = Date.now();
      const result = await service.generateContent(request);
      const endTime = Date.now();

      expect(result.variations[0].content).toBe('Success after retries');
      expect(mockChatCompletions.create).toHaveBeenCalledTimes(3);
      // Should have delays due to exponential backoff
      expect(endTime - startTime).toBeGreaterThan(100); // Some delay expected
    });

    it('should fall back to default content after max retries', async () => {
      // Mock persistent failures
      mockChatCompletions.create.mockRejectedValue(new Error('Persistent error'));

      const request: ContentGenerationRequest = {
        productName: 'Test Product'
      };

      const result = await service.generateContent(request);

      expect(result.variations).toHaveLength(3);
      expect(result.variations[0].content).toContain('Test Product');
      expect(mockChatCompletions.create).toHaveBeenCalledTimes(3); // Max retries
    });
  });
});