/**
 * Bulk Price Update Form
 * Allows percentage or fixed price adjustments for selected products
 */

import React, { useState } from 'react';
import { DollarSign, Percent, X, Calculator } from 'lucide-react';
import { useBulkOperations, PriceAdjustment } from '../hooks/useBulkOperations';

interface BulkPriceFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: string[];
}

export const BulkPriceForm: React.FC<BulkPriceFormProps> = ({
  isOpen,
  onClose,
  selectedItems,
}) => {
  const { bulkUpdatePrices, isOperationInProgress } = useBulkOperations();

  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<string>('');
  const [previewEnabled, setPreviewEnabled] = useState(true);

  // Mock current prices for preview calculation
  const mockCurrentPrices = selectedItems.map((_, index) => 25.99 + index * 5);
  const averageCurrentPrice = mockCurrentPrices.reduce((sum, price) => sum + price, 0) / mockCurrentPrices.length;

  const calculateNewPrice = (currentPrice: number): number => {
    const numValue = parseFloat(value) || 0;
    if (adjustmentType === 'percentage') {
      return currentPrice * (1 + numValue / 100);
    } else {
      return currentPrice + numValue;
    }
  };

  const previewPrice = value ? calculateNewPrice(averageCurrentPrice) : averageCurrentPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!value || parseFloat(value) === 0) return;

    const adjustment: PriceAdjustment = {
      type: adjustmentType,
      value: parseFloat(value),
    };

    await bulkUpdatePrices(selectedItems, adjustment);
    onClose();
    setValue('');
  };

  const handleClose = () => {
    if (!isOperationInProgress) {
      onClose();
      setValue('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Update Prices</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isOperationInProgress}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Selection Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Updating prices for <span className="font-semibold">{selectedItems.length}</span> selected product{selectedItems.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Adjustment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('percentage')}
                  className={`p-3 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                    adjustmentType === 'percentage'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Percent className="w-5 h-5" />
                  <span className="font-medium">Percentage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('fixed')}
                  className={`p-3 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                    adjustmentType === 'fixed'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">Fixed Amount</span>
                </button>
              </div>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {adjustmentType === 'percentage' ? 'Percentage Change' : 'Amount to Add/Subtract'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={adjustmentType === 'percentage' ? 'e.g., 10 for +10%' : 'e.g., 5.00 for +$5.00'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step={adjustmentType === 'percentage' ? '0.1' : '0.01'}
                  disabled={isOperationInProgress}
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  {adjustmentType === 'percentage' ? '%' : '$'}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {adjustmentType === 'percentage'
                  ? 'Use negative values to decrease prices (e.g., -10 for 10% off)'
                  : 'Use negative values to subtract from prices (e.g., -2.50 to reduce by $2.50)'
                }
              </p>
            </div>

            {/* Preview */}
            {previewEnabled && value && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Preview</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Current average price: <span className="font-mono">${averageCurrentPrice.toFixed(2)}</span></p>
                  <p>New average price: <span className="font-mono font-semibold">${previewPrice.toFixed(2)}</span></p>
                  <p className="mt-1">
                    Change: <span className={`font-semibold ${previewPrice > averageCurrentPrice ? 'text-green-600' : 'text-red-600'}`}>
                      {previewPrice > averageCurrentPrice ? '+' : ''}${(previewPrice - averageCurrentPrice).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Common Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Adjustments
              </label>
              <div className="grid grid-cols-3 gap-2">
                {adjustmentType === 'percentage' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setValue('10')}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      disabled={isOperationInProgress}
                    >
                      +10%
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('20')}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      disabled={isOperationInProgress}
                    >
                      +20%
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('-15')}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      disabled={isOperationInProgress}
                    >
                      -15%
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setValue('5')}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      disabled={isOperationInProgress}
                    >
                      +$5
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('10')}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      disabled={isOperationInProgress}
                    >
                      +$10
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('-2')}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      disabled={isOperationInProgress}
                    >
                      -$2
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isOperationInProgress}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={!value || parseFloat(value) === 0 || isOperationInProgress}
            >
              {isOperationInProgress ? 'Updating...' : 'Update Prices'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};