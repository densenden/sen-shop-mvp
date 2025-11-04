/**
 * Product Comparison Modal
 * Allows side-by-side comparison of products across different POD providers
 */

import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Tooltip,
} from "@medusajs/ui";
import {
  X,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";

interface PODProduct {
  id: string;
  name: string;
  description?: string;
  provider: string;
  thumbnail_url?: string;
  variant_count: number;
  base_cost?: number;
  retail_price?: number;
  variants: Array<{
    id: string;
    name: string;
    cost: number;
    retail_price?: number;
    available: boolean;
  }>;
  features?: {
    customizable: boolean;
    has_mockups: boolean;
    has_templates: boolean;
    fulfillment_time?: string;
    quality_rating?: number;
  };
}

interface ProductComparisonModalProps {
  productIds: string[];
  onClose: () => void;
  version: 'v1' | 'v2';
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  productIds,
  onClose,
  version,
}) => {
  const [products, setProducts] = useState<PODProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'variants' | 'provider'>('price');

  useEffect(() => {
    fetchProductsForComparison();
  }, [productIds]);

  const fetchProductsForComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/admin/pod-products/compare?${productIds.map(id => `ids=${id}`).join('&')}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch product comparison data');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = React.useMemo(() => {
    const sorted = [...products];

    switch (sortBy) {
      case 'price':
        return sorted.sort((a, b) => {
          const priceA = a.retail_price || a.base_cost || 0;
          const priceB = b.retail_price || b.base_cost || 0;
          return priceA - priceB;
        });
      case 'variants':
        return sorted.sort((a, b) => b.variant_count - a.variant_count);
      case 'provider':
        return sorted.sort((a, b) => a.provider.localeCompare(b.provider));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const getProviderBadgeColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'printful':
        return 'blue';
      case 'printify':
        return 'green';
      case 'gelato':
        return 'purple';
      default:
        return 'grey';
    }
  };

  const getBestValue = () => {
    if (products.length === 0) return null;

    return products.reduce((best, current) => {
      const currentPrice = current.retail_price || current.base_cost || Infinity;
      const bestPrice = best.retail_price || best.base_cost || Infinity;
      return currentPrice < bestPrice ? current : best;
    });
  };

  const bestValue = getBestValue();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-ui-bg-base rounded-lg p-8 max-w-6xl w-full mx-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ui-fg-interactive"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-ui-bg-base rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ui-border-base">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-ui-fg-subtle" />
            <Heading level="h2">Product Comparison</Heading>
            <Badge color="blue" size="small">
              {products.length} products
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-ui-fg-subtle">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-ui-border-base rounded px-2 py-1 bg-ui-bg-base dark:bg-ui-bg-subtle"
              >
                <option value="price">Price</option>
                <option value="variants">Variants</option>
                <option value="provider">Provider</option>
              </select>
            </div>
            <Button variant="secondary" size="small" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-ui-fg-disabled mb-4" />
              <p className="text-ui-fg-subtle">No products to compare</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`rounded-lg border p-6 space-y-4 ${
                    bestValue?.id === product.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                      : 'border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-subtle'
                  }`}
                >
                  {/* Best Value Badge */}
                  {bestValue?.id === product.id && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge color="green" size="small">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Best Value
                      </Badge>
                    </div>
                  )}

                  {/* Product Image */}
                  {product.thumbnail_url && (
                    <div className="w-full h-48 bg-ui-bg-subtle rounded-lg overflow-hidden">
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Provider Badge */}
                  <div className="flex items-center justify-between">
                    <Badge color={getProviderBadgeColor(product.provider)}>
                      {product.provider}
                    </Badge>
                  </div>

                  {/* Product Name */}
                  <div>
                    <h3 className="font-semibold text-ui-fg-base">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-ui-fg-subtle mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 pt-4 border-t border-ui-border-base">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ui-fg-subtle">Base Cost</span>
                      <span className="font-semibold">
                        ${(product.base_cost || 0).toFixed(2)}
                      </span>
                    </div>
                    {product.retail_price && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ui-fg-subtle">Retail Price</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${product.retail_price.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {product.base_cost && product.retail_price && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ui-fg-subtle">Profit Margin</span>
                        <span className="font-semibold">
                          {(((product.retail_price - product.base_cost) / product.base_cost) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Variants */}
                  <div className="flex items-center justify-between pt-2 border-t border-ui-border-base">
                    <span className="text-sm text-ui-fg-subtle">Variants</span>
                    <Badge size="small">{product.variant_count} options</Badge>
                  </div>

                  {/* Features */}
                  {product.features && (
                    <div className="space-y-2 pt-2 border-t border-ui-border-base">
                      <div className="flex items-center gap-2">
                        {product.features.customizable ? (
                          <Tooltip content="Customizable">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </Tooltip>
                        ) : (
                          <Tooltip content="Not customizable">
                            <XCircle className="w-4 h-4 text-ui-fg-disabled" />
                          </Tooltip>
                        )}
                        <span className="text-xs text-ui-fg-subtle">Customizable</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {product.features.has_mockups ? (
                          <Tooltip content="Has mockups">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          </Tooltip>
                        ) : (
                          <Tooltip content="No mockups">
                            <XCircle className="w-4 h-4 text-ui-fg-disabled" />
                          </Tooltip>
                        )}
                        <span className="text-xs text-ui-fg-subtle">Mockups</span>
                      </div>

                      {product.features.fulfillment_time && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ui-fg-subtle">
                            Ships in {product.features.fulfillment_time}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ui-border-base bg-ui-bg-subtle dark:bg-ui-bg-base">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ui-fg-subtle">
              Comparing {products.length} product{products.length !== 1 ? 's' : ''} across{' '}
              {new Set(products.map(p => p.provider)).size} provider{new Set(products.map(p => p.provider)).size !== 1 ? 's' : ''}
            </div>
            <Button variant="primary" onClick={onClose}>
              Close Comparison
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
