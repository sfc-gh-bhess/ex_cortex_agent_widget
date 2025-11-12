/**
 * ChatHeader Component
 * Displays the application header with logo, title, and theme toggle
 */

import React from 'react';
import { Box, Container, Paper, Typography, Link, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { HEADER_TEXT } from '../../constants/textConstants';
import { ThemeToggle } from '../ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

export const ChatHeader: React.FC = () => {
  const { logout, authMode } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Container maxWidth="lg">
          <Box sx={{ py: 2, position: 'relative' }}>
            {/* Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, pr: 12 }}>
              <Box
                component="img"
                src={HEADER_TEXT.LOGO_PATH}
                alt={HEADER_TEXT.LOGO_ALT}
                sx={{
                  height: 80,
                  width: 'auto',
                  objectFit: 'contain',
                  imageRendering: 'crisp-edges',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  '@media (max-width: 600px)': {
                    height: 64
                  }
                }}
                onError={(e) => {
                  // Hide icon if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  sx={{ 
                    color: 'text.primary', 
                    fontWeight: 600,
                    fontSize: { xs: '1.8rem', '@media (min-width: 2000px)': { fontSize: '2rem' } }
                  }}
                >
                  {HEADER_TEXT.MAIN_TITLE}
                </Typography>
                
                {/* Tagline and Subtitle - Responsive Sizes */}
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1rem', '@media (min-width: 2000px)': { fontSize: '1.05rem' } },
                    fontWeight: 400,
                    opacity: 0.85
                  }}
                >
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.95rem', md: '1rem', '@media (min-width: 2000px)': { fontSize: '1.05rem' } },
                    fontWeight: 400,
                    opacity: 0.85
                  }}
                >
                  {HEADER_TEXT.SUBTITLE_PREFIX}{' '}
                  <Link 
                    href={HEADER_TEXT.CORTEX_AGENTS_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.light'
                      }
                    }}
                  >
                    {HEADER_TEXT.SUBTITLE_MIDDLE}
                  </Link>
                  {/* {' | '}{HEADER_TEXT.SUBTITLE_SUFFIX}{' '}
                  <Link 
                    href={HEADER_TEXT.SUBTITLE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                        color: 'primary.light'
                      }
                    }}
                  >
                    {HEADER_TEXT.SUBTITLE_DEVELOPER}
                  </Link> */}
                </Typography>
              </Box>
            </Box>
            
            {/* Theme Toggle and Logout - Aligned with container edge */}
            <Box sx={{ 
              position: 'absolute', 
              top: 16, 
              right: 16,
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              '@media (max-width: 600px)': {
                right: 16
              }
            }}>
              <ThemeToggle />
              {/* Only show logout button in OAUTH mode */}
              {authMode === 'OAUTH' && (
                <Tooltip title="Logout">
                  <IconButton
                    onClick={handleLogout}
                    sx={{
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    aria-label="logout"
                  >
                    <LogoutIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
    </Paper>
  );
};


