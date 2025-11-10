/**
 * StarterQuestions Component
 * Displays accordion with starter questions for the selected agent
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
  alpha,
  useTheme
} from '@mui/material';
import { KeyboardArrowUp as ArrowUpIcon } from '@mui/icons-material';
import { CHAT_TEXT } from '../../constants/textConstants';

interface StarterQuestionsProps {
  expanded: boolean;
  onToggle: (expanded: boolean) => void;
  agentName: string;
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export const StarterQuestions: React.FC<StarterQuestionsProps> = ({
  expanded,
  onToggle,
  agentName,
  questions,
  onQuestionClick
}) => {
  const theme = useTheme();

  return (
    <Box>
      <Accordion 
        expanded={expanded} 
        onChange={(event, isExpanded) => onToggle(isExpanded)}
        sx={{ 
          maxWidth: '98%', 
          width: '100%',
          margin: '0 !important',
          bgcolor: (theme) => theme.palette.mode === 'dark' 
            ? alpha(theme.palette.grey[900], 0.8)
            : 'background.paper',
          border: (theme) => theme.palette.mode === 'dark'
            ? `1px solid ${alpha(theme.palette.grey[700], 0.3)}`
            : `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '0 !important',
          }
        }}
      >
        <AccordionSummary
          expandIcon={
            <ArrowUpIcon 
              sx={{ 
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.2s' 
              }} 
            />
          }
          sx={{
            '& .MuiAccordionSummary-content': {
              margin: '12px 0',
              '&.Mui-expanded': {
                margin: '12px 0',
              }
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, fontSize: '1rem' }}>
              {CHAT_TEXT.STARTER_QUESTIONS.TITLE}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '1rem', textDecoration: 'underline' }}>
              {agentName}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, pb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '1rem', mb: 1.5, display: 'block' }}>
            {CHAT_TEXT.STARTER_QUESTIONS.SUBTITLE}
          </Typography>
          <Stack spacing={0.75}>
            {questions.map((question, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 1,
                  cursor: 'pointer',
                  borderRadius: 1.5,
                  background: (theme) => theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.grey[800], 0.3)
                    : alpha(theme.palette.grey[100], 0.5),
                  border: (theme) => theme.palette.mode === 'dark'
                    ? `1px solid ${alpha(theme.palette.grey[700], 0.2)}`
                    : `1px solid ${alpha(theme.palette.grey[300], 0.4)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.grey[700], 0.4)
                      : alpha(theme.palette.grey[200], 0.6),
                    border: (theme) => theme.palette.mode === 'dark'
                      ? `1px solid ${alpha(theme.palette.grey[600], 0.3)}`
                      : `1px solid ${alpha(theme.palette.grey[400], 0.5)}`
                  }
                }}
                onClick={() => onQuestionClick(question)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.125
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 500,
                        fontSize: '0.7rem'
                      }}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontWeight: 400,
                        lineHeight: 1.4,
                        fontSize: '0.9rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {question}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.25,
                      transition: 'all 0.2s ease',
                      opacity: 0.7
                    }}
                  >
                    <ArrowUpIcon 
                      sx={{ 
                        fontSize: '1rem',
                        color: 'primary.main',
                        transform: 'rotate(45deg)'
                      }} 
                    />
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};


