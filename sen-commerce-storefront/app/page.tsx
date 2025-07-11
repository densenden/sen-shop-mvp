'use client'

import { useState, useEffect } from 'react'
import { Package, Download, Printer, Eye } from 'lucide-react'

interface Product {
  id: string
  title: string
  description?: string
  handle?: string
  thumbnail?: string
  images: Array<{
    id: string
    url: string
  }>
  variants: Array<{
    id: string
    title: string
    sku?: string
    price: number
    metadata?: any
  }>
  tags: string[]
  metadata: {
    fulfillment_type?: string
    source_provider?: string
    printful_product_id?: string
    digital_product_id?: string
    file_size?: number
    mime_type?: string
    artwork_id?: string
  }
  fulfillment_type?: string
  source_provider?: string
  file_size?: number
  mime_type?: string
  printful_product_id?: string
  artwork_id?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Fetch products from store endpoint
      const response = await fetch('http://localhost:9000/store/products', {
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        }
      })
      const data = await response.json()
      console.log('Products response:', data) // Debug log
      
      // Products are already filtered and formatted by the store endpoint
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    if (filter === 'all') return true
    const fulfillmentType = product.fulfillment_type || product.metadata?.fulfillment_type
    if (filter === 'digital') return fulfillmentType === 'digital_download'
    if (filter === 'printful_pod') return fulfillmentType === 'printful_pod'
    if (filter === 'standard') return !fulfillmentType || fulfillmentType === 'standard'
    return false
  })

  const addToCart = async (product: Product, variant: any) => {
    try {
      const response = await fetch('http://localhost:9000/store/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        },
        body: JSON.stringify({
          variant_id: variant.id,
          product_id: product.id,
          product_title: product.title,
          price: variant.price,
          quantity: 1
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('Product added to cart!')
        console.log('Cart updated:', data.cart)
      } else {
        alert('Failed to add to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Error adding to cart')
    }
  }

  const getProductTypeIcon = (fulfillmentType?: string) => {
    switch (fulfillmentType) {
      case 'digital_download':
        return <Download className="w-5 h-5 text-blue-500" />
      case 'printful_pod':
        return <Printer className="w-5 h-5 text-green-500" />
      default:
        return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getProductTypeBadge = (fulfillmentType?: string) => {
    switch (fulfillmentType) {
      case 'digital_download':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Digital</span>
      case 'printful_pod':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Print on Demand</span>
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Standard</span>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow h-64"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6">
          {[
            { key: 'all', label: 'All Products' },
            { key: 'digital', label: 'Digital' },
            { key: 'printful_pod', label: 'Print on Demand' },
            { key: 'standard', label: 'Standard' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${ 
                filter === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {filter === 'all' ? 'No products found' : `No ${filter} products found`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                {/* Product Image */}
                {product.thumbnail && (
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <img 
                      src={product.thumbnail} 
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getProductTypeIcon(product.metadata?.fulfillment_type)}
                      <h3 className="text-lg font-medium text-gray-900">{product.title}</h3>
                    </div>
                    {getProductTypeBadge(product.metadata?.fulfillment_type)}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description || 'No description available'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    {product.metadata?.fulfillment_type === 'digital_download' && product.metadata?.file_size && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">File Size</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatFileSize(product.metadata.file_size)}
                        </span>
                      </div>
                    )}
                    {product.metadata?.fulfillment_type === 'digital_download' && product.metadata?.mime_type && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">File Type</span>
                        <span className="text-sm font-medium text-gray-900">
                          {product.metadata.mime_type}
                        </span>
                      </div>
                    )}
                    {product.variants && product.variants.length > 0 && (
                      <div className="space-y-1">
                        {product.variants.slice(0, 3).map((variant) => (
                          <div key={variant.id} className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">{variant.title}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {variant.price ? 
                                new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                }).format(variant.price / 100)
                                : 'Price not set'
                              }
                            </span>
                          </div>
                        ))}
                        {product.variants.length > 3 && (
                          <p className="text-xs text-gray-500">+{product.variants.length - 3} more variants</p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => addToCart(product, product.variants[0])}
                      disabled={!product.variants || product.variants.length === 0}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Add to Cart
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}