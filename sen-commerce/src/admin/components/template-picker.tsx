/**
 * Template Picker Component
 * Modal for selecting and applying product templates
 */

import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Tooltip,
} from "@medusajs/ui";
import {
  X,
  Package,
  Search,
  CheckCircle2,
  Loader2,
  Star,
  Tag,
} from "lucide-react";

interface ProductTemplate {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  preview_url?: string;
  variant_configs?: any;
  pricing_rules?: {
    markup_type: 'fixed' | 'percentage';
    markup_value: number;
  };
  usage_count?: number;
  created_at?: string;
  tags?: string[];
}

interface TemplatePickerProps {
  onSelect: (template: ProductTemplate) => void;
  onClose: () => void;
  provider?: string;
  allowMultiSelect?: boolean;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  onSelect,
  onClose,
  provider,
  allowMultiSelect = false,
}) => {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTemplates();
  }, [provider]);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, provider]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (provider) {
        params.append('provider', provider);
      }

      const response = await fetch(`/admin/pod-templates?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by usage count (most used first)
    filtered.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));

    setFilteredTemplates(filtered);
  };

  const handleTemplateClick = (template: ProductTemplate) => {
    if (allowMultiSelect) {
      const newSelected = new Set(selectedTemplates);
      if (newSelected.has(template.id)) {
        newSelected.delete(template.id);
      } else {
        newSelected.add(template.id);
      }
      setSelectedTemplates(newSelected);
    } else {
      onSelect(template);
    }
  };

  const handleApplySelected = () => {
    const selected = templates.filter(t => selectedTemplates.has(t.id));
    selected.forEach(template => onSelect(template));
  };

  const getProviderColor = (provider?: string) => {
    switch (provider?.toLowerCase()) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-ui-bg-base rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ui-border-base">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-ui-fg-subtle" />
            <Heading level="h2">Select Template</Heading>
            {provider && (
              <Badge color={getProviderColor(provider)} size="small">
                {provider}
              </Badge>
            )}
          </div>
          <Button variant="secondary" size="small" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-ui-border-base">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ui-fg-muted" />
            <Input
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-ui-fg-interactive" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-ui-fg-disabled mb-4" />
              <p className="text-ui-fg-subtle">
                {searchQuery ? 'No templates found matching your search' : 'No templates available'}
              </p>
              <Button variant="secondary" size="small" className="mt-4" onClick={onClose}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className={`relative cursor-pointer rounded-lg border p-4 space-y-3 transition-all hover:shadow-md ${
                    selectedTemplates.has(template.id)
                      ? 'border-ui-fg-interactive bg-ui-bg-highlight'
                      : 'border-ui-border-base bg-ui-bg-base dark:bg-ui-bg-subtle hover:border-ui-border-interactive'
                  }`}
                >
                  {/* Selected Indicator */}
                  {selectedTemplates.has(template.id) && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-5 h-5 text-ui-fg-interactive" />
                    </div>
                  )}

                  {/* Preview Image */}
                  {template.preview_url && (
                    <div className="w-full h-32 bg-ui-bg-subtle rounded overflow-hidden">
                      <img
                        src={template.preview_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Template Info */}
                  <div>
                    <h3 className="font-semibold text-ui-fg-base">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-ui-fg-subtle mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>

                  {/* Provider Badge */}
                  {template.provider && (
                    <Badge color={getProviderColor(template.provider)} size="small">
                      {template.provider}
                    </Badge>
                  )}

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs bg-ui-bg-subtle dark:bg-ui-bg-base px-2 py-0.5 rounded"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-ui-fg-muted">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pricing Info */}
                  {template.pricing_rules && (
                    <div className="text-sm text-ui-fg-subtle pt-2 border-t border-ui-border-base">
                      <span>
                        Markup: {template.pricing_rules.markup_value}
                        {template.pricing_rules.markup_type === 'percentage' ? '%' : ' USD'}
                      </span>
                    </div>
                  )}

                  {/* Usage Stats */}
                  {template.usage_count !== undefined && template.usage_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-ui-fg-muted">
                      <Star className="w-3 h-3" />
                      <span>Used {template.usage_count} times</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {allowMultiSelect && selectedTemplates.size > 0 && (
          <div className="p-4 border-t border-ui-border-base bg-ui-bg-subtle dark:bg-ui-bg-base">
            <div className="flex items-center justify-between">
              <div className="text-sm text-ui-fg-subtle">
                {selectedTemplates.size} template{selectedTemplates.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="small" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="small" onClick={handleApplySelected}>
                  Apply Selected
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
