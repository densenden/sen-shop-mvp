/**
 * Enhanced Studio Dashboard with Bulk Operations
 * Integrates the new bulk operations system with the existing studio dashboard
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Package,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  BarChart,
  Settings,
  Palette,
  ShoppingCart,
  CheckSquare,
  Filter,
  Search
} from "lucide-react";
import { PODProduct, ProductStatus } from '../../common/types/pod-provider';
import { BulkOperationsProvider } from '../hooks/useBulkOperations';
import { ProductGrid } from './ProductGrid';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';

interface EnhancedStudioDashboardProps {
  artistId: string;
  artistName?: string;
}

export const EnhancedStudioDashboard: React.FC<EnhancedStudioDashboardProps> = ({
  artistId,
  artistName = "Artist",
}) => {
  const [activeTab, setActiveTab] = useState<"products" | "designs" | "analytics">("products");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [selectionMode, setSelectionMode] = useState(false);

  // Mock POD products data - replace with actual API calls
  const [products] = useState<PODProduct[]>([
    {
      id: "product-1",
      externalId: "ext-1",
      name: "Custom T-Shirt Design",
      description: "Artistic t-shirt with unique design",
      status: "published",
      variants: [
        {
          id: "variant-1",
          externalId: "ext-variant-1",
          productId: "product-1",
          name: "Large Red",
          size: "L",
          color: "Red",
          price: 25.99,
          currency: "USD",
          availability: true,
          mockupUrl: "/api/placeholder/300/300",
        },
      ],
      provider: "printful",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
    },
    {
      id: "product-2",
      externalId: "ext-2",
      name: "Artistic Hoodie",
      description: "Comfortable hoodie with artistic print",
      status: "draft",
      variants: [
        {
          id: "variant-2",
          externalId: "ext-variant-2",
          productId: "product-2",
          name: "Medium Blue",
          size: "M",
          color: "Blue",
          price: 45.99,
          currency: "USD",
          availability: true,
          mockupUrl: "/api/placeholder/300/300",
        },
      ],
      provider: "printify",
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-22"),
    },
    {
      id: "product-3",
      externalId: "ext-3",
      name: "Custom Poster Print",
      description: "High-quality poster print",
      status: "published",
      variants: [
        {
          id: "variant-3",
          externalId: "ext-variant-3",
          productId: "product-3",
          name: "A3 Glossy",
          price: 15.99,
          currency: "USD",
          availability: true,
          mockupUrl: "/api/placeholder/300/300",
        },
      ],
      provider: "gelato",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-25"),
    },
  ]);

  // Calculate statistics
  const totalRevenue = products.reduce((sum, p) => {
    const sales = Math.floor(Math.random() * 100); // Mock sales data
    return sum + (sales * (p.variants[0]?.price || 0));
  }, 0);

  const totalProfit = totalRevenue * 0.4; // Mock 40% profit margin
  const totalSales = Math.floor(totalRevenue / 25); // Mock sales count
  const activeProducts = products.filter(p => p.status === "published").length;

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowTemplateModal(false);
    setShowStudioModal(true);
  };

  const handleStudioComplete = (designData: any) => {
    console.log("Design completed:", designData);
    // Refresh products list
    window.location.reload();
  };

  const handleProductEdit = (product: PODProduct) => {
    console.log("Edit product:", product.id);
    // Implement edit functionality
  };

  const handleProductView = (product: PODProduct) => {
    console.log("View product:", product.id);
    // Implement view functionality
  };

  const handleProductSettings = (product: PODProduct) => {
    console.log("Product settings:", product.id);
    // Implement settings functionality
  };

  return (
    <BulkOperationsProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Enhanced Studio Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {artistName}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectionMode(!selectionMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    selectionMode
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <CheckSquare className="w-5 h-5" />
                  {selectionMode ? 'Exit Selection' : 'Bulk Select'}
                </button>

                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create New Product
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalRevenue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Profit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${totalProfit.toFixed(2)}
                  </p>
                </div>
                <BarChart className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalSales}
                  </p>
                </div>
                <ShoppingCart className="w-10 h-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeProducts}
                  </p>
                </div>
                <Package className="w-10 h-10 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab("products")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "products"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Products ({filteredProducts.length})
                </div>
              </button>

              <button
                onClick={() => setActiveTab("designs")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "designs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Designs
                </div>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "analytics"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Analytics
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as ProductStatus | "all")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <ProductGrid
                products={filteredProducts}
                onProductEdit={handleProductEdit}
                onProductView={handleProductView}
                onProductSettings={handleProductSettings}
                selectionMode={selectionMode}
              />
            </div>
          )}

          {activeTab === "designs" && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Your saved designs will appear here</p>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500">Analytics and insights coming soon</p>
            </div>
          )}
        </div>

        {/* Bulk Operations Toolbar */}
        <BulkOperationsToolbar
          totalItems={filteredProducts.length}
          onCancel={() => setSelectionMode(false)}
        />

        {/* Modals */}
        {/* Note: These would need to be imported from the existing components */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Select Template</h3>
              <p className="text-gray-600 mb-4">Choose a template to start designing your product.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleTemplateSelect("template-1")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  T-Shirt Template
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showStudioModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Studio Interface</h3>
              <p className="text-gray-600 mb-4">Design your product using template: {selectedTemplateId}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStudioComplete({ templateId: selectedTemplateId })}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Complete Design
                </button>
                <button
                  onClick={() => {
                    setShowStudioModal(false);
                    setSelectedTemplateId(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BulkOperationsProvider>
  );
};