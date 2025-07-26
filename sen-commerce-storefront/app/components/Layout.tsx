'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Artworks', href: '/artworks' },
    { name: 'About', href: '/about' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 521.6 517.4" className="w-full h-full fill-current text-gray-900">
                  <path d="M226.4,0h1.6c3.3.4,5.6,3.2,5.6,6.3v183.4c0,2.4-1.4,4.7-3.5,5.8-.9.4-1.8.7-2.9.7s-2.8-.4-3.9-1.3L81.2,87.1l-8,9.3c-8.9,10.2-17.1,21.4-24.2,33.1l-6.2,10.1,65.9,50c2.8,2.1,3.4,6.2,1.2,8.9-1.2,1.6-3.2,2.5-5.1,2.5s-2.5-.3-3.8-1.3l-64.3-48.8-6.4,16c-9.1,22.7-14.6,46.6-16.7,71l-1.2,14.2h496.8l-1.2-14.2c-2-24.4-7.6-48.3-16.7-71l-6.4-16-64.3,48.8c-1.4,1.1-2.9,1.3-3.8,1.3-2,0-3.9-.9-5.1-2.5-2.1-2.8-1.6-6.8,1.2-8.9l65.9-50-6.2-10.1c-7.1-11.7-15.2-22.7-24.2-33.1l-8-9.3-142.1,107.8c-1.2.8-2.5,1.3-3.9,1.3s-2-.3-2.9-.7c-2.2-1.1-3.5-3.3-3.5-5.8V6.4c0-3.2,2.4-5.9,5.5-6.3h1.7c56.2,7.4,109.5,33.6,149.8,73.9l.4.4c3.7,3.7,7.4,7.6,10.9,11.7,42,47.7,65.3,108.9,65.3,172.5s-23.2,125.1-65.3,172.8c-3.5,3.9-7.2,7.9-10.9,11.7l-.4.4c-40.3,40.3-93.6,66.6-149.8,73.9h-.8q0-.1,0-.1h-.8c-3.2-.4-5.5-3.2-5.5-6.3v-183.4c0-2.4,1.4-4.7,3.5-5.8.9-.4,1.8-.7,2.9-.7s2.8.4,3.9,1.3l142.1,107.8,8-9.3c8.9-10.2,17.1-21.4,24.2-33.1l6.2-10.1-65.9-50c-1.8-1.4-2.4-3.3-2.5-4.2s-.1-2.9,1.2-4.7c1.2-1.6,3.2-2.5,5.1-2.5s2.5.3,3.8,1.3l64.3,48.8,6.4-16c9.1-22.7,14.6-46.6,16.7-71l1.2-14.2H12.5l1.2,14.2c2,24.4,7.6,48.3,16.7,71l6.4,16,64.3-48.8c1.4-1.1,2.9-1.3,3.8-1.3,2,0,3.9.9,5.1,2.5,1.4,1.8,1.4,3.8,1.3,4.7s-.7,2.9-2.5,4.2l-65.9,50,6.2,10.1c7.1,11.7,15.2,22.7,24.2,33.1l8,9.3,142.1-107.8c1.2-.8,2.5-1.3,3.9-1.3s2,.3,2.9.7c2.2,1.1,3.5,3.3,3.5,5.8v183.4c0,3.2-2.4,5.9-5.6,6.3h-1.6c-56.3-7.5-109.6-33.7-150-73.9l-.4-.4c-3.7-3.7-7.4-7.6-10.9-11.7C23.3,383.7,0,322.5,0,258.8H0C0,195,23.3,133.7,65.3,86c3.7-4.1,7.4-8,10.9-11.7l.4-.4C116.9,33.7,170.1,7.5,226.4,0M300.7,504.1l16.2-3.7c37-8.5,72.2-26,101.6-50.3l12.9-10.5-130.5-99.1v163.6h-.1,0ZM199.8,356.5l-109.5,83.1,12.9,10.5c29.4,24.3,64.6,41.6,101.6,50.3l16.2,3.7v-163.6l-21,16h-.1ZM300.7,177l130.5-99.1-12.9-10.5c-29.4-24.3-64.6-41.6-101.6-50.3l-16.2-3.7v163.6h.1,0ZM204.7,17.1c-37,8.5-72.2,26-101.6,50.3l-12.9,10.5,130.5,99.1V13.4l-16.2,3.7h.1,0Z"/>
                </svg>
              </div>
              <span className="text-xl font-medium text-gray-900">SenCommerce</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    pathname === item.href
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <Link
                href="/login"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <User className="h-5 w-5" />
              </Link>
              <Link
                href="/cart"
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
              </Link>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block py-2 text-sm transition-colors ${
                      pathname === item.href
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 521.6 517.4" className="w-full h-full fill-current text-white">
                    <path d="M226.4,0h1.6c3.3.4,5.6,3.2,5.6,6.3v183.4c0,2.4-1.4,4.7-3.5,5.8-.9.4-1.8.7-2.9.7s-2.8-.4-3.9-1.3L81.2,87.1l-8,9.3c-8.9,10.2-17.1,21.4-24.2,33.1l-6.2,10.1,65.9,50c2.8,2.1,3.4,6.2,1.2,8.9-1.2,1.6-3.2,2.5-5.1,2.5s-2.5-.3-3.8-1.3l-64.3-48.8-6.4,16c-9.1,22.7-14.6,46.6-16.7,71l-1.2,14.2h496.8l-1.2-14.2c-2-24.4-7.6-48.3-16.7-71l-6.4-16-64.3,48.8c-1.4,1.1-2.9,1.3-3.8,1.3-2,0-3.9-.9-5.1-2.5-2.1-2.8-1.6-6.8,1.2-8.9l65.9-50-6.2-10.1c-7.1-11.7-15.2-22.7-24.2-33.1l-8-9.3-142.1,107.8c-1.2.8-2.5,1.3-3.9,1.3s-2-.3-2.9-.7c-2.2-1.1-3.5-3.3-3.5-5.8V6.4c0-3.2,2.4-5.9,5.5-6.3h1.7c56.2,7.4,109.5,33.6,149.8,73.9l.4.4c3.7,3.7,7.4,7.6,10.9,11.7,42,47.7,65.3,108.9,65.3,172.5s-23.2,125.1-65.3,172.8c-3.5,3.9-7.2,7.9-10.9,11.7l-.4.4c-40.3,40.3-93.6,66.6-149.8,73.9h-.8q0-.1,0-.1h-.8c-3.2-.4-5.5-3.2-5.5-6.3v-183.4c0-2.4,1.4-4.7,3.5-5.8.9-.4,1.8-.7,2.9-.7s2.8.4,3.9,1.3l142.1,107.8,8-9.3c8.9-10.2,17.1-21.4,24.2-33.1l6.2-10.1-65.9-50c-1.8-1.4-2.4-3.3-2.5-4.2s-.1-2.9,1.2-4.7c1.2-1.6,3.2-2.5,5.1-2.5s2.5.3,3.8,1.3l64.3,48.8,6.4-16c9.1-22.7,14.6-46.6,16.7-71l1.2-14.2H12.5l1.2,14.2c2,24.4,7.6,48.3,16.7,71l6.4,16,64.3-48.8c1.4-1.1,2.9-1.3,3.8-1.3,2,0,3.9.9,5.1,2.5,1.4,1.8,1.4,3.8,1.3,4.7s-.7,2.9-2.5,4.2l-65.9,50,6.2,10.1c7.1,11.7,15.2,22.7,24.2,33.1l8,9.3,142.1-107.8c1.2-.8,2.5-1.3,3.9-1.3s2,.3,2.9.7c2.2,1.1,3.5,3.3,3.5,5.8v183.4c0,3.2-2.4,5.9-5.6,6.3h-1.6c-56.3-7.5-109.6-33.7-150-73.9l-.4-.4c-3.7-3.7-7.4-7.6-10.9-11.7C23.3,383.7,0,322.5,0,258.8H0C0,195,23.3,133.7,65.3,86c3.7-4.1,7.4-8,10.9-11.7l.4-.4C116.9,33.7,170.1,7.5,226.4,0M300.7,504.1l16.2-3.7c37-8.5,72.2-26,101.6-50.3l12.9-10.5-130.5-99.1v163.6h-.1,0ZM199.8,356.5l-109.5,83.1,12.9,10.5c29.4,24.3,64.6,41.6,101.6,50.3l16.2,3.7v-163.6l-21,16h-.1ZM300.7,177l130.5-99.1-12.9-10.5c-29.4-24.3-64.6-41.6-101.6-50.3l-16.2-3.7v163.6h.1,0ZM204.7,17.1c-37,8.5-72.2,26-101.6,50.3l-12.9,10.5,130.5,99.1V13.4l-16.2,3.7h.1,0Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">SenCommerce</h3>
              </div>
              <p className="text-sm text-gray-300">
                Digital art and print-on-demand platform for modern creators.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-4">Shop</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/artworks" className="text-sm text-gray-300 hover:text-white">
                    Artworks
                  </Link>
                </li>
                <li>
                  <Link href="/?filter=digital" className="text-sm text-gray-300 hover:text-white">
                    Digital Downloads
                  </Link>
                </li>
                <li>
                  <Link href="/?filter=pod" className="text-sm text-gray-300 hover:text-white">
                    Prints
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-gray-300 hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <a href="mailto:hello@sencommerce.com" className="text-sm text-gray-300 hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className="text-sm text-gray-300 text-center">
              &copy; 2024 SenCommerce. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}