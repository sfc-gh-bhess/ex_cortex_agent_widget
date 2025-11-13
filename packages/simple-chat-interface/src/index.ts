/**
 * @chat-overlay/simple-chat-interface
 * 
 * Embeddable chat interface component powered by Snowflake Cortex Agents REST API
 */

// Main Components
export { ChatInterface } from './components/ChatInterface';
export type { ChatInterfaceProps } from './components/ChatInterface';

export { InlineChatInterface } from './components/InlineChatInterface';
export type { InlineChatInterfaceProps, DisplayConfig } from './components/InlineChatInterface';

export { FloatingChatInterface } from './components/FloatingChatInterface';
export type { FloatingChatInterfaceProps } from './components/FloatingChatInterface';

// Theme Provider
export { ChatThemeProvider } from './contexts/ChatThemeProvider';
export type { ThemeConfig } from './contexts/ChatThemeProvider';

// Types
export type { ChatMessage, SqlQueryWithVerification, TextAnnotation } from './types/chat';
export type { ChartContent, VegaLiteSpec, ChartType } from './types/chart';
export type { AgentConfig, AgentsConfiguration } from './hooks/useAgentConfig';

// Hooks (for advanced usage)
export { useAgentConfig } from './hooks/useAgentConfig';
export { useChatMessages } from './hooks/useChatMessages';
export { useAccordionState } from './hooks/useAccordionState';
export { useSpeechRecognition } from './hooks/useSpeechRecognition';

// Contexts (for advanced usage)
export { ConfigProvider, useConfig } from './contexts/ConfigContext';
export type { ChatConfig } from './contexts/ConfigContext';

// Theme
export { createAppTheme } from './theme/theme';

// Default export (most common use case)
export { FloatingChatInterface as default } from './components/FloatingChatInterface';

