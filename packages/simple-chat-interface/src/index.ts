/**
 * @chat-overlay/simple-chat-interface
 * 
 * Embeddable chat interface component powered by Snowflake Cortex Agents REST API
 */

// Main Components
export { SimpleChatInterface } from './components/SimpleChatInterface';
export type { SimpleChatInterfaceProps, OverlayConfig, DisplayConfig } from './components/SimpleChatInterface';
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

// Default export
export { SimpleChatInterface as default } from './components/SimpleChatInterface';

