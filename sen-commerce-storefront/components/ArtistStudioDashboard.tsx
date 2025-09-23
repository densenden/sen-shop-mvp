"use client";

import React, { useState } from "react";
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
  ShoppingCart
} from "lucide-react";
import { StudioModal } from "./PrintfulStudioEmbed";
import { TemplateModal } from "./StudioTemplateSelector";

interface StudioProduct {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  mockupUrl: string;
  basePrice: number;
  retailPrice: number;
  profit: number;
  sales: number;
  views: number;
  createdAt: string;
}

interface ArtistStudioDashboardProps {
  artistId: string;
  artistName?: string;
}

export const ArtistStudioDashboard: React.FC<ArtistStudioDashboardProps> = ({
  artistId,
  artistName = "Artist",
}) => {
  const [activeTab, setActiveTab] = useState<"products" | "designs" | "analytics">("products");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // Mock data - replace with actual API calls
  const [products] = useState<StudioProduct[]>([
    {
      id: "1",
      name: "Custom T-Shirt Design",
      status: "published",
      mockupUrl: "/api/placeholder/300/300",
      basePrice: 15.00,
      retailPrice: 25.00,
      profit: 10.00,
      sales: 45,
      views: 520,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Artistic Hoodie",
      status: "draft",
      mockupUrl: "/api/placeholder/300/300",
      basePrice: 28.00,
      retailPrice: 45.00,
      profit: 17.00,
      sales: 0,
      views: 0,
      createdAt: "2024-01-20",
    },
  ]);

  const totalRevenue = products.reduce((sum, p) => sum + (p.sales * p.retailPrice), 0);
  const totalProfit = products.reduce((sum, p) => sum + (p.sales * p.profit), 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Studio Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {artistName}
              </p>
            </div>
            
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
                  {products.filter(p => p.status === "published").length}
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
                Products
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
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Product Image */}
                  <div className="aspect-square relative bg-gray-100">
                    <img
                      src={product.mockupUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
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
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>

                    {/* Pricing */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Base Cost:</span>
                        <span className="font-medium">${product.basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Retail Price:</span>
                        <span className="font-medium">${product.retailPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Your Profit:</span>
                        <span className="font-medium text-green-600">
                          ${product.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{product.sales} sales</span>
                      <span>{product.views} views</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                        <Eye className="w-4 h-4 mx-auto" />
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                        <Edit className="w-4 h-4 mx-auto" />
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                        <Settings className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Product Card */}
              <button
                onClick={() => setShowTemplateModal(true)}
                className="bg-white rounded-lg shadow-sm overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors group"
              >
                <div className="aspect-square relative bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                    <p className="text-gray-600 font-medium">Create New Product</p>
                    <p className="text-sm text-gray-500 mt-1">Start designing</p>
                  </div>
                </div>
              </button>
            </div>
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

      {/* Modals */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      <StudioModal
        isOpen={showStudioModal}
        artistId={artistId}
        templateId={selectedTemplateId || undefined}
        onClose={() => {
          setShowStudioModal(false);
          setSelectedTemplateId(null);
        }}
        onComplete={handleStudioComplete}
      />
    </div>
  );
};