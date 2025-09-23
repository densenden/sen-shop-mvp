import {getRequestConfig} from 'next-intl/server'
import {locales, defaultLocale} from '../i18n.config'

export default getRequestConfig(async ({locale}) => {
  // Validate locale and fallback to default if invalid
  let validLocale = locale
  
  if (!locale || !locales.includes(locale as any)) {
    console.warn(`Invalid or missing locale: ${locale}, using default: ${defaultLocale}`)
    validLocale = defaultLocale
  }
  
  try {
    const messages = (await import(`../messages/${validLocale}.json`)).default
    return {
      locale: validLocale,
      messages
    }
  } catch (error) {
    console.error(`Failed to load messages for locale ${validLocale}:`, error)
    
    // Fallback to English if translation file doesn't exist or has issues
    try {
      const fallbackMessages = (await import(`../messages/en.json`)).default
      return {
        locale: validLocale,
        messages: fallbackMessages
      }
    } catch (fallbackError) {
      console.error('Failed to load fallback English messages:', fallbackError)
      // Return empty messages as last resort
      return {
        locale: validLocale,
        messages: {}
      }
    }
  }
})