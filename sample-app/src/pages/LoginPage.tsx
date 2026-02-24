/**
 * Login Page
 * Displays login UI and redirects to Identity Provider
 */

import React from 'react';
import { Box, Button, Typography, Paper, Container } from '@mui/material';
import { Login as LoginIcon } from '@mui/icons-material';
import { buildOAuthLoginUrl } from '../config/env';
import { HEADER_TEXT } from '../constants/textConstants';

export const LoginPage: React.FC = () => {
  const handleLogin = () => {
    window.location.href = buildOAuthLoginUrl();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            padding: 4,
            borderRadius: 2,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Box
              component="img"
              src={HEADER_TEXT.LOGO_PATH}
              alt={HEADER_TEXT.LOGO_ALT}
              sx={{
                height: 100,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              mb: 2,
            }}
          >
            {HEADER_TEXT.MAIN_TITLE}
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Sign in to access your custom Cortex agents
          </Typography>

          {/* Login Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(0,0,0,0.2)',
              },
            }}
          >
            Login with Identity Provider
          </Button>

          {/* Footer */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 4, display: 'block' }}
          >
            Powered by Snowflake Cortex Agents
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

