'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Download, Package, Mail, Home } from 'lucide-react'
import Layout from '../components/Layout'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const total = searchParams.get('total')
  const currency = searchParams.get('currency')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orderId) {
        try {
          const response = await fetch(`http://localhost:9000/store/orders/${orderId}/details`)
          if (response.ok) {
            const data = await response.json()
            setOrderDetails(data.order)
          } else {
            // Fallback to URL parameters if API fails
            setOrderDetails({
              id: orderId,
              total: total ? parseInt(total) : 2500,
              currency_code: currency || 'usd',
              items: [
                {
                  title: 'Order Items',
                  fulfillment_type: 'mixed',
                  description: 'Your purchased items are being processed'
                }
              ],
              created_at: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error('Error fetching order details:', error)
          // Fallback to URL parameters
          setOrderDetails({
            id: orderId,
            total: total ? parseInt(total) : 2500,
            currency_code: currency || 'usd',
            items: [
              {
                title: 'Order Items',
                fulfillment_type: 'mixed',
                description: 'Your purchased items are being processed'
              }
            ],
            created_at: new Date().toISOString()
          })
        }
      }
      setLoading(false)
    }

    fetchOrderDetails()
  }, [orderId, total, currency])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    )
  }

  const formatPrice = (price: number, currency: string = 'usd') => {
    const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0
    const safeCurrency = (currency || 'usd').toUpperCase()
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency
    }).format(safePrice / 100)
  }

  return (
    <Layout>
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
                      {item.thumbnail ? (
                        item.product_handle ? (
                          <Link href={`/products/${item.product_handle}`}>
                            <img 
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                            />
                          </Link>
                        ) : (
                          <img 
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        )
                      ) : item.fulfillment_type === 'digital' ? (
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Download className="h-6 w-6 text-blue-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                      )}
                      <div>
                        {item.product_handle ? (
                          <Link href={`/products/${item.product_handle}`}>
                            <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">{item.title}</h3>
                          </Link>
                        ) : (
                          <h3 className="font-medium text-gray-900">{item.title}</h3>
                        )}
                        <p className="text-sm text-gray-600">
                          {item.fulfillment_type === 'digital' ? 'Digital Download' : 
                           item.fulfillment_type === 'printful_pod' ? 'Print on Demand' : 'Physical Product'}
                        </p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity || 1}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(item.total || item.unit_price || 0, orderDetails.currency_code)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Download Links Section */}
              {orderDetails.download_links && orderDetails.download_links.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <Download className="h-6 w-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Digital Downloads</h3>
                  </div>
                  <div className="space-y-3">
                    {orderDetails.download_links.map((link: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white rounded-lg p-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{link.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            Downloads: {link.download_count}{link.max_downloads > 0 ? `/${link.max_downloads}` : ' (unlimited)'}
                          </p>
                          {link.expires_at && (
                            <p className="text-xs text-gray-500">
                              Expires: {new Date(link.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => window.open(link.download_url, '_blank')}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-4">
                    Download links are valid for 7 days. Save your files to a secure location.
                  </p>
                </div>
              )}

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
    </Layout>
  )
}