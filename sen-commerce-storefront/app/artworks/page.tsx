'use client'

import { useState, useEffect } from 'react'
import { Palette, Eye, ShoppingCart, X, ChevronLeft, ChevronRight, Calendar, Tag, Layers } from 'lucide-react'

interface Artwork {
  id: string
  title: string
  description?: string
  image_url: string
  created_at: string
  artwork_collection_id?: string
}

interface Collection {
  id: string
  name: string
  description?: string
  topic?: string
  purpose?: string
  thumbnail_url?: string
  midjourney_version?: string
  month_created?: string
  created_at: string
  artworks: Artwork[]
}

interface Product {
  id: string
  title: string
  description?: string
  metadata: {
    fulfillment_type?: string
    artwork_id?: string
  }
  variants: Array<{
    id: string
    title: string
    price: number
  }>
}

export default function ArtworksPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [currentArtworkIndex, setCurrentArtworkIndex] = useState(0)
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null)
  const [artworkProducts, setArtworkProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)

  useEffect(() => {
    fetchCollections()
  }, [])

  const fetchCollections = async () => {
    try {
      const response = await fetch('http://localhost:9000/store/artwork-collections', {
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        }
      })
      const data = await response.json()
      console.log('Collections response:', data) // Debug log
      setCollections(data.collections || [])
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchArtworkProducts = async (artworkId: string) => {
    setLoadingProducts(true)
    try {
      // Get products that use this artwork
      const response = await fetch('http://localhost:9000/store/products', {
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        }
      })
      const data = await response.json()
      
      const relatedProducts = (data.products || []).filter((product: Product) =>
        product.metadata?.artwork_id === artworkId
      )
      
      setArtworkProducts(relatedProducts)
    } catch (error) {
      console.error('Error fetching artwork products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const openArtworkModal = (artwork: Artwork, collection: Collection) => {
    setSelectedArtwork(artwork)
    setCurrentCollection(collection)
    const artworksInCollection = collection.artworks
    setCurrentArtworkIndex(artworksInCollection.findIndex(a => a.id === artwork.id))
    fetchArtworkProducts(artwork.id)
  }

  const closeArtworkModal = () => {
    setSelectedArtwork(null)
    setCurrentCollection(null)
    setArtworkProducts([])
  }

  const navigateArtwork = (direction: 'prev' | 'next') => {
    if (!currentCollection) return
    
    const artworks = currentCollection.artworks
    let newIndex = currentArtworkIndex
    
    if (direction === 'prev') {
      newIndex = currentArtworkIndex > 0 ? currentArtworkIndex - 1 : artworks.length - 1
    } else {
      newIndex = currentArtworkIndex < artworks.length - 1 ? currentArtworkIndex + 1 : 0
    }
    
    setCurrentArtworkIndex(newIndex)
    setSelectedArtwork(artworks[newIndex])
    fetchArtworkProducts(artworks[newIndex].id)
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow h-80"></div>
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
              Artwork
              <span className="block font-medium text-black">Collections</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Explore our curated collections of digital artworks, each piece carefully crafted to inspire and captivate.
            </p>
          </div>
        </div>
      </div>

      {/* Collections Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {collections.length === 0 ? (
          <div className="text-center py-20">
            <Palette className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collections found</h3>
            <p className="text-gray-500">We're working on curating amazing artwork collections for you.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {collections.map((collection) => (
              <div key={collection.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Collection Header */}
                <div className="p-8 lg:p-12">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                    {collection.thumbnail_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={collection.thumbnail_url}
                          alt={collection.name}
                          className="w-32 h-32 lg:w-40 lg:h-40 object-cover rounded-2xl shadow-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4">{collection.name}</h2>
                      <p className="text-lg text-gray-600 mb-6 leading-relaxed">{collection.description}</p>
                      
                      <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                        {collection.topic && (
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            <span>{collection.topic}</span>
                          </div>
                        )}
                        {collection.purpose && (
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            <span>{collection.purpose}</span>
                          </div>
                        )}
                        {collection.month_created && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{collection.month_created}</span>
                          </div>
                        )}
                        {collection.midjourney_version && (
                          <div className="flex items-center gap-2">
                            <span>Midjourney v{collection.midjourney_version}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium">
                        {collection.artworks?.length || 0} artworks
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artworks Grid */}
                {collection.artworks && collection.artworks.length > 0 ? (
                  <div className="px-8 lg:px-12 pb-8 lg:pb-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {collection.artworks.map((artwork) => (
                        <div
                          key={artwork.id}
                          className="group aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                          onClick={() => openArtworkModal(artwork, collection)}
                        >
                          <img
                            src={artwork.image_url}
                            alt={artwork.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 lg:p-12 text-center text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No artworks in this collection</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Artwork Modal */}
      {selectedArtwork && currentCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedArtwork.title}</h3>
                <p className="text-sm text-gray-500">
                  {currentArtworkIndex + 1} of {currentCollection.artworks.length} in {currentCollection.name}
                </p>
              </div>
              <button
                onClick={closeArtworkModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Artwork Display */}
              <div className="relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedArtwork.image_url}
                    alt={selectedArtwork.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Navigation Buttons */}
                {currentCollection.artworks.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateArtwork('prev')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => navigateArtwork('next')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Artwork Info & Products */}
              <div className="space-y-6">
                {/* Artwork Description */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">About this artwork</h4>
                  <p className="text-gray-600">{selectedArtwork.description || 'No description available'}</p>
                </div>

                {/* Products with this artwork */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Products with this artwork
                    {loadingProducts && <span className="text-sm text-gray-500 ml-2">Loading...</span>}
                  </h4>
                  
                  {artworkProducts.length === 0 ? (
                    <p className="text-gray-500 italic">No products available with this artwork yet</p>
                  ) : (
                    <div className="space-y-3">
                      {artworkProducts.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{product.title}</h5>
                              <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                              
                              {product.variants && product.variants.length > 0 && (
                                <div className="space-y-1">
                                  {product.variants.slice(0, 2).map((variant) => (
                                    <div key={variant.id} className="flex justify-between text-sm">
                                      <span className="text-gray-700">{variant.title}</span>
                                      <span className="font-medium text-gray-900">
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
                                </div>
                              )}
                            </div>
                            <button className="ml-4 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2">
                              <ShoppingCart className="w-4 h-4" />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}