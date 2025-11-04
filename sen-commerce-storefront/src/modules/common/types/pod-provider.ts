/**
 * Common POD Provider Types and Interfaces
 * Provides unified interface for Print-on-Demand providers (Printful, Printify, Gelato)
 */

export type PODProviderType = 'printful' | 'printify' | 'gelato';

export type PODProviderStatus = 'active' | 'inactive' | 'error' | 'rate_limited';

export type ProductStatus = 'draft' | 'published' | 'archived' | 'out_of_stock';

export interface PODProduct {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  status: ProductStatus;
  variants: PODVariant[];
  provider: PODProviderType;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PODVariant {
  id: string;
  externalId: string;
  productId: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  currency: string;
  availability: boolean;
  mockupUrl?: string;
  metadata?: Record<string, any>;
}

export interface PODOrder {
  id: string;
  externalId: string;
  status: string;
  items: PODOrderItem[];
  shipping: PODShipping;
  totalPrice: number;
  currency: string;
  provider: PODProviderType;
  createdAt: Date;
  updatedAt: Date;
}

export interface PODOrderItem {
  id: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface PODShipping {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface PODProviderCapabilities {
  supportsTemplates: boolean;
  supportsBulkOperations: boolean;
  supportsVariantMapping: boolean;
  supportsPriceUpdates: boolean;
  supportsInventorySync: boolean;
  maxBulkOperationSize: number;
  rateLimitPerMinute: number;
}

export interface PODProviderHealthStatus {
  provider: PODProviderType;
  status: PODProviderStatus;
  lastChecked: Date;
  responseTime?: number;
  errorMessage?: string;
  capabilities: PODProviderCapabilities;
}

export interface PODPricingComparison {
  productId: string;
  variantId: string;
  providers: {
    [key in PODProviderType]?: {
      price: number;
      currency: string;
      available: boolean;
      features?: string[];
    };
  };
  bestValue?: PODProviderType;
  savings?: number;
}

export interface PODProviderError extends Error {
  provider: PODProviderType;
  code: string;
  retryable: boolean;
  rateLimited?: boolean;
  retryAfter?: number;
}

/**
 * Main POD Provider Interface
 * All POD providers must implement this interface
 */
export interface PODProvider {
  readonly providerType: PODProviderType;
  readonly capabilities: PODProviderCapabilities;

  // Health Check
  healthCheck(): Promise<PODProviderHealthStatus>;

  // Product Operations
  getProducts(limit?: number, offset?: number): Promise<PODProduct[]>;
  getProduct(id: string): Promise<PODProduct>;
  createProduct(product: Partial<PODProduct>): Promise<PODProduct>;
  updateProduct(id: string, updates: Partial<PODProduct>): Promise<PODProduct>;
  deleteProduct(id: string): Promise<boolean>;

  // Variant Operations
  getVariants(productId: string): Promise<PODVariant[]>;
  updateVariant(variantId: string, updates: Partial<PODVariant>): Promise<PODVariant>;

  // Bulk Operations
  bulkUpdateProducts(updates: Array<{ id: string; updates: Partial<PODProduct> }>): Promise<PODProduct[]>;
  bulkUpdateVariants(updates: Array<{ id: string; updates: Partial<PODVariant> }>): Promise<PODVariant[]>;

  // Order Operations
  createOrder(order: Partial<PODOrder>): Promise<PODOrder>;
  getOrder(id: string): Promise<PODOrder>;
  getOrders(limit?: number, offset?: number): Promise<PODOrder[]>;

  // Pricing and Comparison
  getVariantPricing(variantId: string): Promise<{ price: number; currency: string }>;

  // Rate Limiting
  isRateLimited(): boolean;
  getRateLimitStatus(): { remaining: number; resetTime: Date };
}