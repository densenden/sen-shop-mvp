import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from './i18n.config'

function getLocaleFromRequest(request: NextRequest): string {
  // 1. Check preferred_language cookie (set when user changes locale)
  const preferredLanguage = request.cookies.get('preferred_language')?.value
  if (preferredLanguage && locales.includes(preferredLanguage as any)) {
    return preferredLanguage
  }

  // 2. Read browser default "Accept-Language" header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const browserLocales = acceptLanguage
      .split(',')
      .map(lang => {
        const [locale] = lang.trim().split(';')
        return locale.split('-')[0] // Extract language code (e.g., 'en' from 'en-US')
      })
      .filter(locale => locales.includes(locale as any))
    
    if (browserLocales.length > 0) {
      return browserLocales[0]
    }
  }

  // 3. Fallback to defaultLocale
  return defaultLocale
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocaleFromRequest(request)
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(de|fr|es|it|pt|nl|pl|cs|sk|hu|ro|bg|hr|sl|lv|lt|et|el|sv|da|fi|mt|ga|en)/:path*']
}