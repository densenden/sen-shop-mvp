import { NextApiRequest, NextApiResponse } from 'next';
import { Template } from './index';

// Mock templates data - this would come from a database in a real app
let mockTemplates: Template[] = [
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
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Template ID is required'
    });
  }

  if (req.method === 'GET') {
    try {
      const template = mockTemplates.find(t => t.id === id);

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.status(200).json({
        success: true,
        template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template'
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const templateIndex = mockTemplates.findIndex(t => t.id === id);

      if (templateIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      const updateData = req.body;
      const existingTemplate = mockTemplates[templateIndex];

      // Update template
      const updatedTemplate: Template = {
        ...existingTemplate,
        ...updateData,
        id: existingTemplate.id, // Preserve original ID
        template_id: existingTemplate.template_id, // Preserve template_id
        updated_at: new Date().toISOString()
      };

      mockTemplates[templateIndex] = updatedTemplate;

      res.status(200).json({
        success: true,
        template: updatedTemplate
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update template'
      });
    }
  } else if (req.method === 'DELETE') {
    try {
      const templateIndex = mockTemplates.findIndex(t => t.id === id);

      if (templateIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      // Remove template
      mockTemplates.splice(templateIndex, 1);

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete template'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}