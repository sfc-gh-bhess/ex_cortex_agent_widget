# Snowflake Cortex Agents Chat

A chat application powered by [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) via the [REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api). This repository provides **two reusable components** — a React chat interface and an Express backend router — along with a **sample application** that wires them together.

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
│  │  (cortex-chat-interface)     │              │                    │
│  └──────────────────────────────┘              │                    │
└────────────────────────────────────────────────┼────────────────────┘
                                                 │
                                                 ▼
┌────────────────────────────────────────────────────────────────┐
│  Backend (Express)                                             │
│                                                                │
│  ┌──────────────┐    ┌──────────────────────────────────────┐  │
│  │  Your server  │───▶│  chatServer.js (createChatRouter)    │  │
│  │  Auth, CORS,  │    │  Agents, Threads, Streaming          │  │
│  │  Sessions     │    └───────────────┬──────────────────────┘  │
│  └──────────────┘                     │                         │
│  (cortex-chat-server)                 │                         │
└───────────────────────────────────────┼─────────────────────────┘
                                        │  HTTPS
                                        ▼
                             ┌──────────────────────┐
                             │  Snowflake            │
                             │  Cortex Agents API    │
                             └──────────────────────┘
```

## Repository Structure

```
.
├── cortex-chat-interface/     Reusable React chat components
│   ├── README.md              Component API, embedding guide
│   └── src/
│
├── cortex-chat-server/        Reusable Express router module
│   ├── README.md              Server integration, auth strategies
│   └── chatServer.js
│
├── sample-app/                Complete working example
│   ├── README.md              Setup and run instructions
│   ├── src/                   Sample frontend (auth, routing, theming)
│   └── server/                Sample backend (server.js)
│
├── setup.sh                   Install dependencies for all packages
└── README.md                  This file
```

| Component | What It Does | Documentation |
|-----------|-------------|---------------|
| **cortex-chat-interface** | Drop-in React chat UI — floating overlay or inline panel | [README](cortex-chat-interface/README.md) |
| **cortex-chat-server** | Express router providing agents, threads, and streaming endpoints | [README](cortex-chat-server/README.md) |
| **sample-app** | Full application wiring both components with auth, theming, and routing | [README](sample-app/README.md) |

## Authentication Modes

The sample backend supports three authentication modes, selected via the `AUTH_MODE` environment variable:

| Mode | Snowflake Auth | User Auth | Best For |
|------|---------------|-----------|----------|
| **PAT** | Shared Personal Access Token | None (open access) | Prototypes, demos, internal tools |
| **OAUTH** | Per-user token from IdP | OAuth / OIDC login | Production apps with per-user Snowflake access |
| **HYBRID** | Shared service PAT | OAuth / OIDC login | Multi-tenant apps with per-tenant data isolation |

**PAT** — All API calls use a single Snowflake PAT stored on the server. No login page.

**OAuth** — Users authenticate with an external Identity Provider (Okta, Auth0, etc.). Each user gets their own Snowflake session.

**Hybrid** — Users authenticate via an IdP, but Snowflake API calls use a shared service PAT. The backend validates the IdP JWT and extracts a configured claim (e.g., `tenant`). Tenant data isolation is controlled by `TENANT_ISOLATION_MODE`:

- **SESSION_VAR** (default) — The tenant value is passed to the Cortex Agent as a session variable, used with Snowflake Row Access Policies for row-level data filtering.
- **ROLE** — The tenant value is mapped to a Snowflake role via a lookup table (`TENANT_ROLE_TABLE`) and set via the `X-Snowflake-Role` header on all Snowflake API calls. Data access is controlled by standard Snowflake RBAC grants. New tenants can be onboarded by inserting a row in the mapping table — no server restart required.

> For both OAuth and Hybrid modes, the frontend uses `VITE_AUTH_MODE=OAUTH`. The distinction is entirely on the backend.

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0 and **npm** >= 9.0.0
- A **Snowflake account** with at least one [Cortex Agent](https://quickstarts.snowflake.com/guide/getting-started-with-snowflake-intelligence/) created

### 1. Clone and install

```bash
git clone <repository-url>
cd ex_cortex_agent_widget
./setup.sh
```

Or install manually:

```bash
(cd cortex-chat-interface && npm install)
(cd sample-app && npm install)
```

### 2. Configure

```bash
cd sample-app
cp env.backend.example .env
cp env.frontend.example .env.local
```

> **Streamlined alternatives:** If you already know which auth mode you need, use one of the mode-specific templates instead — they contain only the variables for that mode:
>
> | Mode | Backend | Frontend |
> |------|---------|----------|
> | SSO (OAuth) | `cp env.backend.sso .env` | `cp env.frontend.sso .env.local` |
> | Hybrid — Session Variable | `cp env.backend.var .env` | `cp env.frontend.var .env.local` |
> | Hybrid — Role-Based | `cp env.backend.role .env` | `cp env.frontend.role .env.local` |
>
> The `env.backend.example` / `env.frontend.example` files document all options across all modes.

> **Identity Provider setup:** If using OAuth or Hybrid mode, configure your IdP before starting the app. See the [Identity Provider Configuration](sample-app/README.md#identity-provider-configuration) guide in the sample-app README.

Edit `.env` (backend) with your Snowflake connection and auth settings:

```bash
AUTH_MODE=OAUTH
SNOWFLAKE_HOST=your-account.snowflakecomputing.com
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema

OAUTH_TOKEN_URL=https://your-idp.example.com/oauth/token
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

Edit `.env.local` (frontend):

```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_AUTH_MODE=OAUTH

VITE_OAUTH_LOGIN_URL=https://your-idp.example.com/authorize
VITE_OAUTH_CLIENT_ID=your_client_id
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_OAUTH_SCOPE=openid profile email
```

For PAT mode (simpler, no IdP required), set `AUTH_MODE=PAT` and provide `SNOWFLAKE_PAT` instead. See the example files for all options.

### 3. Start

**Two terminals (recommended):**

```bash
# Terminal 1 — Backend (port 3001)
cd sample-app
npm run start:server

# Terminal 2 — Frontend (port 3000)
cd sample-app
npm start
```

**Or single terminal:**

```bash
cd sample-app
npm run start:all
```

Open [http://localhost:3000](http://localhost:3000).

## Using the Components in Your Own App

### Frontend

```bash
npm install ./path/to/cortex-chat-interface
```

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

See [cortex-chat-interface/README.md](cortex-chat-interface/README.md) for the full component API.

### Backend

```bash
npm install ./path/to/cortex-chat-server
```

```javascript
const { createChatRouter } = require('@cortex-chat/server');

const chatRouter = createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT
});

app.use('/api', chatRouter);
```

See [cortex-chat-server/README.md](cortex-chat-server/README.md) for auth strategies and the `getSessionVariables` callback.

## Documentation

| Document | Contents |
|----------|----------|
| [cortex-chat-interface/README.md](cortex-chat-interface/README.md) | Component API, props reference, embedding guide |
| [cortex-chat-server/README.md](cortex-chat-server/README.md) | Server integration, auth strategies, endpoints |
| [sample-app/README.md](sample-app/README.md) | How to configure and run the sample application |
| [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) | Agent configuration in Snowflake |
| [Cortex Agents REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api) | API reference |
