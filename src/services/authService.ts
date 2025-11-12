/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { config } from '../config/env';

export interface AuthStatus {
  authenticated: boolean;
  userId?: string;
  expiresAt?: number;
}

/**
 * Check if the user is authenticated
 */
export const checkAuthStatus = async (): Promise<AuthStatus> => {
  try {
    const response = await fetch(`${config.backendUrl}/auth/status`, {
      method: 'GET',
      credentials: 'include', // Include cookies in request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Auth status check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false };
  }
};

/**
 * Exchange OAuth authorization code for tokens
 */
export const exchangeToken = async (code: string, state?: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${config.backendUrl}/auth/exchange`, {
      method: 'POST',
      credentials: 'include', // Include cookies in request
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Token exchange failed: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error exchanging token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange failed',
    };
  }
};

/**
 * Logout the user
 */
export const logout = async (): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${config.backendUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include cookies in request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Logout failed:', response.status);
    }

    return { success: response.ok };
  } catch (error) {
    console.error('Error during logout:', error);
    return { success: false };
  }
};

