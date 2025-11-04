"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Filter,
  ChevronRight,
  Package,
  Shirt,
  Home,
  Coffee,
  Eye,
  Zap,
  BarChart3,
  Check,
  Star
} from "lucide-react";
import { Template } from "../pages/api/studio/templates";

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  mode?: "selection" | "preview";
  selectedCategory?: string;
  onBulkApply?: (templateIds: string[]) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  apparel: <Shirt className="w-5 h-5" />,
  accessories: <Package className="w-5 h-5" />,
  home: <Home className="w-5 h-5" />,
  stationery: <Coffee className="w-5 h-5" />,
};

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  mode = "selection",
  selectedCategory,
  onBulkApply,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(selectedCategory || "all");
  const [sortBy, setSortBy] = useState<"name" | "usage" | "recent">("usage");

  // Bulk selection (for bulk apply mode)
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Preview state
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Fetch templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  // Filter and search templates
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter(template => template.category === activeCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.product_type.toLowerCase().includes(search)
      );
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "usage":
          return (b.usage_count || 0) - (a.usage_count || 0);
        case "recent":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, activeCategory, sortBy]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/studio/templates");
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.templates.map((t: Template) => t.category))
        );
        setCategories(uniqueCategories);
      } else {
        setError(data.error || "Failed to fetch templates");
      }
    } catch (err: any) {
      console.error("Failed to fetch templates:", err);
      setError("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    if (mode === "preview") {
      setPreviewTemplate(template);
    } else {
      onSelectTemplate(template.template_id);
    }
  };

  const handleBulkSelect = (templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const handleBulkApply = () => {
    if (onBulkApply && selectedTemplates.size > 0) {
      onBulkApply(Array.from(selectedTemplates));
      setSelectedTemplates(new Set());
      setShowBulkActions(false);
    }
  };

  const calculatePricePreview = (template: Template) => {
    if (!template.pricing_formula || !template.metadata?.base_cost) return null;

    try {
      const baseCost = template.metadata.base_cost;
      const formula = template.pricing_formula
        .replace(/base_price/g, baseCost.toString())
        .replace(/\*/g, '*')
        .replace(/\+/g, '+')
        .replace(/-/g, '-');

      if (!/^[\d\s+\-*/.()]+$/.test(formula)) return null;

      const result = eval(formula);
      return typeof result === 'number' ? result : null;
    } catch {
      return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "preview" ? "Template Preview" : "Choose a Template"}
            </h2>
            <p className="mt-1 text-gray-600">
              {mode === "preview"
                ? "Browse and preview available templates"
                : "Select a template to start designing your product"
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            {mode === "selection" && onBulkApply && (
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showBulkActions
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Zap className="w-4 h-4 mr-2 inline" />
                Bulk Apply
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && selectedTemplates.size > 0 && (
          <div className="bg-blue-50 border-b px-6 py-3 flex justify-between items-center">
            <span className="text-blue-800 font-medium">
              {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTemplates(new Set())}
                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear Selection
              </button>
              <button
                onClick={handleBulkApply}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Apply to Products
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  activeCategory === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeCategory === category
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {categoryIcons[category]}
                  <span className="capitalize">{category}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="usage">Most Popular</option>
              <option value="recent">Recently Updated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[60vh]">
          {/* Templates List */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading templates...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchTemplates}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500">
                  {searchTerm || activeCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "No templates available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                  const pricePreview = calculatePricePreview(template);
                  const isSelected = selectedTemplates.has(template.id);

                  return (
                    <div
                      key={template.id}
                      className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : previewTemplate?.id === template.id
                          ? "border-blue-300"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {/* Template Image */}
                      <div className="aspect-square relative bg-gray-100">
                        <img
                          src={template.preview_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Overlays */}
                        <div className="absolute top-2 left-2 flex gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            template.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {template.is_active ? "Active" : "Inactive"}
                          </span>

                          {(template.usage_count || 0) > 50 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Popular
                            </span>
                          )}
                        </div>

                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-white bg-opacity-90 rounded text-xs font-medium capitalize">
                            {template.category}
                          </span>
                        </div>

                        {/* Selection Checkbox */}
                        {showBulkActions && (
                          <div className="absolute bottom-2 left-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleBulkSelect(template.id);
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </label>
                          </div>
                        )}

                        {/* Action Icon */}
                        <div className="absolute bottom-2 right-2">
                          {mode === "preview" ? (
                            <Eye className="w-5 h-5 text-white bg-black bg-opacity-50 rounded p-1" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-white bg-black bg-opacity-50 rounded p-1" />
                          )}
                        </div>
                      </div>

                      {/* Template Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                          {template.name}
                        </h3>

                        <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                          {template.description || template.product_type}
                        </p>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 capitalize">
                            {template.product_type.replace('-', ' ')}
                          </span>

                          <div className="flex items-center gap-2">
                            {(template.usage_count || 0) > 0 && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <BarChart3 className="w-3 h-3" />
                                {template.usage_count}
                              </span>
                            )}

                            {pricePreview && (
                              <span className="font-semibold text-green-600">
                                ${pricePreview.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {mode === "preview" && previewTemplate && (
            <div className="w-80 border-l bg-gray-50 overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Template Details
                </h3>

                {/* Template Image */}
                <div className="aspect-square bg-white rounded-lg overflow-hidden mb-4">
                  <img
                    src={previewTemplate.preview_url}
                    alt={previewTemplate.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Template Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{previewTemplate.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{previewTemplate.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <p className="font-medium capitalize">{previewTemplate.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Product Type:</span>
                      <p className="font-medium capitalize">{previewTemplate.product_type.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Usage Count:</span>
                      <p className="font-medium">{previewTemplate.usage_count || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className={`font-medium ${previewTemplate.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                        {previewTemplate.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing */}
                  {previewTemplate.pricing_formula && (
                    <div className="bg-white p-3 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Pricing Formula</h5>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                        {previewTemplate.pricing_formula}
                      </code>
                      {calculatePricePreview(previewTemplate) && (
                        <p className="text-sm text-green-600 mt-2">
                          Estimated Price: ${calculatePricePreview(previewTemplate)!.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Variant Configurations */}
                  {previewTemplate.variant_configurations && (
                    <div className="bg-white p-3 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Available Variants</h5>
                      <div className="space-y-2">
                        {Object.entries(previewTemplate.variant_configurations).map(([type, options]) => (
                          <div key={type} className="text-sm">
                            <span className="text-gray-500 capitalize">{type}:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(options as string[]).map((option) => (
                                <span key={option} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Use Template Button */}
                {mode === "preview" && (
                  <button
                    onClick={() => onSelectTemplate(previewTemplate.template_id)}
                    className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Use This Template
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};