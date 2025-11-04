/**
 * Product Grid Component
 * Enhanced product grid with bulk selection capabilities
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Eye,
  Edit,
  Settings,
  MoreVertical,
  Package,
  DollarSign,
} from 'lucide-react';
import { PODProduct } from '../../common/types/pod-provider';
import { useBulkOperations } from '../hooks/useBulkOperations';

interface ProductGridProps {
  products: PODProduct[];
  onProductEdit?: (product: PODProduct) => void;
  onProductView?: (product: PODProduct) => void;
  onProductSettings?: (product: PODProduct) => void;
  selectionMode?: boolean;
}

interface ProductCardProps {
  product: PODProduct;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit?: () => void;
  onView?: () => void;
  onSettings?: () => void;
  selectionMode?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected,
  onToggleSelect,
  onEdit,
  onView,
  onSettings,
  selectionMode = false,
}) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect();
  };

  const variant = product.variants[0]; // Use first variant for display
  const mockupUrl = variant?.mockupUrl || '/api/placeholder/300/300';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      } ${selectionMode ? 'hover:shadow-md' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Product Image */}
      <div className="aspect-square relative bg-gray-100">
        <img
          src={mockupUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* Selection Checkbox */}
        {(selectionMode || isSelected) && (
          <div className="absolute top-3 left-3">
            <button
              onClick={handleCheckboxClick}
              className={`p-1 rounded transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-white bg-opacity-90 text-gray-600 hover:bg-opacity-100'
              }`}
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(product.status)}`}>
            {product.status}
          </span>
        </div>

        {/* Actions Overlay */}
        {!selectionMode && showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.();
              }}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              title="View Product"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              title="Edit Product"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSettings?.();
              }}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              title="Product Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Pricing Info */}
        {variant && (
          <div className="space-y-1 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price:</span>
              <span className="font-medium">
                {variant.currency} {variant.price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Variants:</span>
              <span className="font-medium">{product.variants.length}</span>
            </div>
          </div>
        )}

        {/* Provider Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Package className="w-3 h-3 mr-1" />
            {product.provider}
          </span>

          <span className="text-xs text-gray-500">
            {new Date(product.updatedAt).toLocaleDateString()}
          </span>
        </div>

        {/* Quick Actions (when not in selection mode) */}
        {!selectionMode && (
          <div className="flex gap-2">
            <button
              onClick={onView}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={onSettings}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
            >
              <MoreVertical className="w-4 h-4 mx-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onProductEdit,
  onProductView,
  onProductSettings,
  selectionMode = false,
}) => {
  const { selectedItems, toggleSelection, isSelected, selectAll, selectNone } = useBulkOperations();

  const handleSelectAll = () => {
    if (selectedItems.length === products.length) {
      selectNone();
    } else {
      selectAll(products.map(p => p.id));
    }
  };

  const isAllSelected = products.length > 0 && selectedItems.length === products.length;
  const isSomeSelected = selectedItems.length > 0;

  // Keyboard support for multi-select
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      handleSelectAll();
    }
    if (e.key === 'Escape') {
      selectNone();
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500">Start by creating your first product design.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Selection Header */}
      {(selectionMode || isSomeSelected) && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All ({products.length})
            </button>

            {isSomeSelected && (
              <span className="text-sm text-gray-500">
                {selectedItems.length} selected
              </span>
            )}
          </div>

          {isSomeSelected && (
            <button
              onClick={selectNone}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isSelected={isSelected(product.id)}
            onToggleSelect={() => toggleSelection(product.id)}
            onEdit={() => onProductEdit?.(product)}
            onView={() => onProductView?.(product)}
            onSettings={() => onProductSettings?.(product)}
            selectionMode={selectionMode || isSomeSelected}
          />
        ))}
      </div>

      {/* Keyboard Shortcuts Help */}
      {(selectionMode || isSomeSelected) && (
        <div className="text-xs text-gray-500 text-center mt-4">
          <kbd className="px-2 py-1 bg-gray-100 rounded">Cmd/Ctrl + A</kbd> to select all,{' '}
          <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> to clear selection
        </div>
      )}
    </div>
  );
};