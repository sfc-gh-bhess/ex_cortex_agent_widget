/**
 * Material UI Custom Theme for Dash DesAI
 * Based on the brand colors and design system
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Snowflake brand colors from their website
const brandColors = {
  primary: '#29B5E8',      // Snowflake signature blue
  primaryDark: '#1E88C7',  // Darker blue for hover states
  primaryLight: '#5CC7EA', // Lighter blue variant
  secondary: '#F8FAFC',    // Very light gray/white background
  accent: '#1E40AF',       // Deep blue for accents
  success: '#10b981',
  warning: '#f59e0b', 
  error: '#ef4444',
  info: '#0ea5e9',
  // Snowflake specific grays
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
};

// Create custom theme options with Snowflake design
const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary,           // Snowflake blue
      dark: brandColors.primaryDark,
      light: brandColors.primaryLight,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.gray400,          // Snowflake gray
      light: brandColors.gray200,
      dark: brandColors.gray600,
      contrastText: brandColors.gray700,
    },
    success: {
      main: brandColors.success,
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: brandColors.warning,
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: brandColors.error,
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: brandColors.info,
      light: '#38bdf8',
      dark: '#0284c7',
    },
    background: {
      default: brandColors.gray50,        // Very light gray like Snowflake
      paper: '#ffffff',
    },
    text: {
      primary: brandColors.gray900,       // Dark gray like Snowflake
      secondary: brandColors.gray600,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Oxygen"',
      '"Ubuntu"',
      '"Cantarell"',
      '"Fira Sans"',
      '"Droid Sans"',
      '"Helvetica Neue"',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none', // Prevent uppercase transformation
    },
  },
  shape: {
    borderRadius: 12, // Rounded corners throughout the app
  },
  components: {
    // Button component customizations
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${brandColors.primaryDark} 0%, ${brandColors.secondary} 100%)`,
          },
        },
      },
    },
    // Paper component customizations
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    // Card component customizations
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    // TextField/Input customizations
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover fieldset': {
              borderColor: brandColors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: brandColors.primary,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    // AppBar customizations
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#1f2937',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    // Chip customizations
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        colorPrimary: {
          background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
          color: 'white',
        },
      },
    },
    // Alert customizations
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    // Avatar customizations
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
  spacing: 8, // 8px base spacing unit
};

// Create the theme
export const theme = createTheme(themeOptions);

// Export theme with Snowflake design system
export const createAppTheme = (isDarkMode: boolean = false) => {
  const baseTheme = createTheme({
    ...themeOptions,
    palette: {
      ...themeOptions.palette,
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: isDarkMode ? '#667eea' : brandColors.primary,           // Snowflake blue for light mode
        dark: isDarkMode ? '#5a67d8' : brandColors.primaryDark,       
        light: isDarkMode ? '#8b9aed' : brandColors.primaryLight,     
        contrastText: '#ffffff',
      },
      secondary: {
        main: isDarkMode ? '#764ba2' : brandColors.gray400,           // Snowflake gray for secondary
        light: isDarkMode ? '#9d7bc4' : brandColors.gray200, 
        dark: isDarkMode ? '#5c3a7a' : brandColors.gray600,
        contrastText: isDarkMode ? '#ffffff' : brandColors.gray700,
      },
      background: {
        default: isDarkMode ? '#0B0D0E' : brandColors.gray50,         // Very light gray like Snowflake
        paper: isDarkMode ? '#1C2025' : '#ffffff',                    // Pure white for cards
      },
      text: {
        primary: isDarkMode ? '#ffffff' : brandColors.gray900,        // Dark gray like Snowflake
        secondary: isDarkMode ? '#B2BAC2' : brandColors.gray600,      // Medium gray for secondary text
      },
      grey: isDarkMode ? {
        50: '#F8F9FA',
        100: '#E7EBF0',
        200: '#E0E3E7',
        300: '#CDD2D7',
        400: '#9DA8B7',
        500: '#6B7A90',
        600: '#434D5B',
        700: '#303740',
        800: '#1C2025',
        900: '#0B0D0E',
      } : {
        50: brandColors.gray50,
        100: brandColors.gray100,
        200: brandColors.gray200,
        300: brandColors.gray300,
        400: brandColors.gray400,
        500: brandColors.gray500,
        600: brandColors.gray600,
        700: brandColors.gray700,
        800: brandColors.gray800,
        900: brandColors.gray900,
      },
      divider: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
      components: {
      ...themeOptions.components,
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDarkMode 
              ? 'rgba(28, 32, 37, 0.95)' 
              : '#ffffff',                                          // Clean white like Snowflake
            backdropFilter: 'blur(10px)',
            color: isDarkMode ? '#ffffff' : brandColors.gray900,    // Dark gray text like Snowflake
            boxShadow: isDarkMode 
              ? '0 1px 3px 0 rgba(255, 255, 255, 0.1), 0 1px 2px 0 rgba(255, 255, 255, 0.06)'
              : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',                 // Subtle shadow like Snowflake
            borderBottom: isDarkMode ? 'none' : `1px solid ${brandColors.gray100}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,                                       // Snowflake uses larger border radius
            backgroundColor: isDarkMode ? '#1C2025' : '#ffffff',
            boxShadow: isDarkMode
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',  // Snowflake-style shadow
            border: isDarkMode 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : `1px solid ${brandColors.gray100}`,                 // Light gray border like Snowflake
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              fontSize: '16px',                                     // Snowflake's input font size
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : brandColors.gray300,
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? brandColors.accent : brandColors.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: isDarkMode ? brandColors.accent : brandColors.primary,
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,                                       // Snowflake's button border radius
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '16px',
            padding: '12px 24px',                                   // Snowflake's button padding
          },
          containedPrimary: {
            backgroundColor: isDarkMode ? '#667eea' : brandColors.primary,  // Snowflake blue
            color: '#ffffff',
            boxShadow: 'none',                                      // Snowflake uses flat buttons
            '&:hover': {
              backgroundColor: isDarkMode ? '#5a67d8' : brandColors.primaryDark,
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: isDarkMode ? '#667eea' : brandColors.primary,
            color: isDarkMode ? '#667eea' : brandColors.primary,
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.1)' : 'rgba(41, 181, 232, 0.1)',
              borderColor: isDarkMode ? '#5a67d8' : brandColors.primaryDark,
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          h1: {
            fontWeight: 700,
            fontSize: '3.5rem',
            color: isDarkMode ? '#ffffff' : brandColors.gray900,
          },
          h2: {
            fontWeight: 700,
            fontSize: '2.5rem',
            color: isDarkMode ? '#ffffff' : brandColors.gray900,
          },
          h3: {
            fontWeight: 600,
            fontSize: '2rem',
            color: isDarkMode ? '#ffffff' : brandColors.gray900,
          },
          body1: {
            fontSize: '16px',
            lineHeight: 1.6,
            color: isDarkMode ? '#B2BAC2' : brandColors.gray700,
          },
          body2: {
            fontSize: '14px',
            lineHeight: 1.5,
            color: isDarkMode ? '#B2BAC2' : brandColors.gray600,
          },
        },
      },
    },
  });

  return baseTheme;
};

export default theme;



