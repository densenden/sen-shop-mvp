/**
 * Bulk Operations Tests
 * Tests for bulk selection, operations, and progress tracking functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BulkOperationsProvider, useBulkOperations } from '../../src/modules/studio/hooks/useBulkOperations';
import { BulkOperationsToolbar } from '../../src/modules/studio/components/BulkOperationsToolbar';
import { ProductGrid } from '../../src/modules/studio/components/ProductGrid';
import { PODProduct } from '../../src/modules/common/types/pod-provider';

// Mock products for testing
const mockProducts: PODProduct[] = [
  {
    id: 'product-1',
    externalId: 'ext-1',
    name: 'Test T-Shirt',
    status: 'published',
    variants: [
      {
        id: 'variant-1',
        externalId: 'ext-variant-1',
        productId: 'product-1',
        name: 'Large Red',
        price: 25.99,
        currency: 'USD',
        availability: true,
      },
    ],
    provider: 'printful',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'product-2',
    externalId: 'ext-2',
    name: 'Test Hoodie',
    status: 'draft',
    variants: [
      {
        id: 'variant-2',
        externalId: 'ext-variant-2',
        productId: 'product-2',
        name: 'Medium Blue',
        price: 45.99,
        currency: 'USD',
        availability: true,
      },
    ],
    provider: 'printify',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Test component to access bulk operations context
const TestComponent: React.FC = () => {
  const {
    selectedItems,
    selectAll,
    selectNone,
    toggleSelection,
    bulkUpdatePrices,
    bulkUpdateStatus,
    isOperationInProgress,
    operationProgress,
    undo,
    canUndo,
  } = useBulkOperations();

  return (
    <div>
      <div data-testid="selected-count">{selectedItems.length}</div>
      <button data-testid="select-all" onClick={() => selectAll(mockProducts.map(p => p.id))}>
        Select All
      </button>
      <button data-testid="select-none" onClick={selectNone}>
        Select None
      </button>
      <button
        data-testid="toggle-product-1"
        onClick={() => toggleSelection('product-1')}
      >
        Toggle Product 1
      </button>
      <button
        data-testid="bulk-price-update"
        onClick={() => bulkUpdatePrices(selectedItems, { type: 'percentage', value: 10 })}
        disabled={selectedItems.length === 0}
      >
        Bulk Price Update
      </button>
      <button
        data-testid="bulk-status-update"
        onClick={() => bulkUpdateStatus(selectedItems, 'published')}
        disabled={selectedItems.length === 0}
      >
        Bulk Status Update
      </button>
      <div data-testid="operation-in-progress">{isOperationInProgress ? 'true' : 'false'}</div>
      <div data-testid="operation-progress">{operationProgress?.processed || 0}</div>
      <button
        data-testid="undo-button"
        onClick={undo}
        disabled={!canUndo}
      >
        Undo
      </button>
    </div>
  );
};

const WrappedTestComponent: React.FC = () => (
  <BulkOperationsProvider>
    <TestComponent />
  </BulkOperationsProvider>
);

describe('Bulk Operations', () => {
  describe('Multi-select functionality', () => {
    test('should handle select all and select none operations', () => {
      render(<WrappedTestComponent />);

      // Initially no items selected
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');

      // Select all items
      fireEvent.click(screen.getByTestId('select-all'));
      expect(screen.getByTestId('selected-count')).toHaveTextContent('2');

      // Select none
      fireEvent.click(screen.getByTestId('select-none'));
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });

    test('should handle individual item selection toggle', () => {
      render(<WrappedTestComponent />);

      // Toggle product 1 selection
      fireEvent.click(screen.getByTestId('toggle-product-1'));
      expect(screen.getByTestId('selected-count')).toHaveTextContent('1');

      // Toggle again to deselect
      fireEvent.click(screen.getByTestId('toggle-product-1'));
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });
  });

  describe('Bulk action toolbar appearance', () => {
    test('should show toolbar when items are selected', () => {
      render(<WrappedTestComponent />);

      // Initially no items selected, buttons should be disabled
      expect(screen.getByTestId('bulk-price-update')).toBeDisabled();
      expect(screen.getByTestId('bulk-status-update')).toBeDisabled();

      // Select an item
      fireEvent.click(screen.getByTestId('toggle-product-1'));

      // Buttons should now be enabled
      expect(screen.getByTestId('bulk-price-update')).toBeEnabled();
      expect(screen.getByTestId('bulk-status-update')).toBeEnabled();
    });
  });

  describe('Bulk operation execution', () => {
    test('should execute bulk price update operation', async () => {
      render(<WrappedTestComponent />);

      // Select an item
      fireEvent.click(screen.getByTestId('toggle-product-1'));

      // Trigger bulk price update
      fireEvent.click(screen.getByTestId('bulk-price-update'));

      // Should show operation in progress
      await waitFor(() => {
        expect(screen.getByTestId('operation-in-progress')).toHaveTextContent('true');
      });

      // Operation should complete (mocked to complete quickly)
      await waitFor(() => {
        expect(screen.getByTestId('operation-in-progress')).toHaveTextContent('false');
      }, { timeout: 2000 });
    });

    test('should execute bulk status update operation', async () => {
      render(<WrappedTestComponent />);

      // Select items
      fireEvent.click(screen.getByTestId('select-all'));

      // Trigger bulk status update
      fireEvent.click(screen.getByTestId('bulk-status-update'));

      // Should show operation in progress
      await waitFor(() => {
        expect(screen.getByTestId('operation-in-progress')).toHaveTextContent('true');
      });

      // Operation should complete
      await waitFor(() => {
        expect(screen.getByTestId('operation-in-progress')).toHaveTextContent('false');
      }, { timeout: 2000 });
    });
  });

  describe('Undo functionality', () => {
    test('should enable undo after successful bulk operation', async () => {
      render(<WrappedTestComponent />);

      // Initially undo should not be available
      expect(screen.getByTestId('undo-button')).toBeDisabled();

      // Select an item and perform operation
      fireEvent.click(screen.getByTestId('toggle-product-1'));
      fireEvent.click(screen.getByTestId('bulk-price-update'));

      // Wait for operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('operation-in-progress')).toHaveTextContent('false');
      }, { timeout: 2000 });

      // Undo should now be available
      await waitFor(() => {
        expect(screen.getByTestId('undo-button')).toBeEnabled();
      });
    });

    test('should execute undo operation successfully', async () => {
      render(<WrappedTestComponent />);

      // Perform a bulk operation first
      fireEvent.click(screen.getByTestId('toggle-product-1'));
      fireEvent.click(screen.getByTestId('bulk-price-update'));

      // Wait for operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('undo-button')).toBeEnabled();
      }, { timeout: 2000 });

      // Execute undo
      fireEvent.click(screen.getByTestId('undo-button'));

      // Undo should disable after execution
      await waitFor(() => {
        expect(screen.getByTestId('undo-button')).toBeDisabled();
      });
    });
  });
});