# @chat-overlay/simple-chat-interface

Embeddable chat interface component powered by Snowflake Cortex Agents REST API. Built with React, TypeScript, and Material-UI.

## Installation

```bash
npm install @chat-overlay/simple-chat-interface
```

## Quick Start

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function MyApp() {
  return (
    <ChatThemeProvider>
      <div>
        <h1>My Application</h1>
        <SimpleChatInterface backendUrl="http://localhost:3001" />
      </div>
    </ChatThemeProvider>
  );
}
```

## Props

### SimpleChatInterface

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `backendUrl` | `string` | Yes | - | URL of your backend proxy server that communicates with Snowflake |
| `overlay` | `OverlayConfig` | No | - | Overlay/floating chat mode configuration |
| `theme` | `ThemeConfig` | No | - | Custom theme configuration |
| `initialAgent` | `string` | No | - | Initial agent to select (if not provided, first alphabetical agent is selected) |
| `onError` | `(error: string) => void` | No | - | Callback when an error occurs |
| `className` | `string` | No | - | Custom CSS class |
| `style` | `React.CSSProperties` | No | - | Custom inline styles |

### OverlayConfig

```typescript
interface OverlayConfig {
  enabled: boolean;                    // Enable overlay/floating mode
  defaultWidth?: string | number;      // Default width when opened (default: '70%')
  defaultHeight?: string | number;     // Default height when opened (default: '70vh')
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';  // Position of floating button (default: 'bottom-right')
  initialState?: 'minimized' | 'expanded';  // Initial state (default: 'minimized')
}
```

### ThemeConfig

```typescript
interface ThemeConfig {
  primary?: string;    // Primary color (default: '#667eea')
  secondary?: string;  // Secondary color (default: '#764ba2')
  mode?: 'light' | 'dark';  // Theme mode (default: 'dark')
}
```

## Usage Examples

### Basic Usage

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <SimpleChatInterface backendUrl="http://localhost:3001" />
    </ChatThemeProvider>
  );
}
```

### With Custom Theme

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <SimpleChatInterface 
        backendUrl="http://localhost:3001"
        theme={{
          primary: '#1976d2',
          secondary: '#dc004e',
          mode: 'light'
        }}
      />
    </ChatThemeProvider>
  );
}
```

### With Error Handling

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  const handleError = (error: string) => {
    console.error('Chat error:', error);
    // Handle error (show notification, log to service, etc.)
  };

  return (
    <ChatThemeProvider>
      <SimpleChatInterface 
        backendUrl="http://localhost:3001"
        onError={handleError}
      />
    </ChatThemeProvider>
  );
}
```

### Floating Overlay Mode (Recommended)

Transform the chat into a floating widget with a minimizable button:

```tsx
import { SimpleChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <div>
        <h1>My Application</h1>
        <p>Your main content here...</p>
        
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

**Features:**
- ✅ Minimized as a floating button by default
- ✅ Opens as an overlay on top of your content
- ✅ Resizable by dragging the corners
- ✅ Minimize button to collapse back to floating button
- ✅ Configurable size and position

### Overlay with Custom Size

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{
    enabled: true,
    defaultWidth: '500px',      // Fixed width
    defaultHeight: '80vh',       // 80% of viewport height
    buttonPosition: 'bottom-left',
    initialState: 'minimized'
  }}
/>
```

### Overlay Starting Expanded

```tsx
<SimpleChatInterface 
  backendUrl="http://localhost:3001"
  overlay={{
    enabled: true,
    initialState: 'expanded'    // Start with overlay open
  }}
/>
```

### Within Existing MUI Theme

If you already have a Material-UI theme in your app, you can skip `ChatThemeProvider`:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SimpleChatInterface } from '@chat-overlay/simple-chat-interface';

const myTheme = createTheme({
  // Your existing theme configuration
});

function App() {
  return (
    <ThemeProvider theme={myTheme}>
      <SimpleChatInterface backendUrl="http://localhost:3001" />
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

## License

MIT

