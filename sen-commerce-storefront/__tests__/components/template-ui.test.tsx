/**
 * Template Management UI Tests
 * Tests for template picker, CRUD forms, and application flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TemplatePicker } from '../../components/TemplatePicker';
import { TemplateFormModal } from '../../components/TemplateFormModal';
import { TemplateManagement } from '../../components/TemplateManagement';

// Mock fetch
global.fetch = jest.fn();

// Mock templates data
const mockTemplates = [
  {
    id: '1',
    template_id: 'tpl_shirt_basic',
    category: 'apparel',
    product_type: 't-shirt',
    name: 'Basic T-Shirt',
    description: 'Classic crew neck t-shirt template',
    preview_url: '/test-image.jpg',
    is_active: true,
    pricing_formula: 'base_price * 1.5 + 5',
    variant_configurations: {
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['black', 'white', 'gray']
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
    preview_url: '/test-hoodie.jpg',
    is_active: true,
    pricing_formula: 'base_price * 1.8 + 10',
    variant_configurations: {
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['black', 'gray', 'navy']
    },
    metadata: { base_cost: 35.00 },
    usage_count: 23,
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-18T16:45:00Z'
  }
];

describe('Template Picker Component', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders template picker and loads templates', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        templates: mockTemplates
      })
    });

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <TemplatePicker
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelect}
      />
    );

    // Check loading state initially
    expect(screen.getByText('Loading templates...')).toBeInTheDocument();

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Premium Hoodie')).toBeInTheDocument();
    });

    // Check that templates are displayed
    expect(screen.getByText('Classic crew neck t-shirt template')).toBeInTheDocument();
    expect(screen.getByText('Heavyweight pullover hoodie template')).toBeInTheDocument();
  });

  test('searches templates by name', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        templates: mockTemplates
      })
    });

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <TemplatePicker
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
    });

    // Search for "hoodie"
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'hoodie' } });

    // Only hoodie template should be visible
    expect(screen.queryByText('Basic T-Shirt')).not.toBeInTheDocument();
    expect(screen.getByText('Premium Hoodie')).toBeInTheDocument();
  });

  test('selects template when clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        templates: mockTemplates
      })
    });

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <TemplatePicker
        isOpen={true}
        onClose={mockOnClose}
        onSelectTemplate={mockOnSelect}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
    });

    // Click on the first template
    const templateCard = screen.getByText('Basic T-Shirt').closest('div');
    fireEvent.click(templateCard!);

    expect(mockOnSelect).toHaveBeenCalledWith('tpl_shirt_basic');
  });
});

describe('Template Form Modal', () => {
  test('renders create template form', () => {
    const mockOnSubmit = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        title="Create New Template"
      />
    );

    expect(screen.getByText('Create New Template')).toBeInTheDocument();
    expect(screen.getByText('Template Name *')).toBeInTheDocument();
    expect(screen.getByText('Category *')).toBeInTheDocument();
    expect(screen.getByText('Product Type *')).toBeInTheDocument();
    expect(screen.getByText('Pricing Formula *')).toBeInTheDocument();
  });

  test('validates required fields', () => {
    const mockOnSubmit = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        title="Create New Template"
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Create Template');
    fireEvent.click(submitButton);

    expect(screen.getByText('Template name is required')).toBeInTheDocument();
    expect(screen.getByText('Product type is required')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', () => {
    const mockOnSubmit = jest.fn();
    const mockOnClose = jest.fn();

    render(
      <TemplateFormModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        title="Create New Template"
      />
    );

    // Fill required fields using placeholder text
    const nameInput = screen.getByPlaceholderText('e.g., Premium T-Shirt Template');
    fireEvent.change(nameInput, { target: { value: 'Test Template' } });

    // Select product type
    const productTypeSelect = screen.getAllByRole('combobox')[1]; // Second select is product type
    fireEvent.change(productTypeSelect, { target: { value: 't-shirt' } });

    // Submit form
    const submitButton = screen.getByText('Create Template');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Template',
        product_type: 't-shirt',
        category: 'apparel'
      })
    );
  });
});

describe('Template Management Page', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('loads and displays templates with stats', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        templates: mockTemplates
      })
    });

    render(<TemplateManagement />);

    expect(screen.getByText('Loading templates...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Premium Hoodie')).toBeInTheDocument();
    });

    // Check template management header
    expect(screen.getByText('Template Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your product templates and pricing formulas')).toBeInTheDocument();
  });

  test('opens create template modal', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        templates: mockTemplates
      })
    });

    render(<TemplateManagement />);

    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Template');
    fireEvent.click(createButton);

    expect(screen.getByText('Create New Template')).toBeInTheDocument();
  });

  test('deletes template with confirmation', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          templates: mockTemplates
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Template deleted successfully'
        })
      });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<TemplateManagement />);

    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
    });

    // Find and click delete button for first template
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('svg') && btn.className.includes('bg-red-100')
    );

    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this template?');

    await waitFor(() => {
      expect(fetch).toHaveBeenLastCalledWith('/api/studio/templates/1', {
        method: 'DELETE'
      });
    });
  });
});

describe('Template Application Flow', () => {
  test('applies template during product creation', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        templates: mockTemplates
      })
    });

    const mockOnSelectTemplate = jest.fn();

    render(
      <TemplatePicker
        isOpen={true}
        onClose={jest.fn()}
        onSelectTemplate={mockOnSelectTemplate}
        mode="selection"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
    });

    // Click on template to apply
    const templateCard = screen.getByText('Basic T-Shirt').closest('div');
    fireEvent.click(templateCard!);

    expect(mockOnSelectTemplate).toHaveBeenCalledWith('tpl_shirt_basic');
  });

  test('shows pricing formula preview in template details', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        templates: mockTemplates
      })
    });

    render(
      <TemplatePicker
        isOpen={true}
        onClose={jest.fn()}
        onSelectTemplate={jest.fn()}
        mode="preview"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Basic T-Shirt')).toBeInTheDocument();
    });

    // Click on template to preview
    const templateCard = screen.getByText('Basic T-Shirt').closest('div');
    fireEvent.click(templateCard!);

    // Should show template details in preview panel
    expect(screen.getByText('Template Details')).toBeInTheDocument();
    expect(screen.getByText('base_price * 1.5 + 5')).toBeInTheDocument();
    expect(screen.getByText(/Estimated Price: \$27\.50/)).toBeInTheDocument();
  });
});