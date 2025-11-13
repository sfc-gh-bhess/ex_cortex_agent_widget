# @chat-overlay/simple-chat-interface

Embeddable chat interface component powered by Snowflake Cortex Agents REST API. Built with React, TypeScript, and Material-UI.

## Installation

```bash
npm install @chat-overlay/simple-chat-interface
```

## Components

This package provides three purpose-built components:

- **`FloatingChatInterface`** - Floating button that expands to an overlay (most common use case)
- **`InlineChatInterface`** - Inline/embedded chat interface for your page
- **`ChatInterface`** - Low-level base component for advanced customization

## Quick Start

### Floating Chat Button (Recommended)

```tsx
import { FloatingChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function MyApp() {
  return (
    <ChatThemeProvider>
      <div>
        <h1>My Application</h1>
        <FloatingChatInterface backendUrl="http://localhost:3001" />
      </div>
    </ChatThemeProvider>
  );
}
```

### Inline Chat

```tsx
import { InlineChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function MyApp() {
  return (
    <ChatThemeProvider>
      <div>
        <h1>My Application</h1>
        <InlineChatInterface backendUrl="http://localhost:3001" />
      </div>
    </ChatThemeProvider>
  );
}
```

## Props

### FloatingChatInterface

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `backendUrl` | `string` | Yes | - | URL of your backend proxy server that communicates with Snowflake |
| `defaultWidth` | `string \| number` | No | `'70%'` | Default width when opened |
| `defaultHeight` | `string \| number` | No | `'70vh'` | Default height when opened |
| `buttonPosition` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | No | `'bottom-right'` | Position of floating button |
| `initialState` | `'minimized' \| 'expanded'` | No | `'minimized'` | Initial state |
| `initialAgent` | `string` | No | - | Initial agent to select |
| `onError` | `(error: string) => void` | No | - | Callback when an error occurs |
| `displayConfig` | `DisplayConfig` | No | - | Configuration for optional sections |

### InlineChatInterface

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `backendUrl` | `string` | Yes | - | URL of your backend proxy server |
| `initialAgent` | `string` | No | - | Initial agent to select |
| `onError` | `(error: string) => void` | No | - | Callback when an error occurs |
| `className` | `string` | No | - | Custom CSS class |
| `style` | `React.CSSProperties` | No | - | Custom inline styles |
| `displayConfig` | `DisplayConfig` | No | - | Configuration for optional sections |

### ChatInterface (Advanced)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `className` | `string` | No | - | Custom CSS class |
| `style` | `React.CSSProperties` | No | - | Custom inline styles |

**Note:** `ChatInterface` requires a `ConfigProvider` wrapper to function.

### DisplayConfig

```typescript
interface DisplayConfig {
  showThinking?: boolean;       // Show "Thinking & Planning" section (default: false)
  showSqlQueries?: boolean;     // Show "SQL Queries Executed" section (default: false)
  showAnnotations?: boolean;    // Show "Annotations" section (default: false)
}
```

## Usage Examples

### Basic Floating Chat

```tsx
import { FloatingChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <FloatingChatInterface backendUrl="http://localhost:3001" />
    </ChatThemeProvider>
  );
}
```

### Floating Chat with Custom Configuration

```tsx
import { FloatingChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <div>
        <h1>My Application</h1>
        <p>Your main content here...</p>
        
        {/* Floating chat overlay */}
        <FloatingChatInterface 
          backendUrl="http://localhost:3001"
          defaultWidth="70%"
          defaultHeight="70vh"
          buttonPosition="bottom-right"
          initialState="minimized"
          displayConfig={{
            showThinking: false,
            showSqlQueries: false,
            showAnnotations: false
          }}
        />
      </div>
    </ChatThemeProvider>
  );
}
```

**Features:**
- ✅ Minimized as a floating button by default
- ✅ Opens as an overlay on top of your content
- ✅ Resizable by dragging the top-left corner
- ✅ Minimize button to collapse back to floating button
- ✅ Configurable size and position

### Floating Chat with Custom Size

```tsx
<FloatingChatInterface 
  backendUrl="http://localhost:3001"
  defaultWidth="500px"      // Fixed width
  defaultHeight="80vh"      // 80% of viewport height
  buttonPosition="bottom-left"
/>
```

### Floating Chat Starting Expanded

```tsx
<FloatingChatInterface 
  backendUrl="http://localhost:3001"
  initialState="expanded"    // Start with overlay open
/>
```

### Inline Chat (Embedded)

```tsx
import { InlineChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <div style={{ height: '80vh' }}>
        <InlineChatInterface 
          backendUrl="http://localhost:3001"
          displayConfig={{
            showThinking: true,
            showSqlQueries: true,
            showAnnotations: true
          }}
        />
      </div>
    </ChatThemeProvider>
  );
}
```

### With Error Handling

```tsx
import { FloatingChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  const handleError = (error: string) => {
    console.error('Chat error:', error);
    // Handle error (show notification, log to service, etc.)
  };

  return (
    <ChatThemeProvider>
      <FloatingChatInterface 
        backendUrl="http://localhost:3001"
        onError={handleError}
      />
    </ChatThemeProvider>
  );
}
```

### Advanced: Custom Configuration with ChatInterface

For advanced use cases where you need full control over the configuration:

```tsx
import { ChatInterface, ConfigProvider, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <ConfigProvider 
        config={{
          backendUrl: 'http://localhost:3001',
          onError: (error) => console.error(error),
          displayConfig: {
            showThinking: true,
            showSqlQueries: true,
            showAnnotations: true
          }
        }}
      >
        <div style={{ height: '100vh' }}>
          <ChatInterface />
        </div>
      </ConfigProvider>
    </ChatThemeProvider>
  );
}
```

### Within Existing MUI Theme

If you already have a Material-UI theme in your app, you can skip `ChatThemeProvider`:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FloatingChatInterface } from '@chat-overlay/simple-chat-interface';

const myTheme = createTheme({
  // Your existing theme configuration
});

function App() {
  return (
    <ThemeProvider theme={myTheme}>
      <FloatingChatInterface backendUrl="http://localhost:3001" />
    </ThemeProvider>
  );
}
```

## Backend Requirements

This component requires a backend proxy server that handles authentication and communicates with the Snowflake Cortex Agents REST API. The backend should expose the following endpoints:

### GET /api/agents/config

Returns agent configuration:

```json
{
  "agents": {
    "agent_name": {
      "displayName": "Agent Display Name",
      "visible": true,
      "starterQuestions": ["Question 1", "Question 2"],
      "description": "Agent description"
    }
  },
  "defaultAgent": "agent_name"
}
```

### POST /api/agents/:agentName/messages

Proxies streaming chat requests to Snowflake. Accepts:

```json
{
  "messages": [
    {
      "role": "user",
      "content": [{"type": "text", "text": "User message"}]
    }
  ],
  "tool_choice": {"type": "auto"},
  "stream": true
}
```

Returns Server-Sent Events (SSE) stream with events like:
- `response.text.delta` - Streaming text response
- `response.status` - Status updates
- `response.tool_result` - Tool execution results
- `response.thinking` - Thinking process text
- `response.chart` - Chart visualizations
- `response.text.annotation` - Citations and references

## Features

- Real-time streaming chat interface
- Support for multiple Snowflake Cortex Agents
- Thinking process visualization
- SQL query display
- Chart visualizations (Vega-Lite)
- Citations and annotations
- Starter questions
- Dark/light theme support
- Voice input (speech recognition)
- Responsive design
- Full TypeScript support

## Migration Guide

If you were using `SimpleChatInterface` from a previous version, here's how to migrate:

### From SimpleChatInterface (Overlay Mode)

**Before:**
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
  displayConfig={{ showThinking: false }}
/>
```

**After:**
```tsx
<FloatingChatInterface 
  backendUrl="http://localhost:3001"
  defaultWidth="70%"
  defaultHeight="70vh"
  buttonPosition="bottom-right"
  initialState="minimized"
  displayConfig={{ showThinking: false }}
/>
```

### From SimpleChatInterface (Inline Mode)

**Before:**
```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{ enabled: false }}
  displayConfig={{ showThinking: true }}
/>
```

**After:**
```tsx
<InlineChatInterface 
  backendUrl="http://localhost:3001"
  displayConfig={{ showThinking: true }}
/>
```

### Key Changes

1. **Component Names:** `SimpleChatInterface` → `FloatingChatInterface` or `InlineChatInterface`
2. **Props Flattened:** Overlay properties are now top-level props (no nested `overlay` object)
3. **Explicit Components:** Use purpose-specific components instead of toggling modes with flags

## License

MIT

