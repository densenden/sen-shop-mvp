'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, ShoppingBag, Download, Truck, Star, Share2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '../../components/Layout'
import { MEDUSA_API_CONFIG, getHeaders } from '../../../lib/config'
import { cartService } from '../../../lib/cart'

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
  }
}

interface ProductVariant {
  id: string
  title: string
  price: number
  sku?: string
  inventory_quantity?: number
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

  useEffect(() => {
    if (handle) {
      fetchProduct()
    }
  }, [handle])

  useEffect(() => {
    // Check if product is in favorites
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(product?.id))
  }, [product?.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      console.log('Fetching product for handle:', handle)
      
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/products`, {
        headers: getHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Products API Response:', data)
        
        // Find product by handle or id
        const productData = data.products?.find((p: Product) => p.handle === handle || p.id === handle)
        
        if (productData) {
          // Process Medusa product data structure
          const productWithImages = {
            ...productData,
            thumbnail: productData.thumbnail,
            images: productData.images?.map((img: any) => typeof img === 'string' ? img : img.url) || [productData.thumbnail],
            variants: productData.variants?.length > 0 ? productData.variants : [{
              id: `${productData.id}-default`,
              title: 'Default',
              price: productData.price,
              sku: productData.handle,
              inventory_quantity: 100
            }]
          }
          
          setProduct(productWithImages)
          setSelectedVariant(productWithImages.variants[0])
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

  const addToCart = async () => {
    if (!product || !selectedVariant) return

    setAddingToCart(true)
    try {
      console.log('Product page: Adding to cart via cartService:', {
        productId: product.id,
        variantId: selectedVariant.id,
        quantity
      })
      
      // Use the same cart service as the artwork pages
      await cartService.addItem(product.id, selectedVariant.id, quantity)
      
      // Show success message or redirect to cart
      router.push('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart. Please try again.')
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
            className="inline-flex items-center text-blue-600 hover:text-blue-500"
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
                      className={`relative h-24 cursor-pointer rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4 ${
                        index === activeImageIndex ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="h-full w-full object-cover object-center rounded-md"
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
                  className="h-full w-full object-cover object-center sm:rounded-lg"
                />
              ) : (
                <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {product.title}
            </h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl text-gray-900">
                {formatPrice(selectedVariant?.price || product.price, product.currency_code)}
              </p>
            </div>

            {/* Product type badge */}
            <div className="mt-4">
              {product.metadata?.fulfillment_type === 'digital_download' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Download className="h-4 w-4 mr-1" />
                  Digital Download
                </span>
              )}
              {product.metadata?.fulfillment_type === 'printful_pod' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
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
                      className="text-yellow-400 h-5 w-5 flex-shrink-0 fill-current"
                    />
                  ))}
                </div>
                <p className="sr-only">5 out of 5 stars</p>
                <a href="#" className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-500">
                  117 reviews
                </a>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 space-y-6">
                <p>{product.description || 'No description available.'}</p>
              </div>
            </div>

            {/* Product details */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Product Details</h3>
                <button
                  onClick={toggleFavorite}
                  className="ml-4 py-2 px-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
                </button>
              </div>
              
              <div className="mt-4 prose prose-sm text-gray-700">
                <ul>
                  <li>High-quality materials</li>
                  <li>Sustainably produced</li>
                  {product.metadata?.fulfillment_type === 'digital_download' && (
                    <>
                      <li>Instant download after purchase</li>
                      <li>Multiple format options available</li>
                    </>
                  )}
                  {product.metadata?.fulfillment_type === 'printful_pod' && (
                    <>
                      <li>Made to order</li>
                      <li>Worldwide shipping available</li>
                    </>
                  )}
                </ul>
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
                      className={`px-4 py-2 text-sm font-medium rounded-md border ${
                        selectedVariant?.id === variant.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {variant.title} - {formatPrice(variant.price, product.currency_code)}
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={addToCart}
                  disabled={addingToCart || !selectedVariant}
                  className="flex-1 bg-blue-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <button
                  type="button"
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Shipping info */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-sm font-medium text-gray-900">Shipping & Returns</h3>
              <div className="mt-4 text-sm text-gray-700">
                {product.metadata?.fulfillment_type === 'digital_download' ? (
                  <p>Digital products are delivered instantly via email after purchase.</p>
                ) : (
                  <>
                    <p>Free shipping on orders over $50.</p>
                    <p>Standard shipping takes 5-7 business days.</p>
                    <p>30-day return policy for all physical products.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
