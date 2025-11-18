# @chat-overlay/simple-chat-interface

Drop-in React chat interface powered by [Snowflake Cortex Agents REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api). Built with React, TypeScript, and Material-UI.

> **💡 Note:** This is a frontend-only package. You'll also need a backend that implements the required API endpoints. See the [Backend Integration Guide](../../server/CHAT_SERVER_README.md) for a ready-to-use Express module.

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
| `applicationName` | `string` | No | `'simple_chat_interface'` | Application name for thread tracking |

### InlineChatInterface

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `backendUrl` | `string` | Yes | - | URL of your backend proxy server |
| `initialAgent` | `string` | No | - | Initial agent to select |
| `onError` | `(error: string) => void` | No | - | Callback when an error occurs |
| `className` | `string` | No | - | Custom CSS class |
| `style` | `React.CSSProperties` | No | - | Custom inline styles |
| `displayConfig` | `DisplayConfig` | No | - | Configuration for optional sections |
| `applicationName` | `string` | No | `'simple_chat_interface'` | Application name for thread tracking |

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
          applicationName="my_app"
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
- ✅ Thread history panel (click history icon in chat input)

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
          applicationName="my_app"
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
          applicationName: 'my_app',
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

This component requires a backend that implements the following API endpoints. We provide a ready-to-use Express module - see the [Backend Integration Guide](../../server/CHAT_SERVER_README.md).

### Required Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all available agents with configuration |
| `/api/agents/:name` | GET | Get details for a specific agent |
| `/api/agents/:name/messages` | POST | Send a message to an agent (streaming SSE) |
| `/api/threads` | POST | Create a new conversation thread |
| `/api/threads` | GET | List all user's conversation threads |
| `/api/threads/:id` | GET | Get conversation history for a thread |
| `/api/threads/:id` | POST | Update thread name |
| `/api/threads/:id` | DELETE | Delete a thread |

### Quick Backend Setup

**Option 1: Use our Express module (recommended)**

```javascript
const { createChatRouter } = require('./chatServer');

app.use('/api', createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT
}));
```

See the [Backend Integration Guide](../../server/CHAT_SERVER_README.md) for complete setup instructions.

**Option 2: Implement your own**

See the API specifications below for request/response formats.

### API Specifications

#### GET /api/agents

Returns agent configuration:

```json
{
  "agents": {
    "agent_name": {
      "displayName": "Agent Display Name",
      "visible": true,
      "starterQuestions": ["Question 1?", "Question 2?"],
      "description": "Agent description"
    }
  },
  "defaultAgent": "agent_name"
}
```

#### POST /api/agents/:agentName/messages

Proxies streaming chat requests to Snowflake. Accepts:

```json
{
  "messages": [
    {
      "role": "user",
      "content": [{"type": "text", "text": "User message"}]
    }
  ],
  "thread_id": "optional_thread_id",
  "parent_message_id": 0,
  "tool_choice": {"type": "auto"},
  "stream": true
}
```

Returns Server-Sent Events (SSE) stream with events:
- `response.text.delta` - Streaming text response
- `response.status` - Status updates  
- `response.tool_result` - Tool execution results
- `response.thinking` - Thinking process text
- `response.chart` - Chart visualizations (Vega-Lite)
- `response.text.annotation` - Citations and references
- `metadata` - Message metadata (includes `message_id`)

#### Thread Endpoints

**POST /api/threads** - Create thread

Request:
```json
{"origin_application": "your_app_name"}
```

Response:
```json
{
  "thread_id": "123456",
  "origin_application": "your_app_name",
  "created_on": 1234567890
}
```

**GET /api/threads** - List threads

Response:
```json
[
  {
    "thread_id": 123456,
    "thread_name": "Thread name",
    "created_on": 1234567890,
    "updated_on": 1234567890
  }
]
```

**GET /api/threads/:id** - Get thread history

Response:
```json
{
  "metadata": {
    "thread_id": 123456,
    "thread_name": "Thread name",
    "created_on": 1234567890,
    "updated_on": 1234567890
  },
  "messages": [
    {
      "message_id": 1,
      "parent_id": 0,
      "created_on": 1234567890,
      "role": "user",
      "message_payload": "{...}"
    }
  ]
}
```

**POST /api/threads/:id** - Update thread name

Request:
```json
{"thread_name": "New name"}
```

Response:
```
204 No Content
```

**DELETE /api/threads/:id** - Delete thread

Response:
```
204 No Content
```

## Features

- Real-time streaming chat interface
- Support for multiple Snowflake Cortex Agents
- Thread management (create, list, revisit conversations)
- Thinking process visualization (optional)
- SQL query display (optional)
- Chart visualizations (Vega-Lite)
- Citations and annotations (optional)
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
4. **Application Name:** New `applicationName` prop for thread tracking (defaults to `'simple_chat_interface'`)

## License

MIT
