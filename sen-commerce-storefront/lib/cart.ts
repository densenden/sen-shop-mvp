import { MEDUSA_API_CONFIG, getHeaders } from './config'

export interface CartItem {
  id: string
  cart_id: string
  product_id: string
  variant_id: string
  title: string
  thumbnail?: string
  quantity: number
  unit_price: number
  total: number
  currency_code: string
  metadata?: {
    fulfillment_type?: string
    artwork_id?: string
  }
  product?: {
    id: string
    title: string
    handle: string
    thumbnail?: string
  }
  variant?: {
    id: string
    title: string
    inventory_quantity?: number
  }
}

export interface CartAddress {
  id?: string
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}

export interface Cart {
  id: string
  region_id?: string
  currency_code: string
  items: CartItem[]
  shipping_address?: CartAddress
  billing_address?: CartAddress
  subtotal: number
  tax_total: number
  shipping_total: number
  total: number
  created_at: string
  updated_at: string
}

class CartService {
  private cartId: string | null = null
  private cart: Cart | null = null

  constructor() {
    // Initialize cart ID from localStorage
    if (typeof window !== 'undefined') {
      this.cartId = localStorage.getItem('cart_id')
    }
  }

  private getHeaders() {
    const headers = getHeaders()
    if (this.cartId) {
      headers['x-cart-id'] = this.cartId
    }
    return headers
  }

  private saveCartId(cartId: string) {
    this.cartId = cartId
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_id', cartId)
    }
  }

  private clearCartId() {
    this.cartId = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart_id')
    }
  }

  async getCart(): Promise<Cart | null> {
    try {
      // First try to get from localStorage fallback
      if (typeof window !== 'undefined') {
        const localCart = localStorage.getItem('fallback_cart')
        if (localCart) {
          this.cart = JSON.parse(localCart)
          return this.cart
        }
      }

      if (!this.cartId) {
        return null
      }

      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/cart`, {
        headers: this.getHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        this.cart = data.cart
        return this.cart
      } else if (response.status === 404) {
        // Cart not found, clear the stored ID
        this.clearCartId()
        return null
      } else {
        console.warn(`Cart API failed with status ${response.status}, using localStorage fallback`)
        return this.getLocalCart()
      }
    } catch (error) {
      console.error('Error getting cart:', error)
      return this.getLocalCart()
    }
  }

  private getLocalCart(): Cart | null {
    if (typeof window !== 'undefined') {
      const localCart = localStorage.getItem('fallback_cart')
      if (localCart) {
        this.cart = JSON.parse(localCart)
        return this.cart
      }
    }
    return null
  }

  private saveLocalCart(cart: Cart) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fallback_cart', JSON.stringify(cart))
    }
  }

  async createCart(region_id: string = 'reg_01JXAMMJEW67HVN6167BJ7513K', currency_code: string = 'eur'): Promise<Cart | null> {
    try {
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/carts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          region_id,
          currency_code,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        this.cart = data.cart
        this.saveCartId(data.cart.id)
        return this.cart
      } else {
        throw new Error(`Failed to create cart: ${response.status}`)
      }
    } catch (error) {
      console.error('Error creating cart:', error)
      return null
    }
  }

  async addItem(productId: string, variantId: string, quantity: number = 1): Promise<Cart | null> {
    try {
      // Ensure we have a cart
      if (!this.cartId) {
        await this.createCart()
      }

      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/carts/${this.cartId}/line-items`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          variant_id: variantId,
          quantity,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        this.cart = data.cart
        this.saveLocalCart(this.cart)
        return this.cart
      } else {
        console.warn('Cart API failed, using localStorage fallback')
        return this.addItemLocal(productId, variantId, quantity)
      }
    } catch (error) {
      console.error('Error adding item to cart via API, using localStorage fallback:', error)
      return this.addItemLocal(productId, variantId, quantity)
    }
  }

  private async addItemLocal(productId: string, variantId: string, quantity: number = 1): Promise<Cart | null> {
    try {
      // Get product details for the cart item
      const productResponse = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/products/${productId}`, {
        headers: getHeaders(),
      })

      let product: any = null
      if (productResponse.ok) {
        const productData = await productResponse.json()
        product = productData.product
      }

      // Get or create cart
      let cart = this.getLocalCart() || this.createLocalCart()
      
      // Find existing item
      const existingItemIndex = cart.items.findIndex(
        item => item.product_id === productId && item.variant_id === variantId
      )

      if (existingItemIndex >= 0) {
        // Update existing item
        cart.items[existingItemIndex].quantity += quantity
        cart.items[existingItemIndex].total = cart.items[existingItemIndex].unit_price * cart.items[existingItemIndex].quantity
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cart_id: cart.id,
          product_id: productId,
          variant_id: variantId,
          title: product?.title || 'Product',
          thumbnail: product?.thumbnail || undefined,
          quantity: quantity,
          unit_price: product?.variants?.find((v: any) => v.id === variantId)?.prices?.[0]?.amount || 2000,
          total: 0,
          currency_code: 'usd',
          product: product ? {
            id: product.id,
            title: product.title,
            handle: product.handle,
            thumbnail: product.thumbnail
          } : undefined
        }
        newItem.total = newItem.unit_price * quantity
        cart.items.push(newItem)
      }

      // Recalculate totals
      cart.subtotal = cart.items.reduce((sum, item) => sum + item.total, 0)
      cart.total = cart.subtotal // Simplified, no tax/shipping for now
      cart.updated_at = new Date().toISOString()

      this.cart = cart
      this.saveLocalCart(cart)
      return cart
    } catch (error) {
      console.error('Error adding item locally:', error)
      throw error
    }
  }

  private createLocalCart(): Cart {
    const cart: Cart = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currency_code: 'usd',
      items: [],
      subtotal: 0,
      tax_total: 0,
      shipping_total: 0,
      total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    this.saveCartId(cart.id)
    this.saveLocalCart(cart)
    return cart
  }

  async updateItem(itemId: string, quantity: number): Promise<Cart | null> {
    try {
      if (!this.cartId) {
        throw new Error('No cart found')
      }

      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/cart/items/${itemId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          quantity,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        this.cart = data.cart
        return this.cart
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to update item: ${response.status}`)
      }
    } catch (error) {
      console.error('Error updating cart item:', error)
      throw error
    }
  }

  async removeItem(itemId: string): Promise<Cart | null> {
    try {
      if (!this.cartId) {
        throw new Error('No cart found')
      }

      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        this.cart = data.cart
        return this.cart
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to remove item: ${response.status}`)
      }
    } catch (error) {
      console.error('Error removing cart item:', error)
      throw error
    }
  }

  async updateAddress(type: 'shipping' | 'billing', address: CartAddress): Promise<Cart | null> {
    try {
      if (!this.cartId) {
        throw new Error('No cart found')
      }

      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/cart/addresses`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          [type + '_address']: address,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        this.cart = data.cart
        return this.cart
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to update address: ${response.status}`)
      }
    } catch (error) {
      console.error('Error updating cart address:', error)
      throw error
    }
  }

  async clearCart(): Promise<void> {
    try {
      if (this.cartId) {
        const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/cart`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })

        if (response.ok) {
          this.cart = null
          this.clearCartId()
        } else {
          console.warn('Failed to clear cart via API, clearing locally')
        }
      }
      
      // Always clear localStorage
      this.cart = null
      this.clearCartId()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fallback_cart')
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      // Clear locally even if API fails
      this.cart = null
      this.clearCartId()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fallback_cart')
      }
    }
  }

  // Get current cart without making API call
  getCurrentCart(): Cart | null {
    return this.cart
  }

  // Get cart item count
  getItemCount(): number {
    if (!this.cart?.items) return 0
    return this.cart.items.reduce((total, item) => total + item.quantity, 0)
  }

  // Get cart total
  getTotal(): number {
    return this.cart?.total || 0
  }

  // Get subtotal
  getSubtotal(): number {
    return this.cart?.subtotal || 0
  }
}

// Create singleton instance
export const cartService = new CartService()

// Utility functions
export const formatPrice = (price: number, currency: string = 'usd'): string => {
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0
  const safeCurrency = (currency || 'usd').toUpperCase()
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: safeCurrency
  }).format(safePrice / 100)
}