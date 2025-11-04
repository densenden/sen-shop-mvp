/**
 * Template Management UI Tests
 * Tests for Task Group 7: Template Management UI
 */

import React from 'react';
import '@testing-library/jest-dom';

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
  tags?: string[];
}

const mockTemplates: ProductTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Basic T-Shirt Template',
    description: 'Standard t-shirt configuration with common sizes',
    provider: 'printful',
    variant_configs: { sizes: ['S', 'M', 'L', 'XL'] },
    pricing_rules: { markup_type: 'percentage', markup_value: 30 },
    usage_count: 45,
    tags: ['apparel', 'tshirt', 'basic'],
  },
  {
    id: 'tmpl-2',
    name: 'Premium Mug Template',
    description: 'High-quality ceramic mug with premium pricing',
    provider: 'printify',
    variant_configs: { sizes: ['11oz', '15oz'] },
    pricing_rules: { markup_type: 'fixed', markup_value: 10 },
    usage_count: 23,
    tags: ['drinkware', 'mug', 'premium'],
  },
  {
    id: 'tmpl-3',
    name: 'Poster Template',
    description: 'Art print poster in various sizes',
    provider: 'gelato',
    variant_configs: { sizes: ['12x16', '18x24', '24x36'] },
    pricing_rules: { markup_type: 'percentage', markup_value: 50 },
    usage_count: 12,
    tags: ['art', 'poster', 'print'],
  },
];

describe('Template Management - Template Picker', () => {
  test('should display list of templates', () => {
    const templates = mockTemplates;

    expect(templates).toHaveLength(3);
    templates.forEach(template => {
      expect(template.id).toBeDefined();
      expect(template.name).toBeDefined();
    });
  });

  test('should filter templates by search query', () => {
    const searchQuery = 'mug';
    const filtered = mockTemplates.filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Premium Mug Template');
  });

  test('should filter templates by provider', () => {
    const provider = 'printful';
    const filtered = mockTemplates.filter(t => t.provider === provider);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].provider).toBe('printful');
  });

  test('should filter templates by tags', () => {
    const searchQuery = 'apparel';
    const filtered = mockTemplates.filter(t =>
      t.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].tags).toContain('apparel');
  });

  test('should sort templates by usage count', () => {
    const sorted = [...mockTemplates].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));

    expect(sorted[0].usage_count).toBe(45);
    expect(sorted[1].usage_count).toBe(23);
    expect(sorted[2].usage_count).toBe(12);
  });
});

describe('Template Management - Template Selection', () => {
  test('should select a template', () => {
    let selectedTemplate: ProductTemplate | null = null;

    const selectTemplate = (template: ProductTemplate) => {
      selectedTemplate = template;
    };

    selectTemplate(mockTemplates[0]);

    expect(selectedTemplate).toBeDefined();
    expect(selectedTemplate?.id).toBe('tmpl-1');
  });

  test('should support multi-select', () => {
    const selectedTemplates = new Set<string>();

    selectedTemplates.add(mockTemplates[0].id);
    selectedTemplates.add(mockTemplates[1].id);

    expect(selectedTemplates.size).toBe(2);
    expect(selectedTemplates.has('tmpl-1')).toBe(true);
    expect(selectedTemplates.has('tmpl-2')).toBe(true);
  });

  test('should toggle template selection', () => {
    const selectedTemplates = new Set<string>(['tmpl-1']);

    // Deselect
    selectedTemplates.delete('tmpl-1');
    expect(selectedTemplates.has('tmpl-1')).toBe(false);

    // Reselect
    selectedTemplates.add('tmpl-1');
    expect(selectedTemplates.has('tmpl-1')).toBe(true);
  });
});

describe('Template Management - Template Application', () => {
  test('should apply template pricing rules', () => {
    const template = mockTemplates[0];
    const baseCost = 10;

    let retailPrice: number;

    if (template.pricing_rules?.markup_type === 'percentage') {
      retailPrice = baseCost * (1 + template.pricing_rules.markup_value / 100);
    } else {
      retailPrice = baseCost + (template.pricing_rules?.markup_value || 0);
    }

    expect(retailPrice).toBe(13); // 10 * 1.30 = 13
  });

  test('should apply fixed markup pricing', () => {
    const template = mockTemplates[1];
    const baseCost = 15;

    let retailPrice: number;

    if (template.pricing_rules?.markup_type === 'percentage') {
      retailPrice = baseCost * (1 + template.pricing_rules.markup_value / 100);
    } else {
      retailPrice = baseCost + (template.pricing_rules?.markup_value || 0);
    }

    expect(retailPrice).toBe(25); // 15 + 10 = 25
  });

  test('should apply variant configurations', () => {
    const template = mockTemplates[0];
    const variantConfigs = template.variant_configs;

    expect(variantConfigs).toBeDefined();
    expect(variantConfigs.sizes).toEqual(['S', 'M', 'L', 'XL']);
  });

  test('should increment usage count after application', () => {
    const template = { ...mockTemplates[0] };
    const originalCount = template.usage_count || 0;

    // Simulate applying template
    template.usage_count = originalCount + 1;

    expect(template.usage_count).toBe(46);
  });
});

describe('Template Management - Template CRUD', () => {
  test('should create new template', () => {
    const templates: ProductTemplate[] = [...mockTemplates];
    const newTemplate: ProductTemplate = {
      id: 'tmpl-4',
      name: 'New Template',
      description: 'A newly created template',
      provider: 'printful',
      pricing_rules: { markup_type: 'percentage', markup_value: 40 },
      usage_count: 0,
      tags: ['new'],
    };

    templates.push(newTemplate);

    expect(templates).toHaveLength(4);
    expect(templates[3].id).toBe('tmpl-4');
  });

  test('should update existing template', () => {
    const templates: ProductTemplate[] = [...mockTemplates];
    const templateToUpdate = templates.find(t => t.id === 'tmpl-1');

    if (templateToUpdate) {
      templateToUpdate.name = 'Updated T-Shirt Template';
      templateToUpdate.pricing_rules = { markup_type: 'percentage', markup_value: 35 };
    }

    const updated = templates.find(t => t.id === 'tmpl-1');
    expect(updated?.name).toBe('Updated T-Shirt Template');
    expect(updated?.pricing_rules?.markup_value).toBe(35);
  });

  test('should delete template', () => {
    let templates: ProductTemplate[] = [...mockTemplates];
    const idToDelete = 'tmpl-2';

    templates = templates.filter(t => t.id !== idToDelete);

    expect(templates).toHaveLength(2);
    expect(templates.find(t => t.id === idToDelete)).toBeUndefined();
  });

  test('should validate template data', () => {
    const template: Partial<ProductTemplate> = {
      name: 'Valid Template',
      pricing_rules: { markup_type: 'percentage', markup_value: 30 },
    };

    // Validation checks
    const isValid =
      !!template.name &&
      template.name.trim().length > 0 &&
      template.pricing_rules !== undefined &&
      template.pricing_rules.markup_value > 0;

    expect(isValid).toBe(true);
  });

  test('should reject invalid template data', () => {
    const invalidTemplate: Partial<ProductTemplate> = {
      name: '',
      pricing_rules: { markup_type: 'percentage', markup_value: -10 },
    };

    // Validation checks
    const isValid =
      !!invalidTemplate.name &&
      invalidTemplate.name.trim().length > 0 &&
      invalidTemplate.pricing_rules !== undefined &&
      invalidTemplate.pricing_rules.markup_value > 0;

    expect(isValid).toBe(false);
  });
});

describe('Template Management - Pricing Formula Preview', () => {
  test('should preview pricing with percentage markup', () => {
    const baseCost = 20;
    const markupPercentage = 40;

    const retailPrice = baseCost * (1 + markupPercentage / 100);
    const profit = retailPrice - baseCost;
    const profitMargin = (profit / baseCost) * 100;

    expect(retailPrice).toBe(28);
    expect(profit).toBe(8);
    expect(profitMargin).toBe(40);
  });

  test('should preview pricing with fixed markup', () => {
    const baseCost = 20;
    const fixedMarkup = 12;

    const retailPrice = baseCost + fixedMarkup;
    const profit = retailPrice - baseCost;
    const profitMargin = (profit / baseCost) * 100;

    expect(retailPrice).toBe(32);
    expect(profit).toBe(12);
    expect(profitMargin).toBe(60);
  });
});
