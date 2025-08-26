import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n.config'

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale
})

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|fr|es|it|pt|nl|pl|cs|sk|hu|ro|bg|hr|sl|lv|lt|et|el|sv|da|fi|mt|ga|en)/:path*']
}