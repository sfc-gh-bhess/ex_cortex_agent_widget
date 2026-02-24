# Sample Application

A complete working application that demonstrates how to use [`@cortex-chat/interface`](../cortex-chat-interface/README.md) and [`@cortex-chat/server`](../cortex-chat-server/README.md) together with authentication, theming, and routing.

## What's Included

**Frontend** (`src/`) — A React application that wraps the `FloatingChatInterface` component with:
- OAuth/OIDC login flow (`AuthContext`, `LoginPage`, `OAuthCallbackPage`)
- Dark/light theme toggle (`ThemeContext`, `ThemeToggle`)
- Environment-driven configuration (`config/env.ts`)
- React Router for routing

**Backend** (`server/server.js`) — An Express server that:
- Integrates the `@cortex-chat/server` chat router
- Manages authentication sessions (PAT, OAuth, or Hybrid mode)
- Handles CORS, rate limiting, and cookie-based sessions
- Validates IdP JWTs and extracts tenant claims (Hybrid mode)

## Setup

### 1. Install dependencies

From the repository root:

```bash
./setup.sh
```

Or manually:

```bash
cd cortex-chat-interface && npm install && cd ..
cd sample-app && npm install
```

### 2. Configure environment

```bash
cp env.backend.example .env
cp env.frontend.example .env.local
```

**Backend** (`.env`) — Snowflake connection, auth mode, and credentials:

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

**Frontend** (`.env.local`) — Backend URL, auth mode, and OAuth settings:

```bash
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_AUTH_MODE=OAUTH

REACT_APP_OAUTH_LOGIN_URL=https://your-idp.example.com/authorize
REACT_APP_OAUTH_CLIENT_ID=your_client_id
REACT_APP_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
REACT_APP_OAUTH_SCOPE=openid profile email
```

See `env.backend.example` and `env.frontend.example` for the full set of options including PAT and Hybrid mode.

### 3. Start

**Two terminals (recommended — mirrors production):**

```bash
# Terminal 1 — Backend (port 3001)
npm run start:server

# Terminal 2 — Frontend (port 3000)
npm start
```

**Single terminal (convenience):**

```bash
npm run start:all
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication Modes

| Mode | Backend `AUTH_MODE` | Frontend `REACT_APP_AUTH_MODE` | Description |
|------|--------------------|-----------------------------|-------------|
| **PAT** | `PAT` | `PAT` | Shared Snowflake PAT. No login page. |
| **OAuth** | `OAUTH` | `OAUTH` | Per-user Snowflake tokens via IdP. |
| **Hybrid** | `HYBRID` | `OAUTH` | Shared PAT + IdP tenant claim as session variable. |

For Hybrid mode, the frontend always uses `REACT_APP_AUTH_MODE=OAUTH`. Additional backend variables are required — see `env.backend.example`.

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start frontend dev server (port 3000) |
| `npm run start:server` | Start backend server (port 3001) |
| `npm run start:all` | Start both concurrently |
| `npm run build` | Production build of the frontend |

## Project Structure

```
sample-app/
├── env.backend.example      Backend configuration template
├── env.frontend.example     Frontend configuration template
├── .env                     Backend config (gitignored)
├── .env.local               Frontend config (gitignored)
├── package.json
├── craco.config.js          CRA build customization
├── tsconfig.json
├── public/                  Static assets (index.html, images)
├── src/
│   ├── index.tsx            App entry point, routing, error boundary
│   ├── config/env.ts        Environment validation, OAuth URL builder
│   ├── contexts/
│   │   ├── AuthContext.tsx   Authentication state management
│   │   └── ThemeContext.tsx  Dark/light theme toggle
│   ├── pages/
│   │   ├── LoginPage.tsx    OAuth login UI
│   │   └── OAuthCallbackPage.tsx  OAuth redirect handler
│   ├── components/
│   │   ├── chat/ChatHeader.tsx  App header with logo, title, logout
│   │   └── ThemeToggle.tsx      Theme switch button
│   ├── services/
│   │   └── authService.ts   Auth API calls (status, exchange, logout)
│   └── constants/
│       └── textConstants.ts  Branding text and URLs
└── server/
    └── server.js            Express server with auth, CORS, sessions
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Cannot connect to backend | Backend not running | Run `npm run start:server` and check `REACT_APP_BACKEND_URL` |
| HTTP 401 Unauthorized | Invalid or expired token | **PAT:** Check `SNOWFLAKE_PAT`. **OAuth:** Verify IdP config and token exchange. **Hybrid:** Check `IDP_ISSUER`, `IDP_AUDIENCE`, `CLAIM_KEY` |
| HTTP 404 Agent Not Found | Agent doesn't exist in specified database/schema | Verify `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, and agent name (case-sensitive) |
| OAuth login loops silently | IdP session persists after app logout | Set `REACT_APP_OAUTH_PROMPT=login` in `.env.local` to force re-authentication |
| Port already in use | Previous process still running | `lsof -ti:3000 \| xargs kill -9` or `lsof -ti:3001 \| xargs kill -9` |
