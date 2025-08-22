'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import { Filter, ArrowRight, Image } from 'lucide-react'
import { MEDUSA_API_CONFIG, getHeaders } from '../../lib/config'

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

export default function ArtworksPage() {
  const [collections, setCollections] = useState<ArtworkCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'collections' | 'all-artworks'>('collections')
  const [filterTopic, setFilterTopic] = useState('all')

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/artwork-collections`, {
        headers: getHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Artwork Collections API Response:', data)
        setCollections(data.collections || [])
      } else {
        console.error('Artwork Collections API failed with status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setCollections([])
      }
    } catch (error) {
      console.error('Error fetching artwork collections:', error)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }


  const filteredCollections = collections.filter(collection => {
    if (filterTopic === 'all') return true
    return collection.topic === filterTopic
  })

  const allArtworks = collections.flatMap(c => c.artworks)
  const topics = Array.from(new Set(collections.map(c => c.topic).filter(Boolean)))

  const formatPrice = (price: number, currency: string = 'EUR') => {
    const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0
    const safeCurrency = (currency || 'EUR').toUpperCase()
    
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: safeCurrency
    }).format(safePrice / 100)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
            Artwork Collections
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Curated collections of original digital artworks with matching products
          </p>
          
          {/* View Mode Toggle */}
          <div className="flex justify-center space-x-1 mb-8">
            <button
              onClick={() => setViewMode('collections')}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                viewMode === 'collections'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Collections
            </button>
            <button
              onClick={() => setViewMode('all-artworks')}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                viewMode === 'all-artworks'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Artworks ({allArtworks.length})
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="py-8 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex space-x-1">
                <button
                  onClick={() => setFilterTopic('all')}
                  className={`px-4 py-2 text-sm transition-colors ${
                    filterTopic === 'all'
                      ? 'text-gray-900 border-b border-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Topics
                </button>
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setFilterTopic(topic || '')}
                    className={`px-4 py-2 text-sm transition-colors capitalize ${
                      filterTopic === topic
                        ? 'text-gray-900 border-b border-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {viewMode === 'collections' 
                ? `${filteredCollections.length} collections` 
                : `${allArtworks.length} artworks`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="pb-20">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : viewMode === 'collections' ? (
            /* Collections View */
            filteredCollections.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">No collections found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/artworks/collections/${collection.id}`}
                    className="group border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 transition-colors"
                  >
                    <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                      {collection.thumbnail_url ? (
                        <img
                          src={collection.thumbnail_url}
                          alt={collection.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : collection.artworks.length > 0 ? (
                        <img
                          src={collection.artworks[0].image_url}
                          alt={collection.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Artwork Count Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-white text-gray-900 text-xs px-2 py-1 font-medium rounded">
                          {collection.artwork_count} artworks
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {collection.topic && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                              {collection.topic}
                            </span>
                          )}
                          {collection.purpose && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                              {collection.purpose.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            /* All Artworks View */
            allArtworks.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">No artworks found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allArtworks.map((artwork) => (
                  <Link key={artwork.id} href={`/artworks/${artwork.id}`} className="group cursor-pointer">
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
                      <h3 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                        {artwork.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {artwork.description}
                      </p>
                      
                      {/* Related Products */}
                      {artwork.products && artwork.products.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-medium">Available as:</p>
                          <div className="flex flex-wrap gap-2">
                            {artwork.products.slice(0, 3).map((product) => (
                              <span
                                key={product.id}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                              >
                                {product.title} - {formatPrice(product.price, product.currency_code)}
                              </span>
                            ))}
                            {artwork.products.length > 3 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{artwork.products.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  )
}