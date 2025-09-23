'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard } from 'lucide-react'
import Layout from '../../components/Layout'
import { cartService, Cart, CartItem, formatPrice } from '../../../lib/cart'
import { TranslatedContent, TranslatedVariable } from '../../../components/TranslatedContent'

export default function CartPage() {
  const router = useRouter()
  const t = useTranslations('cart')
  const tNav = useTranslations('navigation')
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const currentCart = await cartService.getCart()
      setCart(currentCart)
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }

    setUpdating(itemId)
    try {
      const updatedCart = await cartService.updateItem(itemId, newQuantity)
      setCart(updatedCart)
    } catch (error) {
      console.error('Error updating item quantity:', error)
      alert(t('failedToUpdate'))
    } finally {
      setTimeout(() => setUpdating(null), 300)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const updatedCart = await cartService.removeItem(itemId)
      setCart(updatedCart)
    } catch (error) {
      console.error('Error removing item:', error)
      alert(t('failedToRemove'))
    }
  }

  const clearCart = async () => {
    if (confirm(t('clearCartConfirm'))) {
      try {
        await cartService.clearCart()
        setCart(null)
      } catch (error) {
        console.error('Error clearing cart:', error)
        alert(t('failedToClear'))
      }
    }
  }

  const proceedToCheckout = () => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken')
    if (!token) {
      router.push('/login?return=/checkout')
      return
    }
    
    router.push('/checkout')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="py-8 border-b border-gray-100">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              {tNav('home')}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{t('title')}</span>
          </div>
        </div>

        <div className="py-20">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-8">{t('title')}</h1>

          {!cart || cart.items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-medium text-gray-900 mb-4">{t('empty')}</h2>
              <p className="text-gray-600 mb-8">
                {t('emptyDescription')}
              </p>
              <div className="space-x-4">
                <Link
                  href="/"
                  className="bg-gray-900 text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 inline-block"
                >
                  {t('continueShopping')}
                </Link>
                <Link
                  href="/artworks"
                  className="bg-gray-100 text-gray-900 px-8 py-3 text-sm font-medium hover:bg-gray-200 inline-block"
                >
                  {t('browseArtworks')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">
                        {t('cartItems')} ({cart.items.length})
                      </h2>
                      {cart.items.length > 0 && (
                        <button
                          onClick={clearCart}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                        >
                          {t('clearCart')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {cart.items.map((item) => (
                      <div key={item.id} className="p-6">
                        <div className="flex items-center space-x-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-16 h-16 object-cover bg-gray-50"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              <TranslatedContent context="product">
                                <TranslatedVariable name="title">{item.title}</TranslatedVariable>
                              </TranslatedContent>
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm font-medium text-gray-900">
                                {formatPrice(item.unit_price, cart.currency_code)}
                              </span>
                              {item.metadata?.fulfillment_type && (
                                <span className={`px-2 py-1 text-xs font-medium ${
                                  item.metadata.fulfillment_type === 'digital_download'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.metadata.fulfillment_type === 'digital_download' ? t('digital') : t('print')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center border border-gray-300">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={updating === item.id}
                                className="p-2 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-4 py-2 text-sm font-medium text-gray-900">
                                {updating === item.id ? '...' : item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={updating === item.id}
                                className="p-2 hover:bg-gray-50 disabled:opacity-50"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-100 sticky top-8">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-medium text-gray-900">{t('orderSummary')}</h2>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('subtotal')}</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(cart.subtotal, cart.currency_code)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('shipping')}</span>
                      <span className="text-gray-600">
                        {cart.shipping_total > 0 ? formatPrice(cart.shipping_total, cart.currency_code) : t('calculatedAtCheckout')}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('tax')}</span>
                      <span className="text-gray-600">
                        {cart.tax_total > 0 ? formatPrice(cart.tax_total, cart.currency_code) : t('calculatedAtCheckout')}
                      </span>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-medium text-gray-900">{t('total')}</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(cart.total, cart.currency_code)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={proceedToCheckout}
                      className="w-full bg-gray-900 text-white py-3 px-4 font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>{t('proceedToCheckout')}</span>
                    </button>

                    <div className="text-center">
                      <Link
                        href="/"
                        className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{t('continueShopping')}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="px-6 pb-6">
                    <div className="text-sm text-gray-600 mb-3">{t('weAccept')}</div>
                    <div className="flex space-x-3">
                      <div className="bg-gray-100 px-3 py-2 text-xs font-medium">
                        VISA
                      </div>
                      <div className="bg-gray-100 px-3 py-2 text-xs font-medium">
                        MC
                      </div>
                      <div className="bg-gray-100 px-3 py-2 text-xs font-medium">
                        AMEX
                      </div>
                      <div className="bg-gray-100 px-3 py-2 text-xs font-medium">
                        PayPal
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}