import { NextApiRequest, NextApiResponse } from 'next';

export interface Template {
  id: string;
  template_id: string;
  category: string;
  product_type: string;
  name: string;
  description: string;
  preview_url: string;
  is_active: boolean;
  pricing_formula?: string;
  variant_configurations?: Record<string, any>;
  metadata?: Record<string, any>;
  usage_count?: number;
  created_at: string;
  updated_at: string;
}

// Mock templates data - in a real app, this would come from a database
const mockTemplates: Template[] = [
  {
    id: '1',
    template_id: 'tpl_shirt_basic',
    category: 'apparel',
    product_type: 't-shirt',
    name: 'Basic T-Shirt',
    description: 'Classic crew neck t-shirt template',
    preview_url: '/api/placeholder/300/300',
    is_active: true,
    pricing_formula: 'base_price * 1.5 + 5',
    variant_configurations: {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['black', 'white', 'gray', 'navy']
    },
    metadata: { base_cost: 15.00 },
    usage_count: 45,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    template_id: 'tpl_hoodie_premium',
    category: 'apparel',
    product_type: 'hoodie',
    name: 'Premium Hoodie',
    description: 'Heavyweight pullover hoodie template',
    preview_url: '/api/placeholder/300/300',
    is_active: true,
    pricing_formula: 'base_price * 1.8 + 10',
    variant_configurations: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['black', 'gray', 'navy', 'burgundy']
    },
    metadata: { base_cost: 35.00 },
    usage_count: 23,
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-18T16:45:00Z'
  },
  {
    id: '3',
    template_id: 'tpl_mug_ceramic',
    category: 'accessories',
    product_type: 'mug',
    name: 'Ceramic Mug',
    description: '11oz ceramic coffee mug template',
    preview_url: '/api/placeholder/300/300',
    is_active: true,
    pricing_formula: 'base_price * 2.0 + 3',
    variant_configurations: {
      sizes: ['11oz'],
      colors: ['white', 'black']
    },
    metadata: { base_cost: 8.00 },
    usage_count: 67,
    created_at: '2024-01-05T11:20:00Z',
    updated_at: '2024-01-15T13:10:00Z'
  },
  {
    id: '4',
    template_id: 'tpl_poster_premium',
    category: 'home',
    product_type: 'poster',
    name: 'Premium Poster',
    description: 'High-quality print poster template',
    preview_url: '/api/placeholder/300/300',
    is_active: true,
    pricing_formula: 'base_price * 3.0 + 8',
    variant_configurations: {
      sizes: ['12x16', '16x20', '18x24'],
      finishes: ['matte', 'glossy']
    },
    metadata: { base_cost: 12.00 },
    usage_count: 34,
    created_at: '2024-01-12T14:00:00Z',
    updated_at: '2024-01-22T10:25:00Z'
  },
  {
    id: '5',
    template_id: 'tpl_notebook_custom',
    category: 'stationery',
    product_type: 'notebook',
    name: 'Custom Notebook',
    description: 'Spiral-bound notebook template',
    preview_url: '/api/placeholder/300/300',
    is_active: true,
    pricing_formula: 'base_price * 2.5 + 6',
    variant_configurations: {
      sizes: ['A5', 'A4'],
      pages: ['50', '100', '150']
    },
    metadata: { base_cost: 10.00 },
    usage_count: 12,
    created_at: '2024-01-08T08:30:00Z',
    updated_at: '2024-01-16T15:20:00Z'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { category, search, limit = '20', offset = '0' } = req.query;

      let filteredTemplates = [...mockTemplates];

      // Filter by category
      if (category && category !== 'all') {
        filteredTemplates = filteredTemplates.filter(
          template => template.category === category
        );
      }

      // Filter by search term
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(
          template =>
            template.name.toLowerCase().includes(searchLower) ||
            template.description.toLowerCase().includes(searchLower) ||
            template.product_type.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      const paginatedTemplates = filteredTemplates.slice(offsetNum, offsetNum + limitNum);

      res.status(200).json({
        success: true,
        templates: paginatedTemplates,
        total: filteredTemplates.length,
        limit: limitNum,
        offset: offsetNum
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates'
      });
    }
  } else if (req.method === 'POST') {
    try {
      const templateData = req.body;

      // Create new template
      const newTemplate: Template = {
        id: Date.now().toString(),
        template_id: `tpl_${templateData.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
        category: templateData.category,
        product_type: templateData.product_type,
        name: templateData.name,
        description: templateData.description,
        preview_url: templateData.preview_url || '/api/placeholder/300/300',
        is_active: templateData.is_active ?? true,
        pricing_formula: templateData.pricing_formula,
        variant_configurations: templateData.variant_configurations,
        metadata: templateData.metadata,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In a real app, save to database
      mockTemplates.push(newTemplate);

      res.status(201).json({
        success: true,
        template: newTemplate
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}