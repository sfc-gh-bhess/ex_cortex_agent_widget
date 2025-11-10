/**
 * ChatInput Component
 * Handles user input with agent selector and message sending
 */

import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Stack,
  alpha,
  InputAdornment,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  KeyboardArrowUp as ArrowUpIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Mic as MicIcon
} from '@mui/icons-material';
import { CHAT_TEXT } from '../../constants/textConstants';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface AgentConfig {
  displayName: string;
  starterQuestions?: string[];
}

interface ChatInputProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  selectedAgent: string;
  agents: Record<string, AgentConfig>;
  onAgentChange: (agent: string) => void;
  onNewChat: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputText,
  onInputChange,
  onSubmit,
  isLoading,
  selectedAgent,
  agents,
  onAgentChange,
  onNewChat
}) => {
  // Sort agents alphabetically for consistent ordering
  const sortedAgents = Object.entries(agents).sort(([, a], [, b]) => 
    a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase())
  );

  // Responsive design - check if mobile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Speech recognition hook
  const {
    isListening,
    transcript,
    state: recognitionState,
    error: recognitionError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();

  // Update input text when transcript is finalized
  useEffect(() => {
    if (transcript && recognitionState === 'processing') {
      // Wait a brief moment to ensure the transcript is stable
      const timer = setTimeout(() => {
        onInputChange(transcript);
        resetTranscript();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [transcript, recognitionState, onInputChange, resetTranscript]);

  // Handle microphone button click
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Get microphone button tooltip
  const getMicTooltip = () => {
    if (!isSpeechSupported) {
      return 'Voice input not supported in this browser';
    }
    if (recognitionError) {
      return recognitionError;
    }
    if (isListening) {
      return 'Stop recording';
    }
    return 'Click to speak';
  };

  // Get microphone button color based on state
  const getMicColor = () => {
    if (recognitionError && recognitionState === 'error') {
      return 'error.main';
    }
    if (isListening) {
      return 'error.main'; // Red while recording
    }
    return 'text.secondary';
  };

  // Show interim transcript or regular input text
  const getInputValue = () => {
    if (isListening && transcript) {
      return transcript;
    }
    if (isListening && !transcript) {
      return 'Listening...';
    }
    return inputText;
  };

  // Render microphone button (reusable component)
  const renderMicrophoneButton = (inlineStyle = false) => (
    <Tooltip title={getMicTooltip()} arrow>
      <span>
        <IconButton
          onClick={handleMicClick}
          disabled={isLoading || !isSpeechSupported}
          size="small"
          edge={inlineStyle ? "end" : undefined}
          sx={{
            ...(inlineStyle ? {
              // Inside input field (desktop) - compact style
              color: getMicColor(),
              transition: 'all 0.2s ease',
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                  transform: 'scale(1)'
                },
                '50%': {
                  opacity: 0.8,
                  transform: 'scale(1.05)'
                }
              },
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1)
              },
              '&:disabled': {
                color: 'action.disabled'
              }
            } : {
              // Standalone button (mobile) - larger, more prominent
              width: 40,
              height: 40,
              borderRadius: 1.5,
              backgroundColor: (theme) => isListening
                ? alpha(theme.palette.error.main, 0.1)
                : theme.palette.mode === 'dark'
                ? alpha(theme.palette.grey[800], 0.6)
                : alpha(theme.palette.grey[100], 0.8),
              border: (theme) => isListening
                ? `2px solid ${theme.palette.error.main}`
                : theme.palette.mode === 'dark'
                ? `1px solid ${alpha(theme.palette.grey[600], 0.3)}`
                : `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
              color: getMicColor(),
              transition: 'all 0.2s ease',
              animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 1,
                  transform: 'scale(1)'
                },
                '50%': {
                  opacity: 0.8,
                  transform: 'scale(1.05)'
                }
              },
              '&:hover': {
                backgroundColor: (theme) => isListening
                  ? alpha(theme.palette.error.main, 0.15)
                  : theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.primary.main, 0.05),
                borderColor: (theme) => isListening
                  ? theme.palette.error.main
                  : alpha(theme.palette.primary.main, 0.5),
                transform: 'translateY(-1px)',
                boxShadow: (theme) => isListening
                  ? `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`
                  : `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
              },
              '&:active': {
                transform: 'translateY(0px)'
              },
              '&:disabled': {
                color: 'action.disabled',
                backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.12),
                borderColor: (theme) => alpha(theme.palette.action.disabled, 0.12)
              }
            })
          }}
        >
          <MicIcon />
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'sticky',
        bottom: 0,
        borderRadius: 0,
        borderTop: '2px solid',
        borderColor: (theme) => theme.palette.mode === 'dark' 
          ? alpha(theme.palette.primary.main, 0.3)
          : alpha(theme.palette.primary.main, 0.2),
        bgcolor: (theme) => theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.95)
          : alpha(theme.palette.background.paper, 0.98),
        backdropFilter: 'blur(10px)',
        boxShadow: (theme) => theme.palette.mode === 'dark'
          ? `0 -8px 32px ${alpha(theme.palette.common.black, 0.6)}, 0 -2px 16px ${alpha(theme.palette.primary.main, 0.1)}`
          : `0 -8px 32px ${alpha(theme.palette.grey[500], 0.2)}, 0 -4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
        zIndex: 1000
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          py: 1.5,
          mt: 0.25,
          mb: 0.25
        }}>
          <Box component="form" onSubmit={onSubmit}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={{ xs: 1.5, sm: 1.5 }} 
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              {/* Top row on mobile, left side on desktop */}
              <Stack 
                direction="row" 
                spacing={1.5} 
                sx={{ 
                  width: { xs: '100%', sm: 'auto' },
                  alignItems: 'center'
                }}
              >
                {/* Agent Selector */}
                <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 180 }, flex: { xs: 1, sm: 'none' } }}>
                  <Select
                    value={selectedAgent}
                    disabled={isLoading}
                    onChange={(event) => onAgentChange(event.target.value as string)}
                    sx={{
                      borderRadius: 1.5,
                      backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.default, 0.6)
                        : alpha(theme.palette.grey[50], 0.8),
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: (theme) => theme.palette.mode === 'dark'
                            ? alpha(theme.palette.grey[600], 0.3)
                            : alpha(theme.palette.grey[300], 0.5),
                        },
                        '&:hover': {
                          backgroundColor: (theme) => theme.palette.mode === 'dark'
                            ? alpha(theme.palette.background.default, 0.8)
                            : alpha(theme.palette.grey[50], 1),
                          '& fieldset': {
                            borderColor: (theme) => alpha(theme.palette.primary.main, 0.5)
                          }
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: '2px'
                        },
                      },
                      '& .MuiSelect-select': {
                        color: 'text.primary',
                        fontWeight: 500
                      },
                      '& .MuiSelect-icon': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {sortedAgents.map(([key, agent]) => (
                      <MenuItem key={key} value={key}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {agent.displayName}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* New Chat Button */}
                <Tooltip title={CHAT_TEXT.INPUT.NEW_CHAT_TOOLTIP} arrow>
                  <IconButton
                    onClick={onNewChat}
                    disabled={isLoading}
                    size="small"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      backgroundColor: (theme) => theme.palette.mode === 'dark'
                        ? alpha(theme.palette.grey[800], 0.6)
                        : alpha(theme.palette.grey[100], 0.8),
                      border: (theme) => theme.palette.mode === 'dark'
                        ? `1px solid ${alpha(theme.palette.grey[600], 0.3)}`
                        : `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                      color: 'primary.main',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'dark'
                          ? alpha(theme.palette.primary.main, 0.1)
                          : alpha(theme.palette.primary.main, 0.05),
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                        color: 'primary.main',
                        transform: 'translateY(-1px)',
                        boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                      },
                      '&:active': {
                        transform: 'translateY(0px)'
                      },
                      '&:disabled': {
                        color: 'action.disabled',
                        backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.12),
                        borderColor: (theme) => alpha(theme.palette.action.disabled, 0.12)
                      }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              
              {/* Bottom row on mobile, right side on desktop - Text Input, Mic, and Send Button */}
              <Stack 
                direction="row" 
                spacing={1.5} 
                sx={{ 
                  flex: 1, 
                  width: '100%',
                  alignItems: 'center'
                }}
              >
                {/* Text Input */}
                <Box sx={{ flex: 1, maxWidth: { xs: '100%', sm: isMobile ? '100%' : '91%' } }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={getInputValue()}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        if (inputText.trim() && !isLoading) {
                          onSubmit(e as any);
                        }
                      }
                    }}
                    placeholder={isLoading ? CHAT_TEXT.INPUT.PLACEHOLDER_LOADING : CHAT_TEXT.INPUT.PLACEHOLDER}
                    disabled={isLoading || isListening}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      // Show microphone inside input on desktop only
                      endAdornment: !isMobile ? (
                        <InputAdornment position="end">
                          {renderMicrophoneButton(true)}
                        </InputAdornment>
                      ) : undefined
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        backgroundColor: (theme) => isListening
                          ? alpha(theme.palette.error.main, 0.05)
                          : theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.default, 0.6)
                          : alpha(theme.palette.grey[50], 0.8),
                        border: (theme) => isListening
                          ? `1px solid ${alpha(theme.palette.error.main, 0.5)}`
                          : theme.palette.mode === 'dark'
                          ? `1px solid ${alpha(theme.palette.grey[600], 0.3)}`
                          : `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                        '&:hover': {
                          backgroundColor: (theme) => isListening
                            ? alpha(theme.palette.error.main, 0.05)
                            : theme.palette.mode === 'dark'
                            ? alpha(theme.palette.background.default, 0.8)
                            : alpha(theme.palette.grey[50], 1),
                          '& fieldset': {
                            borderColor: (theme) => isListening
                              ? alpha(theme.palette.error.main, 0.5)
                              : alpha(theme.palette.primary.main, 0.5)
                          }
                        },
                        '&.Mui-focused': {
                          backgroundColor: (theme) => isListening
                            ? alpha(theme.palette.error.main, 0.05)
                            : theme.palette.mode === 'dark'
                            ? alpha(theme.palette.background.default, 0.9)
                            : alpha(theme.palette.background.paper, 1),
                          '& fieldset': {
                            borderColor: isListening ? 'error.main' : 'primary.main',
                            borderWidth: '2px'
                          }
                        },
                        '& fieldset': {
                          borderColor: (theme) => isListening
                            ? alpha(theme.palette.error.main, 0.5)
                            : theme.palette.mode === 'dark'
                            ? alpha(theme.palette.grey[600], 0.3)
                            : alpha(theme.palette.grey[300], 0.5)
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: { xs: '16px', sm: '1rem' }, // Prevent zoom on iOS
                        lineHeight: 1.5
                      }
                    }}
                  />
                </Box>
                
                {/* Microphone Button - Standalone on mobile only */}
                {isMobile && renderMicrophoneButton(false)}
                
                {/* Send Button */}
                <Tooltip 
                  title={isLoading ? CHAT_TEXT.INPUT.STOP_TOOLTIP : CHAT_TEXT.INPUT.SEND_TOOLTIP} 
                  arrow
                >
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    disabled={!isLoading && !inputText.trim()}
                    sx={{ 
                      minWidth: 'auto', 
                      width: 48, 
                      height: 40,
                      p: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1.5,
                      background: (theme) => isLoading 
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: (theme) => isLoading
                        ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                        : `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}, 0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                      '&:hover': {
                        background: (theme) => isLoading 
                          ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                          : `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                        transform: 'translateY(-1px)',
                        boxShadow: (theme) => isLoading
                          ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}, 0 3px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                          : `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}, 0 3px 12px ${alpha(theme.palette.primary.main, 0.3)}`
                      },
                      '&:active': {
                        transform: 'translateY(0px)'
                      },
                      '&:disabled': {
                        background: (theme) => alpha(theme.palette.action.disabled, 0.12),
                        boxShadow: 'none'
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {isLoading ? <StopIcon /> : <ArrowUpIcon />}
                  </Button>
                </Tooltip>
              </Stack>
            </Stack>
            
            {/* Footer text positioned under text input - hidden on mobile */}
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                mt: 0.5, 
                display: { xs: 'none', sm: 'block' },
                fontSize: '0.8rem',
                textAlign: 'center',
                width: '100%'
              }}
            >
              {CHAT_TEXT.INPUT.FOOTER_TEXT}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Paper>
  );
};


