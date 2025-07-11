'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'

interface CartItem {
  id: string
  variant_id: string
  product_id: string
  product_title: string
  quantity: number
  price: number
  added_at: string
}

interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  shipping: number
  tax: number
  total: number
  updated_at: string
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch('http://localhost:9000/store/cart', {
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        }
      })
      const data = await response.json()
      setCart(data.cart)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (variantId: string, newQuantity: number) => {
    if (updating) return
    setUpdating(variantId)
    
    try {
      const response = await fetch('http://localhost:9000/store/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        },
        body: JSON.stringify({
          variant_id: variantId,
          quantity: newQuantity
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCart(data.cart)
      }
    } catch (error) {
      console.error('Error updating cart:', error)
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (variantId: string) => {
    await updateQuantity(variantId, 0)
  }

  const clearCart = async () => {
    try {
      const response = await fetch('http://localhost:9000/store/cart', {
        method: 'DELETE',
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCart(data.cart)
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const getProductTypeBadge = (type: string) => {
    switch (type) {
      case 'digital':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Digital</span>
      case 'printful_pod':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Print on Demand</span>
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Standard</span>
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Shopping Cart</h1>
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <a href="/" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors">
            Continue Shopping
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Cart Items</h2>
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.variant_id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product_title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          ${(item.price / 100).toFixed(2)} each
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                          disabled={updating === item.variant_id}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                          disabled={updating === item.variant_id}
                          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeItem(item.variant_id)}
                          disabled={updating === item.variant_id}
                          className="text-red-500 hover:text-red-700 mt-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">${cart.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${cart.tax.toFixed(2)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${cart.total.toFixed(2)}</span>
                  </div>
                </div>
                
                {cart.items.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors mb-4"
                  >
                    Clear Cart
                  </button>
                )}
                
                <button className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                  Proceed to Checkout
                </button>
                
                <a href="/" className="block text-center text-blue-500 hover:text-blue-700 mt-4">
                  Continue Shopping
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}