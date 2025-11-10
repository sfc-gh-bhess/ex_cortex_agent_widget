import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Stack,
  CircularProgress,
  Typography,
  Button,
  alpha,
  useTheme,
  Fab,
  IconButton,
  Paper
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { ConfigProvider, useConfig } from '../contexts/ConfigContext';
import { useAgentConfig } from '../hooks/useAgentConfig';
import { useChatMessages } from '../hooks/useChatMessages';
import { useAccordionState } from '../hooks/useAccordionState';
import { EmptyState } from './chat/EmptyState';
import { StarterQuestions } from './chat/StarterQuestions';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';
import { STATUS_TEXT, ERROR_TEXT } from '../constants/textConstants';

export interface OverlayConfig {
  /** Enable overlay/floating mode */
  enabled: boolean;
  /** Default width when opened (default: '70%') */
  defaultWidth?: string | number;
  /** Default height when opened (default: '70%') */
  defaultHeight?: string | number;
  /** Position of floating button (default: 'bottom-right') */
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Initial state (default: 'minimized') */
  initialState?: 'minimized' | 'expanded';
}

export interface DisplayConfig {
  /** Show "Thinking & Planning" section (default: false) */
  showThinking?: boolean;
  /** Show "SQL Queries Executed" section (default: false) */
  showSqlQueries?: boolean;
  /** Show "Annotations" section (default: false) */
  showAnnotations?: boolean;
}

export interface SimpleChatInterfaceProps {
  backendUrl: string;
  initialAgent?: string;
  onError?: (error: string) => void;
  className?: string;
  style?: React.CSSProperties;
  /** Overlay configuration for floating chat mode */
  overlay?: OverlayConfig;
  /** Display configuration for optional sections */
  displayConfig?: DisplayConfig;
}

const SimpleChatInterfaceInner: React.FC = () => {
  const theme = useTheme();
  const { displayConfig } = useConfig();
  
  // Agent configuration
  const { 
    config: agentConfig, 
    loading: configLoading, 
    error: configError, 
    getVisibleAgents, 
    refreshAgents 
  } = useAgentConfig();

  // Selected agent state
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  
  // Chat messages and streaming
  const { messages, isLoading, sendMessage, cancelRequest, clearMessages } = useChatMessages(selectedAgent);
  
  // Accordion states for different sections
  const thinkingAccordion = useAccordionState();
  const sqlQueriesAccordion = useAccordionState();
  const chartsAccordion = useAccordionState();
  const annotationsAccordion = useAccordionState();
  
  // Input state
  const [inputText, setInputText] = useState('');
  
  // Starter questions state
  const [starterQuestionsExpanded, setStarterQuestionsExpanded] = useState(true);
  
  // Track manually toggled charts (to prevent auto-expansion after manual interaction)
  const [manuallyToggledCharts, setManuallyToggledCharts] = useState<Set<string>>(new Set());
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize selectedAgent when config loads - only set default if no agent is selected
  useEffect(() => {
    if (agentConfig && !selectedAgent) {
      const visibleAgents = getVisibleAgents();
      
      if (Object.keys(visibleAgents).length > 0) {
        // Sort agents alphabetically and select the first one
        const sortedAgentEntries = Object.entries(visibleAgents)
          .sort(([, a], [, b]) => 
            a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase())
          );
        
        const firstAgent = sortedAgentEntries[0][0];
        setSelectedAgent(firstAgent);
      }
    }
  }, [agentConfig, getVisibleAgents, selectedAgent]);

  // Handle case where selected agent becomes invisible
  useEffect(() => {
    if (agentConfig && selectedAgent) {
      const visibleAgents = getVisibleAgents();
      const visibleAgentKeys = Object.keys(visibleAgents);
      
      // If currently selected agent is not visible, switch to first alphabetical one
      if (!visibleAgentKeys.includes(selectedAgent) && visibleAgentKeys.length > 0) {
        const sortedAgentEntries = Object.entries(visibleAgents)
          .sort(([, a], [, b]) => 
            a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase())
          );
        const fallbackAgent = sortedAgentEntries[0][0];
        setSelectedAgent(fallbackAgent);
      }
    }
  }, [agentConfig, selectedAgent, getVisibleAgents]);

  // Clear chat when agent selection changes
  useEffect(() => {
    clearMessages();
    setInputText('');
    thinkingAccordion.reset();
    sqlQueriesAccordion.reset();
    chartsAccordion.reset();
    annotationsAccordion.reset();
    setManuallyToggledCharts(new Set());
  }, [selectedAgent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-collapse thinking steps and SQL queries when response is complete
  useEffect(() => {
    messages.forEach(message => {
      if (message.sender === 'assistant' && 
          message.status === 'sent' && 
          !message.isStreaming) {
        thinkingAccordion.collapse(message.id);
        sqlQueriesAccordion.collapse(message.id);
      }
    });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-expand charts after final response text is displayed
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    messages.forEach(message => {
      if (message.sender === 'assistant' && 
          message.charts && 
          message.charts.length > 0 && 
          message.status === 'sent' && 
          !message.isStreaming &&
          message.text && 
          message.text.trim().length > 0 &&
          !manuallyToggledCharts.has(message.id)) {
        // Auto-expand charts accordion only after final response text is displayed
        const timeoutId = setTimeout(() => {
          chartsAccordion.expand(message.id);
        }, 300);
        timeouts.push(timeoutId);
      }
    });

    return () => {
      timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [messages, manuallyToggledCharts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle form submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      cancelRequest();
    } else if (inputText.trim()) {
      setStarterQuestionsExpanded(false);
      sendMessage(inputText.trim());
      setInputText('');
    }
  }, [inputText, sendMessage, isLoading, cancelRequest]);

  // Handle starter question click
  const handleStarterQuestionClick = useCallback((question: string) => {
    if (question.trim()) {
      setStarterQuestionsExpanded(false);
      sendMessage(question);
    }
  }, [sendMessage]);

  // Handle re-send message
  const handleResendMessage = useCallback((text: string) => {
    if (text.trim()) {
      setStarterQuestionsExpanded(false);
      sendMessage(text);
    }
  }, [sendMessage]);

  // Handle agent change
  const handleAgentChange = useCallback((agent: string) => {
    setSelectedAgent(agent);
    setInputText('');
    setStarterQuestionsExpanded(true);
  }, []);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    clearMessages();
    setInputText('');
    thinkingAccordion.reset();
    sqlQueriesAccordion.reset();
    chartsAccordion.reset();
    annotationsAccordion.reset();
    setManuallyToggledCharts(new Set());
    setStarterQuestionsExpanded(true);
    refreshAgents();
  }, [clearMessages, thinkingAccordion, sqlQueriesAccordion, chartsAccordion, annotationsAccordion, refreshAgents]);

  // Handle chart toggle with manual tracking
  const handleChartToggle = useCallback((messageId: string) => {
    setManuallyToggledCharts(prev => {
      const newSet = new Set(prev);
      newSet.add(messageId);
      return newSet;
    });
    chartsAccordion.toggle(messageId);
  }, [chartsAccordion]);

  // Memoize visible messages for performance
  const visibleMessages = useMemo(() => {
    return messages.filter((message) => {
      const willShowThinking = message.sender === 'assistant' && (
        (message.thinkingTexts && message.thinkingTexts.length > 0 && message.thinkingTexts.some(text => text.trim().length > 0)) ||
        (message.sqlQueries && message.sqlQueries.length > 0)
      );
      const willShowText = message.text && message.text.trim().length > 0;
      const willShowStatus = message.status === 'thinking' && message.isStreaming && (
        (message.thinkingTexts && message.thinkingTexts.length > 0) ||
        (message.sqlQueries && message.sqlQueries.length > 0) ||
        (message.text && message.text.trim().length > 0)
      );
      const willShowError = message.status === 'error' && message.error && message.error.trim().length > 0;
      
      return willShowThinking || willShowText || willShowStatus || willShowError;
    });
  }, [messages]);

  // Get current agent's starter questions
  const currentAgentQuestions = useMemo(() => {
    if (!agentConfig || !selectedAgent) return [];
    return agentConfig.agents[selectedAgent]?.starterQuestions || [];
  }, [agentConfig, selectedAgent]);

  // Get current agent's display name
  const currentAgentName = useMemo(() => {
    if (!agentConfig || !selectedAgent) return '';
    return agentConfig.agents[selectedAgent]?.displayName || selectedAgent;
  }, [agentConfig, selectedAgent]);

  // Show loading state while config is loading
  if (configLoading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            {STATUS_TEXT.LOADING_CONFIG}
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Show error state if config failed to load
  if (configError || !agentConfig) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Stack spacing={3} alignItems="center" sx={{ width: { xs: '100%', sm: '98%' }, maxWidth: 1200 }}>
          {(() => {
                // configError is already a string from the hook
                const errorString = configError || 'An error occurred';
                
                // Split error message: first line is the header, rest goes in the box
                const errorParts = errorString.split('\n\n');
                const errorHeader = errorParts[0] || 'An error occurred';
                const detailsSection = errorParts.slice(1).join('\n\n');
                
                return (
                <Box
                  sx={{
                    mt: 2,
                    py: 1.5,
                    px: 2,
                    backgroundColor: alpha('#ffc107', 0.08),
                    border: `1px solid ${alpha('#ffc107', 0.3)}`,
                    borderRadius: 1.5,
                    borderLeft: `4px solid ${alpha('#ffc107', 0.7)}`,
                  }}
                >
                  {/* Error Header - Bigger and Centered, smaller on mobile */}
                  <Typography 
                    sx={{ 
                      fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                      fontWeight: 700,
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      textAlign: 'center',
                      mb: detailsSection ? 2 : 0
                    }}
                  >
                    {errorHeader}
                  </Typography>
                  
                  {/* Rest of the error message - smaller on mobile */}
                  {detailsSection && (
                    <Typography 
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                        fontWeight: 500,
                        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6
                      }}
                    >
                      {detailsSection}
                    </Typography>
                  )}
                </Box>
          );
          })()}
        </Stack>
      </Box>
    );
  }
  
  // Check if we have no agents after successful API call
  const visibleAgents = getVisibleAgents();
  const hasNoAgents = Object.keys(visibleAgents).length === 0;
  
  if (hasNoAgents) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3 }}>
        <Stack spacing={3} alignItems="center" maxWidth={600}>
          <Typography variant="h5" color="text.primary" fontWeight={600}>
            {ERROR_TEXT.NO_AGENTS_TITLE}
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            {ERROR_TEXT.NO_AGENTS_MESSAGE}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {ERROR_TEXT.NO_AGENTS_HELP}
          </Typography>
          <Button 
            variant="contained" 
            onClick={refreshAgents}
            size="large"
            sx={{ mt: 2 }}
          >
            {ERROR_TEXT.REFRESH_AGENTS}
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',  // Changed from minHeight to height for better container fit
      width: '100%',
      bgcolor: 'background.default', 
      color: 'text.primary' 
    }}>
      {/* Chat Area */}
      <Container maxWidth="lg" sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        py: 3, 
        pb: 2,
        overflow: 'auto',  // Enable scrolling for chat content
        minHeight: 0  // Allow flex child to shrink
      }}>
        {messages.length === 0 ? (
          <Stack spacing={3} sx={{ pt: 2 }}>
            {/* Empty State Greeting */}
            <EmptyState />

            {/* Starter Questions */}
            {currentAgentQuestions.length > 0 && (
              <StarterQuestions
                expanded={starterQuestionsExpanded}
                onToggle={setStarterQuestionsExpanded}
                agentName={currentAgentName}
                questions={currentAgentQuestions}
                onQuestionClick={handleStarterQuestionClick}
              />
            )}
          </Stack>
        ) : (
          <Box sx={{ width: '100%' }}>
            {/* Starter Questions Accordion (shown in chat) */}
            {currentAgentQuestions.length > 0 && (
              <Box sx={{ width: '100%', mb: 3 }}>
                <StarterQuestions
                  expanded={starterQuestionsExpanded}
                  onToggle={setStarterQuestionsExpanded}
                  agentName={currentAgentName}
                  questions={currentAgentQuestions}
                  onQuestionClick={handleStarterQuestionClick}
                />
              </Box>
            )}
            
            {/* Messages */}
            <Stack spacing={3}>
              {visibleMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  collapsedThinking={thinkingAccordion.isCollapsed(message.id)}
                  collapsedSqlQueries={sqlQueriesAccordion.isCollapsed(message.id)}
                  collapsedCharts={chartsAccordion.isCollapsed(message.id)}
                  collapsedAnnotations={annotationsAccordion.isCollapsed(message.id)}
                  onToggleThinking={thinkingAccordion.toggle}
                  onToggleSqlQueries={sqlQueriesAccordion.toggle}
                  onToggleCharts={handleChartToggle}
                  onToggleAnnotations={annotationsAccordion.toggle}
                  onResendMessage={handleResendMessage}
                  showThinking={displayConfig?.showThinking}
                  showSqlQueries={displayConfig?.showSqlQueries}
                  showAnnotations={displayConfig?.showAnnotations}
                />
              ))}
            </Stack>
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Container>

      {/* Input Area */}
      <ChatInput
        inputText={inputText}
        onInputChange={setInputText}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        selectedAgent={selectedAgent}
        agents={agentConfig ? getVisibleAgents() : {}}
        onAgentChange={handleAgentChange}
        onNewChat={handleNewChat}
      />
    </Box>
  );
};

/**
 * Overlay Wrapper Component
 * Handles minimized/expanded state and positioning
 */
interface OverlayWrapperProps {
  overlay: OverlayConfig;
  children: React.ReactNode;
}

const OverlayWrapper: React.FC<OverlayWrapperProps> = ({ overlay, children }) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(
    overlay.initialState === 'expanded'
  );

  // Convert default sizes to pixels for resize calculations
  const getInitialSize = () => {
    const defaultWidth = overlay.defaultWidth || '70%';
    const defaultHeight = overlay.defaultHeight || '70vh';
    
    const width = typeof defaultWidth === 'string' && defaultWidth.endsWith('%')
      ? (window.innerWidth * parseInt(defaultWidth)) / 100
      : typeof defaultWidth === 'string' && defaultWidth.endsWith('px')
      ? parseInt(defaultWidth)
      : typeof defaultWidth === 'number'
      ? defaultWidth
      : window.innerWidth * 0.7;
      
    const height = typeof defaultHeight === 'string' && defaultHeight.endsWith('vh')
      ? (window.innerHeight * parseInt(defaultHeight)) / 100
      : typeof defaultHeight === 'string' && defaultHeight.endsWith('px')
      ? parseInt(defaultHeight)
      : typeof defaultHeight === 'number'
      ? defaultHeight
      : window.innerHeight * 0.7;
      
    return { width, height };
  };

  const [size, setSize] = useState(getInitialSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const position = overlay.buttonPosition || 'bottom-right';

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      // For top-left resize, we subtract delta (dragging left/up increases size)
      const newWidth = Math.max(320, Math.min(window.innerWidth * 0.95, resizeStartRef.current.width - deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight * 0.95, resizeStartRef.current.height - deltaY));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Calculate position styles for FAB
  const getButtonPosition = () => {
    const base = { position: 'fixed' as const, zIndex: 9999 };
    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: 24, right: 24 };
      case 'bottom-left':
        return { ...base, bottom: 24, left: 24 };
      case 'top-right':
        return { ...base, top: 24, right: 24 };
      case 'top-left':
        return { ...base, top: 24, left: 24 };
      default:
        return { ...base, bottom: 24, right: 24 };
    }
  };

  // Floating Action Button (minimized state)
  if (!isExpanded) {
    return (
      <Fab
        color="primary"
        aria-label="open chat"
        onClick={() => setIsExpanded(true)}
        sx={{
          ...getButtonPosition(),
          boxShadow: theme.shadows[8],
          '&:hover': {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s ease-in-out',
          },
        }}
      >
        <ChatIcon />
      </Fab>
    );
  }

  // Expanded overlay state
  return (
    <Paper
      elevation={16}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: theme.shadows[24],
        userSelect: isResizing ? 'none' : 'auto',
        ...(position.startsWith('top') && {
          bottom: 'auto',
          top: 24,
        }),
        ...(position.endsWith('left') && {
          right: 'auto',
          left: 24,
        }),
      }}
    >
      {/* Resize Handle - Top Left */}
      <Box
        onMouseDown={handleResizeStart}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          bgcolor: alpha(theme.palette.primary.main, isResizing ? 0.2 : 0),
          transition: 'background-color 0.2s',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          },
        }}
        title="Drag to resize"
      >
        <DragIndicatorIcon 
          sx={{ 
            fontSize: 20,
            color: theme.palette.text.secondary,
            opacity: 0.6,
            transform: 'rotate(45deg)',
          }} 
        />
      </Box>

      {/* Minimize Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
          <ChatIcon /> Chat Assistant
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(false)}
          aria-label="minimize chat"
          sx={{
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <MinimizeIcon />
        </IconButton>
      </Box>

      {/* Chat Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 0
      }}>
        {children}
      </Box>
    </Paper>
  );
};

export const SimpleChatInterface: React.FC<SimpleChatInterfaceProps> = ({
  backendUrl,
  initialAgent,
  onError,
  className,
  style,
  overlay,
  displayConfig
}) => {
  const content = (
    <ConfigProvider config={{ backendUrl, onError, displayConfig }}>
      <SimpleChatInterfaceInner />
    </ConfigProvider>
  );

  // If overlay mode is enabled, wrap in overlay container
  if (overlay?.enabled) {
    return <OverlayWrapper overlay={overlay}>{content}</OverlayWrapper>;
  }

  // Default inline mode
  return (
    <Box className={className} sx={style}>
      {content}
    </Box>
  );
};

export default SimpleChatInterface;

