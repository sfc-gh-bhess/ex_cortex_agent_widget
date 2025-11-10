import { useState, useEffect, useCallback } from 'react';
import { 
  fetchAgentsConfiguration
} from '../services/snowflakeAgentsApi';
import { useConfig } from '../contexts/ConfigContext';

// Keep backward compatibility with existing AgentConfig interface
export interface AgentConfig {
  displayName: string;
  visible: boolean;
  starterQuestions: string[];
  description?: string;
  tools?: string[];
  createdOn?: string;
  modifiedOn?: string;
  owner?: string;
}

export interface AgentsConfiguration {
  agents: Record<string, AgentConfig>;
  defaultAgent: string;
  source?: 'snowflake-api' | 'static-file' | 'fallback';
  lastFetched?: string;
}

// Removed fallback configuration - show actual errors instead

export const useAgentConfig = () => {
  const { backendUrl, onError } = useConfig();
  const [config, setConfig] = useState<AgentsConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const loadAgentConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch live agents from Snowflake (already fully processed)
      // This will throw an error with HTTP status code if it fails
      const snowflakeConfig = await fetchAgentsConfiguration(backendUrl);
      
      setConfig(snowflakeConfig as AgentsConfiguration);
      setError(null);
      setIsConnected(true);
      
    } catch (err) {
      // Use fullMessage property directly (Error.message normalizes \n\n to \n)
      const errorMessage = (err as any).fullMessage || (err instanceof Error ? err.message : 'Failed to load agent configuration');
      setError(errorMessage);
      setIsConnected(false);
      setConfig(null);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [backendUrl, onError]);

  useEffect(() => {
    loadAgentConfig();
  }, [loadAgentConfig]);

  // Helper function to get only visible agents
  const getVisibleAgents = useCallback(() => {
    if (!config) {
      return {};
    }
    
    const allAgents = Object.entries(config.agents);
    const visibleAgents = allAgents.filter(([_, agent]) => agent.visible);
    return Object.fromEntries(visibleAgents);
  }, [config]);

  // Retry function for manual refresh
  const refreshAgents = useCallback(() => {
    loadAgentConfig();
  }, [loadAgentConfig]);

  return { 
    config, 
    loading, 
    error, 
    isConnected,
    getVisibleAgents, 
    refreshAgents 
  };
};