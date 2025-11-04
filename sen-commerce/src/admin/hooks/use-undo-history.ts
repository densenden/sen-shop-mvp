/**
 * Undo/Redo History Hook
 * Manages action history for bulk operations with undo/redo capabilities
 */

import { useEffect, useRef, useState } from 'react';

export interface HistoryAction {
  id: string;
  type: 'price_update' | 'status_change' | 'delete' | 'ai_generation' | 'variant_toggle' | 'create';
  timestamp: number;
  affectedItems: string[];
  previousState: Record<string, any>;
  newState: Record<string, any>;
  description: string;
}

interface UseUndoHistoryOptions {
  maxHistorySize?: number;
  autoExpireMinutes?: number;
  persistToSession?: boolean;
}

const SESSION_STORAGE_KEY = 'pod_studio_undo_history';
const HISTORY_TIMESTAMP_KEY = 'pod_studio_undo_timestamp';

export const useUndoHistory = (options: UseUndoHistoryOptions = {}) => {
  const {
    maxHistorySize = 20,
    autoExpireMinutes = 30,
    persistToSession = true,
  } = options;

  const [undoStack, setUndoStack] = useState<HistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([]);
  const [lastAction, setLastAction] = useState<HistoryAction | null>(null);
  const expirationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from session storage on mount
  useEffect(() => {
    if (persistToSession) {
      loadFromSession();
    }

    // Set up expiration check
    if (autoExpireMinutes > 0) {
      checkExpiration();
      expirationTimerRef.current = setInterval(checkExpiration, 60000); // Check every minute
    }

    return () => {
      if (expirationTimerRef.current) {
        clearInterval(expirationTimerRef.current);
      }
    };
  }, []);

  // Save to session storage whenever stacks change
  useEffect(() => {
    if (persistToSession) {
      saveToSession();
    }
  }, [undoStack, redoStack]);

  const loadFromSession = () => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const timestamp = sessionStorage.getItem(HISTORY_TIMESTAMP_KEY);

      if (stored && timestamp) {
        const lastUpdate = parseInt(timestamp, 10);
        const now = Date.now();
        const expireMs = autoExpireMinutes * 60 * 1000;

        // Check if history has expired
        if (now - lastUpdate < expireMs) {
          const data = JSON.parse(stored);
          setUndoStack(data.undoStack || []);
          setRedoStack(data.redoStack || []);
        } else {
          // Clear expired history
          clearHistory();
        }
      }
    } catch (error) {
      console.error('Failed to load undo history from session:', error);
    }
  };

  const saveToSession = () => {
    try {
      const data = {
        undoStack,
        redoStack,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      sessionStorage.setItem(HISTORY_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to save undo history to session:', error);
    }
  };

  const checkExpiration = () => {
    try {
      const timestamp = sessionStorage.getItem(HISTORY_TIMESTAMP_KEY);
      if (timestamp) {
        const lastUpdate = parseInt(timestamp, 10);
        const now = Date.now();
        const expireMs = autoExpireMinutes * 60 * 1000;

        if (now - lastUpdate >= expireMs) {
          clearHistory();
        }
      }
    } catch (error) {
      console.error('Failed to check history expiration:', error);
    }
  };

  const addAction = (action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
    const newAction: HistoryAction = {
      ...action,
      id: generateActionId(),
      timestamp: Date.now(),
    };

    setUndoStack((prev) => {
      const newStack = [...prev, newAction];
      // Keep only the last N actions
      return newStack.slice(-maxHistorySize);
    });

    // Clear redo stack when a new action is added
    setRedoStack([]);
    setLastAction(newAction);

    return newAction.id;
  };

  const undo = async (onRestore: (action: HistoryAction) => Promise<void>) => {
    if (undoStack.length === 0) {
      return false;
    }

    const actionToUndo = undoStack[undoStack.length - 1];

    try {
      // Execute the restore callback
      await onRestore(actionToUndo);

      // Move action from undo to redo stack
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, actionToUndo]);
      setLastAction(actionToUndo);

      return true;
    } catch (error) {
      console.error('Failed to undo action:', error);
      throw error;
    }
  };

  const redo = async (onApply: (action: HistoryAction) => Promise<void>) => {
    if (redoStack.length === 0) {
      return false;
    }

    const actionToRedo = redoStack[redoStack.length - 1];

    try {
      // Execute the apply callback
      await onApply(actionToRedo);

      // Move action from redo to undo stack
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, actionToRedo]);
      setLastAction(actionToRedo);

      return true;
    } catch (error) {
      console.error('Failed to redo action:', error);
      throw error;
    }
  };

  const clearHistory = () => {
    setUndoStack([]);
    setRedoStack([]);
    setLastAction(null);

    if (persistToSession) {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(HISTORY_TIMESTAMP_KEY);
      } catch (error) {
        console.error('Failed to clear history from session:', error);
      }
    }
  };

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  return {
    // State
    undoStack,
    redoStack,
    lastAction,
    canUndo,
    canRedo,

    // Actions
    addAction,
    undo,
    redo,
    clearHistory,
  };
};

// Helper function to generate unique action IDs
const generateActionId = (): string => {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
