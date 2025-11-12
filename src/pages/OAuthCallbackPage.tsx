/**
 * OAuth Callback Page
 * Handles OAuth redirect and exchanges authorization code for tokens
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Button, Paper, Container } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { exchangeToken } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isExchanging, setIsExchanging] = useState(true);
  const hasAttemptedExchange = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate exchanges (React 18 StrictMode runs effects twice in dev)
      if (hasAttemptedExchange.current) {
        return;
      }
      hasAttemptedExchange.current = true;

      // Get authorization code and state from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (errorParam) {
        setError(errorDescription || errorParam);
        setIsExchanging(false);
        return;
      }

      // Validate that we have a code
      if (!code) {
        setError('No authorization code received from Identity Provider');
        setIsExchanging(false);
        return;
      }

      // Exchange code for tokens (OAuth codes are single-use only)
      const result = await exchangeToken(code, state || undefined);

      if (result.success) {
        // Update auth state
        await checkAuth();
        
        // Redirect to home page
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Failed to complete authentication');
        setIsExchanging(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuth]);

  const handleRetry = () => {
    setError(null);
    setIsExchanging(true);
    
    // Redirect back to login
    navigate('/');
  };

  if (error) {
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
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />
            
            <Typography
              variant="h5"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 600, color: 'error.main' }}
            >
              Authentication Failed
            </Typography>
            
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {error}
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              sx={{
                py: 1.5,
                px: 4,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Try Again
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
          }}
        >
          <CircularProgress
            size={64}
            sx={{ mb: 3 }}
          />
          
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            {isExchanging ? 'Completing Sign In...' : 'Redirecting...'}
          </Typography>
          
          <Typography
            variant="body1"
            color="text.secondary"
          >
            Please wait while we authenticate your session
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

