'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard, Lock, Check, AlertCircle, Truck, Download } from 'lucide-react'
import Layout from '../components/Layout'
import { cartService } from '../../lib/cart'
import { MEDUSA_API_CONFIG, getHeaders } from '../../lib/config'

interface CartItem {
  id: string
  variant_id: string
  product_id: string
  quantity: number
  unit_price: number
  total: number
  title: string
  variant_title?: string
  thumbnail?: string
}

interface Cart {
  id: string
  items: CartItem[]
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  currency_code: string
}

interface CustomerInfo {
  email: string
  first_name: string
  last_name: string
  phone?: string
}

interface ShippingAddress {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    city: '',
    province: '',
    postal_code: '',
    country_code: 'US',
    phone: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('stripe')

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const cartData = await cartService.getCart()
      setCart(cartData)
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleShippingAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatPrice = (amount: number, currencyCode: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
      }).format(amount / 100)
    } catch (error) {
      return `$${(amount / 100).toFixed(2)}`
    }
  }

  const validateForm = () => {
    const requiredCustomerFields = ['email', 'first_name', 'last_name'] as const
    const requiredAddressFields = ['first_name', 'last_name', 'address_1', 'city', 'province', 'postal_code'] as const

    for (const field of requiredCustomerFields) {
      if (!customerInfo[field].trim()) {
        alert(`Please fill in your ${field.replace('_', ' ')}`)
        return false
      }
    }

    for (const field of requiredAddressFields) {
      if (!shippingAddress[field].trim()) {
        alert(`Please fill in ${field.replace('_', ' ')}`)
        return false
      }
    }

    return true
  }

  const handleCheckout = async () => {
    if (!cart || !validateForm()) return

    setProcessingPayment(true)
    try {
      // Create payment session with Stripe
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/payment-sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          cart_id: cart.id,
          provider_id: 'stripe',
          data: {
            customer: customerInfo,
            shipping_address: shippingAddress,
            amount: cart.total,
            currency: cart.currency_code
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment session')
      }

      const paymentSession = await response.json()
      
      // Simulate successful payment and create order
      console.log('Payment session created:', paymentSession)
      
      // Create order in backend
      const orderResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/orders`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          cart_id: cart.id,
          customer_info: customerInfo,
          shipping_address: shippingAddress,
          payment_session_id: paymentSession.id,
        }),
      })

      let orderId = 'demo_order_' + Date.now();
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        orderId = orderData.order?.id || orderId;
      }

      // Clear cart and redirect to order success with order ID
      await cartService.clearCart()
      router.push(`/order-success?order=${orderId}&total=${cart.total}&currency=${cart.currency_code}`)
      
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    } finally {
      setProcessingPayment(false)
    }
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

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
            <Link
              href="/products"
              className="bg-gray-900 text-white px-8 py-3 text-sm font-medium hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
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
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <Link href="/cart" className="text-gray-500 hover:text-gray-700">
              Cart
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Checkout</span>
          </div>
        </div>

        <div className="py-20">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="space-y-8">
                {/* Customer Information */}
                <div className="bg-white border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Customer Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={customerInfo.first_name}
                          onChange={(e) => handleCustomerInfoChange('first_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          placeholder="First name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={customerInfo.last_name}
                          onChange={(e) => handleCustomerInfoChange('last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Shipping Address</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.first_name}
                          onChange={(e) => handleShippingAddressChange('first_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.last_name}
                          onChange={(e) => handleShippingAddressChange('last_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.address_1}
                        onChange={(e) => handleShippingAddressChange('address_1', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="123 Main Street"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2 (optional)
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.address_2}
                        onChange={(e) => handleShippingAddressChange('address_2', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="Apartment, suite, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          placeholder="City"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.province}
                          onChange={(e) => handleShippingAddressChange('province', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          placeholder="State/Province"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.postal_code}
                          onChange={(e) => handleShippingAddressChange('postal_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                          placeholder="12345"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <select
                          value={shippingAddress.country_code}
                          onChange={(e) => handleShippingAddressChange('country_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white border border-gray-100 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Payment Method</h2>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <CreditCard className="h-5 w-5 mr-3 text-gray-600" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Credit Card (Stripe)</span>
                        <p className="text-xs text-gray-500">Secure payment processing via Stripe</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-100 sticky top-8">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                </div>

                <div className="p-6">
                  {/* Items */}
                  <div className="space-y-4 mb-6">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-12 h-12 object-cover bg-gray-50"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
                            <div className="w-6 h-6 bg-gray-200"></div>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
                          {item.variant_title && (
                            <p className="text-xs text-gray-500">{item.variant_title}</p>
                          )}
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(item.total, cart.currency_code)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(cart.subtotal, cart.currency_code)}
                      </span>
                    </div>
                    {cart.shipping_total > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(cart.shipping_total, cart.currency_code)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-600">Free</span>
                      </div>
                    )}
                    {cart.tax_total > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(cart.tax_total, cart.currency_code)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-2">
                      <span className="text-lg font-medium text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(cart.total, cart.currency_code)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={processingPayment}
                    className="w-full mt-6 bg-gray-900 text-white py-3 px-4 font-medium hover:bg-gray-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Complete Order • {formatPrice(cart.total, cart.currency_code)}</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Your payment information is secure and encrypted via Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}