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
        return <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">Digital</span>
      case 'printful_pod':
        return <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">Print on Demand</span>
      default:
        return <span className="bg-gray-800 text-white text-xs font-medium px-3 py-1 rounded-full">Standard</span>
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-4">
              Discover Our
              <span className="block font-medium text-black">Collection</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Curated designs that blend modern aesthetics with timeless appeal.
              From digital artworks to premium print-on-demand pieces.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'digital', label: 'Digital' },
                  { key: 'printful_pod', label: 'Print on Demand' },
                  { key: 'standard', label: 'Standard' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${ 
                      filter === tab.key
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredProducts.length} products
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">
              {filter === 'all' ? 'We\'re working on adding more products.' : `No ${filter} products available at the moment.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group">
                <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {product.thumbnail ? (
                      <img 
                        src={product.thumbnail} 
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Overlay Icons */}
                    <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                      </button>
                      <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    
                    {/* Product Type Badge */}
                    <div className="absolute top-4 left-4">
                      {getProductTypeBadge(product.metadata?.fulfillment_type)}
                    </div>
                  </div>
                  
                  {/* Product Details */}
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-black transition-colors">
                      {product.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description || 'Premium quality design'}
                    </p>
                    
                    {/* Price Range */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-semibold text-gray-900">
                            {product.variants[0].price ? 
                              new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              }).format(product.variants[0].price / 100)
                              : 'Price on request'
                            }
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">4.8</span>
                          </div>
                        </div>
                        {product.variants.length > 1 && (
                          <p className="text-sm text-gray-500 mt-1">
                            {product.variants.length} variants available
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Additional Info */}
                    <div className="space-y-2 mb-6">
                      {product.metadata?.fulfillment_type === 'digital_download' && product.metadata?.file_size && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Download className="w-4 h-4" />
                          <span>{formatFileSize(product.metadata.file_size)}</span>
                        </div>
                      )}
                      {product.metadata?.fulfillment_type === 'printful_pod' && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Printer className="w-4 h-4" />
                          <span>Made to order</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      onClick={() => addToCart(product, product.variants[0])}
                      disabled={!product.variants || product.variants.length === 0}
                      className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Add to Cart</span>
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