module.exports = {
  apiKey: process.env.GT_API_KEY || 'your-general-translation-api-key',
  projectId: process.env.GT_PROJECT_ID || 'your-project-id',
  defaultLocale: 'en',
  locales: [
    'en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'pl', 
    'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'lv', 
    'lt', 'et', 'el', 'sv', 'da', 'fi', 'mt', 'ga'
  ],
  // Development mode - use cached translations and fallbacks
  cacheTranslations: true,
  translationCache: {},
  // Fallback to original text if translation fails
  fallbackOnError: true
}