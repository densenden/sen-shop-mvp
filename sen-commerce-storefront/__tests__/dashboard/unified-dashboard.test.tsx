/**
 * Unified Dashboard UI Tests
 * Tests for multi-provider product display, filtering, search, and bulk operations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrintfulStudioPage from '../../src/admin/routes/printful-studio/page';
import { podProviderManager } from '../../src/modules/printful/services/pod-provider-facade';
import { PODProduct, PODProviderHealthStatus } from '../../src/modules/common/types/pod-provider';

// Mock the POD provider manager
jest.mock('../../src/modules/printful/services/pod-provider-facade', () => ({
  podProviderManager: {
    getAllProducts: jest.fn(),
    checkAllProvidersHealth: jest.fn(),
  },
}));

// Mock setTimeout to make tests run faster
jest.mock('global', () => ({
  ...global,
  setTimeout: jest.fn((fn, delay) => {
    // For tests, execute immediately
    if (delay > 1000) {
      setImmediate(fn);
    } else {
      return global.setTimeout(fn, delay);
    }
  }),
}));

const mockProducts: PODProduct[] = [
  {
    id: 'printful-1',
    externalId: 'ext-printful-1',
    name: 'Printful T-Shirt Design',
    description: 'High quality t-shirt from Printful',
    status: 'published',
    variants: [
      {
        id: 'var-1',
        externalId: 'ext-var-1',
        productId: 'printful-1',
        name: 'Medium Black',
        size: 'M',
        color: 'Black',
        price: 25.99,
        currency: 'USD',
        availability: true,
        mockupUrl: 'https://example.com/mockup1.jpg',
      },
      {
        id: 'var-2',
        externalId: 'ext-var-2',
        productId: 'printful-1',
        name: 'Large Black',
        size: 'L',
        color: 'Black',
        price: 27.99,
        currency: 'USD',
        availability: true,
        mockupUrl: 'https://example.com/mockup2.jpg',
      },
    ],
    provider: 'printful',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'printify-1',
    externalId: 'ext-printify-1',
    name: 'Printify Hoodie Design',
    description: 'Comfortable hoodie from Printify',
    status: 'draft',
    variants: [
      {
        id: 'var-3',
        externalId: 'ext-var-3',
        productId: 'printify-1',
        name: 'Small Red',
        size: 'S',
        color: 'Red',
        price: 35.99,
        currency: 'USD',
        availability: true,
        mockupUrl: 'https://example.com/mockup3.jpg',
      },
    ],
    provider: 'printify',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'gelato-1',
    externalId: 'ext-gelato-1',
    name: 'Gelato Art Print',
    description: 'Beautiful art print from Gelato',
    status: 'published',
    variants: [
      {
        id: 'var-4',
        externalId: 'ext-var-4',
        productId: 'gelato-1',
        name: 'A4 Matte',
        size: 'A4',
        color: 'White',
        price: 15.99,
        currency: 'USD',
        availability: true,
        mockupUrl: 'https://example.com/mockup4.jpg',
      },
    ],
    provider: 'gelato',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
  },
];

const mockHealthStatus: PODProviderHealthStatus[] = [
  {
    provider: 'printful',
    status: 'active',
    lastChecked: new Date(),
    responseTime: 150,
    capabilities: {
      supportsTemplates: true,
      supportsBulkOperations: true,
      supportsVariantMapping: true,
      supportsPriceUpdates: true,
      supportsInventorySync: true,
      maxBulkOperationSize: 100,
      rateLimitPerMinute: 120,
    },
  },
  {
    provider: 'printify',
    status: 'active',
    lastChecked: new Date(),
    responseTime: 200,
    capabilities: {
      supportsTemplates: true,
      supportsBulkOperations: false,
      supportsVariantMapping: true,
      supportsPriceUpdates: true,
      supportsInventorySync: false,
      maxBulkOperationSize: 50,
      rateLimitPerMinute: 60,
    },
  },
  {
    provider: 'gelato',
    status: 'rate_limited',
    lastChecked: new Date(),
    responseTime: 300,
    capabilities: {
      supportsTemplates: true,
      supportsBulkOperations: true,
      supportsVariantMapping: false,
      supportsPriceUpdates: false,
      supportsInventorySync: true,
      maxBulkOperationSize: 200,
      rateLimitPerMinute: 30,
    },
  },
];

describe('Unified Dashboard UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (podProviderManager.getAllProducts as jest.Mock).mockResolvedValue(mockProducts);
    (podProviderManager.checkAllProvidersHealth as jest.Mock).mockResolvedValue(mockHealthStatus);
  });

  describe('Multi-Provider Product Grid Display', () => {
    test('should display products from all providers with correct badges', async () => {
      render(<PrintfulStudioPage />);

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Check that products from all providers are displayed
      expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      expect(screen.getByText('Printify Hoodie Design')).toBeInTheDocument();
      expect(screen.getByText('Gelato Art Print')).toBeInTheDocument();

      // Check provider badges are displayed (using getAllByText since they appear in multiple places)
      expect(screen.getAllByText('Printful')).toHaveLength(2); // Filter dropdown + badge
      expect(screen.getAllByText('Printify')).toHaveLength(2); // Filter dropdown + badge
      expect(screen.getAllByText('Gelato')).toHaveLength(2); // Filter dropdown + badge

      // Check status badges are displayed
      expect(screen.getAllByText('published')).toHaveLength(2); // Printful and Gelato products
      expect(screen.getByText('draft')).toBeInTheDocument(); // Printify product

      // Check product count is displayed
      expect(screen.getByText('3 products found')).toBeInTheDocument();
    });

    test('should display correct variant information and pricing', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Check variant count is displayed
      const printfulCard = screen.getByText('Printful T-Shirt Design').closest('div[class*="bg-white"]');
      expect(within(printfulCard!).getByText('2')).toBeInTheDocument(); // 2 variants

      // Check price range is displayed (from $25.99 to $27.99)
      expect(within(printfulCard!).getByText(/\$25\.99/)).toBeInTheDocument();
      expect(within(printfulCard!).getByText(/\$27\.99/)).toBeInTheDocument();
    });
  });

  describe('Filter and Search Functionality', () => {
    test('should filter products by provider', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Select Printful filter
      const providerSelect = screen.getByDisplayValue('All Providers');
      fireEvent.change(providerSelect, { target: { value: 'printful' } });

      // Should show only Printful products
      expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      expect(screen.queryByText('Printify Hoodie Design')).not.toBeInTheDocument();
      expect(screen.queryByText('Gelato Art Print')).not.toBeInTheDocument();

      // Check product count updates
      expect(screen.getByText('1 products found')).toBeInTheDocument();
    });

    test('should filter products by status', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Select published status filter
      const statusSelect = screen.getByDisplayValue('All Status');
      fireEvent.change(statusSelect, { target: { value: 'published' } });

      // Should show only published products
      expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      expect(screen.getByText('Gelato Art Print')).toBeInTheDocument();
      expect(screen.queryByText('Printify Hoodie Design')).not.toBeInTheDocument();

      // Check product count updates
      expect(screen.getByText('2 products found')).toBeInTheDocument();
    });

    test('should search products across all providers', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Search for "hoodie"
      const searchInput = screen.getByPlaceholderText('Search products across all providers...');
      fireEvent.change(searchInput, { target: { value: 'hoodie' } });

      // Should show only the hoodie product
      expect(screen.getByText('Printify Hoodie Design')).toBeInTheDocument();
      expect(screen.queryByText('Printful T-Shirt Design')).not.toBeInTheDocument();
      expect(screen.queryByText('Gelato Art Print')).not.toBeInTheDocument();

      // Check product count updates
      expect(screen.getByText('1 products found')).toBeInTheDocument();
    });

    test('should show advanced filters when clicked', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Click More Filters button
      const moreFiltersButton = screen.getByText('More Filters');
      fireEvent.click(moreFiltersButton);

      // Should show advanced filter options
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Price Range')).toBeInTheDocument();
      expect(screen.getByText('Availability')).toBeInTheDocument();
    });
  });

  describe('Bulk Selection Mechanism', () => {
    test('should allow individual product selection', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Find and click the first checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      const firstCheckbox = checkboxes[0];
      fireEvent.click(firstCheckbox);

      // Should show selection count
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    test('should allow selecting all visible products', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Click Select All Visible button
      const selectAllButton = screen.getByText('Select All Visible');
      fireEvent.click(selectAllButton);

      // Should show all products selected
      expect(screen.getByText('3 selected')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    test('should clear selection when Clear button is clicked', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Select all products first
      const selectAllButton = screen.getByText('Select All Visible');
      fireEvent.click(selectAllButton);

      expect(screen.getByText('3 selected')).toBeInTheDocument();

      // Click Clear button
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      // Selection should be cleared
      expect(screen.queryByText('3 selected')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });
  });

  describe('Provider Badge Display', () => {
    test('should display correct provider badges with appropriate colors', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Check each provider badge exists in product cards (not in filter dropdowns)
      const productGrid = screen.getByText('Printful T-Shirt Design').closest('div[class*="grid"]')?.parentElement;

      // Find badges within the product grid context
      const printfulBadges = screen.getAllByText('Printful');
      const printifyBadges = screen.getAllByText('Printify');
      const gelatoBadges = screen.getAllByText('Gelato');

      // Should have badges (at least one for each provider in product cards)
      expect(printfulBadges.length).toBeGreaterThan(0);
      expect(printifyBadges.length).toBeGreaterThan(0);
      expect(gelatoBadges.length).toBeGreaterThan(0);

      // Check that at least one badge has the appropriate color class
      const hasPrintfulColor = printfulBadges.some(badge =>
        badge.className.includes('text-red-800') || badge.closest('span')?.className.includes('text-red-800')
      );
      const hasPrintifyColor = printifyBadges.some(badge =>
        badge.className.includes('text-green-800') || badge.closest('span')?.className.includes('text-green-800')
      );
      const hasGelatoColor = gelatoBadges.some(badge =>
        badge.className.includes('text-blue-800') || badge.closest('span')?.className.includes('text-blue-800')
      );

      expect(hasPrintfulColor).toBe(true);
      expect(hasPrintifyColor).toBe(true);
      expect(hasGelatoColor).toBe(true);
    });

    test('should display provider icons alongside badge names', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Check for provider icons (emojis) - use getAllByText since they appear multiple times
      expect(screen.getAllByText('🎨')).toHaveLength(2); // Printful icon (health status + product badge)
      expect(screen.getAllByText('🖨️')).toHaveLength(2); // Printify icon (health status + product badge)
      expect(screen.getAllByText('🍦')).toHaveLength(2); // Gelato icon (health status + product badge)
    });
  });

  describe('Provider Health and Sync Status', () => {
    test('should display provider health status correctly', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getAllByText('active')).toHaveLength(2); // Printful and Printify
      });

      // Check that all providers show their status
      expect(screen.getAllByText('active')).toHaveLength(2); // Printful and Printify
      expect(screen.getByText('rate_limited')).toBeInTheDocument(); // Gelato

      // Check response times are displayed
      expect(screen.getByText('150ms')).toBeInTheDocument(); // Printful
      expect(screen.getByText('200ms')).toBeInTheDocument(); // Printify
      expect(screen.getByText('300ms')).toBeInTheDocument(); // Gelato
    });

    test('should show sync status and allow manual sync trigger', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Check that sync buttons are present
      const syncButtons = screen.getAllByText('Sync Now');
      expect(syncButtons).toHaveLength(3); // One for each provider

      // Click the first sync button (Printful)
      fireEvent.click(syncButtons[0]);

      // Should show syncing state (the setTimeout is mocked to execute immediately)
      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      }, { timeout: 100 });
    });
  });

  describe('Comparison View Functionality', () => {
    test('should open price comparison view', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Click Compare Prices button
      const comparePricesButton = screen.getByText('Compare Prices');
      fireEvent.click(comparePricesButton);

      // Should show comparison view
      expect(screen.getByText('Price Comparison')).toBeInTheDocument();
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    test('should close comparison view when Close button is clicked', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Open comparison view
      const comparePricesButton = screen.getByText('Compare Prices');
      fireEvent.click(comparePricesButton);

      expect(screen.getByText('Price Comparison')).toBeInTheDocument();

      // Close comparison view
      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      // Should hide comparison view
      expect(screen.queryByText('Price Comparison')).not.toBeInTheDocument();
    });
  });

  describe('Auto-refresh Functionality', () => {
    test('should toggle auto-refresh mode', async () => {
      render(<PrintfulStudioPage />);

      await waitFor(() => {
        expect(screen.getByText('Printful T-Shirt Design')).toBeInTheDocument();
      });

      // Find auto-refresh button by its text content
      const autoRefreshButton = screen.getByText('Auto-refresh').closest('button');

      // Initially should not be active (check for specific classes)
      expect(autoRefreshButton?.className).toContain('bg-gray-100');

      // Click to activate
      fireEvent.click(autoRefreshButton!);

      // Should now be active
      expect(autoRefreshButton?.className).toContain('bg-green-100');
    });
  });
});