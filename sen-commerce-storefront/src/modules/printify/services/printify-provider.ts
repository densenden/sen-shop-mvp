/**
 * Printify Provider Implementation
 * Implements PODProvider interface for Printify API integration
 */

import {
  PODProvider,
  PODProviderType,
  PODProduct,
  PODVariant,
  PODOrder,
  PODProviderHealthStatus,
  PODProviderCapabilities,
  PODProviderError,
} from '../../common/types/pod-provider';

export class PrintifyProvider implements PODProvider {
  readonly providerType: PODProviderType = 'printify';

  readonly capabilities: PODProviderCapabilities = {
    supportsTemplates: true,
    supportsBulkOperations: false, // Printify has limited bulk operations
    supportsVariantMapping: true,
    supportsPriceUpdates: true,
    supportsInventorySync: false, // Printify manages inventory
    maxBulkOperationSize: 50,
    rateLimitPerMinute: 60, // Conservative rate limit
  };

  private baseUrl = 'https://api.printify.com/v1';
  private apiKey: string;
  private shopId: string;
  private rateLimitCounter = 60; // Start with full limit
  private rateLimitResetTime = new Date(Date.now() + 60000); // Reset in 1 minute

  constructor(apiKey: string, shopId: string) {
    this.apiKey = apiKey;
    this.shopId = shopId;
  }

  /**
   * Make authenticated request to Printify API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    // Check rate limiting
    if (this.isRateLimited()) {
      throw new PODProviderError(
        'Rate limit exceeded',
        this.providerType,
        'RATE_LIMITED',
        true,
        true,
        Math.ceil((this.rateLimitResetTime.getTime() - Date.now()) / 1000)
      );
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      // Update rate limit tracking (simplified)
      this.updateRateLimitTracking();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new PODProviderError(
            'Rate limit exceeded',
            this.providerType,
            'RATE_LIMITED',
            true,
            true,
            parseInt(response.headers.get('Retry-After') || '60', 10)
          );
        }

        throw new PODProviderError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          this.providerType,
          errorData.code || 'HTTP_ERROR',
          response.status >= 500
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof PODProviderError) {
        throw error;
      }

      throw new PODProviderError(
        error instanceof Error ? error.message : 'Unknown error',
        this.providerType,
        'NETWORK_ERROR',
        true
      );
    }
  }

  /**
   * Simple rate limit tracking (decrements counter)
   */
  private updateRateLimitTracking(): void {
    this.rateLimitCounter--;

    // Reset counter every minute
    if (Date.now() >= this.rateLimitResetTime.getTime()) {
      this.rateLimitCounter = this.capabilities.rateLimitPerMinute;
      this.rateLimitResetTime = new Date(Date.now() + 60000);
    }
  }

  /**
   * Convert Printify product data to PODProduct format
   */
  private convertPrintifyProduct(printifyProduct: any): PODProduct {
    return {
      id: printifyProduct.id.toString(),
      externalId: printifyProduct.external_id,
      name: printifyProduct.title,
      description: printifyProduct.description,
      status: this.mapPrintifyStatus(printifyProduct.publish_details?.status),
      variants: printifyProduct.variants?.map((v: any) => this.convertPrintifyVariant(v, printifyProduct.id)) || [],
      provider: 'printify',
      metadata: {
        printifyData: printifyProduct,
        blueprint_id: printifyProduct.blueprint_id,
        print_provider_id: printifyProduct.print_provider_id,
      },
      createdAt: new Date(printifyProduct.created_at),
      updatedAt: new Date(printifyProduct.updated_at),
    };
  }

  /**
   * Convert Printify variant data to PODVariant format
   */
  private convertPrintifyVariant(printifyVariant: any, productId: string): PODVariant {
    return {
      id: printifyVariant.id.toString(),
      externalId: printifyVariant.id.toString(),
      productId: productId.toString(),
      name: printifyVariant.title,
      size: printifyVariant.options?.size,
      color: printifyVariant.options?.color,
      price: printifyVariant.price ? parseFloat(printifyVariant.price) / 100 : 0, // Printify uses cents
      currency: 'USD', // Printify typically uses USD
      availability: printifyVariant.is_enabled,
      mockupUrl: printifyVariant.image,
      metadata: {
        printifyData: printifyVariant,
        sku: printifyVariant.sku,
      },
    };
  }

  /**
   * Map Printify status to common status
   */
  private mapPrintifyStatus(printifyStatus: string): 'draft' | 'published' | 'archived' | 'out_of_stock' {
    switch (printifyStatus?.toLowerCase()) {
      case 'published':
        return 'published';
      case 'draft':
        return 'draft';
      case 'archived':
        return 'archived';
      default:
        return 'draft';
    }
  }

  /**
   * Health check implementation
   */
  async healthCheck(): Promise<PODProviderHealthStatus> {
    const startTime = Date.now();

    try {
      await this.makeRequest(`/shops/${this.shopId}.json`);
      const responseTime = Date.now() - startTime;

      return {
        provider: this.providerType,
        status: 'active',
        lastChecked: new Date(),
        responseTime,
        capabilities: this.capabilities,
      };
    } catch (error) {
      return {
        provider: this.providerType,
        status: error instanceof PODProviderError && error.rateLimited ? 'rate_limited' : 'error',
        lastChecked: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        capabilities: this.capabilities,
      };
    }
  }

  /**
   * Get products from Printify
   */
  async getProducts(limit = 20, offset = 0): Promise<PODProduct[]> {
    try {
      const page = Math.floor(offset / limit) + 1;
      const response = await this.makeRequest<any>(`/shops/${this.shopId}/products.json?limit=${limit}&page=${page}`);
      return response.data?.map((product: any) => this.convertPrintifyProduct(product)) || [];
    } catch (error) {
      console.error('Error fetching Printify products:', error);
      return [];
    }
  }

  /**
   * Get single product from Printify
   */
  async getProduct(id: string): Promise<PODProduct> {
    const response = await this.makeRequest<any>(`/shops/${this.shopId}/products/${id}.json`);
    return this.convertPrintifyProduct(response);
  }

  /**
   * Create product in Printify
   */
  async createProduct(product: Partial<PODProduct>): Promise<PODProduct> {
    const printifyData = {
      title: product.name,
      description: product.description,
      blueprint_id: product.metadata?.blueprint_id || 1, // Default blueprint
      print_provider_id: product.metadata?.print_provider_id || 1, // Default provider
      // Add variants and other Printify-specific fields
    };

    const response = await this.makeRequest<any>(`/shops/${this.shopId}/products.json`, 'POST', printifyData);
    return this.convertPrintifyProduct(response);
  }

  /**
   * Update product in Printify
   */
  async updateProduct(id: string, updates: Partial<PODProduct>): Promise<PODProduct> {
    const printifyData = {
      title: updates.name,
      description: updates.description,
      // Map other updates to Printify format
    };

    const response = await this.makeRequest<any>(`/shops/${this.shopId}/products/${id}.json`, 'PUT', printifyData);
    return this.convertPrintifyProduct(response);
  }

  /**
   * Delete product from Printify
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/shops/${this.shopId}/products/${id}.json`, 'DELETE');
      return true;
    } catch (error) {
      console.error('Error deleting Printify product:', error);
      return false;
    }
  }

  /**
   * Get variants for a product
   */
  async getVariants(productId: string): Promise<PODVariant[]> {
    const product = await this.getProduct(productId);
    return product.variants;
  }

  /**
   * Update variant in Printify
   */
  async updateVariant(variantId: string, updates: Partial<PODVariant>): Promise<PODVariant> {
    // Printify variants are updated as part of product updates
    // This is a simplified implementation
    const printifyData = {
      price: updates.price ? Math.round(updates.price * 100) : undefined, // Convert to cents
      is_enabled: updates.availability,
    };

    // Note: This is a simplified approach - in reality, you'd need to update the entire product
    // with the variant changes since Printify doesn't have separate variant endpoints
    throw new PODProviderError(
      'Printify requires updating variants through product updates',
      this.providerType,
      'NOT_SUPPORTED',
      false
    );
  }

  /**
   * Bulk update products (limited support)
   */
  async bulkUpdateProducts(updates: Array<{ id: string; updates: Partial<PODProduct> }>): Promise<PODProduct[]> {
    const results: PODProduct[] = [];

    // Printify doesn't have native bulk operations, process sequentially with delays
    for (const update of updates) {
      try {
        const result = await this.updateProduct(update.id, update.updates);
        results.push(result);

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error updating Printify product ${update.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Bulk update variants (not supported)
   */
  async bulkUpdateVariants(updates: Array<{ id: string; updates: Partial<PODVariant> }>): Promise<PODVariant[]> {
    throw new PODProviderError(
      'Printify does not support bulk variant updates',
      this.providerType,
      'NOT_SUPPORTED',
      false
    );
  }

  /**
   * Create order in Printify
   */
  async createOrder(order: Partial<PODOrder>): Promise<PODOrder> {
    const printifyData = {
      external_id: order.externalId,
      shipping_method: 1, // Default shipping method
      send_shipping_notification: false,
      address_to: {
        first_name: order.shipping?.name?.split(' ')[0] || '',
        last_name: order.shipping?.name?.split(' ').slice(1).join(' ') || '',
        email: order.shipping?.email,
        phone: order.shipping?.phone,
        country: order.shipping?.country,
        region: order.shipping?.state,
        address1: order.shipping?.address1,
        address2: order.shipping?.address2,
        city: order.shipping?.city,
        zip: order.shipping?.zip,
      },
      line_items: order.items?.map(item => ({
        product_id: item.variantId.split('-')[0], // Extract product ID
        variant_id: parseInt(item.variantId.split('-')[1] || '0'), // Extract variant ID
        quantity: item.quantity,
      })),
    };

    const response = await this.makeRequest<any>(`/shops/${this.shopId}/orders.json`, 'POST', printifyData);

    return {
      id: response.id.toString(),
      externalId: response.external_id,
      status: response.status,
      items: order.items || [],
      shipping: order.shipping!,
      totalPrice: response.total_price ? parseFloat(response.total_price) / 100 : 0,
      currency: 'USD',
      provider: 'printify',
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.updated_at),
    };
  }

  /**
   * Get order from Printify
   */
  async getOrder(id: string): Promise<PODOrder> {
    const response = await this.makeRequest<any>(`/shops/${this.shopId}/orders/${id}.json`);

    return {
      id: response.id.toString(),
      externalId: response.external_id,
      status: response.status,
      items: [], // Would need to map from response.line_items
      shipping: {
        name: `${response.address_to?.first_name || ''} ${response.address_to?.last_name || ''}`.trim(),
        address1: response.address_to?.address1 || '',
        address2: response.address_to?.address2,
        city: response.address_to?.city || '',
        state: response.address_to?.region,
        zip: response.address_to?.zip || '',
        country: response.address_to?.country || '',
        phone: response.address_to?.phone,
        email: response.address_to?.email,
      },
      totalPrice: response.total_price ? parseFloat(response.total_price) / 100 : 0,
      currency: 'USD',
      provider: 'printify',
      createdAt: new Date(response.created_at),
      updatedAt: new Date(response.updated_at),
    };
  }

  /**
   * Get orders from Printify
   */
  async getOrders(limit = 20, offset = 0): Promise<PODOrder[]> {
    const page = Math.floor(offset / limit) + 1;
    const response = await this.makeRequest<any>(`/shops/${this.shopId}/orders.json?limit=${limit}&page=${page}`);

    return response.data?.map((order: any) => ({
      id: order.id.toString(),
      externalId: order.external_id,
      status: order.status,
      items: [], // Would need to map from order.line_items
      shipping: {
        name: `${order.address_to?.first_name || ''} ${order.address_to?.last_name || ''}`.trim(),
        address1: order.address_to?.address1 || '',
        address2: order.address_to?.address2,
        city: order.address_to?.city || '',
        state: order.address_to?.region,
        zip: order.address_to?.zip || '',
        country: order.address_to?.country || '',
        phone: order.address_to?.phone,
        email: order.address_to?.email,
      },
      totalPrice: order.total_price ? parseFloat(order.total_price) / 100 : 0,
      currency: 'USD',
      provider: 'printify',
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
    })) || [];
  }

  /**
   * Get variant pricing
   */
  async getVariantPricing(variantId: string): Promise<{ price: number; currency: string }> {
    try {
      // Extract product ID and variant index from variantId
      const [productId] = variantId.split('-');
      const product = await this.getProduct(productId);
      const variant = product.variants.find(v => v.id === variantId);

      return {
        price: variant?.price || 0,
        currency: variant?.currency || 'USD',
      };
    } catch (error) {
      return { price: 0, currency: 'USD' };
    }
  }

  /**
   * Check if rate limited
   */
  isRateLimited(): boolean {
    if (Date.now() >= this.rateLimitResetTime.getTime()) {
      this.rateLimitCounter = this.capabilities.rateLimitPerMinute;
      this.rateLimitResetTime = new Date(Date.now() + 60000);
      return false;
    }
    return this.rateLimitCounter <= 0;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): { remaining: number; resetTime: Date } {
    return {
      remaining: Math.max(0, this.rateLimitCounter),
      resetTime: this.rateLimitResetTime,
    };
  }
}

/**
 * Custom PODProviderError class for Printify-specific errors
 */
class PODProviderError extends Error {
  constructor(
    message: string,
    public provider: PODProviderType,
    public code: string,
    public retryable: boolean,
    public rateLimited: boolean = false,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'PODProviderError';
  }
}