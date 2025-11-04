"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Calculator,
  AlertCircle,
  Info,
  Check
} from "lucide-react";
import { Template } from "../pages/api/studio/templates";

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Template>) => void;
  title: string;
  initialData?: Template | null;
}

interface VariantConfig {
  type: string;
  options: string[];
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData = null,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "apparel",
    product_type: "",
    pricing_formula: "base_price * 1.5 + 5",
    is_active: true,
    preview_url: "",
    metadata: {
      base_cost: 15.00
    }
  });

  const [variantConfigs, setVariantConfigs] = useState<VariantConfig[]>([
    { type: "sizes", options: ["S", "M", "L", "XL"] },
    { type: "colors", options: ["black", "white", "gray"] }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pricingPreview, setPricingPreview] = useState<number | null>(null);

  // Categories and product types
  const categories = [
    { value: "apparel", label: "Apparel" },
    { value: "accessories", label: "Accessories" },
    { value: "home", label: "Home & Living" },
    { value: "stationery", label: "Stationery" }
  ];

  const productTypes = {
    apparel: ["t-shirt", "hoodie", "tank-top", "long-sleeve", "polo"],
    accessories: ["mug", "bag", "phone-case", "keychain", "sticker"],
    home: ["poster", "canvas", "pillow", "blanket", "wall-art"],
    stationery: ["notebook", "journal", "calendar", "planner", "card"]
  };

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        category: initialData.category,
        product_type: initialData.product_type,
        pricing_formula: initialData.pricing_formula || "base_price * 1.5 + 5",
        is_active: initialData.is_active,
        preview_url: initialData.preview_url,
        metadata: initialData.metadata || { base_cost: 15.00 }
      });

      if (initialData.variant_configurations) {
        const configs = Object.entries(initialData.variant_configurations).map(
          ([type, options]) => ({
            type,
            options: Array.isArray(options) ? options : []
          })
        );
        setVariantConfigs(configs);
      }
    } else {
      // Reset form for new template
      setFormData({
        name: "",
        description: "",
        category: "apparel",
        product_type: "",
        pricing_formula: "base_price * 1.5 + 5",
        is_active: true,
        preview_url: "",
        metadata: { base_cost: 15.00 }
      });
      setVariantConfigs([
        { type: "sizes", options: ["S", "M", "L", "XL"] },
        { type: "colors", options: ["black", "white", "gray"] }
      ]);
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Calculate pricing preview
  useEffect(() => {
    if (formData.pricing_formula && formData.metadata.base_cost) {
      try {
        const baseCost = formData.metadata.base_cost;
        const formula = formData.pricing_formula
          .replace(/base_price/g, baseCost.toString())
          .replace(/\*/g, '*')
          .replace(/\+/g, '+')
          .replace(/-/g, '-');

        // For safety, only allow basic math operations
        if (/^[\d\s+\-*/.()]+$/.test(formula)) {
          const result = eval(formula);
          setPricingPreview(typeof result === 'number' ? result : null);
        } else {
          setPricingPreview(null);
        }
      } catch {
        setPricingPreview(null);
      }
    } else {
      setPricingPreview(null);
    }
  }, [formData.pricing_formula, formData.metadata.base_cost]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    }

    if (!formData.product_type) {
      newErrors.product_type = "Product type is required";
    }

    if (!formData.pricing_formula.trim()) {
      newErrors.pricing_formula = "Pricing formula is required";
    }

    if (formData.metadata.base_cost <= 0) {
      newErrors.base_cost = "Base cost must be greater than 0";
    }

    // Validate variant configurations
    variantConfigs.forEach((config, index) => {
      if (!config.type.trim()) {
        newErrors[`variant_type_${index}`] = "Variant type is required";
      }
      if (config.options.length === 0) {
        newErrors[`variant_options_${index}`] = "At least one option is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare variant configurations
    const variant_configurations = variantConfigs.reduce((acc, config) => {
      if (config.type.trim() && config.options.length > 0) {
        acc[config.type.trim()] = config.options.filter(opt => opt.trim());
      }
      return acc;
    }, {} as Record<string, string[]>);

    const submissionData = {
      ...formData,
      variant_configurations,
      name: formData.name.trim(),
      description: formData.description.trim(),
      product_type: formData.product_type.trim(),
      pricing_formula: formData.pricing_formula.trim()
    };

    onSubmit(submissionData);
  };

  const handleVariantConfigChange = (index: number, field: 'type' | 'options', value: string | string[]) => {
    setVariantConfigs(prev => prev.map((config, i) =>
      i === index
        ? { ...config, [field]: value }
        : config
    ));
  };

  const addVariantConfig = () => {
    setVariantConfigs(prev => [...prev, { type: "", options: [] }]);
  };

  const removeVariantConfig = (index: number) => {
    setVariantConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const addVariantOption = (configIndex: number) => {
    setVariantConfigs(prev => prev.map((config, i) =>
      i === configIndex
        ? { ...config, options: [...config.options, ""] }
        : config
    ));
  };

  const updateVariantOption = (configIndex: number, optionIndex: number, value: string) => {
    setVariantConfigs(prev => prev.map((config, i) =>
      i === configIndex
        ? {
            ...config,
            options: config.options.map((opt, j) => j === optionIndex ? value : opt)
          }
        : config
    ));
  };

  const removeVariantOption = (configIndex: number, optionIndex: number) => {
    setVariantConfigs(prev => prev.map((config, i) =>
      i === configIndex
        ? { ...config, options: config.options.filter((_, j) => j !== optionIndex) }
        : config
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Premium T-Shirt Template"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      category: e.target.value,
                      product_type: "" // Reset product type when category changes
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type *
                </label>
                <select
                  value={formData.product_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_type: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.product_type ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select product type</option>
                  {productTypes[formData.category as keyof typeof productTypes]?.map(type => (
                    <option key={type} value={type}>
                      {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                {errors.product_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Image URL
                </label>
                <input
                  type="url"
                  value={formData.preview_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, preview_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe this template..."
              />
            </div>

            {/* Pricing Configuration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Pricing Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Cost ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.metadata.base_cost}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, base_cost: parseFloat(e.target.value) || 0 }
                    }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.base_cost ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.base_cost && (
                    <p className="mt-1 text-sm text-red-600">{errors.base_cost}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Formula *
                  </label>
                  <input
                    type="text"
                    value={formData.pricing_formula}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricing_formula: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.pricing_formula ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="base_price * 1.5 + 5"
                  />
                  {errors.pricing_formula && (
                    <p className="mt-1 text-sm text-red-600">{errors.pricing_formula}</p>
                  )}
                </div>
              </div>

              {/* Pricing Preview */}
              {pricingPreview !== null && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Retail Price Preview: ${pricingPreview.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Use "base_price" in your formula. Supported operations: +, -, *, /, ()
                  <br />
                  Example: "base_price * 2.5 + 10" means 2.5x markup plus $10 handling fee
                </p>
              </div>
            </div>

            {/* Variant Configurations */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Variant Configurations
                </h3>
                <button
                  type="button"
                  onClick={addVariantConfig}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant Type
                </button>
              </div>

              <div className="space-y-4">
                {variantConfigs.map((config, configIndex) => (
                  <div key={configIndex} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={config.type}
                          onChange={(e) => handleVariantConfigChange(configIndex, 'type', e.target.value)}
                          placeholder="e.g., sizes, colors, materials"
                          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`variant_type_${configIndex}`] ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors[`variant_type_${configIndex}`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`variant_type_${configIndex}`]}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariantConfig(configIndex)}
                        className="ml-3 p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Options:</span>
                        <button
                          type="button"
                          onClick={() => addVariantOption(configIndex)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          + Add Option
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {config.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-1">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateVariantOption(configIndex, optionIndex, e.target.value)}
                              placeholder="Option value"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantOption(configIndex, optionIndex)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {errors[`variant_options_${configIndex}`] && (
                        <p className="text-sm text-red-600">{errors[`variant_options_${configIndex}`]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Make this template active and available for use
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {initialData ? "Update Template" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
};