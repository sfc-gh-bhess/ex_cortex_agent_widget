/**
 * FloatingChatInterface Component
 * Chat interface with floating button overlay for easy integration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  IconButton,
  Paper,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon,
  Minimize as MinimizeIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { ConfigProvider } from '../contexts/ConfigContext';
import { ChatInterface } from './ChatInterface';

export interface DisplayConfig {
  /** Show "Thinking & Planning" section (default: false) */
  showThinking?: boolean;
  /** Show "SQL Queries Executed" section (default: false) */
  showSqlQueries?: boolean;
  /** Show "Annotations" section (default: false) */
  showAnnotations?: boolean;
}

export interface FloatingChatInterfaceProps {
  backendUrl: string;
  applicationName?: string;
  initialAgent?: string;
  onError?: (error: string) => void;
  displayConfig?: DisplayConfig;
  /** Default width when opened (default: '70%') */
  defaultWidth?: string | number;
  /** Default height when opened (default: '70vh') */
  defaultHeight?: string | number;
  /** Position of floating button (default: 'bottom-right') */
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Initial state (default: 'minimized') */
  initialState?: 'minimized' | 'expanded';
}

/**
 * Overlay Wrapper Component
 * Handles minimized/expanded state and positioning
 */
interface OverlayWrapperProps {
  defaultWidth?: string | number;
  defaultHeight?: string | number;
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  initialState?: 'minimized' | 'expanded';
  children: React.ReactNode;
}

const OverlayWrapper: React.FC<OverlayWrapperProps> = ({ 
  defaultWidth,
  defaultHeight,
  buttonPosition,
  initialState,
  children 
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(
    initialState === 'expanded'
  );

  // Convert default sizes to pixels for resize calculations
  const getInitialSize = () => {
    const width = typeof defaultWidth === 'string' && defaultWidth.endsWith('%')
      ? (window.innerWidth * parseInt(defaultWidth)) / 100
      : typeof defaultWidth === 'string' && defaultWidth.endsWith('px')
      ? parseInt(defaultWidth)
      : typeof defaultWidth === 'number'
      ? defaultWidth
      : window.innerWidth * 0.7;
      
    const height = typeof defaultHeight === 'string' && defaultHeight.endsWith('vh')
      ? (window.innerHeight * parseInt(defaultHeight)) / 100
      : typeof defaultHeight === 'string' && defaultHeight.endsWith('px')
      ? parseInt(defaultHeight)
      : typeof defaultHeight === 'number'
      ? defaultHeight
      : window.innerHeight * 0.7;
      
    return { width, height };
  };

  const [size, setSize] = useState(getInitialSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const position = buttonPosition || 'bottom-right';

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      // For top-left resize, we subtract delta (dragging left/up increases size)
      const newWidth = Math.max(320, Math.min(window.innerWidth * 0.95, resizeStartRef.current.width - deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight * 0.95, resizeStartRef.current.height - deltaY));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  // Calculate position styles for FAB
  const getButtonPosition = () => {
    const base = { position: 'fixed' as const, zIndex: 9999 };
    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: 24, right: 24 };
      case 'bottom-left':
        return { ...base, bottom: 24, left: 24 };
      case 'top-right':
        return { ...base, top: 24, right: 24 };
      case 'top-left':
        return { ...base, top: 24, left: 24 };
      default:
        return { ...base, bottom: 24, right: 24 };
    }
  };

  // Render both FAB and overlay, show/hide with CSS to preserve state
  return (
    <>
      {/* Floating Action Button (minimized state) */}
      <Fab
        color="primary"
        aria-label="open chat"
        onClick={() => setIsExpanded(true)}
        sx={{
          ...getButtonPosition(),
          boxShadow: theme.shadows[8],
          display: isExpanded ? 'none' : 'flex',
          '&:hover': {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s ease-in-out',
          },
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Expanded overlay state */}
      <Paper
        elevation={16}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex: 9998,
          display: isExpanded ? 'flex' : 'none',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 2,
          boxShadow: theme.shadows[24],
          userSelect: isResizing ? 'none' : 'auto',
          ...(position.startsWith('top') && {
            bottom: 'auto',
            top: 24,
          }),
          ...(position.endsWith('left') && {
            right: 'auto',
            left: 24,
          }),
        }}
      >
        {/* Resize Handle - Top Left */}
        <Box
          onMouseDown={handleResizeStart}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 40,
            height: 40,
            cursor: 'nwse-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            bgcolor: alpha(theme.palette.primary.main, isResizing ? 0.2 : 0),
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            },
          }}
          title="Drag to resize"
        >
          <DragIndicatorIcon 
            sx={{ 
              fontSize: 20,
              color: theme.palette.text.secondary,
              opacity: 0.6,
              transform: 'rotate(45deg)',
            }} 
          />
        </Box>

        {/* Minimize Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
            <ChatIcon /> Chat Assistant
          </Typography>
          <IconButton
            size="small"
            onClick={() => setIsExpanded(false)}
            aria-label="minimize chat"
            sx={{
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <MinimizeIcon />
          </IconButton>
        </Box>

        {/* Chat Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0
        }}>
          {children}
        </Box>
      </Paper>
    </>
  );
};

export const FloatingChatInterface: React.FC<FloatingChatInterfaceProps> = ({
  backendUrl,
  applicationName,
  initialAgent,
  onError,
  displayConfig,
  defaultWidth,
  defaultHeight,
  buttonPosition,
  initialState
}) => {
  return (
    <ConfigProvider config={{ backendUrl, applicationName, onError, displayConfig }}>
      <OverlayWrapper
        defaultWidth={defaultWidth}
        defaultHeight={defaultHeight}
        buttonPosition={buttonPosition}
        initialState={initialState}
      >
        <ChatInterface />
      </OverlayWrapper>
    </ConfigProvider>
  );
};

