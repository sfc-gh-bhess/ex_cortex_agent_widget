/**
 * ThinkingSteps Component
 * Displays accordion with AI thinking process steps
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  alpha,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { CHAT_TEXT } from '../../constants/textConstants';
import { splitThinkingTextIntoParagraphs } from '../../utils/chatUtils';

interface ThinkingStepsProps {
  messageId: string;
  thinkingTexts?: string[];
  thinkingSteps?: string[];
  isStreaming?: boolean;
  streamingStatus?: string;
  collapsed: boolean;
  onToggle: (messageId: string) => void;
}

export const ThinkingSteps: React.FC<ThinkingStepsProps> = ({
  messageId,
  thinkingTexts = [],
  thinkingSteps = [],
  isStreaming = false,
  streamingStatus,
  collapsed,
  onToggle
}) => {
  const theme = useTheme();

  // Don't render if there's no thinking content
  if (!thinkingTexts.length && !thinkingSteps.length) {
    return null;
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 2, 
        borderRadius: 1.5,
        background: (theme) => theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)}, ${alpha(theme.palette.secondary.main, 0.02)})`
          : alpha(theme.palette.grey[50], 0.8),
        border: (theme) => theme.palette.mode === 'dark'
          ? `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
          : `1px solid ${alpha(theme.palette.grey[300], 0.8)}`
      }}
    >
      <Accordion 
        expanded={!collapsed}
        onChange={() => onToggle(messageId)}
        sx={{ 
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '&:before': { display: 'none' }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon color="primary" />}
          sx={{ 
            py: 0.5,
            '& .MuiAccordionSummary-content': { 
              alignItems: 'center' 
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <AutoAwesomeIcon color="primary" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 600 }}>
                {CHAT_TEXT.THINKING_STEPS.TITLE}
              </Typography>
            </Box>
          </Stack>
        </AccordionSummary>
        
        <AccordionDetails sx={{ pt: 0, pb: 1 }}>
          <Divider sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.3) }} />
          
          {/* Thinking Text Display - Natural Paragraph Format */}
          {thinkingTexts.length > 0 && thinkingTexts.some(text => text.trim().length > 0) && (
            <Box>
              <Stack spacing={1}>
                {thinkingTexts
                  .filter(text => text.trim().length > 0)
                  .flatMap((thinkingText, textIndex) => {
                    const paragraphs = splitThinkingTextIntoParagraphs(thinkingText);
                    
                    return paragraphs.map((paragraph, paragraphIndex) => (
                      <Box 
                        key={`thinking-${textIndex}-${paragraphIndex}`}
                        sx={{ 
                          mb: 2,
                          p: 2,
                          borderRadius: 1.5,
                          bgcolor: (theme) => theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.grey[800], 0.6)
                            : alpha(theme.palette.grey[50], 0.8),
                          borderLeft: `4px solid ${alpha(theme.palette.secondary.main, 0.5)}`,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: (theme) => theme.palette.mode === 'dark' 
                              ? alpha(theme.palette.grey[800], 0.8)
                              : alpha(theme.palette.grey[50], 1),
                            borderLeftColor: alpha(theme.palette.secondary.main, 0.7),
                            transform: 'translateY(-1px)',
                            boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`
                          }
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            color: 'text.primary',
                            lineHeight: 1.6,
                            fontWeight: 400,
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                            fontStyle: 'italic',
                            mb: 0,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            hyphens: 'auto'
                          }}
                        >
                          {paragraph}
                        </Typography>
                      </Box>
                    ));
                  })}
              </Stack>
            </Box>
          )}
          
          {/* Streaming Status within Thinking Steps */}
          {isStreaming && streamingStatus && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <ListItem 
                sx={{ 
                  py: 0.75,
                  px: 2,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  opacity: 0.85,
                  transition: 'opacity 1s ease-in-out',
                  '&:hover': {
                    opacity: 1,
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CircularProgress size={20} thickness={4} sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        lineHeight: 1.2,
                        color: 'primary.main',
                        fontWeight: 500,
                        fontStyle: 'italic'
                      }}
                    >
                      {streamingStatus}
                    </Typography>
                  }
                />
              </ListItem>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};


