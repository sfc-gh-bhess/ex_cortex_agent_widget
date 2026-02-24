/**
 * ChatThemeProvider
 * Provides Material-UI theme with optional customization
 */

import React, { ReactNode, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '../theme/theme';

export interface ThemeConfig {
  primary?: string;
  secondary?: string;
  mode?: 'light' | 'dark';
}

interface ChatThemeProviderProps {
  theme?: ThemeConfig;
  children: ReactNode;
}

export const ChatThemeProvider: React.FC<ChatThemeProviderProps> = ({ theme: themeConfig, children }) => {
  const theme = useMemo(() => {
    const isDarkMode = themeConfig?.mode === 'dark' || themeConfig?.mode === undefined;
    const muiTheme = createAppTheme(isDarkMode);
    
    // Apply custom colors if provided
    if (themeConfig?.primary || themeConfig?.secondary) {
      return {
        ...muiTheme,
        palette: {
          ...muiTheme.palette,
          ...(themeConfig.primary && {
            primary: {
              ...muiTheme.palette.primary,
              main: themeConfig.primary,
            },
          }),
          ...(themeConfig.secondary && {
            secondary: {
              ...muiTheme.palette.secondary,
              main: themeConfig.secondary,
            },
          }),
        },
      };
    }
    
    return muiTheme;
  }, [themeConfig]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

