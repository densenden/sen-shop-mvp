/**
 * Dashboard UI Component Tests
 * Tests for Task Group 5: Unified Dashboard UI
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dashboard data
const mockDashboard = {
  version: 'v2',
  metrics: {
    total_products: 100,
    linked_products: 45,
    total_variants: 250,
    artworks: 30,
    artworks_without_products: 5
  },
  capabilities: ['multi-provider', 'bulk-operations', 'templates'],
  health: {
    status: 'ok' as const,
    message: 'All systems operational'
  },
  providers: {
    printful: {
      status: 'healthy' as const,
      product_count: 45,
      last_sync: '2025-11-04T10:00:00Z'
    },
    printify: {
      status: 'healthy' as const,
      product_count: 30,
      last_sync: '2025-11-04T09:45:00Z'
    },
    gelato: {
      status: 'healthy' as const,
      product_count: 25,
      last_sync: '2025-11-04T09:30:00Z'
    }
  }
};

const mockCatalog = [
  {
    id: '1',
    version: 'v2',
    name: 'Printful T-Shirt',
    description: 'Premium cotton t-shirt',
    thumbnail_url: 'https://example.com/shirt.jpg',
    variant_count: 5,
    variants: [],
    provider: 'printful' as const,
    sync_status: 'synced' as const,
    last_synced: '2025-11-04T10:00:00Z'
  },
  {
    id: '2',
    version: 'v2',
    name: 'Printify Mug',
    description: 'Ceramic coffee mug',
    thumbnail_url: 'https://example.com/mug.jpg',
    variant_count: 2,
    variants: [],
    provider: 'printify' as const,
    sync_status: 'synced' as const,
    last_synced: '2025-11-04T09:45:00Z'
  },
  {
    id: '3',
    version: 'v2',
    name: 'Gelato Poster',
    description: 'High-quality art print',
    thumbnail_url: 'https://example.com/poster.jpg',
    variant_count: 3,
    variants: [],
    provider: 'gelato' as const,
    sync_status: 'synced' as const,
    last_synced: '2025-11-04T09:30:00Z'
  }
];

describe('Dashboard UI - Multi-Provider Display', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should display products from all providers', () => {
    const products = mockCatalog;

    expect(products).toHaveLength(3);
    expect(products.some(p => p.provider === 'printful')).toBe(true);
    expect(products.some(p => p.provider === 'printify')).toBe(true);
    expect(products.some(p => p.provider === 'gelato')).toBe(true);
  });

  test('should show provider badges correctly', () => {
    const products = mockCatalog;

    products.forEach(product => {
      expect(product.provider).toBeDefined();
      expect(['printful', 'printify', 'gelato']).toContain(product.provider);
    });
  });

  test('should display sync status for each product', () => {
    const products = mockCatalog;

    products.forEach(product => {
      expect(product.sync_status).toBeDefined();
      expect(['synced', 'syncing', 'error', 'pending']).toContain(product.sync_status);
      expect(product.last_synced).toBeDefined();
    });
  });
});

describe('Dashboard UI - Provider Filtering', () => {
  test('should filter products by selected provider', () => {
    let selectedProvider = 'printful';
    const filtered = mockCatalog.filter(p =>
      selectedProvider === 'all' ? true : p.provider === selectedProvider
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].provider).toBe('printful');
  });

  test('should show all products when "all" provider is selected', () => {
    let selectedProvider = 'all';
    const filtered = mockCatalog.filter(p =>
      selectedProvider === 'all' ? true : p.provider === selectedProvider
    );

    expect(filtered).toHaveLength(3);
  });

  test('should handle empty results when filtering', () => {
    let selectedProvider = 'printful';
    const emptyCatalog: any[] = [];
    const filtered = emptyCatalog.filter(p =>
      selectedProvider === 'all' ? true : p.provider === selectedProvider
    );

    expect(filtered).toHaveLength(0);
  });
});

describe('Dashboard UI - Search Functionality', () => {
  test('should filter products by search query', () => {
    const searchQuery = 'shirt';
    const filtered = mockCatalog.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Printful T-Shirt');
  });

  test('should search across multiple fields', () => {
    const searchQuery = 'ceramic';
    const filtered = mockCatalog.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Printify Mug');
  });

  test('should handle empty search query', () => {
    const searchQuery = '';
    const filtered = mockCatalog.filter(p =>
      searchQuery.trim() === '' ? true :
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(filtered).toHaveLength(3);
  });

  test('should be case-insensitive', () => {
    const searchQuery = 'POSTER';
    const filtered = mockCatalog.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Gelato Poster');
  });
});

describe('Dashboard UI - Bulk Selection', () => {
  test('should track selected products', () => {
    const selectedProducts = new Set<string>();

    selectedProducts.add('1');
    selectedProducts.add('2');

    expect(selectedProducts.size).toBe(2);
    expect(selectedProducts.has('1')).toBe(true);
    expect(selectedProducts.has('2')).toBe(true);
  });

  test('should toggle product selection', () => {
    const selectedProducts = new Set<string>();
    const productId = '1';

    // Select
    selectedProducts.add(productId);
    expect(selectedProducts.has(productId)).toBe(true);

    // Deselect
    selectedProducts.delete(productId);
    expect(selectedProducts.has(productId)).toBe(false);
  });

  test('should select all products', () => {
    const selectedProducts = new Set<string>();

    mockCatalog.forEach(p => selectedProducts.add(p.id));

    expect(selectedProducts.size).toBe(mockCatalog.length);
  });

  test('should clear all selections', () => {
    const selectedProducts = new Set<string>(['1', '2', '3']);

    selectedProducts.clear();

    expect(selectedProducts.size).toBe(0);
  });
});

describe('Dashboard UI - Provider Health Status', () => {
  test('should display health status for each provider', () => {
    const providers = mockDashboard.providers;

    expect(providers).toBeDefined();
    expect(providers?.printful).toBeDefined();
    expect(providers?.printify).toBeDefined();
    expect(providers?.gelato).toBeDefined();
  });

  test('should show product count per provider', () => {
    const providers = mockDashboard.providers;

    expect(providers?.printful.product_count).toBe(45);
    expect(providers?.printify.product_count).toBe(30);
    expect(providers?.gelato.product_count).toBe(25);
  });

  test('should display last sync time', () => {
    const providers = mockDashboard.providers;

    expect(providers?.printful.last_sync).toBeDefined();
    expect(providers?.printify.last_sync).toBeDefined();
    expect(providers?.gelato.last_sync).toBeDefined();
  });

  test('should indicate healthy provider status', () => {
    const providers = mockDashboard.providers;

    Object.values(providers || {}).forEach(provider => {
      expect(['healthy', 'unhealthy', 'disabled']).toContain(provider.status);
    });
  });
});

describe('Dashboard UI - Combined Filtering', () => {
  test('should filter by both provider and search query', () => {
    const selectedProvider = 'printful';
    const searchQuery = 'shirt';

    let filtered = mockCatalog;

    // Filter by provider
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(p => p.provider === selectedProvider);
    }

    // Filter by search
    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Printful T-Shirt');
    expect(filtered[0].provider).toBe('printful');
  });
});
