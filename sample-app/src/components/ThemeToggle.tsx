import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { 
  LightMode as LightModeIcon, 
  DarkMode as DarkModeIcon 
} from '@mui/icons-material';
import { useThemeContext } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'medium' }) => {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const theme = useTheme();

  return (
    <Tooltip 
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      arrow
    >
      <IconButton
        onClick={toggleTheme}
        size={size}
        sx={{
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          transition: 'all 0.3s ease',
        }}
      >
        {isDarkMode ? (
          <LightModeIcon fontSize={size} />
        ) : (
          <DarkModeIcon fontSize={size} />
        )}
      </IconButton>
    </Tooltip>
  );
};

