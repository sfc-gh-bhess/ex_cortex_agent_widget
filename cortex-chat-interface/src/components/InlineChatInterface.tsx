/**
 * InlineChatInterface Component
 * Chat interface for inline/embedded usage with ConfigProvider wrapper
 */

import React from 'react';
import { Box } from '@mui/material';
import { ConfigProvider } from '../contexts/ConfigContext';
import { ChatInterface } from './ChatInterface';

export interface DisplayConfig {
  /** Show "Thinking & Planning" section (default: false) */
  showThinking?: boolean;
  /** Show "SQL Queries Executed" section (default: false) */
  showSqlQueries?: boolean;
  /** Show "Annotations" section (default: false) */
  showAnnotations?: boolean;
}

export interface InlineChatInterfaceProps {
  backendUrl: string;
  applicationName?: string;
  initialAgent?: string;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
  displayConfig?: DisplayConfig;
}

export const InlineChatInterface: React.FC<InlineChatInterfaceProps> = ({
  backendUrl,
  applicationName,
  initialAgent,
  onError,
  className,
  style,
  displayConfig
}) => {
  return (
    <ConfigProvider config={{ backendUrl, applicationName, onError, displayConfig }}>
      <Box className={className} sx={style}>
        <ChatInterface />
      </Box>
    </ConfigProvider>
  );
};

