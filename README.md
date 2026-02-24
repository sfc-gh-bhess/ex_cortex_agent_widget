# Snowflake Cortex Agents Chat Application

A chat application powered by [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) via the [REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api). This repository provides **reusable frontend and backend components** that you can drop into your own application, along with a complete **sample application** that shows how to wire them together.

> Based on the [Snowflake-Labs repository](https://github.com/Snowflake-Labs/awesome-custom-cortex-agents-rest-api-react-app) by [Dash DesAI](https://www.linkedin.com/in/dash-desai/).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│                                                                     │
│  ┌──────────────────────────────┐                                   │
│  │  Your React App              │                                   │
│  │  ┌────────────────────────┐  │                                   │
│  │  │  FloatingChatInterface │  │  HTTP / SSE                       │
│  │  │  or InlineChatInterface│──┼──────────────┐                    │
│  │  └────────────────────────┘  │              │                    │
│  │  (packages/simple-chat-      │              │                    │
│  │   interface)                 │              │                    │
│  └──────────────────────────────┘              │                    │
└────────────────────────────────────────────────┼────────────────────┘
                                                 │
                                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  Backend (Express)                                             │
│                                                                │
│  ┌──────────────┐    ┌──────────────────────────────────────┐  │
│  │  server.js   │───▶│  chatServer.js (createChatRouter)    │  │
│  │  Auth, CORS, │    │  Agents, Threads, Streaming          │  │
│  │  Sessions    │    └───────────────┬──────────────────────┘  │
│  └──────────────┘                    │                         │
└──────────────────────────────────────┼─────────────────────────┘
                                       │  HTTPS
                                       ▼
                            ┌──────────────────────┐
                            │  Snowflake            │
                            │  Cortex Agents API    │
                            └──────────────────────┘
```

**Two reusable components:**

| Component | Location | Purpose |
|-----------|----------|---------|
| **ChatInterface** | `packages/simple-chat-interface/` | Drop-in React chat UI (floating overlay or inline) |
| **chatServer.js** | `server/chatServer.js` | Express router providing all API endpoints the ChatInterface needs |

**Sample application** (`src/` + `server/server.js`): A complete working app that wires the two components together with authentication, theming, and routing.

## Authentication Modes

The backend supports three authentication modes, selected via the `AUTH_MODE` environment variable:

| Mode | Snowflake Auth | User Auth | Best For |
|------|---------------|-----------|----------|
| **PAT** | Shared Personal Access Token | None (open access) | Prototypes, demos, internal tools |
| **OAUTH** | Per-user token from IdP | OAuth / OIDC login | Production apps with per-user Snowflake access |
| **HYBRID** | Shared service PAT | OAuth / OIDC login | Multi-tenant apps with row-level data filtering |

### PAT Mode

All API calls use a single Snowflake PAT stored on the server. No login page — users access the app directly.

### OAuth Mode

Users authenticate with an external Identity Provider (Okta, Auth0, etc.). The IdP-issued access token is used directly for Snowflake API calls, giving each user their own Snowflake session and permissions.

### Hybrid Mode

Users authenticate via an IdP (same login flow as OAuth), but Snowflake API calls use a shared service PAT. The backend validates the IdP JWT, extracts a configured claim (e.g., `tenant`), and passes it to the Cortex Agent as a **session variable**. This enables row-level data filtering in Snowflake based on who is logged in — without needing per-user Snowflake accounts.

```
IdP JWT claim  ──▶  Session variable  ──▶  Cortex Agent query context
  tenant_key         TENANT=Alice           WHERE tenant = $TENANT
```

> **Frontend note:** For both OAuth and Hybrid modes, the frontend uses `REACT_APP_AUTH_MODE=OAUTH`. The distinction between OAuth and Hybrid is entirely on the backend.

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0 and **npm** >= 9.0.0
- **Snowflake account** with at least one [Cortex Agent](https://quickstarts.snowflake.com/guide/getting-started-with-snowflake-intelligence/) created
- A Snowflake [Personal Access Token](https://docs.snowflake.com/en/user-guide/personal-access-token) (for PAT or Hybrid mode)

### 1. Clone and install

```bash
git clone <repository-url>
cd ex_cortex_agent_widget
npm install
```

### 2. Configure the backend

```bash
cp env.backend.example .env
```

Edit `.env` with your Snowflake connection and auth settings:

```bash
AUTH_MODE=OAUTH
SNOWFLAKE_HOST=your-account.snowflakecomputing.com
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema

# OAuth — provided by your Identity Provider (Okta, Auth0, etc.)
OAUTH_TOKEN_URL=https://your-idp.example.com/oauth/token
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

For PAT mode (simpler, no IdP required), set `AUTH_MODE=PAT` and provide `SNOWFLAKE_PAT` instead. See `env.backend.example` for the full set of options including Hybrid mode.

### 3. Configure the frontend

```bash
cp env.frontend.example .env.local
```

Edit `.env.local`:

```bash
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_AUTH_MODE=OAUTH

# OAuth — must match the values registered with your Identity Provider
REACT_APP_OAUTH_LOGIN_URL=https://your-idp.example.com/authorize
REACT_APP_OAUTH_CLIENT_ID=your_client_id
REACT_APP_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
REACT_APP_OAUTH_SCOPE=openid profile email
```

For PAT mode, set `REACT_APP_AUTH_MODE=PAT` and omit the OAuth variables. See `env.frontend.example` for all options.

### 4. Start

```bash
npm run start:all
```

This launches:
- **Frontend** on [http://localhost:3000](http://localhost:3000)
- **Backend** on [http://localhost:3001](http://localhost:3001)

## Using the Reusable Components in Your App

The sample application in `src/` demonstrates integration, but you can use the components independently in your own projects.

### Frontend — Add chat to your React app

```bash
npm install ./packages/simple-chat-interface
```

```tsx
import { FloatingChatInterface, ChatThemeProvider } from '@chat-overlay/simple-chat-interface';

function App() {
  return (
    <ChatThemeProvider>
      <YourExistingApp />
      <FloatingChatInterface backendUrl="http://localhost:3001" />
    </ChatThemeProvider>
  );
}
```

See [`packages/simple-chat-interface/README.md`](packages/simple-chat-interface/README.md) for the full component API, props reference, and embedding options.

### Backend — Add chat endpoints to your Express app

Copy `server/chatServer.js` into your project:

```javascript
const { createChatRouter } = require('./chatServer');

const chatRouter = createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT
});

app.use('/api', chatRouter);
```

See [`server/README.md`](server/README.md) for configuration options, authentication strategies, and the `getSessionVariables` callback for Hybrid mode.

## Project Structure

```
.
├── packages/simple-chat-interface/   # Reusable React chat components
│   ├── src/
│   │   ├── components/              # FloatingChatInterface, InlineChatInterface, ChatInterface
│   │   ├── hooks/                   # useChatMessages, useThreadManagement, useAgentConfig
│   │   ├── services/                # Snowflake Agents API client
│   │   ├── contexts/                # ConfigProvider, ChatThemeProvider
│   │   └── index.ts                 # Package exports
│   └── README.md
│
├── server/
│   ├── chatServer.js                # Reusable Express router (the backend component)
│   ├── server.js                    # Sample application server (auth, CORS, sessions)
│   └── README.md
│
├── src/                             # Sample application frontend
│   ├── components/                  # App-specific components (header, theme toggle)
│   ├── config/                      # Environment configuration and OAuth URL builder
│   ├── contexts/                    # AuthContext, ThemeContext
│   ├── pages/                       # LoginPage, OAuthCallbackPage
│   ├── services/                    # Auth service (token exchange, session check)
│   └── index.tsx                    # App entry point
│
├── env.backend.example              # Backend configuration template
├── env.frontend.example             # Frontend configuration template
└── README.md                        # This file
```

## Development

| Command | Description |
|---------|-------------|
| `npm run start:all` | Start frontend + backend concurrently |
| `npm start` | Start frontend only (port 3000) |
| `npm run start:server` | Start backend only (port 3001) |
| `npm run build` | Production build of frontend |

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Cannot connect to backend | Backend not running | Run `npm run start:server` and check `REACT_APP_BACKEND_URL` |
| HTTP 401 Unauthorized | Invalid or expired token | **PAT:** Check `SNOWFLAKE_PAT`. **OAuth:** Verify IdP config. **Hybrid:** Check `IDP_ISSUER`, `IDP_AUDIENCE`, `CLAIM_KEY` |
| HTTP 404 Agent Not Found | Agent doesn't exist in specified database/schema | Verify `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, and agent name (case-sensitive) |
| Port already in use | Previous process still running | `lsof -ti:3000 \| xargs kill -9` or `lsof -ti:3001 \| xargs kill -9` |
| OAuth login loops silently | IdP session persists after app logout | Set `REACT_APP_OAUTH_PROMPT=login` in `.env.local` to force re-authentication |

## Documentation

- [Frontend Package — Component API & Embedding Guide](packages/simple-chat-interface/README.md)
- [Backend Module — Server Integration & Auth Strategies](server/README.md)
- [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents)
- [Cortex Agents REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api)

## License

MIT
