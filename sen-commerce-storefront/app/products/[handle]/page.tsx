'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, ShoppingBag, Download, Truck, Star, Share2, Palette, Grid3x3, Info, Package } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../components/Layout'
import { MEDUSA_API_CONFIG, getHeaders } from '../../../lib/config'
import { cartService } from '../../../lib/cart'
import { digitalOwnershipService, OwnedDigitalProduct } from '../../../lib/digital-ownership'

interface Product {
  id: string
  title: string
  description?: string
  handle: string
  thumbnail?: string
  images?: string[]
  price: number
  currency_code: string
  status: string
  variants: ProductVariant[]
  metadata?: {
    fulfillment_type?: string
    source_provider?: string
    artwork_id?: string
    artist_name?: string
    collection_id?: string
  }
}

interface ProductVariant {
  id: string
  title: string
  price: number
  calculated_price?: {
    amount: number
    currency_code: string
  }
  price_set?: {
    prices?: Array<{
      amount: number
      currency_code: string
    }>
  }
  prices?: Array<{
    amount: number
    currency_code: string
  }>
  sku?: string
  inventory_quantity?: number
}

interface Artwork {
  id: string
  title: string
  description?: string
  image_url: string
  artwork_collection_id?: string
  collection?: Collection
}

interface Collection {
  id: string
  name: string
  description?: string
  topic?: string
  purpose?: string
  brand_story?: string
  genesis_story?: string
  design_philosophy?: string
  month_created?: string
  thumbnail_url?: string
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const handle = params?.handle as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [artwork, setArtwork] = useState<Artwork | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<'artwork' | 'collection' | 'product' | 'shipping'>('artwork')
  const [isOwned, setIsOwned] = useState(false)
  const [ownedProductDetails, setOwnedProductDetails] = useState<OwnedDigitalProduct | null>(null)
  const [checkingOwnership, setCheckingOwnership] = useState(false)

  useEffect(() => {
    if (handle) {
      fetchProduct()
    }
  }, [handle])

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(product?.id))
  }, [product?.id])

  useEffect(() => {
    if (product) {
      // Always search for artwork that contains this product ID (single source of truth)
      fetchArtworkByProductId(product.id)
    }
  }, [product?.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      console.log('Fetching product for handle:', handle)
      
      // First try individual product endpoint
      const individualResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/products/${handle}`, {
        headers: getHeaders()
      })
      
      if (individualResponse.ok) {
        const data = await individualResponse.json()
        console.log('Individual Product API Response:', data)
        
        if (data.product) {
          processProduct(data.product)
          return
        }
      }
      
      // Fallback to listing all products
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/products`, {
        headers: getHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Products API Response:', data)
        
        const productData = data.products?.find((p: Product) => p.handle === handle || p.id === handle)
        
        if (productData) {
          processProduct(productData)
        } else {
          setError('Product not found')
        }
      } else {
        console.error('Products API failed with status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setError('Failed to load product')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const processProduct = (productData: any) => {
    const productWithImages = {
      ...productData,
      thumbnail: productData.thumbnail,
      images: productData.images?.map((img: any) => typeof img === 'string' ? img : img.url) || [productData.thumbnail],
      variants: productData.variants?.length > 0 ? productData.variants.map((v: any) => ({
        ...v,
        price_set: v.price_set, // Ensure price_set is preserved
        price: v.price || v.price_set?.prices?.[0]?.amount || productData.price || 0
      })) : [{
        id: `${productData.id}-default`,
        title: 'Default',
        price: productData.price || 0,
        price_set: productData.price_set,
        calculated_price: productData.calculated_price,
        prices: productData.prices,
        sku: productData.handle,
        inventory_quantity: 100
      }]
    }
    
    setProduct(productWithImages)
    setSelectedVariant(productWithImages.variants[0])
    
    // Check ownership for digital products
    checkOwnership(productWithImages)
  }

  const fetchArtworkByProductId = async (productId: string) => {
    try {
      console.log(`[Product Detail] Searching for artwork containing product ${productId}`)
      
      // Search all artworks for one that contains this product ID (single source of truth)
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/admin/artworks`, {
        headers: getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        const artworkData = data.artworks?.find((a: any) => 
          a.product_ids && Array.isArray(a.product_ids) && a.product_ids.includes(productId)
        )
        
        if (artworkData) {
          console.log(`[Product Detail] Found artwork: ${artworkData.title}`)
          
          // Fetch collection data if artwork has a collection
          if (artworkData.artwork_collection_id) {
            try {
              console.log(`[Collection Debug] Fetching collection ${artworkData.artwork_collection_id}`)
              const collectionResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/admin/artwork-collections/${artworkData.artwork_collection_id}`, {
                headers: getHeaders()
              })
              console.log(`[Collection Debug] Collection response status: ${collectionResponse.status}`)
              if (collectionResponse.ok) {
                const collectionData = await collectionResponse.json()
                console.log(`[Collection Debug] Collection data received:`, collectionData)
                artworkData.collection = collectionData.collection
              } else {
                const errorText = await collectionResponse.text()
                console.error(`[Collection Debug] Collection fetch failed:`, errorText)
              }
            } catch (error) {
              console.error('[Collection Debug] Error fetching collection:', error)
            }
          } else {
            console.log(`[Collection Debug] No artwork_collection_id found for artwork ${artworkData.id}`)
          }
          
          setArtwork(artworkData)
          fetchRelatedProducts(artworkData.id)
        } else {
          console.log(`[Product Detail] No artwork found for product ${productId}`)
          setArtwork(null)
        }
      }
    } catch (error) {
      console.error('Error fetching artwork:', error)
      setArtwork(null)
    }
  }

  const fetchRelatedProducts = async (artworkId: string) => {
    try {
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/products?artwork_id=${artworkId}`, {
        headers: getHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        const related = data.products?.filter((p: Product) => p.id !== product?.id) || []
        setRelatedProducts(related.slice(0, 8))
      }
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const checkOwnership = async (product: Product) => {
    if (!digitalOwnershipService.isDigitalProduct(product.metadata)) {
      return // Not a digital product
    }
    
    setCheckingOwnership(true)
    try {
      const owned = await digitalOwnershipService.isProductOwned(product.id)
      setIsOwned(owned)
      
      if (owned) {
        const details = await digitalOwnershipService.getOwnedProductDetails(product.id)
        setOwnedProductDetails(details)
      }
    } catch (error) {
      console.error('Error checking ownership:', error)
    } finally {
      setCheckingOwnership(false)
    }
  }

  const handleDownload = () => {
    if (ownedProductDetails?.download_url) {
      window.open(ownedProductDetails.download_url, '_blank')
    } else {
      // Fallback: redirect to account page
      router.push('/account?tab=downloads')
    }
  }

  const addToCart = async () => {
    if (!product || !selectedVariant) return

    setAddingToCart(true)
    try {
      console.log('Product page: Adding to cart via cartService:', {
        productId: product.id,
        variantId: selectedVariant.id,
        quantity
      })
      
      await cartService.addItem(product.id, selectedVariant.id, quantity, product.metadata)
      router.push('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert(error instanceof Error ? error.message : 'Failed to add item to cart. Please try again.')
    } finally {
      setAddingToCart(false)
    }
  }

  const toggleFavorite = () => {
    if (!product) return

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    const newFavorites = isFavorite
      ? favorites.filter((id: string) => id !== product.id)
      : [...favorites, product.id]
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    setIsFavorite(!isFavorite)
  }

  const handleShare = async () => {
    if (!product) return
    
    const shareData = {
      title: product.title,
      text: product.description || `Check out ${product.title} on SenCommerce`,
      url: window.location.href
    }
    
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const formatPrice = (variant: ProductVariant | null, product: Product) => {
    if (!variant) return '$0.00'
    
    // Use calculated_price for EUR pricing, fallback to price_set for other currencies  
    const price = variant.calculated_price?.currency_code === 'eur' ? variant.calculated_price.amount :
                  variant.price_set?.prices?.[0]?.amount ||
                  variant.prices?.[0]?.amount || 
                  variant.price || 
                  product.price || 
                  0
    
    const currency = variant.calculated_price?.currency_code === 'eur' ? 'eur' :
                     variant.price_set?.prices?.[0]?.currency_code ||
                     variant.prices?.[0]?.currency_code || 
                     product.currency_code || 
                     'eur'
    
    const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0
    const safeCurrency = (currency || 'eur').toUpperCase()
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: safeCurrency
    }).format(safePrice / 100)
  }

  const getVariantDisplayName = (variant: ProductVariant, product: Product) => {
    // Clean up variant title by removing product name prefix
    // Example: "KRIA Unisex Athletic Shorts / XS" -> "XS"
    if (variant.title && variant.title.includes(' / ')) {
      return variant.title.split(' / ').pop() || variant.title
    }
    // If title starts with product name, remove it
    if (variant.title && product.title && variant.title.startsWith(product.title)) {
      return variant.title.replace(product.title, '').trim().replace(/^[\/-]\s*/, '')
    }
    return variant.title || 'Default'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'The product you\'re looking for doesn\'t exist.'}</p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link href="/" className="hover:text-gray-700">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.title}</span>
        </nav>

        {/* Back button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            {/* Image thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                <div className="grid grid-cols-4 gap-6">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative h-24 cursor-pointer rounded border-2 ${
                        index === activeImageIndex ? 'border-gray-900' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="h-full w-full object-cover rounded"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main image */}
            <div className="aspect-w-1 aspect-h-1 w-full">
              {product.thumbnail || (product.images && product.images.length > 0) ? (
                <img
                  src={product.images?.[activeImageIndex] || product.thumbnail}
                  alt={product.title}
                  className="h-full w-full object-cover object-center border border-gray-200"
                />
              ) : (
                <div className="h-96 w-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-medium tracking-tight text-gray-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {product.title}
            </h1>

            <div className="mt-3">
              <p className="text-3xl text-gray-900">
                {formatPrice(selectedVariant, product)}
              </p>
            </div>

            {/* Product type badge */}
            <div className="mt-4">
              {product.metadata?.fulfillment_type === 'digital_download' && (
                <span className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium text-gray-700">
                  <Download className="h-4 w-4 mr-1" />
                  Digital Download
                </span>
              )}
              {product.metadata?.fulfillment_type === 'printful_pod' && (
                <span className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium text-gray-700">
                  <Truck className="h-4 w-4 mr-1" />
                  Print on Demand
                </span>
              )}
            </div>

            {/* Reviews */}
            <div className="mt-4">
              <div className="flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <Star
                      key={rating}
                      className="text-gray-300 h-5 w-5 flex-shrink-0 fill-current"
                    />
                  ))}
                </div>
                <p className="sr-only">5 out of 5 stars</p>
                <a href="#" className="ml-3 text-sm font-medium text-gray-600 hover:text-gray-800">
                  117 reviews
                </a>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-base text-gray-700 space-y-6">
                <p>{product.description || 'No description available.'}</p>
              </div>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900">Options</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 text-sm font-medium border ${
                        selectedVariant?.id === variant.id
                          ? 'border-gray-900 bg-gray-100 text-gray-900'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {getVariantDisplayName(variant, product)} - {formatPrice(variant, product)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="mt-8">
              <div className="flex items-center space-x-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-1 block w-full border-gray-300 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8">
                {/* Show info box for unowned digital products only */}
                {digitalOwnershipService.isDigitalProduct(product?.metadata) && !isOwned && !checkingOwnership && (
                  <div className="mb-4">
                    <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded">
                      <p className="text-blue-800 text-sm">Digital product • Instant download after purchase</p>
                    </div>
                  </div>
                )}

                {/* Checking ownership state */}
                {digitalOwnershipService.isDigitalProduct(product?.metadata) && checkingOwnership && (
                  <div className="mb-4">
                    <div className="bg-gray-100 px-4 py-2 rounded text-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mx-auto mb-2"></div>
                      <span className="text-sm text-gray-600">Checking ownership...</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  {/* Conditional button: Download if owned, Add to Cart if not */}
                  {digitalOwnershipService.isDigitalProduct(product?.metadata) && isOwned ? (
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-black border border-transparent py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-gray-800 transition-colors"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download Now
                    </button>
                  ) : (
                    <button
                      onClick={addToCart}
                      disabled={addingToCart || !selectedVariant}
                      className="flex-1 bg-blue-600 border border-transparent py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingToCart ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-5 w-5 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </button>
                  )}

                <button
                  onClick={toggleFavorite}
                  className="py-3 px-6 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  type="button"
                  className="py-3 px-6 border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              
              {/* Ownership info text below buttons - only for owned digital products */}
              {digitalOwnershipService.isDigitalProduct(product?.metadata) && isOwned && (
                <div className="mt-3 text-center">
                  <p className="text-gray-600 text-sm">
                    You already own this digital product!
                  </p>
                  <p className="text-gray-500 text-sm">
                    Purchased on {ownedProductDetails ? new Date(ownedProductDetails.order_date).toLocaleDateString() : 'N/A'} 
                    • <Link href="/account?tab=downloads" className="underline hover:text-gray-700">View in Account</Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Section */}
        <div className="mt-16 border-t border-gray-200 pt-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('artwork')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'artwork'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                About Artwork
              </button>
              <button
                onClick={() => setActiveTab('collection')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'collection'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                About Collection
              </button>
              <button
                onClick={() => setActiveTab('product')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'product'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                About Product
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'shipping'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shipping & Returns
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-8">
            {activeTab === 'artwork' && (
              <div className="max-w-4xl">
                {artwork ? (
                  <div className="space-y-6">
                    {/* Artwork Preview */}
                    <div>
                      {artwork.image_url && (
                        <img
                          src={artwork.image_url}
                          alt={artwork.title}
                          className="w-full max-w-md h-auto border border-gray-200 mb-6"
                        />
                      )}
                    </div>
                    
                    {/* Artwork Details */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium text-gray-900">{artwork.title}</h3>
                      {artwork.description && (
                        <p className="text-gray-700 leading-relaxed">{artwork.description}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <p className="text-gray-600">No artwork information available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'collection' && (
              <div className="max-w-4xl">
                {console.log('[Collection Tab Debug] Artwork:', artwork) || console.log('[Collection Tab Debug] Collection:', artwork?.collection)}
                {artwork?.collection ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-medium text-gray-900 mb-4">{artwork.collection.name}</h3>
                      {artwork.collection.description && (
                        <p className="text-gray-700 leading-relaxed mb-6">{artwork.collection.description}</p>
                      )}
                    </div>
                    
                    {artwork.collection.topic && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Topic</h4>
                        <p className="text-gray-700 mb-4">{artwork.collection.topic}</p>
                      </div>
                    )}
                    
                    {artwork.collection.purpose && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Purpose</h4>
                        <p className="text-gray-700 mb-4">{artwork.collection.purpose}</p>
                      </div>
                    )}
                    
                    {artwork.collection.brand_story && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Brand Story</h4>
                        <p className="text-gray-700 mb-4">{artwork.collection.brand_story}</p>
                      </div>
                    )}
                    
                    {artwork.collection.design_philosophy && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Design Philosophy</h4>
                        <p className="text-gray-700 mb-4">{artwork.collection.design_philosophy}</p>
                      </div>
                    )}
                    
                    {artwork.collection.genesis_story && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Genesis Story</h4>
                        <p className="text-gray-700 mb-4">{artwork.collection.genesis_story}</p>
                      </div>
                    )}
                    
                    {artwork.collection.month_created && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Created</h4>
                        <p className="text-gray-700">{artwork.collection.month_created}</p>
                      </div>
                    )}
                  </div>
                ) : artwork ? (
                  <div className="py-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Collection</h3>
                    {artwork.artwork_collection_id ? (
                      <p className="text-gray-600">Collection information is being loaded...</p>
                    ) : (
                      <p className="text-gray-600">This artwork is not part of a specific collection.</p>
                    )}
                  </div>
                ) : (
                  <div className="py-8">
                    <p className="text-gray-600">No artwork information available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'product' && (
              <div className="max-w-4xl space-y-6">
                {product.metadata?.fulfillment_type === 'printful_pod' ? (
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Printful Product Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Material & Construction</h4>
                        <p className="text-gray-700">High-quality materials sourced from trusted suppliers</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Printing Process</h4>
                        <p className="text-gray-700">Advanced direct-to-garment (DTG) printing for vibrant, long-lasting colors</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Quality Assurance</h4>
                        <p className="text-gray-700">Each item is carefully inspected before shipping</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Processing Time</h4>
                        <p className="text-gray-700">2-7 business days for production</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Environmental Impact</h4>
                        <p className="text-gray-700">Made to order to reduce waste and environmental impact</p>
                      </div>
                    </div>
                  </div>
                ) : product.metadata?.fulfillment_type === 'digital_download' ? (
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Digital File Details</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">File Formats</h4>
                        <p className="text-gray-700">High-resolution PNG, JPG, and vector formats included</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Resolution</h4>
                        <p className="text-gray-700">300 DPI for print-ready quality</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Color Space</h4>
                        <p className="text-gray-700">RGB for digital use, CMYK for print applications</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">File Sizes</h4>
                        <p className="text-gray-700">Multiple sizes included for various use cases</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Delivery</h4>
                        <p className="text-gray-700">Instant download after purchase completion</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Usage Rights</h4>
                        <p className="text-gray-700">Personal and commercial use license included</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Product Information</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700">{product.description || 'No detailed description available.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="max-w-4xl space-y-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Shipping Information</h3>
                  
                  {product.metadata?.fulfillment_type === 'digital_download' ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Digital Delivery</h4>
                        <p className="text-gray-700">Files are delivered instantly via email after purchase</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">No Physical Shipping</h4>
                        <p className="text-gray-700">This is a digital product - no physical item will be shipped</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Access</h4>
                        <p className="text-gray-700">Download links remain active for 30 days after purchase</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Processing Time</h4>
                        <p className="text-gray-700">2-7 business days for production and processing</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Shipping Options</h4>
                        <p className="text-gray-700">Standard shipping (5-10 business days) and Express shipping (2-5 business days) available</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Free Shipping</h4>
                        <p className="text-gray-700">Free standard shipping on orders over $50</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">International Shipping</h4>
                        <p className="text-gray-700">We ship worldwide - additional charges may apply</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Returns & Exchanges</h3>
                  
                  {product.metadata?.fulfillment_type === 'digital_download' ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Digital Product Policy</h4>
                        <p className="text-gray-700">Due to the digital nature of this product, all sales are final</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Quality Guarantee</h4>
                        <p className="text-gray-700">If you experience any issues with file quality or download, contact us for support</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Return Window</h4>
                        <p className="text-gray-700">30 days from delivery date for returns</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Return Conditions</h4>
                        <p className="text-gray-700">Items must be unused, unwashed, and in original condition</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Return Process</h4>
                        <p className="text-gray-700">Contact our support team to initiate a return and receive a prepaid return label</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Exchanges</h4>
                        <p className="text-gray-700">Free exchanges for size or defect issues within 30 days</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Refunds</h4>
                        <p className="text-gray-700">Full refunds processed within 5-7 business days after we receive the returned item</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">Customer Support</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Contact Us</h4>
                      <p className="text-gray-700">Email: support@sencommerce.com</p>
                      <p className="text-gray-700">Response time: Within 24 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}