"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, ChevronRight, Package, Shirt, Home, Coffee } from "lucide-react";
import { TemplatePicker } from "./TemplatePicker";

interface Template {
  id: string;
  template_id: string;
  category: string;
  product_type: string;
  name: string;
  description: string;
  preview_url: string;
  is_active: boolean;
}

interface StudioTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  selectedCategory?: string;
  className?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  apparel: <Shirt className="w-5 h-5" />,
  accessories: <Package className="w-5 h-5" />,
  home: <Home className="w-5 h-5" />,
  stationery: <Coffee className="w-5 h-5" />,
};

export const StudioTemplateSelector: React.FC<StudioTemplateSelectorProps> = ({
  onSelectTemplate,
  selectedCategory,
  className = "",
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState(selectedCategory || "all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const url = activeCategory === "all"
          ? "/api/studio/templates"
          : `/api/studio/templates?category=${activeCategory}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }

        const data = await response.json();

        if (data.success) {
          setTemplates(data.templates);

          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(data.templates.map((t: Template) => t.category))
          );
          setCategories(uniqueCategories);
        }
      } catch (err: any) {
        console.error("Failed to fetch templates:", err);
        setError(err.message || "Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [activeCategory]);

  // Sync templates from Printful
  const syncTemplates = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/studio/templates", {
        method: "POST",
      });

      if (response.ok) {
        // Refresh templates after sync
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to sync templates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={syncTemplates}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Sync Templates
        </button>
      </div>
    );
  }

  return (
    <div className={`studio-template-selector ${className}`}>
      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Products
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeCategory === category
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {categoryIcons[category]}
            <span className="capitalize">{category}</span>
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No templates available</p>
          <button
            onClick={syncTemplates}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Sync Templates from Printful
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onSelectTemplate(template.template_id)}
            >
              {/* Template Preview */}
              <div className="aspect-square relative bg-gray-100">
                {template.preview_url ? (
                  <Image
                    src={template.preview_url}
                    alt={template.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-2 left-2">
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
                  {template.description || template.product_type}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 capitalize">
                    {template.product_type}
                  </span>

                  <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  return (
    <TemplatePicker
      isOpen={isOpen}
      onClose={onClose}
      onSelectTemplate={onSelectTemplate}
      mode="selection"
    />
  );
};