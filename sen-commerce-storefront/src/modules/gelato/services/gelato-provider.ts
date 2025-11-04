/**
 * Gelato Provider Implementation
 * Implements PODProvider interface for Gelato API integration
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

export class GelatoProvider implements PODProvider {
  readonly providerType: PODProviderType = 'gelato';

  readonly capabilities: PODProviderCapabilities = {
    supportsTemplates: true,
    supportsBulkOperations: true,
    supportsVariantMapping: true,
    supportsPriceUpdates: true,
    supportsInventorySync: true,
    maxBulkOperationSize: 200,
    rateLimitPerMinute: 100,
  };

  private baseUrl = 'https://order.gelatoapis.com/v4';
  private apiKey: string;
  private rateLimitCounter = 100;
  private rateLimitResetTime = new Date(Date.now() + 60000);

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated request to Gelato API
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
        'X-API-KEY': this.apiKey,
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
   * Update rate limit tracking
   */
  private updateRateLimitTracking(response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining) {
      this.rateLimitCounter = parseInt(remaining, 10);
    }

    if (reset) {
      this.rateLimitResetTime = new Date(parseInt(reset, 10) * 1000);
    } else {
      // Fallback: decrement counter
      this.rateLimitCounter--;
      if (Date.now() >= this.rateLimitResetTime.getTime()) {
        this.rateLimitCounter = this.capabilities.rateLimitPerMinute;
        this.rateLimitResetTime = new Date(Date.now() + 60000);
      }
    }
  }

  /**
   * Convert Gelato product data to PODProduct format
   */
  private convertGelatoProduct(gelatoProduct: any): PODProduct {
    return {
      id: gelatoProduct.id || gelatoProduct.uid,
      externalId: gelatoProduct.externalId || gelatoProduct.referenceId,
      name: gelatoProduct.title || gelatoProduct.name,
      description: gelatoProduct.description,
      status: this.mapGelatoStatus(gelatoProduct.status),
      variants: gelatoProduct.variants?.map((v: any) => this.convertGelatoVariant(v, gelatoProduct.id)) || [],
      provider: 'gelato',
      metadata: {
        gelatoData: gelatoProduct,
        productType: gelatoProduct.productType,
        productionTime: gelatoProduct.productionTime,
      },
      createdAt: new Date(gelatoProduct.createdAt || Date.now()),
      updatedAt: new Date(gelatoProduct.updatedAt || Date.now()),
    };
  }

  /**
   * Convert Gelato variant data to PODVariant format
   */
  private convertGelatoVariant(gelatoVariant: any, productId: string): PODVariant {
    return {
      id: gelatoVariant.id || gelatoVariant.sku,
      externalId: gelatoVariant.sku,
      productId: productId,
      name: gelatoVariant.title || `${gelatoVariant.color} ${gelatoVariant.size}`,
      size: gelatoVariant.size,
      color: gelatoVariant.color,
      price: parseFloat(gelatoVariant.price?.amount || '0'),
      currency: gelatoVariant.price?.currency || 'USD',
      availability: gelatoVariant.available !== false,
      mockupUrl: gelatoVariant.previewUrl || gelatoVariant.mockupUrl,
      metadata: {
        gelatoData: gelatoVariant,
        sku: gelatoVariant.sku,
        weight: gelatoVariant.weight,
      },
    };
  }

  /**
   * Map Gelato status to common status
   */
  private mapGelatoStatus(gelatoStatus: string): 'draft' | 'published' | 'archived' | 'out_of_stock' {
    switch (gelatoStatus?.toLowerCase()) {
      case 'active':
      case 'published':
        return 'published';
      case 'draft':
        return 'draft';
      case 'archived':
      case 'inactive':
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
      // Gelato health check endpoint (use available products endpoint as health check)
      await this.makeRequest('/products?limit=1');
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
   * Get products from Gelato
   */
  async getProducts(limit = 20, offset = 0): Promise<PODProduct[]> {
    try {
      const response = await this.makeRequest<any>(`/products?limit=${limit}&offset=${offset}`);
      return response.products?.map((product: any) => this.convertGelatoProduct(product)) || [];
    } catch (error) {
      console.error('Error fetching Gelato products:', error);
      return [];
    }
  }

  /**
   * Get single product from Gelato
   */
  async getProduct(id: string): Promise<PODProduct> {
    const response = await this.makeRequest<any>(`/products/${id}`);
    return this.convertGelatoProduct(response);
  }

  /**
   * Create product in Gelato
   */
  async createProduct(product: Partial<PODProduct>): Promise<PODProduct> {
    const gelatoData = {
      title: product.name,
      description: product.description,
      referenceId: product.externalId,
      productType: product.metadata?.productType || 'print',
      // Add other Gelato-specific fields
    };

    const response = await this.makeRequest<any>('/products', 'POST', gelatoData);
    return this.convertGelatoProduct(response);
  }

  /**
   * Update product in Gelato
   */
  async updateProduct(id: string, updates: Partial<PODProduct>): Promise<PODProduct> {
    const gelatoData = {
      title: updates.name,
      description: updates.description,
      // Map other updates to Gelato format
    };

    const response = await this.makeRequest<any>(`/products/${id}`, 'PUT', gelatoData);
    return this.convertGelatoProduct(response);
  }

  /**
   * Delete product from Gelato
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.makeRequest(`/products/${id}`, 'DELETE');
      return true;
    } catch (error) {
      console.error('Error deleting Gelato product:', error);
      return false;
    }
  }

  /**
   * Get variants for a product
   */
  async getVariants(productId: string): Promise<PODVariant[]> {
    try {
      const response = await this.makeRequest<any>(`/products/${productId}/variants`);
      return response.variants?.map((variant: any) => this.convertGelatoVariant(variant, productId)) || [];
    } catch (error) {
      // Fallback: get product and return its variants
      const product = await this.getProduct(productId);
      return product.variants;
    }
  }

  /**
   * Update variant in Gelato
   */
  async updateVariant(variantId: string, updates: Partial<PODVariant>): Promise<PODVariant> {
    const gelatoData = {
      price: updates.price ? { amount: updates.price, currency: updates.currency || 'USD' } : undefined,
      available: updates.availability,
    };

    const response = await this.makeRequest<any>(`/variants/${variantId}`, 'PUT', gelatoData);
    return this.convertGelatoVariant(response, response.productId);
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(updates: Array<{ id: string; updates: Partial<PODProduct> }>): Promise<PODProduct[]> {
    const results: PODProduct[] = [];

    // Gelato supports bulk operations - batch them
    const batchSize = Math.min(updates.length, this.capabilities.maxBulkOperationSize);

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      try {
        // Create bulk update request
        const bulkData = {
          updates: batch.map(update => ({
            id: update.id,
            data: {
              title: update.updates.name,
              description: update.updates.description,
            },
          })),
        };

        const response = await this.makeRequest<any>('/products/bulk-update', 'POST', bulkData);
        const batchResults = response.results?.map((result: any) => this.convertGelatoProduct(result)) || [];
        results.push(...batchResults);
      } catch (error) {
        console.error('Error in Gelato bulk update:', error);

        // Fallback to individual updates
        for (const update of batch) {
          try {
            const result = await this.updateProduct(update.id, update.updates);
            results.push(result);
          } catch (individualError) {
            console.error(`Error updating Gelato product ${update.id}:`, individualError);
          }
        }
      }
    }

    return results;
  }

  /**
   * Bulk update variants
   */
  async bulkUpdateVariants(updates: Array<{ id: string; updates: Partial<PODVariant> }>): Promise<PODVariant[]> {
    const results: PODVariant[] = [];

    // Process in batches
    const batchSize = Math.min(updates.length, this.capabilities.maxBulkOperationSize);

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      try {
        const bulkData = {
          updates: batch.map(update => ({
            id: update.id,
            data: {
              price: update.updates.price ? { amount: update.updates.price, currency: update.updates.currency || 'USD' } : undefined,
              available: update.updates.availability,
            },
          })),
        };

        const response = await this.makeRequest<any>('/variants/bulk-update', 'POST', bulkData);
        const batchResults = response.results?.map((result: any) => this.convertGelatoVariant(result, result.productId)) || [];
        results.push(...batchResults);
      } catch (error) {
        console.error('Error in Gelato bulk variant update:', error);

        // Fallback to individual updates
        for (const update of batch) {
          try {
            const result = await this.updateVariant(update.id, update.updates);
            results.push(result);
          } catch (individualError) {
            console.error(`Error updating Gelato variant ${update.id}:`, individualError);
          }
        }
      }
    }

    return results;
  }

  /**
   * Create order in Gelato
   */
  async createOrder(order: Partial<PODOrder>): Promise<PODOrder> {
    const gelatoData = {
      referenceId: order.externalId,
      shipTo: {
        firstName: order.shipping?.name?.split(' ')[0] || '',
        lastName: order.shipping?.name?.split(' ').slice(1).join(' ') || '',
        email: order.shipping?.email,
        phone: order.shipping?.phone,
        country: order.shipping?.country,
        state: order.shipping?.state,
        city: order.shipping?.city,
        address1: order.shipping?.address1,
        address2: order.shipping?.address2,
        zip: order.shipping?.zip,
      },
      items: order.items?.map(item => ({
        variantSku: item.variantId,
        quantity: item.quantity,
      })),
    };

    const response = await this.makeRequest<any>('/orders', 'POST', gelatoData);

    return {
      id: response.id,
      externalId: response.referenceId,
      status: response.status,
      items: order.items || [],
      shipping: order.shipping!,
      totalPrice: parseFloat(response.total?.amount || '0'),
      currency: response.total?.currency || 'USD',
      provider: 'gelato',
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  }

  /**
   * Get order from Gelato
   */
  async getOrder(id: string): Promise<PODOrder> {
    const response = await this.makeRequest<any>(`/orders/${id}`);

    return {
      id: response.id,
      externalId: response.referenceId,
      status: response.status,
      items: response.items?.map((item: any) => ({
        id: item.id,
        variantId: item.variantSku,
        quantity: item.quantity,
        price: parseFloat(item.price?.amount || '0'),
      })) || [],
      shipping: {
        name: `${response.shipTo?.firstName || ''} ${response.shipTo?.lastName || ''}`.trim(),
        address1: response.shipTo?.address1 || '',
        address2: response.shipTo?.address2,
        city: response.shipTo?.city || '',
        state: response.shipTo?.state,
        zip: response.shipTo?.zip || '',
        country: response.shipTo?.country || '',
        phone: response.shipTo?.phone,
        email: response.shipTo?.email,
      },
      totalPrice: parseFloat(response.total?.amount || '0'),
      currency: response.total?.currency || 'USD',
      provider: 'gelato',
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  }

  /**
   * Get orders from Gelato
   */
  async getOrders(limit = 20, offset = 0): Promise<PODOrder[]> {
    const response = await this.makeRequest<any>(`/orders?limit=${limit}&offset=${offset}`);

    return response.orders?.map((order: any) => ({
      id: order.id,
      externalId: order.referenceId,
      status: order.status,
      items: order.items?.map((item: any) => ({
        id: item.id,
        variantId: item.variantSku,
        quantity: item.quantity,
        price: parseFloat(item.price?.amount || '0'),
      })) || [],
      shipping: {
        name: `${order.shipTo?.firstName || ''} ${order.shipTo?.lastName || ''}`.trim(),
        address1: order.shipTo?.address1 || '',
        address2: order.shipTo?.address2,
        city: order.shipTo?.city || '',
        state: order.shipTo?.state,
        zip: order.shipTo?.zip || '',
        country: order.shipTo?.country || '',
        phone: order.shipTo?.phone,
        email: order.shipTo?.email,
      },
      totalPrice: parseFloat(order.total?.amount || '0'),
      currency: order.total?.currency || 'USD',
      provider: 'gelato',
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt),
    })) || [];
  }

  /**
   * Get variant pricing
   */
  async getVariantPricing(variantId: string): Promise<{ price: number; currency: string }> {
    try {
      const response = await this.makeRequest<any>(`/variants/${variantId}`);
      return {
        price: parseFloat(response.price?.amount || '0'),
        currency: response.price?.currency || 'USD',
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
 * Custom PODProviderError class for Gelato-specific errors
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