/**
 * SqlQueriesSection Component
 * Displays accordion with SQL queries executed during chat response
 */

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  alpha,
  useTheme
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { CHAT_TEXT } from '../../constants/textConstants';
import { SqlQueryWithVerification } from '../../types/chat';

interface SqlQueriesSectionProps {
  messageId: string;
  sqlQueries: SqlQueryWithVerification[];
  collapsed: boolean;
  onToggle: (messageId: string) => void;
}

export const SqlQueriesSection: React.FC<SqlQueriesSectionProps> = ({
  messageId,
  sqlQueries,
  collapsed,
  onToggle
}) => {
  const theme = useTheme();

  // Don't render if there are no SQL queries
  if (!sqlQueries || sqlQueries.length === 0) {
    return null;
  }

  const verifiedCount = sqlQueries.filter(queryObj => 
    queryObj.verification && Object.keys(queryObj.verification).length > 0
  ).length;

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
          : `1px solid ${alpha(theme.palette.grey[300], 0.8)}`,
        display: { xs: 'none', md: 'block' } // Hide on mobile
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
              <CodeIcon color="primary" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 600 }}>
                  {CHAT_TEXT.SQL_QUERIES.HEADER}
                </Typography>
                <Chip
                  label={`${sqlQueries.length} ${sqlQueries.length !== 1 ? CHAT_TEXT.SQL_QUERIES.EXECUTION_COUNT_PLURAL : CHAT_TEXT.SQL_QUERIES.EXECUTION_COUNT_SINGULAR}`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    borderColor: alpha(theme.palette.grey[500], 0.4),
                    color: 'text.secondary',
                    backgroundColor: alpha(theme.palette.grey[100], 0.3),
                    fontSize: '0.7rem', 
                    height: 18,
                    fontWeight: 400
                  }}
                />
                {verifiedCount > 0 && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${verifiedCount} ${verifiedCount === 1 ? CHAT_TEXT.VERIFICATION.COUNT_LABEL_SINGULAR : CHAT_TEXT.VERIFICATION.COUNT_LABEL_PLURAL}`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: alpha(theme.palette.success.main, 0.4),
                      color: 'text.secondary',
                      backgroundColor: alpha(theme.palette.success.light, 0.1),
                      fontSize: '0.7rem', 
                      height: 18,
                      fontWeight: 400,
                      '& .MuiSvgIcon-root': { 
                        color: alpha(theme.palette.success.main, 0.7),
                        fontSize: '0.8rem'
                      }
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </AccordionSummary>
        
        <AccordionDetails sx={{ pt: 0, pb: 1 }}>
          <Divider sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.3) }} />
          
          <Stack spacing={2}>
            {sqlQueries.map((queryObj, index) => (
              <Paper 
                key={index} 
                variant="outlined" 
                sx={{ 
                  p: 2,
                  bgcolor: (theme) => theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.grey[800], 0.4)
                    : alpha(theme.palette.grey[100], 0.6),
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.grey[700], 0.6)
                      : alpha(theme.palette.grey[100], 0.8),
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? alpha(theme.palette.grey[600], 0.5)
                      : alpha(theme.palette.grey[400], 0.5)
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Chip
                    label={`${CHAT_TEXT.SQL_QUERIES.QUERY_LABEL} ${index + 1}`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: alpha(theme.palette.grey[500], 0.4),
                      color: 'text.secondary',
                      backgroundColor: alpha(theme.palette.grey[100], 0.3),
                      fontSize: '0.7rem', 
                      height: 18,
                      fontWeight: 400
                    }}
                  />
                  
                  {queryObj.verification && Object.keys(queryObj.verification).length > 0 && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={
                        queryObj.verification.verified_query_used ? CHAT_TEXT.VERIFICATION.VERIFIED_QUERY :
                        queryObj.verification.query_verified ? CHAT_TEXT.VERIFICATION.QUERY_VERIFIED :
                        queryObj.verification.validated ? CHAT_TEXT.VERIFICATION.RESPONSE_VALIDATED :
                        CHAT_TEXT.VERIFICATION.VERIFICATION_AVAILABLE
                      }
                      variant="outlined"
                      size="small"
                      sx={{ 
                        borderColor: alpha(theme.palette.success.main, 0.4),
                        color: 'text.secondary',
                        backgroundColor: alpha(theme.palette.success.light, 0.1),
                        fontSize: '0.7rem', 
                        height: 18,
                        fontWeight: 400,
                        '& .MuiSvgIcon-root': { 
                          color: alpha(theme.palette.success.main, 0.7),
                          fontSize: '0.8rem'
                        }
                      }}
                    />
                  )}
                </Stack>
                
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: (theme) => theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.grey[900], 0.6)
                      : alpha(theme.palette.grey[100], 0.8),
                    border: (theme) => theme.palette.mode === 'dark'
                      ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      : `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                    borderRadius: 1
                  }}
                >
                  <Typography
                    variant="body2"
                    component="pre"
                    sx={{
                      fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      color: 'text.primary',
                      fontSize: '0.8rem',
                      lineHeight: 1.4
                    }}
                  >
                    {queryObj.sql}
                  </Typography>
                </Paper>
              </Paper>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};


