'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { locales, localeNames, type Locale } from '../../i18n.config'
import { useLocale } from 'next-intl'

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = useLocale() as Locale
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLocaleChange = (newLocale: Locale) => {
    if (!pathname) return
    
    const segments = pathname.split('/')
    // Replace the locale segment (always at index 1 for our routing structure)
    if (segments.length > 1) {
      segments[1] = newLocale
    } else {
      // If no locale in path, add it
      segments.splice(1, 0, newLocale)
    }
    
    const newPath = segments.join('/')
    
    router.push(newPath)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Select language"
      >
        <span>{localeNames[currentLocale]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[120px] z-10">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={`block w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-900 hover:text-white transition-colors ${
                currentLocale === locale ? 'bg-gray-50 font-medium' : ''
              }`}
            >
              {localeNames[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}