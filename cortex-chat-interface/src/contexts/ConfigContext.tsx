/**
 * ConfigContext
 * Provides configuration (backend URL, display options) to all child components
 */

import React, { createContext, useContext, ReactNode } from 'react';

export interface DisplayConfig {
  /** Show "Thinking & Planning" section (default: false) */
  showThinking?: boolean;
  /** Show "SQL Queries Executed" section (default: false) */
  showSqlQueries?: boolean;
  /** Show "Annotations" section (default: false) */
  showAnnotations?: boolean;
}

export interface ChatConfig {
  backendUrl: string;
  onError?: (error: string) => void;
  displayConfig?: DisplayConfig;
}

const ConfigContext = createContext<ChatConfig | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  config: ChatConfig;
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ config, children }) => {
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
};

