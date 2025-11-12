/**
 * Application Entry Point
 * Bootstraps the React application with proper error boundaries
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import { ChatHeader } from './components/chat/ChatHeader';
import { ThemeContextProvider, useThemeContext } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { config } from './config/env';

/**
 * Error Boundary Component for handling runtime errors
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Error caught by boundary
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            backdropFilter: 'blur(10px)',
            maxWidth: '500px'
          }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Something went wrong
            </h1>
            <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Environment validation check
 */
const validateEnvironment = () => {
  try {
    // This will throw if required environment variables are missing
    // We need to actually access the config to trigger validation
    const testConfig = config.backendUrl;
    return !!testConfig;
  } catch (error) {
    
    // Show environment error UI
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    
    root.render(
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '1rem',
          backdropFilter: 'blur(10px)',
          maxWidth: '600px'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fecaca' }}>
            Configuration Error
          </h1>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
            {error instanceof Error ? error.message : 'Environment configuration is invalid'}
          </p>
          <div style={{
            textAlign: 'left',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>
              Required Environment Variable:
            </p>
            <ul style={{ paddingLeft: '1rem', lineHeight: '1.6' }}>
              <li>REACT_APP_BACKEND_URL</li>
            </ul>
          </div>
          <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            Please create a .env file in the project root with the backend URL (e.g., http://localhost:3001).
          </p>
        </div>
      </div>
    );
    
    return false;
  }
};

/**
 * Protected Route Component - Only accessible when authenticated
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
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
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <CircularProgress size={64} sx={{ mb: 3, color: 'white' }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Loading...
          </Typography>
        </Container>
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  return <>{children}</>;
};

/**
 * Main App Content - Only shown when authenticated
 */
const MainAppContent: React.FC = () => {
  const { isDarkMode } = useThemeContext();
  
  return (
    <ChatThemeProvider theme={{ mode: isDarkMode ? 'dark' : 'light' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh', 
        bgcolor: 'background.default' 
      }}>
        {/* Application-specific header */}
        <ChatHeader />
        
        {/* Main content area */}
        <Box sx={{ flex: 1, p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Custom Cortex Agents
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Click the chat button in the bottom right corner to start a conversation with our AI assistant.
          </Typography>
        </Box>
        
        {/* Floating chat overlay */}
        <SimpleChatInterface 
          backendUrl={config.backendUrl}
          onError={(error) => console.error('Chat error:', error)}
          overlay={{
            enabled: true,
            defaultWidth: '70%',
            defaultHeight: '70vh',
            buttonPosition: 'bottom-right',
            initialState: 'minimized'
          }}
          displayConfig={{
            showThinking: false,
            showSqlQueries: false,
            showAnnotations: false
          }}
        />
      </Box>
    </ChatThemeProvider>
  );
};

/**
 * App Component with Routing and Authentication
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* OAuth callback route - publicly accessible */}
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          
          {/* Main app route - requires authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainAppContent />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

/**
 * Bootstrap the application
 */
const bootstrap = () => {
  if (!validateEnvironment()) {
    return;
  }

  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeContextProvider>
          <App />
        </ThemeContextProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );

  // Register service worker for PWA capabilities if needed
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => {
          // Service worker registered successfully
        })
        .catch(() => {
          // Service worker registration failed
        });
    });
  }
};

// Start the application
bootstrap();
