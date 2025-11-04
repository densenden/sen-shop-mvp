/**
 * Bulk Operations Toolbar
 * Provides bulk actions for selected products across POD providers
 */

import React, { useState } from 'react';
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  Textarea,
  Tooltip,
} from "@medusajs/ui";
import {
  CheckSquare,
  DollarSign,
  Edit,
  Trash2,
  Wand2,
  X,
  Loader2,
  AlertCircle,
  BarChart3,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface BulkOperationsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkPriceUpdate: (config: PriceUpdateConfig) => Promise<void>;
  onBulkStatusChange: (status: string) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onBulkAIGeneration: () => Promise<void>;
  onBulkVariantToggle: (enabled: boolean) => Promise<void>;
}

interface PriceUpdateConfig {
  type: 'percentage' | 'fixed';
  value: number;
  operation: 'increase' | 'decrease' | 'set';
}

type BulkAction = 'price' | 'status' | 'delete' | 'ai' | 'variants' | null;

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkPriceUpdate,
  onBulkStatusChange,
  onBulkDelete,
  onBulkAIGeneration,
  onBulkVariantToggle,
}) => {
  const [activeAction, setActiveAction] = useState<BulkAction>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price update state
  const [priceType, setPriceType] = useState<'percentage' | 'fixed'>('percentage');
  const [priceValue, setPriceValue] = useState<string>('');
  const [priceOperation, setPriceOperation] = useState<'increase' | 'decrease' | 'set'>('increase');

  // Status change state
  const [selectedStatus, setSelectedStatus] = useState<string>('published');

  // Variant toggle state
  const [variantsEnabled, setVariantsEnabled] = useState(true);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handlePriceUpdate = async () => {
    const value = parseFloat(priceValue);
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid price value');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onBulkPriceUpdate({
        type: priceType,
        value,
        operation: priceOperation,
      });
      setActiveAction(null);
      setPriceValue('');
    } catch (err: any) {
      setError(err.message || 'Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    setLoading(true);
    setError(null);

    try {
      await onBulkStatusChange(selectedStatus);
      setActiveAction(null);
    } catch (err: any) {
      setError(err.message || 'Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await onBulkDelete();
      setShowConfirmDelete(false);
      setActiveAction(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete products');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGeneration = async () => {
    setLoading(true);
    setError(null);

    try {
      await onBulkAIGeneration();
      setActiveAction(null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI content');
    } finally {
      setLoading(false);
    }
  };

  const handleVariantToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      await onBulkVariantToggle(variantsEnabled);
      setActiveAction(null);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle variants');
    } finally {
      setLoading(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white dark:bg-ui-bg-base border border-ui-border-base rounded-lg shadow-2xl max-w-4xl">
        {/* Main Toolbar */}
        <div className="flex items-center gap-4 p-4">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-ui-fg-interactive" />
            <Badge color="blue" size="small">
              {selectedCount} selected
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Tooltip content="Update prices">
              <Button
                variant={activeAction === 'price' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setActiveAction(activeAction === 'price' ? null : 'price')}
              >
                <DollarSign className="w-4 h-4" />
                Price
              </Button>
            </Tooltip>

            <Tooltip content="Change status">
              <Button
                variant={activeAction === 'status' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setActiveAction(activeAction === 'status' ? null : 'status')}
              >
                <Edit className="w-4 h-4" />
                Status
              </Button>
            </Tooltip>

            <Tooltip content="Generate AI content">
              <Button
                variant={activeAction === 'ai' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setActiveAction(activeAction === 'ai' ? null : 'ai')}
              >
                <Wand2 className="w-4 h-4" />
                AI Content
              </Button>
            </Tooltip>

            <Tooltip content="Toggle variants">
              <Button
                variant={activeAction === 'variants' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setActiveAction(activeAction === 'variants' ? null : 'variants')}
              >
                <ToggleRight className="w-4 h-4" />
                Variants
              </Button>
            </Tooltip>

            <Tooltip content="Delete selected">
              <Button
                variant={activeAction === 'delete' ? 'danger' : 'secondary'}
                size="small"
                onClick={() => setActiveAction(activeAction === 'delete' ? null : 'delete')}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </Tooltip>
          </div>

          {/* Clear Selection */}
          <Button
            variant="secondary"
            size="small"
            onClick={onClearSelection}
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        </div>

        {/* Action Panel */}
        {activeAction && (
          <div className="border-t border-ui-border-base p-4 bg-ui-bg-subtle dark:bg-ui-bg-base">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Price Update Panel */}
            {activeAction === 'price' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ui-fg-base">Bulk Price Update</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Update Type</Label>
                    <Select value={priceType} onValueChange={(val) => setPriceType(val as any)}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="percentage">Percentage</Select.Item>
                        <Select.Item value="fixed">Fixed Amount</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div>
                    <Label>Operation</Label>
                    <Select value={priceOperation} onValueChange={(val) => setPriceOperation(val as any)}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="increase">Increase by</Select.Item>
                        <Select.Item value="decrease">Decrease by</Select.Item>
                        <Select.Item value="set">Set to</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>

                  <div>
                    <Label>Value</Label>
                    <Input
                      type="number"
                      placeholder={priceType === 'percentage' ? '10' : '5.00'}
                      value={priceValue}
                      onChange={(e) => setPriceValue(e.target.value)}
                      step={priceType === 'percentage' ? '1' : '0.01'}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button variant="secondary" size="small" onClick={() => setActiveAction(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handlePriceUpdate}
                    disabled={loading || !priceValue}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                    Update {selectedCount} Product{selectedCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}

            {/* Status Change Panel */}
            {activeAction === 'status' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ui-fg-base">Change Product Status</h3>
                <div>
                  <Label>New Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="draft">Draft</Select.Item>
                      <Select.Item value="published">Published</Select.Item>
                      <Select.Item value="archived">Archived</Select.Item>
                    </Select.Content>
                  </Select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button variant="secondary" size="small" onClick={() => setActiveAction(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleStatusChange}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
                    Update {selectedCount} Product{selectedCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}

            {/* AI Generation Panel */}
            {activeAction === 'ai' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ui-fg-base">Generate AI Content</h3>
                <p className="text-sm text-ui-fg-subtle">
                  Generate SEO-optimized product descriptions and metadata for {selectedCount} selected product{selectedCount !== 1 ? 's' : ''}.
                  This will create 3 variations per product for you to choose from.
                </p>

                <div className="flex items-center gap-2 justify-end">
                  <Button variant="secondary" size="small" onClick={() => setActiveAction(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleAIGeneration}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Generate Content
                  </Button>
                </div>
              </div>
            )}

            {/* Variant Toggle Panel */}
            {activeAction === 'variants' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-ui-fg-base">Toggle Product Variants</h3>
                <div>
                  <Label>Action</Label>
                  <Select
                    value={variantsEnabled ? 'enable' : 'disable'}
                    onValueChange={(val) => setVariantsEnabled(val === 'enable')}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="enable">Enable All Variants</Select.Item>
                      <Select.Item value="disable">Disable All Variants</Select.Item>
                    </Select.Content>
                  </Select>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <Button variant="secondary" size="small" onClick={() => setActiveAction(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleVariantToggle}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ToggleRight className="w-4 h-4" />}
                    {variantsEnabled ? 'Enable' : 'Disable'} Variants
                  </Button>
                </div>
              </div>
            )}

            {/* Delete Confirmation Panel */}
            {activeAction === 'delete' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-red-600">Delete Products</h3>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Are you sure you want to delete {selectedCount} product{selectedCount !== 1 ? 's' : ''}?
                    This action cannot be undone.
                  </p>
                </div>

                {!showConfirmDelete ? (
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="secondary" size="small" onClick={() => setActiveAction(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => setShowConfirmDelete(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Products
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="secondary" size="small" onClick={() => setShowConfirmDelete(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Confirm Delete
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
