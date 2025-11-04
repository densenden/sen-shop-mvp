/**
 * Bulk Description Update Form
 * Allows manual description updates or AI-generated descriptions
 */

import React, { useState } from 'react';
import { FileText, Sparkles, X, Copy, RefreshCw } from 'lucide-react';
import { useBulkOperations } from '../hooks/useBulkOperations';

interface BulkDescriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: string[];
}

export const BulkDescriptionForm: React.FC<BulkDescriptionFormProps> = ({
  isOpen,
  onClose,
  selectedItems,
}) => {
  const { bulkUpdateDescriptions, isOperationInProgress } = useBulkOperations();

  const [updateMode, setUpdateMode] = useState<'manual' | 'ai'>('ai');
  const [description, setDescription] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'creative'>('professional');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewDescription, setPreviewDescription] = useState('');

  const handleGeneratePreview = async () => {
    if (!aiKeywords.trim()) return;

    setIsGeneratingPreview(true);

    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const toneVariations = {
      professional: 'Professional quality design perfect for any occasion. Crafted with attention to detail and made from premium materials.',
      casual: 'Cool design that looks great and feels amazing. Perfect for everyday wear or hanging out with friends.',
      creative: 'Express yourself with this unique artistic creation! A bold statement piece that showcases your individual style.'
    };

    const generatedDescription = `${toneVariations[aiTone]} Keywords: ${aiKeywords}. Available in multiple sizes and colors to fit your perfect style.`;

    setPreviewDescription(generatedDescription);
    setIsGeneratingPreview(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (updateMode === 'manual' && !description.trim()) return;
    if (updateMode === 'ai' && !aiKeywords.trim()) return;

    await bulkUpdateDescriptions(selectedItems, updateMode === 'ai');
    onClose();
    setDescription('');
    setAiKeywords('');
    setPreviewDescription('');
  };

  const handleClose = () => {
    if (!isOperationInProgress) {
      onClose();
      setDescription('');
      setAiKeywords('');
      setPreviewDescription('');
    }
  };

  const copyToDescription = () => {
    setDescription(previewDescription);
    setUpdateMode('manual');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">Update Descriptions</h2>
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
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                Updating descriptions for <span className="font-semibold">{selectedItems.length}</span> selected product{selectedItems.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Update Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Update Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUpdateMode('ai')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    updateMode === 'ai'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium">AI Generated</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Generate descriptions using AI based on keywords and tone
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateMode('manual')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    updateMode === 'manual'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Manual Entry</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Write your own description to apply to all selected products
                  </p>
                </button>
              </div>
            </div>

            {/* AI Generation Options */}
            {updateMode === 'ai' && (
              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">AI Generation Settings</h3>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={aiKeywords}
                    onChange={(e) => setAiKeywords(e.target.value)}
                    placeholder="e.g., trendy, comfortable, artistic, vintage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isOperationInProgress}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate keywords with commas to help AI generate relevant descriptions
                  </p>
                </div>

                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone of Voice
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['professional', 'casual', 'creative'] as const).map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setAiTone(tone)}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          aiTone === tone
                            ? 'border-purple-500 bg-purple-100 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        disabled={isOperationInProgress}
                      >
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Generation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Preview
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      disabled={!aiKeywords.trim() || isGeneratingPreview || isOperationInProgress}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
                      {isGeneratingPreview ? 'Generating...' : 'Generate Preview'}
                    </button>
                  </div>

                  {previewDescription ? (
                    <div className="relative">
                      <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm">
                        {previewDescription}
                      </div>
                      <button
                        type="button"
                        onClick={copyToDescription}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy to manual description"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 italic">
                      Enter keywords and click "Generate Preview" to see AI-generated description
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual Description */}
            {updateMode === 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter the description that will be applied to all selected products..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  disabled={isOperationInProgress}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    This description will replace the current description for all selected products
                  </p>
                  <p className="text-xs text-gray-500">
                    {description.length}/500
                  </p>
                </div>
              </div>
            )}

            {/* Template Suggestions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Templates
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "High-quality print with vibrant colors that won't fade. Perfect for everyday wear or special occasions.",
                  "Comfortable fit with premium materials. Express your unique style with this eye-catching design.",
                  "Durable construction meets artistic flair. A must-have addition to any wardrobe collection."
                ].map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setDescription(template);
                      setUpdateMode('manual');
                    }}
                    className="text-left p-3 text-sm bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                    disabled={isOperationInProgress}
                  >
                    {template}
                  </button>
                ))}
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
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={
                (updateMode === 'manual' && !description.trim()) ||
                (updateMode === 'ai' && !aiKeywords.trim()) ||
                isOperationInProgress
              }
            >
              {isOperationInProgress ? 'Updating...' : 'Update Descriptions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};