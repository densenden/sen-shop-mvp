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
  
  // Skip middleware for static assets, API routes, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  
  // Check if there is any supported locale in the pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocaleFromRequest(request)
    
    // Ensure we have a valid locale
    if (!locales.includes(locale as any)) {
      console.warn(`Invalid locale detected: ${locale}, falling back to ${defaultLocale}`)
      return NextResponse.redirect(
        new URL(`/${defaultLocale}${pathname}`, request.url)
      )
    }
    
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - _vercel (Vercel internals)
  // - Static files like favicon.ico, images, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/']
}