'use client'

import { useState } from 'react'
import { Menu, X, ShoppingBag, User, Search, Heart } from 'lucide-react'
import Link from 'next/link'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-black">
              Sen Commerce
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-gray-800 hover:text-black px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/artworks" className="text-gray-800 hover:text-black px-3 py-2 text-sm font-medium transition-colors">
                Artworks
              </Link>
              <Link href="/collections" className="text-gray-800 hover:text-black px-3 py-2 text-sm font-medium transition-colors">
                Collections
              </Link>
              <Link href="/about" className="text-gray-800 hover:text-black px-3 py-2 text-sm font-medium transition-colors">
                About
              </Link>
            </div>
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-600 hover:text-black transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-gray-600 hover:text-black transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="text-gray-600 hover:text-black transition-colors">
              <User className="w-5 h-5" />
            </button>
            <Link href="/cart" className="text-gray-600 hover:text-black transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-black"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link href="/" className="text-gray-800 hover:text-black block px-3 py-2 text-base font-medium">
              Home
            </Link>
            <Link href="/artworks" className="text-gray-800 hover:text-black block px-3 py-2 text-base font-medium">
              Artworks
            </Link>
            <Link href="/collections" className="text-gray-800 hover:text-black block px-3 py-2 text-base font-medium">
              Collections
            </Link>
            <Link href="/about" className="text-gray-800 hover:text-black block px-3 py-2 text-base font-medium">
              About
            </Link>
            <div className="flex items-center space-x-4 px-3 py-2">
              <button className="text-gray-600 hover:text-black">
                <Search className="w-5 h-5" />
              </button>
              <button className="text-gray-600 hover:text-black">
                <Heart className="w-5 h-5" />
              </button>
              <button className="text-gray-600 hover:text-black">
                <User className="w-5 h-5" />
              </button>
              <Link href="/cart" className="text-gray-600 hover:text-black relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}