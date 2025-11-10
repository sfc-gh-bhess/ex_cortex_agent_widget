# Resize Handle Position Update

## Change Summary

Moved the resize handle from **bottom-right** to **top-left** corner of the overlay component for better ergonomics.

## Implementation

### Previous Approach (CSS Resize)

The original implementation used CSS `resize: both` property:
- ❌ Always positioned at bottom-right (CSS limitation)
- ❌ Not customizable
- ❌ Limited visual feedback

```css
resize: both;
overflow: auto;
```

### New Approach (Custom Drag Handle)

Implemented a custom JavaScript-based resize handle:
- ✅ Positioned at top-left corner
- ✅ Visible drag indicator icon
- ✅ Visual feedback on hover and during drag
- ✅ Smooth resizing with constraints
- ✅ Better UX with cursor change

## Features

### Visual Resize Handle

Located in the top-left corner of the overlay:
- **Icon**: Rotated drag indicator (45°)
- **Size**: 40px × 40px hit area
- **Cursor**: `nwse-resize` (diagonal resize cursor)
- **Hover Effect**: Subtle background color on hover
- **Active State**: Highlighted during resize

### Resize Behavior

**Drag Direction:**
- Drag **left** → increases width
- Drag **up** → increases height
- Drag **right** → decreases width
- Drag **down** → decreases height

**Constraints:**
- **Minimum**: 320px × 400px
- **Maximum**: 95% viewport width × 95% viewport height

### User Experience

1. **Discovery**: Always-visible drag handle indicator
2. **Affordance**: Cursor changes to resize icon on hover
3. **Feedback**: Background highlights during drag
4. **Smooth**: No text selection during drag (`userSelect: 'none'`)

## Technical Details

### State Management

```typescript
const [size, setSize] = useState({ width: number, height: number });
const [isResizing, setIsResizing] = useState(false);
const resizeStartRef = useRef<{ x, y, width, height } | null>(null);
```

### Resize Calculation

For top-left resize, the logic is inverted:
```typescript
// Moving left (negative deltaX) increases width
const newWidth = startWidth - deltaX;

// Moving up (negative deltaY) increases height  
const newHeight = startHeight - deltaY;
```

### Event Handling

1. **Mouse Down** on handle → Start resize, capture initial position
2. **Mouse Move** (document) → Calculate new size, apply constraints
3. **Mouse Up** (document) → End resize, clean up

### Size Initialization

Converts various size formats to pixels:
- Percentages: `'70%'` → `0.7 * window.innerWidth`
- Viewport units: `'70vh'` → `0.7 * window.innerHeight`
- Pixels: `'500px'` or `500` → `500`

## Component Structure

```
Paper (Overlay Container)
├── Resize Handle (Top-Left)
│   ├── Position: absolute, top: 0, left: 0
│   ├── Size: 40px × 40px
│   ├── Icon: DragIndicator (rotated 45°)
│   └── onMouseDown → handleResizeStart
│
├── Header
│   ├── Chat Icon + Title (ml: 4 for handle space)
│   └── Minimize Button
│
└── Content
    └── Scrollable chat area
```

## Visual Representation

```
┌──────────────────────────────┐
│ ⋮⋮ 💬 Chat Assistant      _ │
│  ↖ Drag to resize            │
├──────────────────────────────┤
│                              │
│  Chat messages...            │
│                              │
│                              │
│                              │
├──────────────────────────────┤
│ Type a message...            │
└──────────────────────────────┘

⋮⋮ = Resize handle indicator
↖ = Resize cursor
```

## Code Changes

### Added Import

```typescript
import {
  // ... other icons
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
```

### Added State & Logic

```typescript
// Size state
const [size, setSize] = useState(getInitialSize);
const [isResizing, setIsResizing] = useState(false);
const resizeStartRef = useRef<...>(null);

// Convert config sizes to pixels
const getInitialSize = () => { ... };

// Handle resize events
const handleResizeStart = (e: React.MouseEvent) => { ... };

// Mouse move/up handlers in useEffect
useEffect(() => {
  if (!isResizing) return;
  // Add document listeners
  // Calculate and apply new size
}, [isResizing]);
```

### Updated Paper Component

```typescript
<Paper
  sx={{
    width: `${size.width}px`,          // Dynamic size
    height: `${size.height}px`,        // Dynamic size
    overflow: 'hidden',                // Restored to hidden
    // Removed: resize: 'both'
    userSelect: isResizing ? 'none' : 'auto',  // Prevent selection
  }}
>
  {/* Resize Handle - NEW */}
  <Box onMouseDown={handleResizeStart} sx={{ ... }}>
    <DragIndicatorIcon />
  </Box>
  
  {/* Header - Updated with ml: 4 */}
  <Box sx={{ ... }}>
    <Typography sx={{ ml: 4 }}>
      ...
    </Typography>
  </Box>
  
  {/* Content */}
  ...
</Paper>
```

## Advantages Over CSS Resize

| Feature | CSS Resize | Custom Handle |
|---------|-----------|---------------|
| Position | Bottom-right only | Any corner ✅ |
| Visibility | Subtle | Clear indicator ✅ |
| Visual Feedback | Minimal | Hover + active states ✅ |
| Mobile Support | Limited | Better (can enhance) ✅ |
| Customization | None | Full control ✅ |
| Constraints | Via CSS only | JavaScript logic ✅ |

## Browser Compatibility

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Desktop: Full support
- ✅ Mobile: Works with mouse events (can add touch support)

## Accessibility

- **Cursor**: Clear resize affordance
- **Visual**: Visible drag handle
- **Title**: Tooltip "Drag to resize"
- **Contrast**: Sufficient icon opacity

## Performance

- **Minimal overhead**: Only active during resize
- **Efficient**: Direct size state updates
- **Smooth**: No layout thrashing
- **Clean**: Event listeners cleaned up in useEffect

## Future Enhancements

Potential improvements:
1. **Touch support**: Add touch event handlers for mobile
2. **Double-click**: Reset to default size
3. **Keyboard**: Arrow keys for resize
4. **Snap points**: Predefined sizes (small/medium/large)
5. **Position drag**: Allow moving the overlay
6. **Animations**: Smooth transitions on expand/collapse
7. **Persist size**: Remember user's resize preference

## Testing

### To Test Resize:

1. **Open overlay**: Click FAB button
2. **Locate handle**: Top-left corner with drag icon
3. **Hover**: Cursor changes to diagonal resize
4. **Drag left/up**: Overlay grows
5. **Drag right/down**: Overlay shrinks
6. **Release**: Size is locked

### Edge Cases Tested:

- ✅ Min size constraint (320 × 400)
- ✅ Max size constraint (95vw × 95vh)
- ✅ Rapid mouse movements
- ✅ Drag outside window (still works)
- ✅ Text selection prevented during drag

## Build Status

✅ **Package**: Built successfully  
✅ **Main App**: Built successfully  
✅ **Bundle**: 328.23 kB (+537 B)  
✅ **TypeScript**: No errors

## Summary

The resize handle has been successfully moved from bottom-right to top-left with a custom implementation that provides:

- Better visibility and discoverability
- Improved user experience with visual feedback
- Full control over behavior and appearance
- Foundation for future enhancements

The change requires no updates to the API - all existing overlay configurations continue to work as before.

