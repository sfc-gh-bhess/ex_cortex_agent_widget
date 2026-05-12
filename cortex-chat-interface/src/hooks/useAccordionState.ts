/**
 * useAccordionState Hook
 * Manages accordion collapse/expand state for chat message sections
 */

import { useState, useCallback } from 'react';

export const useAccordionState = () => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const collapse = useCallback((id: string) => {
    setCollapsed(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  const expand = useCallback((id: string) => {
    setCollapsed(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const reset = useCallback(() => {
    setCollapsed(new Set());
  }, []);

  return {
    collapsed,
    toggle,
    collapse,
    expand,
    reset,
    isCollapsed: (id: string) => collapsed.has(id)
  };
};


