/**
 * Keyboard Shortcuts Hook
 * Provides keyboard shortcuts for common operations
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

export const useKeyboardShortcuts = ({ enabled = true, shortcuts }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
        const altMatch = !!shortcut.altKey === event.altKey;
        const metaMatch = !!shortcut.metaKey === event.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return { shortcuts };
};

// Common keyboard shortcuts for POD Studio
export const getCommonShortcuts = (callbacks: {
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onSearch?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (callbacks.onUndo) {
    shortcuts.push({
      key: 'z',
      ctrlKey: true,
      description: 'Undo last action',
      action: callbacks.onUndo,
    });
  }

  if (callbacks.onRedo) {
    shortcuts.push(
      {
        key: 'y',
        ctrlKey: true,
        description: 'Redo last undone action',
        action: callbacks.onRedo,
      },
      {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        description: 'Redo last undone action',
        action: callbacks.onRedo,
      }
    );
  }

  if (callbacks.onSelectAll) {
    shortcuts.push({
      key: 'a',
      ctrlKey: true,
      description: 'Select all items',
      action: callbacks.onSelectAll,
    });
  }

  if (callbacks.onDelete) {
    shortcuts.push({
      key: 'Delete',
      description: 'Delete selected items',
      action: callbacks.onDelete,
    });
  }

  if (callbacks.onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      description: 'Save changes',
      action: callbacks.onSave,
    });
  }

  if (callbacks.onSearch) {
    shortcuts.push({
      key: 'f',
      ctrlKey: true,
      description: 'Focus search',
      action: callbacks.onSearch,
    });
  }

  return shortcuts;
};

// Format shortcut for display
export const formatShortcut = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push('Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  if (shortcut.altKey) {
    parts.push('Alt');
  }

  // Format the key
  const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  parts.push(key);

  return parts.join('+');
};
