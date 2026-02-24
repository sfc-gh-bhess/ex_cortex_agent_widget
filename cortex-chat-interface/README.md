# @cortex-chat/interface

Drop-in React chat interface for [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api). Built with React, TypeScript, and Material-UI.

This is a **frontend-only** package. It requires a backend that implements the endpoints described in [Backend Requirements](#backend-requirements). The companion [`cortex-chat-server`](../cortex-chat-server/README.md) module provides a ready-to-use Express router.

## Architecture

```
@cortex-chat/interface
├── components/
│   ├── FloatingChatInterface   ← Floating button + resizable overlay (most common)
│   ├── InlineChatInterface     ← Embedded inline panel
│   └── ChatInterface           ← Low-level base component (advanced)
├── contexts/
│   ├── ConfigProvider          ← Backend URL, display options, error callback
│   └── ChatThemeProvider       ← MUI theme wrapper (dark/light)
├── hooks/
│   ├── useChatMessages         ← Message streaming and SSE parsing
│   ├── useAgentConfig          ← Agent discovery and selection
│   ├── useThreadManagement     ← Thread CRUD operations
│   └── useSpeechRecognition    ← Voice input
├── services/
│   └── snowflakeAgentsApi      ← HTTP client for backend endpoints
└── types/
    ├── chat.ts                 ← Message, thread, annotation types
    └── chart.ts                ← Vega-Lite chart types
```

`FloatingChatInterface` and `InlineChatInterface` are convenience wrappers that set up a `ConfigProvider` and render `ChatInterface`. For most use cases, pick one of these two. Use `ChatInterface` directly only if you need full control over the config context.

## Sample Application

The `sample-app/` directory at the repository root contains a complete sample application that demonstrates:

- Wrapping `FloatingChatInterface` with authentication (`AuthContext`) and theming (`ThemeContext`)
- OAuth/OIDC login flow with callback handling
- Environment-driven configuration for PAT and OAuth modes

This is a good starting point if you're building a new application. If you're adding the chat interface to an **existing** React app, follow the embedding guide below.

## Embedding in an Existing React App

### Installation

```bash
npm install ./path/to/cortex-chat-interface
```

The package has peer dependencies on `@mui/material`, `@emotion/react`, `@emotion/styled`, `react`, and `react-dom`. If your app already uses MUI, these are satisfied automatically.

### Floating Chat Button (Recommended)

A floating action button in the corner of your app. Clicking it opens a resizable overlay.

```tsx
import { FloatingChatInterface, ChatThemeProvider } from '@cortex-chat/interface';

function App() {
  return (
    <ChatThemeProvider>
      <YourExistingApp />
      <FloatingChatInterface backendUrl="http://localhost:3001" />
    </ChatThemeProvider>
  );
}
```

The overlay is draggable, resizable, and minimizable. Thread history is accessible via the history icon in the chat input area.

### Inline Chat (Embedded)

Renders the chat interface inline within your page layout. Useful for dedicated chat pages or split-panel UIs.

```tsx
import { InlineChatInterface, ChatThemeProvider } from '@cortex-chat/interface';

function App() {
  return (
    <ChatThemeProvider>
      <div style={{ display: 'flex', height: '100vh' }}>
        <aside style={{ width: 300 }}>Sidebar</aside>
        <main style={{ flex: 1 }}>
          <InlineChatInterface backendUrl="http://localhost:3001" />
        </main>
      </div>
    </ChatThemeProvider>
  );
}
```

### Using Your Existing MUI Theme

If your app already has a `ThemeProvider`, you can skip `ChatThemeProvider`:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FloatingChatInterface } from '@cortex-chat/interface';

const myTheme = createTheme({ /* your config */ });

function App() {
  return (
    <ThemeProvider theme={myTheme}>
      <FloatingChatInterface backendUrl="http://localhost:3001" />
    </ThemeProvider>
  );
}
```

### Advanced: ChatInterface with ConfigProvider

For full control over configuration (custom hooks, nested contexts, etc.):

```tsx
import { ChatInterface, ConfigProvider, ChatThemeProvider } from '@cortex-chat/interface';

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

## Props Reference

### FloatingChatInterface

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `backendUrl` | `string` | Yes | — | URL of your backend server |
| `defaultWidth` | `string \| number` | No | `'70%'` | Overlay width when expanded |
| `defaultHeight` | `string \| number` | No | `'70vh'` | Overlay height when expanded |
| `buttonPosition` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | No | `'bottom-right'` | Floating button position |
| `initialState` | `'minimized' \| 'expanded'` | No | `'minimized'` | State on first render |
| `initialAgent` | `string` | No | — | Pre-select a specific agent |
| `onError` | `(error: string) => void` | No | — | Error callback |
| `displayConfig` | `DisplayConfig` | No | — | Toggle optional UI sections |

### InlineChatInterface

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `backendUrl` | `string` | Yes | — | URL of your backend server |
| `initialAgent` | `string` | No | — | Pre-select a specific agent |
| `onError` | `(error: string) => void` | No | — | Error callback |
| `className` | `string` | No | — | CSS class for the container |
| `style` | `React.CSSProperties` | No | — | Inline styles for the container |
| `displayConfig` | `DisplayConfig` | No | — | Toggle optional UI sections |

### DisplayConfig

```typescript
interface DisplayConfig {
  showThinking?: boolean;      // Show "Thinking & Planning" section (default: false)
  showSqlQueries?: boolean;    // Show "SQL Queries Executed" section (default: false)
  showAnnotations?: boolean;   // Show "Annotations" section (default: false)
}
```

## Configuring for Authentication Modes

The chat interface component itself is **authentication-agnostic** — it just calls `backendUrl` endpoints. Authentication is handled by the backend (see [cortex-chat-server/README.md](../cortex-chat-server/README.md)).

The **sample application** (`sample-app/`) includes full authentication support, configured via frontend environment variables:

| Mode | `VITE_AUTH_MODE` | Additional Frontend Env Vars | Behavior |
|------|-----------------------|------------------------------|----------|
| **PAT** | `PAT` | None | No login page. Immediate access. |
| **OAuth** | `OAUTH` | `VITE_OAUTH_LOGIN_URL`, `VITE_OAUTH_CLIENT_ID`, `VITE_OAUTH_REDIRECT_URI`, optionally `VITE_OAUTH_SCOPE`, `VITE_OAUTH_AUDIENCE`, `VITE_OAUTH_PROMPT` | Users see a login page and authenticate via IdP. |
| **Hybrid** | `OAUTH` | Same as OAuth | Same login flow as OAuth. The backend distinction is transparent to the frontend. |

See `sample-app/env.frontend.example` for all available options.

## Backend Requirements

The chat interface expects the following API endpoints. The companion [`cortex-chat-server`](../cortex-chat-server/README.md) module implements all of them.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List available agents with configuration |
| `/api/agents/:name` | GET | Get a specific agent's details |
| `/api/agents/:name/messages` | POST | Send a message (returns SSE stream) |
| `/api/threads` | POST | Create a new conversation thread |
| `/api/threads` | GET | List all threads |
| `/api/threads/:id` | GET | Get conversation history |
| `/api/threads/:id` | POST | Update thread name |
| `/api/threads/:id` | DELETE | Delete a thread |

### SSE Event Types

The `/api/agents/:name/messages` endpoint returns a Server-Sent Events stream. The component handles these event types:

| Event | Description |
|-------|-------------|
| `response.text.delta` | Streaming text content |
| `response.status` | Status updates |
| `response.tool_result` | Tool execution results |
| `response.thinking` | Agent reasoning process |
| `response.chart` | Vega-Lite chart visualization |
| `response.text.annotation` | Citations and references |
| `metadata` | Message metadata (includes `message_id`) |

## Features

- Real-time streaming responses via SSE
- Multi-agent support with agent discovery
- Thread management (create, list, revisit, rename, delete)
- Thinking process visualization (optional)
- SQL query display (optional)
- Chart visualizations (Vega-Lite via Recharts)
- Citations and annotations (optional)
- Starter questions per agent
- Dark/light theme support
- Voice input (speech-to-text, requires Chrome/Edge/Safari)
- Resizable floating overlay with drag support
- Responsive design (desktop, tablet, mobile)
- Full TypeScript support with exported types

## Exported Types and Hooks

For advanced usage, the package exports its internal hooks and types:

```typescript
// Hooks
import { useAgentConfig, useChatMessages, useAccordionState, useSpeechRecognition } from '@cortex-chat/interface';

// Contexts
import { ConfigProvider, useConfig } from '@cortex-chat/interface';

// Types
import type { ChatMessage, AgentConfig, ChatConfig, DisplayConfig, ChartContent } from '@cortex-chat/interface';

// Theme
import { createAppTheme } from '@cortex-chat/interface';
```

## License

MIT
