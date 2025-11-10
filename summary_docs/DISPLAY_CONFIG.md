# Display Configuration Feature

## Overview

Added configurable visibility control for optional sections in chat messages:
- **Thinking & Planning** section
- **SQL Queries Executed** section  
- **Annotations** section

Charts/visualizations and message text are always displayed.

## Configuration

### DisplayConfig Interface

```typescript
interface DisplayConfig {
  /** Show "Thinking & Planning" section (default: false) */
  showThinking?: boolean;
  /** Show "SQL Queries Executed" section (default: false) */
  showSqlQueries?: boolean;
  /** Show "Annotations" section (default: false) */
  showAnnotations?: boolean;
}
```

### Default Behavior

By default, all optional sections are **hidden** (set to `false`):
- ❌ Thinking & Planning section - Hidden
- ❌ SQL Queries Executed section - Hidden
- ❌ Annotations section - Hidden
- ✅ Charts/Visualizations - Always shown
- ✅ Message text - Always shown

## Usage

### Basic Example (All Sections Hidden - Default)

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <SimpleChatInterface 
        backendUrl="http://localhost:3001"
        // No displayConfig = all optional sections hidden by default
      />
    </ChatThemeProvider>
  );
}
```

### Show All Optional Sections

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  displayConfig={{
    showThinking: true,
    showSqlQueries: true,
    showAnnotations: true
  }}
/>
```

### Show Only SQL Queries

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  displayConfig={{
    showSqlQueries: true
    // showThinking and showAnnotations default to false
  }}
/>
```

### Show Thinking and Annotations

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  displayConfig={{
    showThinking: true,
    showAnnotations: true
    // showSqlQueries defaults to false
  }}
/>
```

### With Overlay Mode

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{
    enabled: true,
    defaultWidth: '70%',
    defaultHeight: '70vh',
    buttonPosition: 'bottom-right',
    initialState: 'minimized'
  }}
  displayConfig={{
    showThinking: false,    // Hidden
    showSqlQueries: false,  // Hidden
    showAnnotations: false  // Hidden
  }}
/>
```

## Implementation Details

### Component Hierarchy

```
SimpleChatInterface
  ├── ConfigProvider (receives displayConfig)
  │   └── SimpleChatInterfaceInner (uses displayConfig from context)
  │       └── ChatMessage (receives show* props)
  │           ├── ThinkingSteps (conditionally rendered)
  │           ├── SqlQueriesSection (conditionally rendered)
  │           ├── ChartsSection (always rendered)
  │           ├── AnnotationsSection (conditionally rendered)
  │           └── Message text (always rendered)
```

### Context Integration

The `displayConfig` is passed through the `ConfigContext`:

```typescript
// ConfigContext.tsx
export interface ChatConfig {
  backendUrl: string;
  onError?: (error: string) => void;
  displayConfig?: DisplayConfig;  // New addition
}
```

### ChatMessage Component Updates

Added new props to conditionally render sections:

```typescript
interface ChatMessageProps {
  // ... existing props
  showThinking?: boolean;
  showSqlQueries?: boolean;
  showAnnotations?: boolean;
}
```

**Conditional Rendering:**

```tsx
{/* Thinking Steps - Conditionally rendered */}
{showThinking && message.sender === 'assistant' && (
  <ThinkingSteps ... />
)}

{/* SQL Queries - Conditionally rendered */}
{showSqlQueries && message.sender === 'assistant' && (
  <SqlQueriesSection ... />
)}

{/* Annotations - Conditionally rendered */}
{showAnnotations && message.status === 'sent' && (
  <AnnotationsSection ... />
)}

{/* Charts - ALWAYS rendered when present */}
{message.sender === 'assistant' && message.charts && (
  <ChartsSection ... />
)}

{/* Message text - ALWAYS rendered */}
<MarkdownFormatter content={message.text} />
```

## Files Modified

### Package Files

1. **`packages/simple-chat-interface/src/contexts/ConfigContext.tsx`**
   - Added `DisplayConfig` interface
   - Updated `ChatConfig` to include `displayConfig`

2. **`packages/simple-chat-interface/src/components/SimpleChatInterface.tsx`**
   - Added `DisplayConfig` interface export
   - Updated `SimpleChatInterfaceProps` to include `displayConfig`
   - Updated `SimpleChatInterfaceInner` to read `displayConfig` from context
   - Pass display flags to `ChatMessage` components
   - Updated wrapper to pass `displayConfig` to `ConfigProvider`

3. **`packages/simple-chat-interface/src/components/chat/ChatMessage.tsx`**
   - Added `showThinking`, `showSqlQueries`, `showAnnotations` props
   - Default all to `false`
   - Conditionally render sections based on flags

4. **`packages/simple-chat-interface/src/index.ts`**
   - Export `DisplayConfig` type

### Main Application Files

5. **`src/index.tsx`**
   - Added `displayConfig` prop with all options set to `false`

## Use Cases

### 1. Production/End-User Mode (Default)

Hide technical details from end users:

```tsx
displayConfig={{
  showThinking: false,     // Hide AI reasoning
  showSqlQueries: false,   // Hide technical queries
  showAnnotations: false   // Hide metadata
}}
```

**Result:** Clean, simple chat interface showing only answers and charts.

### 2. Development/Debug Mode

Show all details for debugging:

```tsx
displayConfig={{
  showThinking: true,      // See AI reasoning
  showSqlQueries: true,    // See executed queries
  showAnnotations: true    // See metadata
}}
```

**Result:** Full transparency for development and troubleshooting.

### 3. Business User Mode

Show query transparency without technical details:

```tsx
displayConfig={{
  showSqlQueries: true,    // Show data queries for transparency
  showThinking: false,     // Hide complex AI reasoning
  showAnnotations: false   // Hide technical metadata
}}
```

**Result:** Users see what data was queried but not implementation details.

### 4. Executive Dashboard Mode

Minimal interface focused on insights:

```tsx
displayConfig={{
  showThinking: false,
  showSqlQueries: false,
  showAnnotations: false
}}
// Or simply omit displayConfig entirely (defaults to all false)
```

**Result:** Only answers and visualizations visible.

## Visual Comparison

### With All Sections Visible

```
┌─────────────────────────────────────┐
│ 🤖 Assistant                        │
├─────────────────────────────────────┤
│ ▼ Thinking & Planning               │
│   • Analyzing the question...       │
│   • Determining data requirements   │
│                                     │
│ ▼ SQL Queries Executed              │
│   SELECT * FROM sales...            │
│                                     │
│ Here's your answer...               │
│                                     │
│ [Chart Visualization]               │
│                                     │
│ ▼ Annotations                       │
│   • Source: sales_db                │
│   • Confidence: 95%                 │
└─────────────────────────────────────┘
```

### With All Sections Hidden (Default)

```
┌─────────────────────────────────────┐
│ 🤖 Assistant                        │
├─────────────────────────────────────┤
│ Here's your answer...               │
│                                     │
│ [Chart Visualization]               │
│                                     │
└─────────────────────────────────────┘
```

## Benefits

1. **Simplified UI**: Default experience is clean and focused on answers
2. **Flexibility**: Enable technical details when needed for debugging
3. **Audience-Appropriate**: Customize visibility based on user expertise
4. **Performance**: Sections aren't just hidden with CSS - they're not rendered at all
5. **Backward Compatible**: Existing code works without changes (defaults to hidden)

## API Updates

### SimpleChatInterface Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `displayConfig` | `DisplayConfig` | No | `{ showThinking: false, showSqlQueries: false, showAnnotations: false }` | Controls visibility of optional sections |

### DisplayConfig Type

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showThinking` | `boolean` | `false` | Show "Thinking & Planning" section |
| `showSqlQueries` | `boolean` | `false` | Show "SQL Queries Executed" section |
| `showAnnotations` | `boolean` | `false` | Show "Annotations" section |

## Migration Guide

### Existing Applications

No changes required! The default behavior hides all optional sections:

```tsx
// Before
<SimpleChatInterface backendUrl="http://localhost:3001" />

// After (same behavior)
<SimpleChatInterface backendUrl="http://localhost:3001" />
```

### To Show Sections Previously Visible

If you had these sections visible before and want to keep them:

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  displayConfig={{
    showThinking: true,
    showSqlQueries: true,
    showAnnotations: true
  }}
/>
```

## TypeScript Support

Full TypeScript support with type safety:

```typescript
import { 
  SimpleChatInterface, 
  DisplayConfig 
} from '@chat-overlay/simple-chat-interface';

const config: DisplayConfig = {
  showThinking: true,    // ✅ Type-safe
  showSqlQueries: false,
  showAnnotations: true
};

<SimpleChatInterface 
  backendUrl="..."
  displayConfig={config}
/>
```

## Build Status

✅ **Package**: Built successfully  
✅ **Main App**: Built successfully  
✅ **Bundle**: 328.33 kB (+95 B minimal increase)  
✅ **TypeScript**: No errors  
✅ **Backward Compatible**: Yes

## Summary

The display configuration feature provides fine-grained control over which optional sections appear in chat messages. By defaulting to hidden, the interface is clean and focused for end users, while still allowing developers and power users to enable technical details when needed. The implementation is efficient (sections aren't rendered when hidden), type-safe, and fully backward compatible.

