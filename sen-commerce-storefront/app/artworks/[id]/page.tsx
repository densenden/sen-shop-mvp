'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '../../components/Layout'
import AddToCartButton from '../../components/AddToCartButton'
import { ArrowLeft, ExternalLink, ShoppingBag, Eye, Heart } from 'lucide-react'
import { MEDUSA_API_CONFIG, getHeaders } from '../../../lib/config'

interface Product {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string
  images?: { url: string; alt?: string }[]
  variants: {
    id: string
    title: string
    prices: {
      amount: number
      currency_code: string
    }[]
    inventory_quantity?: number
  }[]
  metadata?: {
    artwork_id?: string
    product_type?: string
  }
}

interface Artwork {
  id: string
  title: string
  description?: string
  image_url?: string
  artwork_collection_id?: string
  artist_name?: string
  creation_date?: string
  tags?: string[]
  dimensions?: string
  style?: string
  brand_story?: string
  products?: Product[]
}

interface ArtworkCollection {
  id: string
  name: string
  description?: string
  topic?: string
  purpose?: string
}

export default function ArtworkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const artworkId = params.id as string
  
  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [collection, setCollection] = useState<ArtworkCollection | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    fetchArtworkDetails()
  }, [artworkId])

  const fetchArtworkDetails = async () => {
    try {
      setLoading(true)
      
      console.log(`Fetching artwork with ID: ${artworkId}`)
      
      // Fetch artwork details
      const artworkResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/artworks/${artworkId}`, {
        headers: getHeaders()
      })
      
      console.log(`Artwork API response status: ${artworkResponse.status}`)
      
      if (artworkResponse.ok) {
        const artworkData = await artworkResponse.json()
        console.log('Artwork API response:', artworkData)
        setArtwork(artworkData.artwork)
        
        // Fetch collection details if artwork belongs to one
        if (artworkData.artwork?.artwork_collection_id) {
          const collectionResponse = await fetch(
            `${MEDUSA_API_CONFIG.baseUrl}/store/artwork-collections/${artworkData.artwork.artwork_collection_id}`,
            { headers: getHeaders() }
          )
          if (collectionResponse.ok) {
            const collectionData = await collectionResponse.json()
            setCollection(collectionData.collection)
          }
        }
        
        // Fetch related products
        const productsResponse = await fetch(
          `${MEDUSA_API_CONFIG.baseUrl}/store/artworks/${artworkId}/products`,
          { headers: getHeaders() }
        )
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          console.log('Artwork products response:', productsData)
          setRelatedProducts(productsData.products || [])
        } else {
          console.warn('Failed to fetch artwork products, falling back to empty array')
          setRelatedProducts([])
        }
      } else {
        const errorText = await artworkResponse.text()
        console.error(`Failed to fetch artwork details. Status: ${artworkResponse.status}, Response: ${errorText}`)
        
        // Try fallback: get artwork from collections list
        await tryFallbackFetch()
      }
    } catch (error) {
      console.error('Error fetching artwork details:', error)
      await tryFallbackFetch()
    } finally {
      setLoading(false)
    }
  }

  const tryFallbackFetch = async () => {
    try {
      console.log('Trying fallback: fetching from artwork collections')
      
      // Fetch all collections and find the artwork
      const collectionsResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/artwork-collections`, {
        headers: getHeaders()
      })
      
      if (collectionsResponse.ok) {
        const collectionsData = await collectionsResponse.json()
        const collections = collectionsData.collections || []
        
        // Search for artwork in all collections
        let foundArtwork = null
        let foundCollection = null
        
        for (const collection of collections) {
          if (collection.artworks) {
            const artwork = collection.artworks.find((art: any) => art.id === artworkId)
            if (artwork) {
              foundArtwork = artwork
              foundCollection = collection
              break
            }
          }
        }
        
        if (foundArtwork) {
          console.log('Found artwork in collections:', foundArtwork)
          setArtwork(foundArtwork)
          setCollection(foundCollection)
          
          // Set related products if available
          if (foundArtwork.products) {
            setRelatedProducts(foundArtwork.products)
          }
        } else {
          console.log('Artwork not found in any collection')
        }
      }
    } catch (error) {
      console.error('Fallback fetch also failed:', error)
    }
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

  const getLowestPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return null
    const prices = product.variants.flatMap(v => v.prices)
    const lowestPrice = Math.min(...prices.map(p => p.amount))
    const currency = prices.find(p => p.amount === lowestPrice)?.currency_code || 'USD'
    return { amount: lowestPrice, currency }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!artwork) {
    return (
      <Layout>
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-16">
              <h1 className="text-2xl font-light text-gray-900 mb-4">Artwork not found</h1>
              <Link
                href="/artworks"
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Back to Artworks
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link href="/artworks" className="hover:text-gray-700 transition-colors">
              Artworks
            </Link>
            <span>/</span>
            {collection && (
              <>
                <Link 
                  href={`/artworks/collections/${collection.id}`}
                  className="hover:text-gray-700 transition-colors"
                >
                  {collection.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{artwork.title}</span>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
            {/* Left Column - Large Image */}
            <div className="space-y-6">
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden relative">
                {artwork.image_url ? (
                  <>
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">No image available</p>
                    </div>
                  </div>
                )}
                
                {/* Image overlay buttons */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="bg-white/80 hover:bg-white p-2 rounded-full transition-colors">
                    <Heart className="h-4 w-4 text-gray-600" />
                  </button>
                  {artwork.image_url && (
                    <a
                      href={artwork.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/80 hover:bg-white p-2 rounded-full transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Artwork Metadata */}
              <div className="space-y-4">
                {artwork.dimensions && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Dimensions: </span>
                    <span className="text-sm text-gray-600">{artwork.dimensions}</span>
                  </div>
                )}
                {artwork.style && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Style: </span>
                    <span className="text-sm text-gray-600 capitalize">{artwork.style}</span>
                  </div>
                )}
                {artwork.creation_date && (
                  <div>
                    <span className="text-sm font-medium text-gray-900">Created: </span>
                    <span className="text-sm text-gray-600">{artwork.creation_date}</span>
                  </div>
                )}
                {artwork.tags && artwork.tags.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-900 block mb-2">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {artwork.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-light text-gray-900 mb-4">{artwork.title}</h1>
                {artwork.artist_name && (
                  <p className="text-lg text-gray-600 mb-6">by {artwork.artist_name}</p>
                )}
                
                {collection && (
                  <div className="mb-6">
                    <Link
                      href={`/artworks/collections/${collection.id}`}
                      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span>Part of </span>
                      <span className="font-medium ml-1">{collection.name}</span>
                      <span className="ml-1">collection</span>
                    </Link>
                  </div>
                )}

                {artwork.description && (
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <p>{artwork.description}</p>
                  </div>
                )}
              </div>

              {artwork.brand_story && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Story</h3>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <p>{artwork.brand_story}</p>
                  </div>
                </div>
              )}

              {/* Available Products Count */}
              {relatedProducts.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Available as Products</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        This artwork is available on {relatedProducts.length} different products
                      </p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {relatedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light text-gray-900">Products with this Artwork</h2>
                <p className="text-sm text-gray-500">{relatedProducts.length} products</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {relatedProducts.map((product) => {
                  const price = getLowestPrice(product)
                  const defaultVariant = product.variants?.[0]
                  
                  return (
                    <div key={product.id} className="group">
                      <Link href={`/products/${product.handle}`}>
                        <div className="aspect-square bg-gray-50 mb-4 relative overflow-hidden rounded-lg">
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : artwork.image_url ? (
                            <img
                              src={artwork.image_url}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-16 h-16 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      <div className="space-y-3">
                        <div>
                          <Link href={`/products/${product.handle}`}>
                            <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                              {product.title}
                            </h3>
                          </Link>
                          {price && (
                            <p className="text-sm text-gray-600 mt-1">
                              {formatPrice(price.amount, price.currency)}
                            </p>
                          )}
                        </div>

                        {defaultVariant && (
                          <AddToCartButton
                            productId={product.id}
                            variantId={defaultVariant.id}
                            title="Add to Cart"
                            size="sm"
                            className="w-full"
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {relatedProducts.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">
                This artwork is not currently available on any products.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}