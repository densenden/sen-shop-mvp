/**
 * Bulk Operations Hook and Context
 * Manages bulk selection, operations, and undo/redo functionality
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { PODProduct, PODVariant, ProductStatus } from '../../common/types/pod-provider';
import { podProviderManager } from '../../printful/services/pod-provider-facade';

export interface BulkOperationProgress {
  total: number;
  processed: number;
  errors: number;
  currentItem?: string;
}

export interface PriceAdjustment {
  type: 'percentage' | 'fixed';
  value: number;
}

export interface BulkOperation {
  id: string;
  type: 'price_update' | 'status_change' | 'description_update' | 'variant_toggle';
  timestamp: Date;
  affectedItems: string[];
  originalData: Record<string, any>;
  newData: Record<string, any>;
}

interface BulkOperationsState {
  selectedItems: string[];
  isOperationInProgress: boolean;
  operationProgress: BulkOperationProgress | null;
  operationHistory: BulkOperation[];
  currentHistoryIndex: number;
}

type BulkOperationsAction =
  | { type: 'SELECT_ITEM'; payload: string }
  | { type: 'DESELECT_ITEM'; payload: string }
  | { type: 'SELECT_ALL'; payload: string[] }
  | { type: 'SELECT_NONE' }
  | { type: 'START_OPERATION'; payload: BulkOperationProgress }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<BulkOperationProgress> }
  | { type: 'COMPLETE_OPERATION'; payload: BulkOperation }
  | { type: 'UNDO_OPERATION' }
  | { type: 'REDO_OPERATION' }
  | { type: 'CLEAR_HISTORY' };

const initialState: BulkOperationsState = {
  selectedItems: [],
  isOperationInProgress: false,
  operationProgress: null,
  operationHistory: [],
  currentHistoryIndex: -1,
};

function bulkOperationsReducer(
  state: BulkOperationsState,
  action: BulkOperationsAction
): BulkOperationsState {
  switch (action.type) {
    case 'SELECT_ITEM':
      if (state.selectedItems.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        selectedItems: [...state.selectedItems, action.payload],
      };

    case 'DESELECT_ITEM':
      return {
        ...state,
        selectedItems: state.selectedItems.filter(id => id !== action.payload),
      };

    case 'SELECT_ALL':
      return {
        ...state,
        selectedItems: action.payload,
      };

    case 'SELECT_NONE':
      return {
        ...state,
        selectedItems: [],
      };

    case 'START_OPERATION':
      return {
        ...state,
        isOperationInProgress: true,
        operationProgress: action.payload,
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        operationProgress: state.operationProgress
          ? { ...state.operationProgress, ...action.payload }
          : null,
      };

    case 'COMPLETE_OPERATION':
      const newHistory = state.operationHistory.slice(0, state.currentHistoryIndex + 1);
      newHistory.push(action.payload);

      // Keep only last 20 operations
      if (newHistory.length > 20) {
        newHistory.shift();
      }

      return {
        ...state,
        isOperationInProgress: false,
        operationProgress: null,
        operationHistory: newHistory,
        currentHistoryIndex: newHistory.length - 1,
        selectedItems: [], // Clear selection after operation
      };

    case 'UNDO_OPERATION':
      if (state.currentHistoryIndex >= 0) {
        return {
          ...state,
          currentHistoryIndex: state.currentHistoryIndex - 1,
        };
      }
      return state;

    case 'REDO_OPERATION':
      if (state.currentHistoryIndex < state.operationHistory.length - 1) {
        return {
          ...state,
          currentHistoryIndex: state.currentHistoryIndex + 1,
        };
      }
      return state;

    case 'CLEAR_HISTORY':
      return {
        ...state,
        operationHistory: [],
        currentHistoryIndex: -1,
      };

    default:
      return state;
  }
}

interface BulkOperationsContextType {
  selectedItems: string[];
  isOperationInProgress: boolean;
  operationProgress: BulkOperationProgress | null;
  operationHistory: BulkOperation[];
  canUndo: boolean;
  canRedo: boolean;

  // Selection methods
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  selectNone: () => void;
  isSelected: (id: string) => boolean;

  // Bulk operations
  bulkUpdatePrices: (productIds: string[], adjustment: PriceAdjustment) => Promise<void>;
  bulkUpdateStatus: (productIds: string[], status: ProductStatus) => Promise<void>;
  bulkUpdateDescriptions: (productIds: string[], useAI?: boolean) => Promise<void>;
  bulkToggleVariants: (productIds: string[], enable: boolean) => Promise<void>;

  // History operations
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clearHistory: () => void;
}

const BulkOperationsContext = createContext<BulkOperationsContextType | null>(null);

export const BulkOperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bulkOperationsReducer, initialState);

  // Auto-clear history after 30 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'CLEAR_HISTORY' });
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearTimeout(timer);
  }, [state.operationHistory]);

  const toggleSelection = useCallback((id: string) => {
    if (state.selectedItems.includes(id)) {
      dispatch({ type: 'DESELECT_ITEM', payload: id });
    } else {
      dispatch({ type: 'SELECT_ITEM', payload: id });
    }
  }, [state.selectedItems]);

  const selectAll = useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT_ALL', payload: ids });
  }, []);

  const selectNone = useCallback(() => {
    dispatch({ type: 'SELECT_NONE' });
  }, []);

  const isSelected = useCallback((id: string) => {
    return state.selectedItems.includes(id);
  }, [state.selectedItems]);

  const bulkUpdatePrices = useCallback(async (productIds: string[], adjustment: PriceAdjustment) => {
    if (state.isOperationInProgress) return;

    const operationId = `price-update-${Date.now()}`;

    dispatch({
      type: 'START_OPERATION',
      payload: {
        total: productIds.length,
        processed: 0,
        errors: 0,
      },
    });

    try {
      // Simulate API call with progress updates
      const originalData: Record<string, any> = {};
      const newData: Record<string, any> = {};

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];

        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: {
            processed: i + 1,
            currentItem: productId,
          },
        });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Store original and new data for undo
        originalData[productId] = { price: 25.99 }; // Mock original price
        const newPrice = adjustment.type === 'percentage'
          ? 25.99 * (1 + adjustment.value / 100)
          : 25.99 + adjustment.value;
        newData[productId] = { price: newPrice };
      }

      dispatch({
        type: 'COMPLETE_OPERATION',
        payload: {
          id: operationId,
          type: 'price_update',
          timestamp: new Date(),
          affectedItems: productIds,
          originalData,
          newData,
        },
      });
    } catch (error) {
      dispatch({
        type: 'UPDATE_PROGRESS',
        payload: {
          errors: (state.operationProgress?.errors || 0) + 1,
        },
      });
    }
  }, [state.isOperationInProgress, state.operationProgress?.errors]);

  const bulkUpdateStatus = useCallback(async (productIds: string[], status: ProductStatus) => {
    if (state.isOperationInProgress) return;

    const operationId = `status-update-${Date.now()}`;

    dispatch({
      type: 'START_OPERATION',
      payload: {
        total: productIds.length,
        processed: 0,
        errors: 0,
      },
    });

    try {
      const originalData: Record<string, any> = {};
      const newData: Record<string, any> = {};

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];

        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: {
            processed: i + 1,
            currentItem: productId,
          },
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        originalData[productId] = { status: 'draft' }; // Mock original status
        newData[productId] = { status };
      }

      dispatch({
        type: 'COMPLETE_OPERATION',
        payload: {
          id: operationId,
          type: 'status_change',
          timestamp: new Date(),
          affectedItems: productIds,
          originalData,
          newData,
        },
      });
    } catch (error) {
      console.error('Bulk status update failed:', error);
    }
  }, [state.isOperationInProgress]);

  const bulkUpdateDescriptions = useCallback(async (productIds: string[], useAI = false) => {
    if (state.isOperationInProgress) return;

    const operationId = `description-update-${Date.now()}`;

    dispatch({
      type: 'START_OPERATION',
      payload: {
        total: productIds.length,
        processed: 0,
        errors: 0,
      },
    });

    try {
      const originalData: Record<string, any> = {};
      const newData: Record<string, any> = {};

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];

        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: {
            processed: i + 1,
            currentItem: productId,
          },
        });

        await new Promise(resolve => setTimeout(resolve, useAI ? 500 : 100));

        originalData[productId] = { description: 'Original description' };
        newData[productId] = {
          description: useAI
            ? 'AI-generated description with keywords and appeal'
            : 'Updated description'
        };
      }

      dispatch({
        type: 'COMPLETE_OPERATION',
        payload: {
          id: operationId,
          type: 'description_update',
          timestamp: new Date(),
          affectedItems: productIds,
          originalData,
          newData,
        },
      });
    } catch (error) {
      console.error('Bulk description update failed:', error);
    }
  }, [state.isOperationInProgress]);

  const bulkToggleVariants = useCallback(async (productIds: string[], enable: boolean) => {
    if (state.isOperationInProgress) return;

    const operationId = `variant-toggle-${Date.now()}`;

    dispatch({
      type: 'START_OPERATION',
      payload: {
        total: productIds.length,
        processed: 0,
        errors: 0,
      },
    });

    try {
      const originalData: Record<string, any> = {};
      const newData: Record<string, any> = {};

      for (let i = 0; i < productIds.length; i++) {
        const productId = productIds[i];

        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: {
            processed: i + 1,
            currentItem: productId,
          },
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        originalData[productId] = { variantsEnabled: !enable };
        newData[productId] = { variantsEnabled: enable };
      }

      dispatch({
        type: 'COMPLETE_OPERATION',
        payload: {
          id: operationId,
          type: 'variant_toggle',
          timestamp: new Date(),
          affectedItems: productIds,
          originalData,
          newData,
        },
      });
    } catch (error) {
      console.error('Bulk variant toggle failed:', error);
    }
  }, [state.isOperationInProgress]);

  const undo = useCallback(async () => {
    if (state.currentHistoryIndex >= 0) {
      const operation = state.operationHistory[state.currentHistoryIndex];

      // Apply the reverse of the operation (restore original data)
      console.log('Undoing operation:', operation);

      dispatch({ type: 'UNDO_OPERATION' });
    }
  }, [state.currentHistoryIndex, state.operationHistory]);

  const redo = useCallback(async () => {
    if (state.currentHistoryIndex < state.operationHistory.length - 1) {
      const operation = state.operationHistory[state.currentHistoryIndex + 1];

      // Reapply the operation
      console.log('Redoing operation:', operation);

      dispatch({ type: 'REDO_OPERATION' });
    }
  }, [state.currentHistoryIndex, state.operationHistory]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const contextValue: BulkOperationsContextType = {
    selectedItems: state.selectedItems,
    isOperationInProgress: state.isOperationInProgress,
    operationProgress: state.operationProgress,
    operationHistory: state.operationHistory,
    canUndo: state.currentHistoryIndex >= 0,
    canRedo: state.currentHistoryIndex < state.operationHistory.length - 1,

    toggleSelection,
    selectAll,
    selectNone,
    isSelected,

    bulkUpdatePrices,
    bulkUpdateStatus,
    bulkUpdateDescriptions,
    bulkToggleVariants,

    undo,
    redo,
    clearHistory,
  };

  return (
    <BulkOperationsContext.Provider value={contextValue}>
      {children}
    </BulkOperationsContext.Provider>
  );
};

export const useBulkOperations = (): BulkOperationsContextType => {
  const context = useContext(BulkOperationsContext);
  if (!context) {
    throw new Error('useBulkOperations must be used within a BulkOperationsProvider');
  }
  return context;
};