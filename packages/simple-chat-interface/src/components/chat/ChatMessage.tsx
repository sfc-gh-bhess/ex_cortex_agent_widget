/**
 * ChatMessage Component
 * Displays a single chat message (user or assistant) with all associated content
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Fade,
  Stack,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Replay as ReplayIcon
} from '@mui/icons-material';
import { ChatMessage as ChatMessageType } from '../../types/chat';
import { ThinkingSteps } from './ThinkingSteps';
import { SqlQueriesSection } from './SqlQueriesSection';
import { ChartsSection } from './ChartsSection';
import { AnnotationsSection } from './AnnotationsSection';
import { MarkdownFormatter } from './MarkdownFormatter';
import { CHAT_TEXT, MESSAGE_LABELS } from '../../constants/textConstants';

interface ChatMessageProps {
  message: ChatMessageType;
  collapsedThinking: boolean;
  collapsedSqlQueries: boolean;
  collapsedCharts: boolean;
  collapsedAnnotations: boolean;
  onToggleThinking: (messageId: string) => void;
  onToggleSqlQueries: (messageId: string) => void;
  onToggleCharts: (messageId: string) => void;
  onToggleAnnotations: (messageId: string) => void;
  onResendMessage?: (text: string) => void;
  showThinking?: boolean;
  showSqlQueries?: boolean;
  showAnnotations?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  collapsedThinking,
  collapsedSqlQueries,
  collapsedCharts,
  collapsedAnnotations,
  onToggleThinking,
  onToggleSqlQueries,
  onToggleCharts,
  onToggleAnnotations,
  onResendMessage,
  showThinking = false,
  showSqlQueries = false,
  showAnnotations = false
}) => {
  const theme = useTheme();
  const [copySuccess, setCopySuccess] = useState(false);

  // Format timestamp as YYYY-MM-DD HH:MM:SS
  const formatTimestamp = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Handle re-send message
  const handleResend = () => {
    if (onResendMessage && message.text) {
      onResendMessage(message.text);
    }
  };

  return (
    <Fade in={true} timeout={600}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
          maxWidth: { 
            xs: message.sender === 'user' ? '85%' : '100%',
            sm: message.sender === 'user' ? '75%' : '98%'
          },
          width: message.sender === 'user' ? 'auto' : (message.sender === 'assistant' ? { xs: '100%', sm: '98%' } : 'auto'),
        }}
      >
      <Card
        variant={message.sender === 'user' ? 'outlined' : 'elevation'}
        elevation={message.sender === 'user' ? 0 : 3}
        sx={{
          bgcolor: message.sender === 'user' 
            ? theme.palette.primary.main
            : 'background.paper',
          color: message.sender === 'user' ? 'text.primary' : 'text.primary',
          borderRadius: message.sender === 'user' ? 3 : 2,
          border: message.sender === 'assistant' 
            ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
            : 'none',
          boxShadow: message.sender === 'user' 
            ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            : `0 2px 12px ${alpha(theme.palette.grey[500], 0.1)}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: message.sender === 'user' 
              ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
              : `0 4px 20px ${alpha(theme.palette.grey[500], 0.15)}`,
          }
        }}
      >
        <CardContent sx={{ 
          py: message.sender === 'user' ? 2 : 3, 
          px: { xs: 2, sm: message.sender === 'user' ? 2 : 3 }, 
          '&:last-child': { pb: message.sender === 'user' ? 2 : 3 } 
        }}>
          {/* Assistant Thinking Steps */}
          {showThinking && message.sender === 'assistant' && (
            <ThinkingSteps
              messageId={message.id}
              thinkingTexts={message.thinkingTexts}
              thinkingSteps={message.thinkingSteps}
              isStreaming={message.isStreaming}
              streamingStatus={message.streamingStatus}
              collapsed={collapsedThinking}
              onToggle={onToggleThinking}
            />
          )}

          {/* SQL Queries Section - Only show when completed */}
          {showSqlQueries &&
           message.sender === 'assistant' && 
           message.sqlQueries && 
           message.sqlQueries.length > 0 && 
           message.status === 'sent' && 
           !message.isStreaming && (
            <SqlQueriesSection
              messageId={message.id}
              sqlQueries={message.sqlQueries}
              collapsed={collapsedSqlQueries}
              onToggle={onToggleSqlQueries}
            />
          )}

          {/* Charts Section - Only show when completed */}
          {message.sender === 'assistant' && 
           message.charts && 
           message.charts.length > 0 && 
           message.status === 'sent' && 
           !message.isStreaming && (
            <ChartsSection
              messageId={message.id}
              charts={message.charts}
              collapsed={collapsedCharts}
              onToggle={onToggleCharts}
            />
          )}

          {/* Progress Bar - Positioned After Last Accordion */}
          {/* {message.status === 'thinking' && message.sender === 'assistant' && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {CHAT_TEXT.THINKING_STEPS.PROCESSING_REALTIME}
                </Typography>
              </Stack>
              <LinearProgress 
                color="primary" 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }} 
              />
            </Box>
          )} */}
          {/* Agent Status Box - Shows during streaming */}
          {message.sender === 'assistant' && message.isStreaming && (
            <Fade in={true}>
              <Box 
                sx={{ 
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <CircularProgress 
                    size={20} 
                    thickness={4}
                    sx={{ color: theme.palette.primary.main }}
                  />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      flex: 1
                    }}
                  >
                    {message.streamingStatus || 'Processing...'}
                  </Typography>
                </Stack>
              </Box>
            </Fade>
          )}

          {/* Message Text Content */}
          {message.sender === 'user' ? (
            message.text && message.text.trim().length > 0 && (
              <Box>
                <Typography variant="body1" sx={{ 
                  color: 'white',
                  fontWeight: 500
                }}>
                  {message.text}
                </Typography>
              </Box>
            )
          ) : (
            // Assistant message - render with markdown formatting
            message.text && message.text.trim().length > 0 && (
              <Box>
                <MarkdownFormatter content={message.text} theme={theme} />
                
                {/* Annotations Section - Display at bottom of response text */}
                {showAnnotations &&
                 message.status === 'sent' && 
                 !message.isStreaming && 
                 message.annotations && 
                 message.annotations.length > 0 && (
                  <AnnotationsSection
                    messageId={message.id}
                    annotations={message.annotations}
                    collapsed={collapsedAnnotations}
                    onToggle={onToggleAnnotations}
                  />
                )}
              </Box>
            )
          )}
          
          {/* Error */}
          {message.status === 'error' && message.error && message.error.trim().length > 0 && (
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
              {(() => {
                // Split error message into parts
                const errorLines = message.error.split('\n\n');
                const header = errorLines[0]; // "PAWS right there! We have hit a snag :("
                const rest = errorLines.slice(1).join('\n\n');
                
                return (
                  <>
                    {/* Error Header - Bigger and Centered, smaller on mobile */}
                    <Typography 
                      sx={{ 
                        fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                        fontWeight: 700,
                        color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                        textAlign: 'center',
                        mb: rest ? 2 : 0
                      }}
                    >
                      {header}
                    </Typography>
                    
                    {/* Rest of the error message - smaller on mobile */}
                    {rest && (
                      <Typography 
                        sx={{ 
                          fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                          fontWeight: 500,
                          color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6
                        }}
                      >
                        {rest}
                      </Typography>
                    )}
                  </>
                );
              })()}
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Action Buttons - Below the bubble */}
      {/* For User Messages - Show copy and re-ask buttons */}
      {message.sender === 'user' && message.text && message.text.trim().length > 0 && (
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            mt: 0.5,
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            opacity: 0.7,
            '&:hover': { opacity: 1 },
            transition: 'opacity 0.2s'
          }}
        >
          {/* Timestamp */}
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>

          {/* Action Buttons */}
          <Stack direction="row" spacing={0.5}>
            {/* Copy Button */}
            <Tooltip 
              title={copySuccess ? MESSAGE_LABELS.COPY_SUCCESS : MESSAGE_LABELS.COPY_USER_MESSAGE_TOOLTIP}
              arrow
            >
              <IconButton
                onClick={handleCopy}
                size="small"
                sx={{
                  color: 'text.secondary',
                  padding: '4px',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                <CopyIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {/* Re-ask Button */}
            {onResendMessage && (
              <Tooltip title={MESSAGE_LABELS.RESEND_MESSAGE_TOOLTIP} arrow>
                <IconButton
                  onClick={handleResend}
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    padding: '4px',
                    '&:hover': {
                      color: 'primary.main',
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <ReplayIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      )}

      {/* For Assistant Messages - Show disclaimer and copy button only when complete */}
      {message.sender === 'assistant' && message.status === 'sent' && !message.isStreaming && message.text && message.text.trim().length > 0 && (
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ 
            mt: 0.5,
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: 0.7,
            '&:hover': { opacity: 1 },
            transition: 'opacity 0.2s'
          }}
        >
          {/* Timestamp */}
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}
          >
            {formatTimestamp(message.timestamp)}
          </Typography>

          {/* Center section with Disclaimer - Hidden on mobile */}
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontSize: '0.8rem',
              textAlign: 'center',
              flex: 1
            }}
          >
            {MESSAGE_LABELS.DISCLAIMER}
          </Typography>

          {/* Copy Button */}
          <Tooltip 
            title={copySuccess ? MESSAGE_LABELS.COPY_SUCCESS : MESSAGE_LABELS.COPY_ASSISTANT_MESSAGE_TOOLTIP}
            arrow
          >
            <IconButton
              onClick={handleCopy}
              size="small"
              sx={{
                color: 'text.secondary',
                padding: '4px',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              <CopyIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
      </Box>
    </Fade>
  );
};


