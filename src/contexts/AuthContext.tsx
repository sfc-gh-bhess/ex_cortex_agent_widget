/**
 * Authentication Context
 * Manages authentication state across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuthStatus, logout as logoutService } from '../services/authService';
import { config, buildOAuthLoginUrl } from '../config/env';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
  expiresAt?: number;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  authMode: 'PAT' | 'OAUTH';
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    // In PAT mode, user is always authenticated
    if (config.authMode === 'PAT') {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }
    
    // In OAUTH mode, check session status with backend
    const status = await checkAuthStatus();
    
    setAuthState({
      isAuthenticated: status.authenticated,
      isLoading: false,
      userId: status.userId,
      expiresAt: status.expiresAt,
    });
  };

  const login = () => {
    if (config.authMode === 'OAUTH') {
      window.location.href = buildOAuthLoginUrl();
    }
  };

  const logout = async () => {
    // Only proceed in OAUTH mode
    if (config.authMode === 'OAUTH') {
      await logoutService();
    }
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      userId: undefined,
      expiresAt: undefined,
    });
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuth,
        authMode: config.authMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

