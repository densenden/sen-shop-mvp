/**
 * Printful Provider Implementation
 * Implements PODProvider interface for Printful API integration
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

export class PrintfulProvider implements PODProvider {
  readonly providerType: PODProviderType = 'printful';

  readonly capabilities: PODProviderCapabilities = {
    supportsTemplates: true,
    supportsBulkOperations: true,
    supportsVariantMapping: true,
    supportsPriceUpdates: true,
    supportsInventorySync: true,
    maxBulkOperationSize: 100,
    rateLimitPerMinute: 120,
  };

  private baseUrl = 'https://api.printful.com';
  private apiKey: string;
  private rateLimitCounter = 0;
  private rateLimitResetTime = new Date();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated request to Printful API
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
        true
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

      // Update rate limit tracking
      this.updateRateLimitTracking(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new PODProviderError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          this.providerType,
          errorData.code || 'HTTP_ERROR',
          response.status >= 500 || response.status === 429
        );
      }

      const data = await response.json();
      return data.result || data;
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
   * Update rate limit tracking based on response headers
   */
  private updateRateLimitTracking(response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining) {
      this.rateLimitCounter = parseInt(remaining, 10);
    }

    if (reset) {
      this.rateLimitResetTime = new Date(parseInt(reset, 10) * 1000);
    }
  }

  /**
   * Convert Printful product data to PODProduct format
   */
  private convertPrintfulProduct(printfulProduct: any): PODProduct {
    return {
      id: printfulProduct.id.toString(),
      externalId: printfulProduct.external_id,
      name: printfulProduct.name,
      description: printfulProduct.description,
      status: this.mapPrintfulStatus(printfulProduct.status),
      variants: printfulProduct.variants?.map((v: any) => this.convertPrintfulVariant(v, printfulProduct.id)) || [],
      provider: 'printful',
      metadata: {
        printfulData: printfulProduct,
      },
      createdAt: new Date(printfulProduct.created),
      updatedAt: new Date(printfulProduct.updated),
    };
  }

  /**
   * Convert Printful variant data to PODVariant format
   */
  private convertPrintfulVariant(printfulVariant: any, productId: string): PODVariant {
    return {
      id: printfulVariant.id.toString(),
      externalId: printfulVariant.external_id,
      productId: productId.toString(),
      name: printfulVariant.name,
      size: printfulVariant.size,
      color: printfulVariant.color,
      price: parseFloat(printfulVariant.price || '0'),
      currency: printfulVariant.currency || 'USD',
      availability: printfulVariant.availability_status === 'active',
      mockupUrl: printfulVariant.files?.find((f: any) => f.type === 'preview')?.preview_url,
      metadata: {
        printfulData: printfulVariant,
      },
    };
  }

  /**
   * Map Printful status to common status
   */
  private mapPrintfulStatus(printfulStatus: string): 'draft' | 'published' | 'archived' | 'out_of_stock' {
    switch (printfulStatus?.toLowerCase()) {
      case 'draft':
        return 'draft';
      case 'synced':
      case 'active':
        return 'published';
      case 'archived':
        return 'archived';
      case 'out_of_stock':
        return 'out_of_stock';
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
      await this.makeRequest('/store');
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
   * Get products from Printful
   */
  async getProducts(limit = 20, offset = 0): Promise<PODProduct[]> {
    try {
      const response = await this.makeRequest<any>(`/store/products?limit=${limit}&offset=${offset}`);
      return response.map((product: any) => this.convertPrintfulProduct(product));
    } catch (error) {
      console.error('Error fetching Printful products:', error);
      return [];
    }
  }

  /**
   * Get single product from Printful
   */
  async getProduct(id: string): Promise<PODProduct> {
    const response = await this.makeRequest<any>(`/store/products/${id}`);
    return this.convertPrintfulProduct(response);
  }

  /**
   * Create product in Printful
   */
  async createProduct(product: Partial<PODProduct>): Promise<PODProduct> {
    const printfulData = {
      external_id: product.externalId,
      name: product.name,
      description: product.description,
      // Add other Printful-specific fields as needed
    };

    const response = await this.makeRequest<any>('/store/products', 'POST', printfulData);
    return this.convertPrintfulProduct(response);
  }

  /**
   * Update product in Printful
   */
  async updateProduct(id: string, updates: Partial<PODProduct>): Promise<PODProduct> {
    const printfulData = {
      name: updates.name,
      description: updates.description,
      // Map other updates to Printful format
    };

    const response = await this.makeRequest<any>(`/store/products/${id}`, 'PUT', printfulData);
    return this.convertPrintfulProduct(response);
  }

  /**
   * Delete product from Printful
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/store/products/${id}`, 'DELETE');
      return true;
    } catch (error) {
      console.error('Error deleting Printful product:', error);
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
   * Update variant in Printful
   */
  async updateVariant(variantId: string, updates: Partial<PODVariant>): Promise<PODVariant> {
    const printfulData = {
      price: updates.price,
      // Map other updates to Printful format
    };

    const response = await this.makeRequest<any>(`/store/variants/${variantId}`, 'PUT', printfulData);
    return this.convertPrintfulVariant(response, response.product_id);
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(updates: Array<{ id: string; updates: Partial<PODProduct> }>): Promise<PODProduct[]> {
    const results: PODProduct[] = [];

    // Printful doesn't have native bulk operations, so we'll batch them
    const batchSize = Math.min(updates.length, this.capabilities.maxBulkOperationSize);

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchPromises = batch.map(update =>
        this.updateProduct(update.id, update.updates).catch(error => {
          console.error(`Error updating product ${update.id}:`, error);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as PODProduct[]);
    }

    return results;
  }

  /**
   * Bulk update variants
   */
  async bulkUpdateVariants(updates: Array<{ id: string; updates: Partial<PODVariant> }>): Promise<PODVariant[]> {
    const results: PODVariant[] = [];

    const batchSize = Math.min(updates.length, this.capabilities.maxBulkOperationSize);

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchPromises = batch.map(update =>
        this.updateVariant(update.id, update.updates).catch(error => {
          console.error(`Error updating variant ${update.id}:`, error);
          return null;
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null) as PODVariant[]);
    }

    return results;
  }

  /**
   * Create order in Printful
   */
  async createOrder(order: Partial<PODOrder>): Promise<PODOrder> {
    const printfulData = {
      external_id: order.externalId,
      shipping: order.shipping,
      items: order.items?.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    };

    const response = await this.makeRequest<any>('/orders', 'POST', printfulData);

    return {
      id: response.id.toString(),
      externalId: response.external_id,
      status: response.status,
      items: response.items || [],
      shipping: response.shipping,
      totalPrice: parseFloat(response.costs?.total || '0'),
      currency: response.costs?.currency || 'USD',
      provider: 'printful',
      createdAt: new Date(response.created),
      updatedAt: new Date(response.updated),
    };
  }

  /**
   * Get order from Printful
   */
  async getOrder(id: string): Promise<PODOrder> {
    const response = await this.makeRequest<any>(`/orders/${id}`);

    return {
      id: response.id.toString(),
      externalId: response.external_id,
      status: response.status,
      items: response.items || [],
      shipping: response.shipping,
      totalPrice: parseFloat(response.costs?.total || '0'),
      currency: response.costs?.currency || 'USD',
      provider: 'printful',
      createdAt: new Date(response.created),
      updatedAt: new Date(response.updated),
    };
  }

  /**
   * Get orders from Printful
   */
  async getOrders(limit = 20, offset = 0): Promise<PODOrder[]> {
    const response = await this.makeRequest<any>(`/orders?limit=${limit}&offset=${offset}`);
    return response.map((order: any) => ({
      id: order.id.toString(),
      externalId: order.external_id,
      status: order.status,
      items: order.items || [],
      shipping: order.shipping,
      totalPrice: parseFloat(order.costs?.total || '0'),
      currency: order.costs?.currency || 'USD',
      provider: 'printful',
      createdAt: new Date(order.created),
      updatedAt: new Date(order.updated),
    }));
  }

  /**
   * Get variant pricing
   */
  async getVariantPricing(variantId: string): Promise<{ price: number; currency: string }> {
    try {
      const response = await this.makeRequest<any>(`/store/variants/${variantId}`);
      return {
        price: parseFloat(response.price || '0'),
        currency: response.currency || 'USD',
      };
    } catch (error) {
      return { price: 0, currency: 'USD' };
    }
  }

  /**
   * Check if rate limited
   */
  isRateLimited(): boolean {
    return this.rateLimitCounter <= 0 && new Date() < this.rateLimitResetTime;
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
 * Custom PODProviderError class for Printful-specific errors
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