/**
 * useThreadManagement Hook
 * Manages thread operations: list, load, rename, delete
 */

import { useState, useCallback } from 'react';
import { useConfig } from '../contexts/ConfigContext';

export interface ThreadMetadata {
  thread_id: number;
  thread_name: string;
  created_on: number;
  updated_on: number;
}

// Snowflake API returns an array of threads directly, not wrapped in an object
export type ThreadListResponse = ThreadMetadata[];

export const useThreadManagement = () => {
  const { backendUrl } = useConfig();
  const [threads, setThreads] = useState<ThreadMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List all threads
  const listThreads = useCallback(async (): Promise<ThreadMetadata[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/threads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to list threads: ${response.statusText}`);
      }

      const threadList: ThreadListResponse = await response.json();
      
      // Sort threads by updated_on (most recent first)
      threadList.sort((a, b) => b.updated_on - a.updated_on);
      
      setThreads(threadList);
      return threadList;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list threads';
      setError(errorMessage);
      console.error('Error listing threads:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Load thread data (returns the full thread object)
  const loadThreadData = useCallback(async (threadId: string): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/threads/${threadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to load thread: ${response.statusText}`);
      }

      const threadData = await response.json();
      return threadData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load thread';
      setError(errorMessage);
      console.error('Error loading thread:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Rename thread
  const renameThread = useCallback(async (threadId: string, newName: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/threads/${threadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ thread_name: newName }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to rename thread: ${response.statusText}`);
      }

      // Update local threads list
      setThreads(prevThreads =>
        prevThreads.map(thread =>
          thread.thread_id === parseInt(threadId, 10)
            ? { ...thread, thread_name: newName, updated_on: Date.now() }
            : thread
        )
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename thread';
      setError(errorMessage);
      console.error('Error renaming thread:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Delete thread
  const deleteThread = useCallback(async (threadId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete thread: ${response.statusText}`);
      }

      // Remove from local threads list
      setThreads(prevThreads =>
        prevThreads.filter(thread => thread.thread_id !== parseInt(threadId, 10))
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete thread';
      setError(errorMessage);
      console.error('Error deleting thread:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  return {
    threads,
    loading,
    error,
    listThreads,
    loadThreadData,
    renameThread,
    deleteThread
  };
};

