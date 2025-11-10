# Overlay Mode Visual Guide

This guide provides a visual representation of how the overlay mode works.

## User Flow

### 1. Initial State (Minimized)

```
┌─────────────────────────────────────────────────┐
│ Header: Custom Cortex Agents                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Welcome to Custom Cortex Agents                │
│  Click the chat button in the bottom right      │
│  corner to start a conversation.                │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                                 │
│                                         ┌─────┐ │
│                                         │ 💬  │ │ <- Floating Action Button (FAB)
│                                         └─────┘ │
└─────────────────────────────────────────────────┘
```

### 2. User Clicks FAB

```
User clicks the chat icon button (FAB)
    ↓
Overlay expands over the page content
```

### 3. Expanded State

```
┌─────────────────────────────────────────────────┐
│ Header: Custom Cortex Agents                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Welcome to Custom Cortex Agents                │
│  Click the chat button...                       │
│                    ┌────────────────────────┐   │
│                    │ 💬 Chat Assistant    _ │   │ <- Overlay Header
│                    ├────────────────────────┤   │
│                    │                        │   │
│                    │  Loading config...     │   │ <- Chat Content
│                    │                        │   │
│                    │                        │   │
│                    │                        │   │
│                    │                        │   │
│                    │                        │   │
│                    │                        │◢  │ <- Resize handle
│                    └────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 4. Chatting

```
┌─────────────────────────────────────────────────┐
│ Header: Custom Cortex Agents                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Welcome to Custom Cortex Agents                │
│  Click the chat button...                       │
│                    ┌────────────────────────┐   │
│                    │ 💬 Chat Assistant    _ │   │
│                    ├────────────────────────┤   │
│                    │                        │   │
│                    │ 👤 Hello!              │   │
│                    │                        │   │
│                    │ 🤖 Hi! How can I help? │   │
│                    │                        │   │
│                    │                        │   │
│                    ├────────────────────────┤   │
│                    │ Type a message... [🎤] │   │
│                    └────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 5. User Clicks Minimize

```
User clicks the minimize button (_ icon)
    ↓
Overlay collapses back to FAB
    ↓
Returns to Initial State
```

## Layout Comparison

### Inline Mode (Old Behavior)

```
┌─────────────────────────────────────────┐
│ Header                                  │
├─────────────────────────────────────────┤
│                                         │
│ Chat Interface (takes up full page)    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │                                 │    │
│ │  Chat messages here             │    │
│ │                                 │    │
│ │                                 │    │
│ └─────────────────────────────────┘    │
│                                         │
│ ┌─────────────────────────────────┐    │
│ │ Type a message...               │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Characteristics:**
- Chat is part of page flow
- Takes up full height
- Scrolls with page
- No minimize option

### Overlay Mode (New Behavior)

```
┌─────────────────────────────────────────┐
│ Header                                  │
├─────────────────────────────────────────┤
│                                         │
│ Main Content Area                       │
│ (Your application content)              │
│                                         │
│ - Navigation                            │
│ - Dashboard                             │
│ - Forms                                 │
│ - Tables                                │
│ - etc.                                  │
│                                         │
│                              ┌────┐     │
│                              │ 💬 │ FAB │
│                              └────┘     │
└─────────────────────────────────────────┘
       │
       │ Click FAB
       ↓
┌─────────────────────────────────────────┐
│ Header                                  │
├─────────────────────────────────────────┤
│                                         │
│ Main Content                            │
│ (Still visible)    ┌──────────────┐    │
│                    │ 💬 Chat    _ │    │
│                    ├──────────────┤    │
│                    │              │    │
│                    │ Messages...  │    │
│                    │              │    │
│                    └──────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Characteristics:**
- Chat floats above content
- Doesn't affect page layout
- Can be minimized
- Resizable
- Positioned at corner

## Button Positions

### Bottom Right (Default)

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                              ┌────┐     │
│                              │ 💬 │     │
│                              └────┘     │
└─────────────────────────────────────────┘
```

### Bottom Left

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│     ┌────┐                              │
│     │ 💬 │                              │
│     └────┘                              │
└─────────────────────────────────────────┘
```

### Top Right

```
┌─────────────────────────────────────────┐
│                              ┌────┐     │
│                              │ 💬 │     │
│                              └────┘     │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Top Left

```
┌─────────────────────────────────────────┐
│     ┌────┐                              │
│     │ 💬 │                              │
│     └────┘                              │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

## Size Configurations

### Default (70% x 70vh)

```
Screen: 1920px x 1080px

Overlay size: 1344px x 756px (70% of 1920, 70% of 1080)

┌────────────────────────────────────────────────┐
│                                                │
│         ┌──────────────────────────┐          │
│         │                          │          │
│         │                          │          │
│         │        Chat Overlay      │          │
│         │        (70% x 70vh)      │          │
│         │                          │          │
│         │                          │          │
│         └──────────────────────────┘          │
│                                                │
└────────────────────────────────────────────────┘
```

### Small (500px x 600px)

```
┌────────────────────────────────────────────────┐
│                                                │
│                           ┌────────┐          │
│                           │        │          │
│                           │  Chat  │          │
│                           │  500px │          │
│                           │  600px │          │
│                           │        │          │
│                           └────────┘          │
│                                                │
└────────────────────────────────────────────────┘
```

### Large (90% x 85vh)

```
Screen: 1920px x 1080px

Overlay size: 1728px x 918px

┌────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │                                          │ │
│  │                                          │ │
│  │           Chat Overlay                   │ │
│  │           (90% x 85vh)                   │ │
│  │                                          │ │
│  │                                          │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

## Resizing

Users can resize the overlay by dragging the bottom-right corner:

### Before Resize

```
┌────────────────────┐
│ 💬 Chat       _    │
├────────────────────┤
│                    │
│  Chat content      │
│                    │
│                    │
│                    │
│                   ◢│ <- Drag handle
└────────────────────┘
```

### During Resize

```
User drags corner ◢
    ↓
┌──────────────────────────┐
│ 💬 Chat             _    │
├──────────────────────────┤
│                          │
│  Chat content            │
│                          │
│                          │
│                          │
│                          │
│                          │
│                         ◢│
└──────────────────────────┘
```

### Constraints

```
Minimum Size:
┌────────┐
│320px   │
│x       │
│400px   │
│       ◢│
└────────┘

Maximum Size:
┌────────────────────────────────────┐
│ 95% viewport width                 │
│ x                                  │
│ 95% viewport height                │
│                                    │
│                                    │
│                                   ◢│
└────────────────────────────────────┘
```

## Component Structure

```
App Component
│
├── ChatHeader
│   └── (Your application header)
│
├── Main Content Area
│   └── (Your application content)
│
└── SimpleChatInterface (overlay mode)
    │
    ├── When minimized:
    │   └── Fab (Floating Action Button)
    │       └── Chat Icon
    │
    └── When expanded:
        └── Paper (Overlay Container)
            ├── Header
            │   ├── Chat Icon + Title
            │   └── Minimize Button
            │
            └── Content
                └── SimpleChatInterfaceInner
                    ├── Agent Config
                    ├── Chat Messages
                    └── Chat Input
```

## Z-Index Layers

```
Layer 4: FAB (z-index: 9999)
         ┌────┐
         │ 💬 │
         └────┘

Layer 3: Overlay (z-index: 9998)
         ┌──────────────┐
         │ Chat Overlay │
         └──────────────┘

Layer 2: Your Content (default z-index)
         ┌──────────────────────┐
         │ Application Content  │
         └──────────────────────┘

Layer 1: Background (z-index: 0)
         ┌──────────────────────┐
         │ Page Background      │
         └──────────────────────┘
```

## Responsive Behavior

### Desktop (> 1024px)

```
┌────────────────────────────────────────────────┐
│                                                │
│  Overlay: 70% width = ~716px                  │
│                                                │
│                   ┌──────────────────┐        │
│                   │                  │        │
│                   │  Chat Overlay    │        │
│                   │                  │        │
│                   │                  │        │
│                   └──────────────────┘        │
│                                                │
└────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)

```
┌────────────────────────────────┐
│                                │
│  Overlay: 70% width = ~537px  │
│                                │
│         ┌──────────────┐      │
│         │              │      │
│         │    Chat      │      │
│         │   Overlay    │      │
│         │              │      │
│         └──────────────┘      │
│                                │
└────────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────────┐
│                  │
│  Overlay maxes   │
│  at 95vw         │
│                  │
│  ┌────────────┐ │
│  │            │ │
│  │   Chat     │ │
│  │            │ │
│  │            │ │
│  └────────────┘ │
│                  │
└──────────────────┘
```

**Note:** On mobile, the default 70% width may be quite large. Consider using a percentage-based width that adapts better to smaller screens.

## Animation States

### FAB Hover

```
Normal State:          Hover State:
┌────┐                ┌─────┐
│ 💬 │    ─────>      │ 💬  │ (scaled 1.1x)
└────┘                └─────┘
                      (slight shadow increase)
```

### Expand Transition

```
FAB                    Overlay
┌────┐                ┌──────────────┐
│ 💬 │    ─────>      │ 💬 Chat    _ │
└────┘                │              │
                      │              │
                      └──────────────┘

(Instant transition, no animation currently)
```

### Minimize Transition

```
Overlay                FAB
┌──────────────┐      ┌────┐
│ 💬 Chat    _ │  ──> │ 💬 │
│              │      └────┘
│              │
└──────────────┘

(Instant transition, no animation currently)
```

## Best Practices Illustrated

### ✅ Good: Bottom-right with adequate space

```
┌────────────────────────────────────────┐
│ Navigation Bar                         │
├────────────────────────────────────────┤
│                                        │
│ Main Content                           │
│ - Plenty of space                      │
│ - FAB doesn't block anything           │
│                                        │
│                             ┌────┐    │
│                             │ 💬 │    │
│                             └────┘    │
└────────────────────────────────────────┘
```

### ❌ Bad: Blocking important UI

```
┌────────────────────────────────────────┐
│ Navigation Bar                         │
├────────────────────────────────────────┤
│                                        │
│ Main Content                           │
│                                        │
│                      [Save Button]    │
│                             ┌────┐    │
│                             │ 💬 │    │ <- Blocks button!
│                             └────┘    │
└────────────────────────────────────────┘

Solution: Use bottom-left or adjust your button positions
```

### ✅ Good: Appropriate size for content

```
70% width on 1920px screen = 1344px
(Comfortable for reading and interaction)

┌────────────────────────────────────────────┐
│                                            │
│            ┌─────────────────────┐        │
│            │                     │        │
│            │  Readable width     │        │
│            │  Good proportions   │        │
│            │                     │        │
│            └─────────────────────┘        │
│                                            │
└────────────────────────────────────────────┘
```

### ❌ Bad: Too large (95% width might be overwhelming)

```
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐ │
│  │                                      │ │
│  │  Too wide, overwhelming              │ │
│  │  Blocks too much content             │ │
│  │                                      │ │
│  └──────────────────────────────────────┘ │
└────────────────────────────────────────────┘

Solution: Use 60-75% width for better balance
```

## Summary

The overlay mode provides a non-intrusive way to add chat functionality to any application. The visual design follows Material-UI principles with:

- Clear affordance (FAB indicates clickable chat)
- Adequate contrast (elevated shadows)
- Flexible sizing (resizable, configurable)
- Minimal obstruction (positioned at corners)
- Clear actions (minimize button, FAB)

This makes it perfect for adding AI assistance to existing applications without disrupting the user's workflow.

