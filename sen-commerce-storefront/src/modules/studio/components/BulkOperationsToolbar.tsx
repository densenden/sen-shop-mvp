/**
 * Bulk Operations Toolbar
 * Shows bulk action controls when items are selected
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  DollarSign,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  Undo,
  Redo,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { ProductStatus } from '../../common/types/pod-provider';
import { BulkPriceForm } from './BulkPriceForm';
import { BulkDescriptionForm } from './BulkDescriptionForm';
import { OperationProgressBar } from './OperationProgressBar';

interface BulkOperationsToolbarProps {
  totalItems: number;
  onCancel?: () => void;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  totalItems,
  onCancel,
}) => {
  const {
    selectedItems,
    selectAll,
    selectNone,
    isOperationInProgress,
    operationProgress,
    canUndo,
    canRedo,
    bulkUpdateStatus,
    bulkToggleVariants,
    undo,
    redo,
  } = useBulkOperations();

  const [showPriceForm, setShowPriceForm] = useState(false);
  const [showDescriptionForm, setShowDescriptionForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    type: string;
    action: () => void;
  } | null>(null);

  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;
  const isSomeSelected = selectedItems.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      selectNone();
    } else {
      // In a real implementation, you'd pass all available product IDs
      const allIds = Array.from({ length: totalItems }, (_, i) => `product-${i + 1}`);
      selectAll(allIds);
    }
  };

  const handleStatusUpdate = (status: ProductStatus) => {
    setShowConfirmDialog({
      type: `Change status to ${status}`,
      action: () => {
        bulkUpdateStatus(selectedItems, status);
        setShowConfirmDialog(null);
      },
    });
  };

  const handleToggleVariants = (enable: boolean) => {
    setShowConfirmDialog({
      type: enable ? 'Enable all variants' : 'Disable all variants',
      action: () => {
        bulkToggleVariants(selectedItems, enable);
        setShowConfirmDialog(null);
      },
    });
  };

  const handleDelete = () => {
    setShowConfirmDialog({
      type: 'Delete selected products',
      action: () => {
        // Implementation would call actual delete function
        console.log('Deleting products:', selectedItems);
        setShowConfirmDialog(null);
      },
    });
  };

  if (!isSomeSelected && !isOperationInProgress) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transition-transform duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {isOperationInProgress && operationProgress ? (
            <OperationProgressBar progress={operationProgress} />
          ) : (
            <div className="flex items-center justify-between">
              {/* Selection Info */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                  disabled={isOperationInProgress}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {selectedItems.length} of {totalItems} selected
                </button>

                {isSomeSelected && (
                  <button
                    onClick={selectNone}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    disabled={isOperationInProgress}
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Status Updates */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusUpdate('published')}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    disabled={isOperationInProgress}
                    title="Publish selected"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('draft')}
                    className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                    disabled={isOperationInProgress}
                    title="Set as draft"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('archived')}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    disabled={isOperationInProgress}
                    title="Archive selected"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Separator */}
                <div className="w-px h-6 bg-gray-300 mx-2" />

                {/* Main Actions */}
                <button
                  onClick={() => setShowPriceForm(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-2"
                  disabled={isOperationInProgress}
                >
                  <DollarSign className="w-4 h-4" />
                  Update Prices
                </button>

                <button
                  onClick={() => setShowDescriptionForm(true)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-2"
                  disabled={isOperationInProgress}
                >
                  <FileText className="w-4 h-4" />
                  Update Descriptions
                </button>

                <button
                  onClick={() => handleToggleVariants(true)}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-2"
                  disabled={isOperationInProgress}
                  title="Enable all variants"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleToggleVariants(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
                  disabled={isOperationInProgress}
                  title="Disable all variants"
                >
                  <EyeOff className="w-4 h-4" />
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-2"
                  disabled={isOperationInProgress}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>

                {/* Separator */}
                <div className="w-px h-6 bg-gray-300 mx-2" />

                {/* Undo/Redo */}
                <button
                  onClick={undo}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={!canUndo || isOperationInProgress}
                  title="Undo last operation"
                >
                  <Undo className="w-4 h-4" />
                </button>

                <button
                  onClick={redo}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={!canRedo || isOperationInProgress}
                  title="Redo operation"
                >
                  <Redo className="w-4 h-4" />
                </button>

                {/* Close */}
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700"
                    disabled={isOperationInProgress}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      <BulkPriceForm
        isOpen={showPriceForm}
        onClose={() => setShowPriceForm(false)}
        selectedItems={selectedItems}
      />

      <BulkDescriptionForm
        isOpen={showDescriptionForm}
        onClose={() => setShowDescriptionForm(false)}
        selectedItems={selectedItems}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold">Confirm Action</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to {showConfirmDialog.type.toLowerCase()}? This action will
              affect {selectedItems.length} product{selectedItems.length > 1 ? 's' : ''}.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmDialog.action}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};