# AI Content Generation Module

## Overview
This module provides AI-powered content generation for POD products using OpenAI's GPT-4 model. It generates SEO-optimized product descriptions with multiple variations to maximize conversion rates.

## Features
- **3 Content Variations**: Short, detailed, and story-driven descriptions
- **SEO Optimization**: Auto-generated meta titles, descriptions, and URL slugs
- **Smart Caching**: 24-hour cache to reduce API costs
- **Exponential Backoff**: Retry logic for API failures
- **Rate Limiting**: Built-in rate limiting for the API endpoint
- **Batch Processing**: Support for bulk content generation

## Usage

### Basic Usage
```typescript
import { aiService } from '@/modules/ai';

const request = {
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
  },
  seoKeywords: ['modern art', 'home decor'],
  brandVoice: 'professional'
};

const result = await aiService.generateContent(request);
```

### API Endpoint
```
POST /api/admin/ai/generate-content

Body:
{
  "productName": "Modern Art Print",
  "artworkInfo": {
    "name": "Abstract Harmony",
    "artist": "Artist Name"
  },
  "seoKeywords": ["modern art", "home decor"]
}

Response:
{
  "success": true,
  "data": {
    "variations": [
      {
        "type": "short",
        "content": "Stylish art print perfect for modern homes...",
        "title": "Modern Art Print",
        "keywords": ["art", "print", "modern"]
      }
    ],
    "seoData": {
      "metaTitle": "Modern Art Print - Premium Home Decor",
      "metaDescription": "Stylish modern art print...",
      "keywords": ["modern art", "art print"],
      "urlSlug": "modern-art-print-premium-home-decor"
    },
    "cached": false
  }
}
```

## Configuration
Set your OpenAI API key in `.env.local`:
```
OPENAI_API_KEY=your-openai-api-key-here
```

## Architecture
- **OpenAIService**: Core service for content generation
- **CacheService**: Handles content caching (memory or database)
- **API Endpoint**: RESTful endpoint with rate limiting
- **Types**: TypeScript interfaces for all data structures

## Testing
Run the test suite with:
```bash
npm test src/modules/ai/__tests__/openai-service.test.ts
```

All 8 tests should pass, covering:
- Content generation with mocked responses
- Caching mechanism
- SEO optimization
- Retry logic with exponential backoff
- Fallback handling

## Generated Content Types

### Short Variation
- 2-3 sentences
- Social media friendly
- Focus on key benefits

### Detailed Variation
- 4-6 sentences
- Technical specifications
- Materials and quality focus

### Story Variation
- 3-5 sentences
- Emotional connection
- Transform and inspire messaging

## SEO Features
- **Meta Titles**: Under 60 characters
- **Meta Descriptions**: Under 160 characters
- **URL Slugs**: SEO-friendly, lowercase with hyphens
- **Keywords**: Optimized for ecommerce conversion
- **Alt Text**: Generated for images (future enhancement)

## Performance
- **Caching**: 24-hour content cache reduces API costs
- **Rate Limiting**: 10 requests per minute per IP
- **Batch Processing**: Support for up to 5 products per request
- **Exponential Backoff**: Automatic retry on failures

## Future Enhancements
- Database-backed caching for production
- A/B testing for content variations
- Image generation integration
- Multi-language support
- Custom prompt templates