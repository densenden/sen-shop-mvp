"use client";

import React, { useState, useEffect } from "react";
import {
  Filter,
  Search,
  RefreshCw,
  Package,
  Eye,
  Settings,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  TrendingUp,
  ShoppingCart
} from "lucide-react";
import { podProviderManager } from "../../../modules/printful/services/pod-provider-facade";
import { PODProduct, PODProviderType, PODProviderHealthStatus } from "../../../modules/common/types/pod-provider";

interface UnifiedProduct extends PODProduct {
  providerBadge: {
    name: string;
    color: string;
    icon: string;
  };
}

interface SyncStatus {
  provider: PODProviderType;
  lastSync: Date;
  status: 'synced' | 'syncing' | 'error';
  nextSync?: Date;
}

interface ComparisonData {
  productId: string;
  productName: string;
  providers: {
    [key in PODProviderType]?: {
      price: number;
      available: boolean;
      features: string[];
    };
  };
  bestValue?: PODProviderType;
}

export default function PrintfulStudioPage() {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<PODProviderType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Provider health status
  const [providerHealth, setProviderHealth] = useState<PODProviderHealthStatus[]>([]);

  useEffect(() => {
    initializeDashboard();
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const initializeDashboard = async () => {
    setLoading(true);
    try {
      await loadProviderHealth();
      await loadProducts();
      await loadSyncStatuses();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderHealth = async () => {
    try {
      const health = await podProviderManager.checkAllProvidersHealth();
      setProviderHealth(health);
    } catch (error) {
      console.error('Error loading provider health:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await podProviderManager.getAllProducts();
      const unifiedProducts: UnifiedProduct[] = allProducts.map(product => ({
        ...product,
        providerBadge: getProviderBadge(product.provider)
      }));
      setProducts(unifiedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadSyncStatuses = async () => {
    // Mock sync statuses - in real implementation, this would come from your sync service
    const mockSyncStatuses: SyncStatus[] = [
      {
        provider: 'printful',
        lastSync: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        status: 'synced',
        nextSync: new Date(Date.now() + 1000 * 60 * 25) // 25 minutes from now
      },
      {
        provider: 'printify',
        lastSync: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        status: 'synced',
        nextSync: new Date(Date.now() + 1000 * 60 * 15) // 15 minutes from now
      },
      {
        provider: 'gelato',
        lastSync: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
        status: 'syncing',
      }
    ];
    setSyncStatuses(mockSyncStatuses);
  };

  const getProviderBadge = (provider: PODProviderType) => {
    const badges = {
      printful: { name: "Printful", color: "bg-red-100 text-red-800", icon: "🎨" },
      printify: { name: "Printify", color: "bg-green-100 text-green-800", icon: "🖨️" },
      gelato: { name: "Gelato", color: "bg-blue-100 text-blue-800", icon: "🍦" }
    };
    return badges[provider];
  };

  const refreshData = async () => {
    await loadProviderHealth();
    await loadProducts();
    await loadSyncStatuses();
  };

  const triggerManualSync = async (provider: PODProviderType) => {
    // Update sync status to show syncing
    setSyncStatuses(prev => prev.map(status =>
      status.provider === provider
        ? { ...status, status: 'syncing' as const }
        : status
    ));

    try {
      // In real implementation, trigger actual sync
      console.log(`Triggering manual sync for ${provider}`);

      // Simulate sync delay
      setTimeout(() => {
        setSyncStatuses(prev => prev.map(status =>
          status.provider === provider
            ? {
                ...status,
                status: 'synced' as const,
                lastSync: new Date(),
                nextSync: new Date(Date.now() + 1000 * 60 * 30)
              }
            : status
        ));
        loadProducts(); // Reload products after sync
      }, 3000);
    } catch (error) {
      console.error(`Error syncing ${provider}:`, error);
      setSyncStatuses(prev => prev.map(status =>
        status.provider === provider
          ? { ...status, status: 'error' as const }
          : status
      ));
    }
  };

  const buildComparisonView = async () => {
    setComparisonMode(true);
    try {
      // Group products by similar names for comparison
      const productGroups = new Map<string, UnifiedProduct[]>();

      products.forEach(product => {
        const baseKey = product.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!productGroups.has(baseKey)) {
          productGroups.set(baseKey, []);
        }
        productGroups.get(baseKey)!.push(product);
      });

      const comparisons: ComparisonData[] = [];
      productGroups.forEach((groupProducts, key) => {
        if (groupProducts.length > 1) {
          const comparison: ComparisonData = {
            productId: key,
            productName: groupProducts[0].name,
            providers: {}
          };

          let bestPrice = Infinity;
          let bestProvider: PODProviderType | undefined;

          groupProducts.forEach(product => {
            const avgPrice = product.variants.reduce((sum, variant) => sum + variant.price, 0) / product.variants.length;
            comparison.providers[product.provider] = {
              price: avgPrice,
              available: product.variants.some(v => v.availability),
              features: [] // Could extract from metadata
            };

            if (avgPrice < bestPrice) {
              bestPrice = avgPrice;
              bestProvider = product.provider;
            }
          });

          if (bestProvider) {
            comparison.bestValue = bestProvider;
          }

          comparisons.push(comparison);
        }
      });

      setComparisonData(comparisons);
    } catch (error) {
      console.error('Error building comparison view:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === "all" || product.provider === selectedProvider;
    const matchesStatus = selectedStatus === "all" || product.status === selectedStatus;

    return matchesSearch && matchesProvider && matchesStatus;
  });

  const handleBulkSelection = (productId: string, selected: boolean) => {
    const newSelection = new Set(selectedProducts);
    if (selected) {
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedProducts(newSelection);
  };

  const selectAllVisible = () => {
    const allVisibleIds = new Set(filteredProducts.map(p => p.id));
    setSelectedProducts(allVisibleIds);
  };

  const clearSelection = () => {
    setSelectedProducts(new Set());
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getSyncStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading unified dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                POD Studio Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Unified view across all print-on-demand providers
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="text-sm">Auto-refresh</span>
              </button>

              <button
                onClick={refreshData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Health Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {providerHealth.map((health) => (
            <div key={health.provider} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getProviderBadge(health.provider).icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 capitalize">{health.provider}</h3>
                    <p className="text-sm text-gray-500">
                      {health.responseTime ? `${health.responseTime}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  health.status === 'active' ? 'bg-green-100 text-green-800' :
                  health.status === 'rate_limited' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {health.status}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Last checked: {formatTimeAgo(health.lastChecked)}
              </div>

              {/* Sync Status */}
              {syncStatuses.find(s => s.provider === health.provider) && (
                <div className="border-t pt-4">
                  {(() => {
                    const syncStatus = syncStatuses.find(s => s.provider === health.provider)!;
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getSyncStatusIcon(syncStatus.status)}
                          <span className="text-sm text-gray-600">
                            {syncStatus.status === 'synced' && `Synced ${formatTimeAgo(syncStatus.lastSync)}`}
                            {syncStatus.status === 'syncing' && 'Syncing...'}
                            {syncStatus.status === 'error' && 'Sync failed'}
                          </span>
                        </div>

                        <button
                          onClick={() => triggerManualSync(health.provider)}
                          disabled={syncStatus.status === 'syncing'}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                        >
                          Sync Now
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products across all providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as PODProviderType | "all")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Providers</option>
                <option value="printful">Printful</option>
                <option value="printify">Printify</option>
                <option value="gelato">Gelato</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">All Categories</option>
                    <option value="apparel">Apparel</option>
                    <option value="accessories">Accessories</option>
                    <option value="home">Home & Living</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Any Price</option>
                    <option value="0-25">$0 - $25</option>
                    <option value="25-50">$25 - $50</option>
                    <option value="50+">$50+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">All Items</option>
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredProducts.length} products found
              </span>

              {selectedProducts.size > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-blue-600 font-medium">
                    {selectedProducts.size} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={selectAllVisible}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Select All Visible
              </button>

              <button
                onClick={buildComparisonView}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Compare Prices</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison View */}
      {comparisonMode && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Price Comparison</h3>
                <button
                  onClick={() => setComparisonMode(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              {comparisonData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comparable products found across providers
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Printful</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Printify</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Gelato</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-900">Best Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((comparison) => (
                        <tr key={comparison.productId} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {comparison.productName}
                          </td>
                          {(['printful', 'printify', 'gelato'] as PODProviderType[]).map((provider) => (
                            <td key={provider} className="text-center py-3 px-4">
                              {comparison.providers[provider] ? (
                                <div className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                                  comparison.bestValue === provider
                                    ? 'bg-green-100 text-green-800 font-medium'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  ${comparison.providers[provider]!.price.toFixed(2)}
                                  {comparison.bestValue === provider && (
                                    <TrendingUp className="w-3 h-3 ml-1" />
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          ))}
                          <td className="text-center py-3 px-4">
                            {comparison.bestValue && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                                {comparison.bestValue}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedProvider("all");
                setSelectedStatus("all");
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="aspect-square relative bg-gray-100">
                  {product.variants[0]?.mockupUrl ? (
                    <img
                      src={product.variants[0].mockupUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={(e) => handleBulkSelection(product.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  {/* Provider Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.providerBadge.color}`}>
                      <span className="mr-1">{product.providerBadge.icon}</span>
                      {product.providerBadge.name}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute bottom-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      product.status === "published"
                        ? "bg-green-100 text-green-800"
                        : product.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {product.status}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Variants Info */}
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="flex justify-between">
                      <span>Variants:</span>
                      <span className="font-medium">{product.variants.length}</span>
                    </div>
                    {product.variants.length > 0 && (
                      <div className="flex justify-between">
                        <span>Price range:</span>
                        <span className="font-medium">
                          ${Math.min(...product.variants.map(v => v.price)).toFixed(2)} -
                          ${Math.max(...product.variants.map(v => v.price)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                      <Eye className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                      <Settings className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                      <ShoppingCart className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}