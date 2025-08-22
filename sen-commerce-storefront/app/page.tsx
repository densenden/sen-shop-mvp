'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from './components/Layout'
import { Filter, CheckCircle } from 'lucide-react'
import MaterialIcon, { MaterialIcons } from './components/MaterialIcon'
import { MEDUSA_API_CONFIG, getHeaders } from '../lib/config'
import { digitalOwnershipService } from '../lib/digital-ownership'

interface Product {
  id: string
  title: string
  description?: string
  handle?: string
  thumbnail?: string
  price: number
  currency_code: string
  status: string
  metadata?: {
    fulfillment_type?: string
    source_provider?: string
    artwork_id?: string
  }
}

// Component to show ownership status for individual products
const OwnershipIndicator = ({ productId }: { productId: string }) => {
  const [isOwned, setIsOwned] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const checkSingleProduct = async () => {
      setChecking(true)
      try {
        const owned = await digitalOwnershipService.isProductOwned(productId)
        setIsOwned(owned)
      } catch (error) {
        console.error('Error checking product ownership:', error)
      } finally {
        setChecking(false)
      }
    }
    
    checkSingleProduct()
  }, [productId])

  if (checking) {
    return (
      <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 font-medium">
        <div className="animate-pulse">Checking...</div>
      </div>
    )
  }

  if (isOwned) {
    return (
      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 font-medium flex items-center space-x-1">
        <CheckCircle className="h-3 w-3" />
        <span>Owned</span>
      </span>
    )
  }

  return null
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [ownedProducts, setOwnedProducts] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Test server connection first
    testServerConnection()
    fetchProducts()
    checkOwnership()
  }, [])

  const checkOwnership = async () => {
    try {
      await digitalOwnershipService.fetchOwnedProducts()
      // This will be used for quick checking in the product display
    } catch (error) {
      console.error('Error fetching ownership info:', error)
    }
  }

  const testServerConnection = async () => {
    try {
      console.log('Testing server connection...')
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/products`, {
        headers: getHeaders()
      })
      console.log('Server test - Status:', response.status)
      console.log('Server test - OK:', response.ok)
      if (!response.ok) {
        const errorText = await response.text()
        console.log('Server test - Error body:', errorText)
      }
    } catch (error) {
      console.error('Server connection test failed:', error)
      console.error('Make sure Medusa server is running on port 9000')
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/products`, {
        headers: getHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Products API Response:', data)
        setProducts(data.products || [])
      } else {
        console.error('Products API failed with status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }


  const filteredProducts = products.filter(product => {
    if (filterType === 'all') return true
    if (filterType === 'digital') return product.metadata?.fulfillment_type === 'digital_download' || product.metadata?.fulfillment_type === 'digital'
    if (filterType === 'pod') return product.metadata?.fulfillment_type === 'printful_pod'
    if (filterType === 'physical') return product.metadata?.fulfillment_type && product.metadata.fulfillment_type !== 'digital_download' && product.metadata.fulfillment_type !== 'digital' && product.metadata.fulfillment_type !== 'printful_pod'
    return true
  })

  const formatPrice = (price: number, currency: string = 'eur') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price / 100)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            Digital Art & Prints
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Curated collection of digital artworks and premium print-on-demand products
          </p>
          <Link
            href="/artworks"
            className="inline-block bg-gray-900 text-white px-8 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            View Artworks
          </Link>
        </div>

        {/* Filter */}
        <div className="py-8 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'digital', label: 'Digital' },
                  { key: 'pod', label: 'Prints' },
                  { key: 'physical', label: 'Physical' },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterType(filter.key)}
                    className={`px-4 py-2 text-sm transition-colors ${
                      filterType === filter.key
                        ? 'text-gray-900 border-b border-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {filteredProducts.length} products
            </p>
          </div>
        </div>

        {/* Products */}
        <div className="pb-20">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.handle || product.id}`}
                  className="group"
                >
                  <div className="aspect-square bg-gray-50 mb-4 relative overflow-hidden">
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-200 rounded"></div>
                      </div>
                    )}
                    {product.metadata?.fulfillment_type && (
                      <div className="absolute top-4 left-4 flex flex-col space-y-1">
                        <span className="bg-white text-gray-900 text-xs px-2 py-1 font-medium">
                          {(product.metadata.fulfillment_type === 'digital_download' || product.metadata.fulfillment_type === 'digital') 
                            ? 'Digital' 
                            : product.metadata.fulfillment_type === 'printful_pod' 
                            ? 'Print' 
                            : 'Physical'}
                        </span>
                        {digitalOwnershipService.isDigitalProduct(product.metadata) && (
                          <OwnershipIndicator productId={product.id} />
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(product.price, product.currency_code)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}