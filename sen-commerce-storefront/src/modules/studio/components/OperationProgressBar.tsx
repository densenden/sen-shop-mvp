/**
 * Operation Progress Bar
 * Shows progress, success/failure counts, and allows operation cancellation
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X, Eye, Clock } from 'lucide-react';
import { BulkOperationProgress } from '../hooks/useBulkOperations';

interface OperationProgressBarProps {
  progress: BulkOperationProgress;
  onCancel?: () => void;
  showDetailedLog?: boolean;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  itemId?: string;
}

export const OperationProgressBar: React.FC<OperationProgressBarProps> = ({
  progress,
  onCancel,
  showDetailedLog = false,
}) => {
  const [showLog, setShowLog] = useState(false);
  const [operationLog, setOperationLog] = useState<LogEntry[]>([]);

  const { total, processed, errors, currentItem } = progress;
  const successCount = processed - errors;
  const progressPercentage = total > 0 ? (processed / total) * 100 : 0;
  const isComplete = processed >= total;

  // Simulate log entries based on progress
  useEffect(() => {
    if (currentItem) {
      const newEntry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        type: Math.random() > 0.1 ? 'success' : 'error', // 90% success rate simulation
        message: Math.random() > 0.1
          ? `Successfully updated ${currentItem}`
          : `Failed to update ${currentItem}: Network timeout`,
        itemId: currentItem,
      };

      setOperationLog(prev => [...prev.slice(-19), newEntry]); // Keep last 20 entries
    }
  }, [currentItem, processed]);

  const getStatusColor = () => {
    if (errors > 0 && isComplete) return 'text-amber-600';
    if (errors > 0) return 'text-orange-600';
    if (isComplete) return 'text-green-600';
    return 'text-blue-600';
  };

  const getProgressBarColor = () => {
    if (errors > 0 && isComplete) return 'bg-amber-500';
    if (errors > 0) return 'bg-orange-500';
    if (isComplete) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (isComplete) {
      if (errors > 0) {
        return `Completed with ${errors} error${errors > 1 ? 's' : ''}`;
      }
      return 'Completed successfully';
    }
    return `Processing ${currentItem || 'items'}...`;
  };

  return (
    <div className="space-y-4">
      {/* Main Progress Display */}
      <div className="flex items-center gap-4">
        {/* Progress Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <span className="text-sm text-gray-500">
              {processed} of {total} ({progressPercentage.toFixed(1)}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {showDetailedLog && (
            <button
              onClick={() => setShowLog(!showLog)}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Toggle detailed log"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}

          {onCancel && !isComplete && (
            <button
              onClick={onCancel}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Success/Error Counts */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>{successCount} successful</span>
        </div>

        {errors > 0 && (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" />
            <span>{errors} failed</span>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Completed at {new Date().toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Detailed Operation Log */}
      {showLog && showDetailedLog && (
        <div className="mt-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700">Operation Log</h4>
            <button
              onClick={() => setShowLog(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {operationLog.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {operationLog.map((entry) => (
                  <div key={entry.id} className="p-3 flex items-start gap-3">
                    <div className="mt-0.5">
                      {entry.type === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {entry.type === 'error' && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      {entry.type === 'warning' && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      {entry.type === 'info' && (
                        <div className="w-4 h-4 rounded-full bg-blue-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{entry.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.timestamp.toLocaleTimeString()}
                        {entry.itemId && ` • Item: ${entry.itemId}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                No log entries yet
              </div>
            )}
          </div>

          {/* Log Footer */}
          {operationLog.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
              Showing last {operationLog.length} operations
            </div>
          )}
        </div>
      )}

      {/* Completion Summary */}
      {isComplete && (
        <div className={`p-4 rounded-lg ${
          errors > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            {errors > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <h4 className={`font-medium ${
              errors > 0 ? 'text-amber-800' : 'text-green-800'
            }`}>
              Operation Complete
            </h4>
          </div>

          <div className={`mt-2 text-sm ${
            errors > 0 ? 'text-amber-700' : 'text-green-700'
          }`}>
            {errors > 0 ? (
              <p>
                {successCount} item{successCount !== 1 ? 's' : ''} updated successfully,
                {errors} failed. Check the log for details.
              </p>
            ) : (
              <p>
                All {total} item{total !== 1 ? 's' : ''} updated successfully!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};