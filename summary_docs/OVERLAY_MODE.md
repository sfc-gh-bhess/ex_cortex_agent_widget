# Overlay Mode Implementation Guide

## Overview

The `SimpleChatInterface` component now supports **Overlay Mode**, transforming it from an inline component into a floating chat widget. This is perfect for adding chat functionality to existing applications without disrupting the main content.

## Features

✅ **Floating Action Button (FAB)**: Minimized state shows as a chat icon button  
✅ **Resizable Overlay**: Users can resize the chat window by dragging corners  
✅ **Configurable Position**: Place the button in any corner of the screen  
✅ **Configurable Size**: Set default width and height (percentage or fixed)  
✅ **Minimize Button**: Close the overlay back to the floating button  
✅ **Initial State**: Start minimized or expanded  

## Quick Start

### Basic Overlay Implementation

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <div>
        {/* Your main content */}
        <h1>My Application</h1>
        <p>Your content here...</p>
        
        {/* Floating chat overlay */}
        <SimpleChatInterface 
          backendUrl="http://localhost:3001"
          overlay={{
            enabled: true,
            defaultWidth: '70%',
            defaultHeight: '70vh',
            buttonPosition: 'bottom-right',
            initialState: 'minimized'
          }}
        />
      </div>
    </ChatThemeProvider>
  );
}
```

## Configuration Options

### OverlayConfig Interface

```typescript
interface OverlayConfig {
  /** Enable overlay/floating mode */
  enabled: boolean;
  
  /** Default width when opened (default: '70%') */
  defaultWidth?: string | number;
  
  /** Default height when opened (default: '70vh') */
  defaultHeight?: string | number;
  
  /** Position of floating button (default: 'bottom-right') */
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /** Initial state (default: 'minimized') */
  initialState?: 'minimized' | 'expanded';
}
```

## Usage Examples

### Example 1: Bottom Right (Default)

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{
    enabled: true,
    // All other options use defaults
  }}
/>
```

**Result:**
- Floating button appears in bottom-right corner
- Opens to 70% width × 70vh height
- Starts minimized

### Example 2: Custom Size

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{
    enabled: true,
    defaultWidth: '500px',       // Fixed width
    defaultHeight: '600px',      // Fixed height
    buttonPosition: 'bottom-left'
  }}
/>
```

### Example 3: Large Overlay

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{
    enabled: true,
    defaultWidth: '90%',         // 90% of screen width
    defaultHeight: '85vh',       // 85% of viewport height
    buttonPosition: 'top-right'
  }}
/>
```

### Example 4: Start Expanded

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{
    enabled: true,
    initialState: 'expanded'     // Chat opens immediately
  }}
/>
```

### Example 5: Multiple Positions

You can configure the button position in any corner:

```tsx
// Bottom right (default)
overlay={{ enabled: true, buttonPosition: 'bottom-right' }}

// Bottom left
overlay={{ enabled: true, buttonPosition: 'bottom-left' }}

// Top right
overlay={{ enabled: true, buttonPosition: 'top-right' }}

// Top left
overlay={{ enabled: true, buttonPosition: 'top-left' }}
```

## Inline Mode vs Overlay Mode

### Inline Mode (Default)

When `overlay` prop is not provided or `enabled: false`:

```tsx
<SimpleChatInterface backendUrl="http://localhost:3001" />
```

- Chat is embedded directly in your page flow
- Takes up space in the document layout
- Scrolls with the page content

### Overlay Mode

When `overlay.enabled: true`:

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{ enabled: true }}
/>
```

- Chat floats above your content
- Doesn't affect page layout
- Fixed position on screen
- Can be minimized/expanded

## Resizing Behavior

When the overlay is expanded, users can:

1. **Resize by dragging corners**: The overlay has `resize: both` enabled
2. **Minimum size constraints**: 
   - Min width: 320px
   - Min height: 400px
3. **Maximum size constraints**:
   - Max width: 95vw (95% of viewport width)
   - Max height: 95vh (95% of viewport height)

## Styling and Customization

### Combining with Theme

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider theme={{ mode: 'light', primary: '#1976d2' }}>
      <SimpleChatInterface 
        backendUrl="http://localhost:3001"
        overlay={{
          enabled: true,
          defaultWidth: '600px',
          defaultHeight: '700px'
        }}
      />
    </ChatThemeProvider>
  );
}
```

## Technical Details

### Component Structure

When overlay mode is enabled, the component renders:

1. **Minimized State**: Material-UI `Fab` (Floating Action Button)
   - Chat icon
   - Positioned at specified corner
   - z-index: 9999

2. **Expanded State**: Material-UI `Paper` component
   - Header with minimize button
   - Chat interface content
   - Resizable container
   - z-index: 9998
   - Shadow elevation: 24

### State Management

- Component maintains internal state for minimized/expanded
- State is initialized based on `initialState` prop
- Click FAB to expand
- Click minimize button in header to collapse

## Real-World Example

Here's the implementation from the main application:

```tsx
import React from 'react';
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';
import { Box, Typography } from '@mui/material';

function App() {
  return (
    <ChatThemeProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Main content */}
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Custom Cortex Agents
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Click the chat button in the bottom right corner to start a conversation.
          </Typography>
        </Box>
        
        {/* Floating chat overlay */}
        <SimpleChatInterface 
          backendUrl={process.env.REACT_APP_BACKEND_URL}
          onError={(error) => console.error('Chat error:', error)}
          overlay={{
            enabled: true,
            defaultWidth: '70%',
            defaultHeight: '70vh',
            buttonPosition: 'bottom-right',
            initialState: 'minimized'
          }}
        />
      </Box>
    </ChatThemeProvider>
  );
}
```

## Migration Guide

### Converting from Inline to Overlay

**Before (Inline):**
```tsx
<Box sx={{ height: '100vh' }}>
  <SimpleChatInterface backendUrl="http://localhost:3001" />
</Box>
```

**After (Overlay):**
```tsx
<Box sx={{ height: '100vh' }}>
  {/* Your content here */}
  <SimpleChatInterface 
    backendUrl="http://localhost:3001"
    overlay={{ enabled: true }}
  />
</Box>
```

## Browser Compatibility

The overlay mode uses:
- CSS `resize` property (supported in all modern browsers)
- CSS `position: fixed`
- Material-UI components

Compatible with:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Best Practices

1. **Use overlay mode for existing applications**: Don't disrupt your main content
2. **Use inline mode for dedicated chat pages**: When chat is the primary focus
3. **Configure appropriate size**: Consider mobile responsiveness
4. **Test on different screen sizes**: Ensure usability on all devices
5. **Position based on your layout**: Avoid blocking important UI elements

## Troubleshooting

### Overlay appears behind other content

Adjust z-index by wrapping in a container with higher z-index, or modify your app's z-index hierarchy.

### FAB is too small on mobile

The FAB uses Material-UI's default size. You can wrap it and adjust if needed, or this will be configurable in future versions.

### Resize not working

The resize functionality uses CSS `resize: both`. Ensure your browser supports this property. Some mobile browsers may have limited support.

## Future Enhancements

Potential future features:
- Draggable window position
- Custom FAB icon
- Custom header title
- Persistent size/position (localStorage)
- Animation transitions
- Multiple instances support

## Support

For issues or questions:
- Check the main README: `packages/simple-chat-interface/README.md`
- Review examples in this document
- Check TypeScript types for available options

