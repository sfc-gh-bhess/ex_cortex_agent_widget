/**
 * ChartsSection Component
 * Displays accordion with chart visualizations
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
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { CHAT_TEXT } from '../../constants/textConstants';
import { ChartVisualization } from '../ChartVisualization';
import { ChartContent } from '../../types/chart';

interface ChartsSectionProps {
  messageId: string;
  charts: ChartContent[];
  collapsed: boolean;
  onToggle: (messageId: string) => void;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  messageId,
  charts,
  collapsed,
  onToggle
}) => {
  const theme = useTheme();

  // Don't render if there are no charts
  if (!charts || charts.length === 0) {
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
              <BarChartIcon color="primary" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 600 }}>
                  {CHAT_TEXT.VISUALIZATION.TITLE}
                </Typography>
                <Chip
                  label={`${charts.length} ${charts.length !== 1 ? 'charts' : 'chart'}`}
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
              </Stack>
            </Box>
          </Stack>
        </AccordionSummary>
        
        <AccordionDetails sx={{ pt: 0, pb: 1 }}>
          <Divider sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.3) }} />
          
          <Stack spacing={3}>
            {charts.map((chartContent, index) => (
              <Box key={index}>
                <ChartVisualization 
                  chartContent={chartContent}
                  height={300}
                />
              </Box>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};


