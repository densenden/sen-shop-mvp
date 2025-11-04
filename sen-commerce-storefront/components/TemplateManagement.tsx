"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  Settings,
  DollarSign,
  Package,
  TrendingUp
} from "lucide-react";
import { Template } from "../pages/api/studio/templates";
import { TemplateFormModal } from "./TemplateFormModal";
import { TemplatePicker } from "./TemplatePicker";

interface TemplateManagementProps {
  className?: string;
}

export const TemplateManagement: React.FC<TemplateManagementProps> = ({
  className = "",
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "usage" | "created" | "updated">("updated");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Filter and search templates
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(template => template.category === selectedCategory);
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
        case "created":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, sortBy]);

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

  const handleCreateTemplate = async (templateData: Partial<Template>) => {
    try {
      const response = await fetch("/api/studio/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(prev => [...prev, data.template]);
        setShowCreateModal(false);
      } else {
        setError(data.error || "Failed to create template");
      }
    } catch (err: any) {
      console.error("Failed to create template:", err);
      setError("Failed to create template");
    }
  };

  const handleUpdateTemplate = async (templateData: Partial<Template>) => {
    if (!editingTemplate) return;

    try {
      const response = await fetch(`/api/studio/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(prev =>
          prev.map(t => t.id === editingTemplate.id ? data.template : t)
        );
        setShowEditModal(false);
        setEditingTemplate(null);
      } else {
        setError(data.error || "Failed to update template");
      }
    } catch (err: any) {
      console.error("Failed to update template:", err);
      setError("Failed to update template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/studio/templates/${templateId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
      } else {
        setError(data.error || "Failed to delete template");
      }
    } catch (err: any) {
      console.error("Failed to delete template:", err);
      setError("Failed to delete template");
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    const duplicateData = {
      ...template,
      name: `${template.name} (Copy)`,
      template_id: undefined,
      id: undefined,
      usage_count: 0,
    };

    await handleCreateTemplate(duplicateData);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const calculatePricePreview = (template: Template) => {
    if (!template.pricing_formula || !template.metadata?.base_cost) return null;

    try {
      const baseCost = template.metadata.base_cost;
      // Simple formula evaluation (in a real app, use a proper expression parser)
      const formula = template.pricing_formula
        .replace(/base_price/g, baseCost.toString())
        .replace(/\*/g, '*')
        .replace(/\+/g, '+')
        .replace(/-/g, '-');

      // For safety, only allow basic math operations
      if (!/^[\d\s+\-*/.()]+$/.test(formula)) return null;

      const result = eval(formula);
      return typeof result === 'number' ? result : null;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`template-management ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Template Management</h2>
          <p className="text-gray-600 mt-1">
            Manage your product templates and pricing formulas
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowPickerModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview Templates
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Templates</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.filter(t => t.is_active).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900">
                {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <Filter className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
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

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="name">Name A-Z</option>
            <option value="usage">Most Used</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first template to get started"}
          </p>
          {!searchTerm && selectedCategory === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const pricePreview = calculatePricePreview(template);

            return (
              <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Template Preview */}
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={template.preview_url}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      template.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {template.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-white bg-opacity-90 rounded text-xs font-medium capitalize">
                      {template.category}
                    </span>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {template.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Product Type:</span>
                      <p className="font-medium capitalize">{template.product_type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Usage Count:</span>
                      <p className="font-medium">{template.usage_count || 0}</p>
                    </div>
                  </div>

                  {/* Pricing Preview */}
                  {pricePreview && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price Preview:</span>
                        <span className="font-semibold text-green-700">
                          ${pricePreview.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Edit</span>
                    </button>

                    <button
                      onClick={() => handleDuplicateTemplate(template)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TemplateFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTemplate}
        title="Create New Template"
      />

      <TemplateFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleUpdateTemplate}
        title="Edit Template"
        initialData={editingTemplate}
      />

      <TemplatePicker
        isOpen={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        onSelectTemplate={(templateId) => {
          console.log("Template selected:", templateId);
          setShowPickerModal(false);
        }}
        mode="preview"
      />
    </div>
  );
};