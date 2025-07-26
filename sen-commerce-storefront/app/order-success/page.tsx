'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Download, Package, Mail, Home } from 'lucide-react'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      // In a real app, fetch order details from API
      setOrderDetails({
        id: orderId,
        total: 2500, // $25.00
        currency_code: 'usd',
        items: [
          {
            title: 'Digital Art Download',
            type: 'digital',
            download_url: '#'
          }
        ]
      })
    }
    setLoading(false)
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const formatPrice = (price: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price / 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              SenCommerce
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your order has been successfully placed.
          </p>

          {/* Order Details */}
          {orderDetails && (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-left">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-600">Order #{orderDetails.id.slice(-8)}</p>
              </div>

              <div className="space-y-4 mb-6">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {item.type === 'digital' ? (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Download className="h-6 w-6 text-blue-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">
                          {item.type === 'digital' ? 'Digital Download' : 'Physical Product'}
                        </p>
                      </div>
                    </div>
                    {item.type === 'digital' && (
                      <button
                        onClick={() => window.open(item.download_url, '_blank')}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        Download
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(orderDetails.total, orderDetails.currency_code)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What's Next?</h3>
            <p className="text-gray-700 mb-4">
              You'll receive an order confirmation email shortly with all the details and download links.
            </p>
            <p className="text-sm text-gray-600">
              Digital products are available for download immediately. 
              Physical products will be processed and shipped within 2-3 business days.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              View Order History
            </Link>
            <Link
              href="/"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 font-semibold inline-flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Need help with your order?
            </p>
            <div className="space-x-4">
              <a
                href="mailto:support@sencommerce.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </a>
              <span className="text-gray-400">•</span>
              <Link
                href="/about"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}