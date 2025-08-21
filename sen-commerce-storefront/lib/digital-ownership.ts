import { MEDUSA_API_CONFIG, getHeaders } from './config'

export interface OwnedDigitalProduct {
  product_id: string
  product_name: string
  order_id: string
  order_display_id: string
  download_url: string
  order_date: string
}

class DigitalOwnershipService {
  private ownedProducts: OwnedDigitalProduct[] = []
  private userEmail: string | null = null
  private lastFetchTime: number = 0
  private cacheTimeout: number = 5 * 60 * 1000 // 5 minutes

  // Set the current user email
  setUserEmail(email: string | null) {
    if (this.userEmail !== email) {
      this.userEmail = email
      this.ownedProducts = []
      this.lastFetchTime = 0
    }
  }

  // Get user email from localStorage
  private getUserEmail(): string | null {
    if (typeof window === 'undefined') return null
    
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        return userData.email || null
      } catch {
        return null
      }
    }
    return null
  }

  // Fetch owned digital products from the API
  async fetchOwnedProducts(): Promise<OwnedDigitalProduct[]> {
    const email = this.getUserEmail()
    if (!email) {
      this.ownedProducts = []
      return []
    }

    // Use cached data if it's recent
    const now = Date.now()
    if (this.userEmail === email && (now - this.lastFetchTime) < this.cacheTimeout) {
      return this.ownedProducts
    }

    try {
      console.log('[Digital Ownership] Fetching downloads for:', email)
      const response = await fetch(`${MEDUSA_API_CONFIG.baseUrl}/store/downloads?customer_email=${encodeURIComponent(email)}`, {
        headers: getHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const downloads = data.downloads || []
        
        this.ownedProducts = downloads.map((download: any) => ({
          product_id: download.product_id, // Now should be available from the fixed API
          product_name: download.product_name,
          order_id: download.order_id,
          order_display_id: download.order_display_id,
          download_url: download.download_url,
          order_date: download.order_date
        }))

        this.userEmail = email
        this.lastFetchTime = now
        
        console.log('[Digital Ownership] Found', this.ownedProducts.length, 'owned digital products')
        return this.ownedProducts
      } else {
        console.warn('[Digital Ownership] API request failed:', response.status)
        this.ownedProducts = []
        return []
      }
    } catch (error) {
      console.error('[Digital Ownership] Error fetching owned products:', error)
      this.ownedProducts = []
      return []
    }
  }

  // Check if user owns a specific product
  async isProductOwned(productId: string): Promise<boolean> {
    const owned = await this.fetchOwnedProducts()
    return owned.some(product => product.product_id === productId)
  }

  // Check multiple products at once
  async checkMultipleProducts(productIds: string[]): Promise<{ [productId: string]: boolean }> {
    const owned = await this.fetchOwnedProducts()
    const result: { [productId: string]: boolean } = {}
    
    productIds.forEach(productId => {
      result[productId] = owned.some(product => product.product_id === productId)
    })
    
    return result
  }

  // Get owned product details
  async getOwnedProductDetails(productId: string): Promise<OwnedDigitalProduct | null> {
    const owned = await this.fetchOwnedProducts()
    return owned.find(product => product.product_id === productId) || null
  }

  // Check if product is digital
  isDigitalProduct(metadata?: { fulfillment_type?: string }): boolean {
    return metadata?.fulfillment_type === 'digital' || metadata?.fulfillment_type === 'digital_download'
  }

  // Clear cache (useful when user logs out)
  clearCache() {
    this.ownedProducts = []
    this.lastFetchTime = 0
    this.userEmail = null
  }
}

export const digitalOwnershipService = new DigitalOwnershipService()