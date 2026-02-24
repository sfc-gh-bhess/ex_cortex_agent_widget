/**
 * EmptyState Component
 * Displays greeting card when there are no messages
 */

import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, alpha, keyframes } from '@mui/material';
import { Brush as BrushIcon } from '@mui/icons-material';
import { CHAT_TEXT } from '../../constants/textConstants';
import { getTimeBasedGreeting, formatDate, formatTime } from '../../utils/chatUtils';

// Animation keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gradientShift = keyframes`
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

export const EmptyState: React.FC = () => {
  const currentDate = new Date();
  
  // Calculate greeting only once on mount using lazy initialization
  const [greeting] = useState(() => getTimeBasedGreeting());
  
  return (
    <Card 
      sx={{ 
        maxWidth: '98%', 
        width: '100%',
        bgcolor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        animation: `${fadeInUp} 0.8s ease-out`
      }}
    >
      <CardContent 
        sx={{ 
          textAlign: 'center', 
          py: 2,
          bgcolor: 'transparent'
        }}
      >
        {/* Animated Greeting */}
        <Typography 
          variant="h1" 
          sx={{ 
            mb: 1, 
            fontWeight: 700, 
            fontSize: { xs: '2.5rem', sm: '3rem', '@media (min-width: 2000px)': { fontSize: '3.5rem' } },
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #667eea 75%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #4facfe 50%, #667eea 75%, #764ba2 100%)',
            backgroundSize: '200% 200%',
            animation: `${gradientShift} 8s ease infinite`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            letterSpacing: '-0.02em'
          }}
        >
          {greeting}
        </Typography>
        
        {/* Date/Time with subtle pulse */}
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mb: 3, 
            fontWeight: 400, 
            fontSize: { xs: '0.95rem', '@media (min-width: 2000px)': { fontSize: '1.1rem' } },
            opacity: 0.7,
            animation: `${pulse} 3s ease-in-out infinite`
          }}
        >
          {formatDate(currentDate)} • {formatTime(currentDate)}
        </Typography>
        
        {/* Subheader with icon and enhanced styling */}
        <Box
          sx={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 1.25,
            borderRadius: 2,
            background: (theme) => theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: `${float} 3s ease-in-out infinite`,
            '&:hover': {
              background: (theme) => theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.secondary.main, 0.15)} 100%)`
                : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
              borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: (theme) => `0 12px 32px ${alpha(theme.palette.primary.main, 0.25)}`,
              '& .brush-icon': {
                transform: 'rotate(-10deg) scale(1.1)',
                color: 'primary.main'
              }
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 3,
              background: (theme) => `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
              backgroundSize: '200% 100%',
              animation: `${shimmer} 3s infinite`,
              opacity: 0,
              transition: 'opacity 0.3s',
            },
            '&:hover::before': {
              opacity: 1
            }
          }}
        >
          <BrushIcon 
            className="brush-icon"
            sx={{ 
              fontSize: { xs: '1.4rem', sm: '1.5rem' },
              color: 'primary.main',
              transition: 'all 0.3s ease',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              fontSize: { xs: '0.95rem', sm: '1.05rem', '@media (min-width: 2000px)': { fontSize: '1.15rem' } },
              lineHeight: 1.3,
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                : 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {CHAT_TEXT.EMPTY_STATE.SUBHEADER}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};


