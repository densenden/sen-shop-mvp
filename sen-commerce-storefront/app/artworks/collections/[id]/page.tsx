'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { ArrowLeft, Image, ShoppingBag } from 'lucide-react'
import { MEDUSA_API_CONFIG, getHeaders } from '../../../../lib/config'

interface Artwork {
  id: string
  title: string
  description?: string
  image_url?: string
  artwork_collection_id?: string
  products?: Product[]
}

interface Product {
  id: string
  title: string
  handle: string
  thumbnail?: string
  price: number
  currency_code: string
}

interface ArtworkCollection {
  id: string
  name: string
  description?: string
  topic?: string
  purpose?: string
  thumbnail_url?: string
  artworks: Artwork[]
  artwork_count: number
}

export default function CollectionDetailPage() {
  const params = useParams()
  const collectionId = params?.id as string
  
  const [collection, setCollection] = useState<ArtworkCollection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (collectionId) {
      fetchCollection()
    }
  }, [collectionId])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/artwork-collections/${collectionId}`, {
        headers: getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Collection API Response:', data)
        setCollection(data.collection || null)
      } else {
        console.error('Collection API failed with status:', response.status)
        setCollection(null)
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
      setCollection(null)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, currency: string = 'usd') => {
    const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0
    const safeCurrency = (currency || 'usd').toUpperCase()
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency
    }).format(safePrice / 100)
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    )
  }

  if (!collection) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-light text-gray-900 mb-4">Collection Not Found</h1>
            <p className="text-gray-600 mb-8">The collection you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/artworks"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Collections
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
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span>/</span>
            <Link href="/artworks" className="hover:text-gray-900">Artworks</Link>
            <span>/</span>
            <Link href="/artworks" className="hover:text-gray-900">Collections</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{collection.name}</span>
          </div>
        </div>

        {/* Collection Header */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
                {collection.name}
              </h1>
              
              {collection.description && (
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  {collection.description}
                </p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div>
                  <span className="font-medium">{collection.artwork_count}</span> artworks
                </div>
                {collection.topic && (
                  <div className="flex items-center space-x-2">
                    <span>Topic:</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                      {collection.topic}
                    </span>
                  </div>
                )}
                {collection.purpose && (
                  <div className="flex items-center space-x-2">
                    <span>Purpose:</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                      {collection.purpose.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="relative">
              {collection.thumbnail_url ? (
                <img
                  src={collection.thumbnail_url}
                  alt={collection.name}
                  className="w-full h-80 object-cover rounded-lg shadow-lg"
                />
              ) : collection.artworks.length > 0 ? (
                <img
                  src={collection.artworks[0].image_url}
                  alt={collection.name}
                  className="w-full h-80 object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Image className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collection Artworks */}
        <div className="pb-20">
          {collection.artworks.length === 0 ? (
            <div className="text-center py-20">
              <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No artworks in this collection</h3>
              <p className="text-gray-600">This collection is empty or artworks are being added.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 pb-6 mb-12">
                <h2 className="text-2xl font-light text-gray-900">
                  Artworks in this Collection
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {collection.artworks.map((artwork) => (
                  <div key={artwork.id} className="group">
                    <Link href={`/artworks/${artwork.id}`} className="block">
                      <div className="aspect-square bg-gray-50 mb-4 relative overflow-hidden rounded-lg">
                        {artwork.image_url ? (
                          <img
                            src={artwork.image_url}
                            alt={artwork.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Product Count Badge */}
                        {artwork.products && artwork.products.length > 0 && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-white text-gray-900 text-xs px-2 py-1 font-medium rounded">
                              {artwork.products.length} products
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                          {artwork.title}
                        </h3>
                        {artwork.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {artwork.description}
                          </p>
                        )}
                      </div>
                    </Link>
                    
                    {/* Related Products - Outside of main link to prevent nested links */}
                    {artwork.products && artwork.products.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <p className="text-xs text-gray-500 font-medium">Available as:</p>
                        <div className="space-y-2">
                          {artwork.products.slice(0, 2).map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.handle}`}
                              className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group/product"
                            >
                              <div className="flex items-center space-x-3">
                                {product.thumbnail ? (
                                  <img
                                    src={product.thumbnail}
                                    alt={product.title}
                                    className="w-8 h-8 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900 group-hover/product:text-gray-700">
                                    {product.title}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {formatPrice(product.price, product.currency_code)}
                                  </p>
                                </div>
                              </div>
                              <ShoppingBag className="w-4 h-4 text-gray-400 group-hover/product:text-gray-600" />
                            </Link>
                          ))}
                          {artwork.products.length > 2 && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              +{artwork.products.length - 2} more products
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Back to Collections */}
        <div className="border-t border-gray-100 pt-8 pb-20">
          <Link
            href="/artworks"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Collections
          </Link>
        </div>
      </div>
    </Layout>
  )
}
