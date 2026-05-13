# Add a "Talk to Your Data" Chat to Any Website with Snowflake Cortex

What if your users could just *ask* their data a question — in plain English — and get an accurate, real-time answer? No dashboards to navigate. No SQL to write. Just a conversation. What if you could just add that to your existing web application?

That's the promise of **Snowflake Cortex Agents**, and in this post we'll show you how to add a conversational data experience to any existing website using a pair of drop-in components: a **React chat interface** and an **Express backend router**. We'll also walk through a complete sample application so you can see the whole thing in action before you start building.

## Why "Talk to Your Data"?

The use cases are everywhere. Maybe you're building an internal analytics tool for your team. Maybe you run a SaaS platform and want tenants to explore *their* data without ever leaving your app. Or maybe you have business users who need answers from the data warehouse but don't know SQL.

Whatever the scenario, you'll need to think about one key question: **who can see what?**

This project supports three access modes to cover the most common patterns:

| Mode | Who Sees What | Best For |
|------|---------------|----------|
| **Shared access (PAT)** | All users see the same data | Internal tools, demos, prototypes |
| **Per-user access (OAuth/SSO)** | Each user accesses Snowflake as themselves | Organizations where users already have Snowflake accounts |
| **Multi-tenant (Hybrid)** | Each user is mapped to a tenant and only sees that tenant's data | SaaS platforms, franchise portals, partner dashboards |

The Hybrid mode itself comes in two flavors — **Session Attribute** (row-level filtering via Row Access Policies) and **Role-Based** (a dedicated Snowflake role per tenant). We'll focus on the Session Attribute approach for simplicity, but the repository supports both.

## Architecture at a Glance

The overall design is a classic three-tier web application: a React frontend talks to an Express backend, and the backend proxies requests to the Snowflake Cortex Agents REST API. Your Snowflake access tokens never touch the browser.

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
│  │  Your server │───▶│  chatServer.js (createChatRouter)    │  │
│  │  Auth, CORS, │    │  Agents, Threads, Streaming          │  │
│  │  Sessions    │    └───────────────┬──────────────────────┘  │
│  └──────────────┘                    │                         │
│  (cortex-chat-server)                │                         │
└──────────────────────────────────────┼─────────────────────────┘
                                       │  HTTPS
                                       ▼
                             ┌──────────────────────┐
                             │  Snowflake           │
                             │  Cortex Agents API   │
                             └──────────────────────┘
```

The two reusable components — `cortex-chat-interface` (frontend) and `cortex-chat-server` (backend) — are designed to be dropped into your existing codebase. The repository also includes a complete **sample application** that wires them together with authentication, theming, and routing, so you can see a working end-to-end example.

The companion GitHub repository is here: **[ex_cortex_agent_widget](https://github.com/sfc-gh-bhess/ex_cortex_agent_widget)**

## Adding the Components to Your Website

### Backend: Express Router

The backend component is a single-file Express router (`chatServer.js`) that handles all the Snowflake Cortex API communication. Install it and mount it on your existing Express app:

```bash
npm install ./path/to/cortex-chat-server
```

```javascript
const express = require('express');
const { createChatRouter } = require('@cortex-chat/server');

const app = express();
app.use(express.json());

const chatRouter = createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT,
});

app.use('/api', chatRouter);
app.listen(3001);
```

That's the simplest version — a shared PAT for all users. For multi-tenant use cases, you'd also supply `getSessionVariables` (to inject a tenant identifier as a session attribute) or `getSnowflakeRole` (to set a per-tenant Snowflake role). The configuration object also supports `originApplication` for thread tagging, `getOriginApplication` for per-user thread scoping, and an `onError` callback.

> **Not using Express?** The backend component is intentionally small and self-contained. If you're on a different framework (Flask, FastAPI, Spring, etc.), you can port the logic from `chatServer.js` — it's essentially a set of proxy endpoints that forward requests to the Snowflake REST API with the right headers and handle SSE streaming back to the client.

### Frontend: React Chat Component

The frontend component gives you a polished chat interface — floating overlay or inline panel — that connects to the backend endpoints above.

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

The `FloatingChatInterface` renders as a button in the corner of your app. Click it and a draggable, resizable chat overlay appears. If you'd rather embed the chat inline (say, in a split-panel layout), use `InlineChatInterface` instead.

Key props you can configure:

| Prop | Description |
|------|-------------|
| `backendUrl` | URL of your backend server (required) |
| `initialAgent` | Pre-select a specific Cortex Agent |
| `buttonPosition` | Where the floating button appears (`bottom-right`, `top-left`, etc.) |
| `displayConfig` | Toggle sections like SQL queries, thinking process, and annotations |

If your app already has a Material-UI `ThemeProvider`, you can skip `ChatThemeProvider` and the chat component will inherit your existing theme.

## The Sample Application: A Restaurant Franchise Portal

To see all of this in action, the repository includes a complete sample application. The use case: a **sales data portal for restaurant franchises**. Franchisees log in and ask natural-language questions about their menu items and daily sales — things like:

- *"Which chicken sandwich sold the most in May 2024?"*
- *"Did we sell more burgers or tacos in June?"*
- *"What was the best-selling item across all stores for 2024?"*

The key constraint is **data isolation**: Alice (owner of Alice's Restaurant) should only see data about her franchise, not Bob's Place or Charlie's Diner.

### Setting Up the Example Data in Snowflake

The repository includes a Snowflake Notebook file — `Multisales.ipynb` — that sets up everything you need in your Snowflake account. To use it:

1. Download `Multisales.ipynb` from the repository.
2. In Snowflake, navigate to **Projects > Notebooks** and click **Import .ipynb file**.
3. Upload the file and open the Notebook.
4. Run through the cells, or run them all at once.

Here's what the Notebook does, step by step:

1. **Infrastructure setup** — Creates a warehouse (`MULTISALES_WH`), database (`MULTISALES`), schema (`DATA`), and a dedicated role (`MULTISALES_RL`) with the right privileges.

2. **Sample data** — Creates an `ITEMS` table with menu items for three restaurant chains (Alice's Restaurant, Bob's Place, and Charlie's Diner). Item descriptions are auto-generated by Cortex AI. Then it creates an `ORDERS` table with a full year of daily sales data across multiple stores.

3. **Cortex Search Services** — Builds search indexes on menu item names and descriptions so the Cortex Agent can do semantic lookups.

4. **Semantic View** — Creates a `MULTISALES_SV` semantic view that gives the Cortex Agent a structured understanding of the tables, their relationships, and their business meaning.

5. **Cortex Agent** — Creates the `MULTISALES_AGENT` with a text-to-SQL tool (backed by the semantic view) and a Cortex Search tool (for item lookups).

6. **Row Access Policies** — Sets up entitlement tables and Row Access Policies for data isolation.

7. **Service user and PAT** — Creates a service user (`MULTISALES_APP`) and a Programmatic Access Token for the backend to authenticate with Snowflake.

### Choosing Your Access Mode

The Notebook covers three modes of data isolation:

- **3a: OAUTH (SSO)** — Users authenticate directly with Snowflake. The Row Access Policy checks `CURRENT_USER()`.
- **3b: HYBRID-ROLE** — The app maps each tenant to a Snowflake role. The RAP checks `CURRENT_ROLE()`.
- **3c: HYBRID-SESSION** — The app passes a session attribute. The RAP checks `SYS_CONTEXT('SNOWFLAKE$SESSION_ATTRIBUTES', 'TENANT')`.

You can choose whichever mode fits your use case. For the rest of this walkthrough, we'll focus on **HYBRID-SESSION** (mode 3c) since it's the most common pattern for SaaS-style multi-tenant applications and doesn't require creating Snowflake users or roles per tenant.

In the Session Attribute approach, the Notebook creates:

- An **entitlement table** (`ENTITLEMENT_VAR`) that maps tenant keys (like `Alice`) to tenant names (like `Alices Restaurant`).
- A **Row Access Policy** (`RAP_ENTITLEMENT_VAR`) on the entitlement table that filters rows based on the value of `SYS_CONTEXT('SNOWFLAKE$SESSION_ATTRIBUTES', 'TENANT')`.
- A **memoizable UDF** (`TENANTS_VAR()`) that builds an array of allowed tenant names.
- A **Row Access Policy** (`RAP_TENANT_VAR`) applied to the `ORDERS` and `ITEMS` tables, so that queries only return rows for tenants the current session is authorized to see.

The beauty of this approach is that when the backend sends a request to the Cortex Agent with a session attribute like `SET_SYS_CONTEXT('SNOWFLAKE$SESSION_ATTRIBUTES', 'TENANT', 'Alice')`, Snowflake's Row Access Policies automatically filter the data — the agent only ever "sees" Alice's Restaurant data, no matter what SQL it generates.

## Configuring the Identity Provider

Both OAuth and Hybrid modes require an external Identity Provider (IdP) such as **Okta**, **Auth0**, or any OIDC-compliant provider. Here's the high-level setup:

1. **Register a web application** in your IdP as a confidential (server-side) client with Authorization Code and Refresh Token grant types.

2. **Set the redirect URI** to `http://localhost:3000/auth/callback` (or your production URL).

3. **Note the key values** you'll need:
   - Token endpoint URL → `OAUTH_TOKEN_URL`
   - Client ID → `OAUTH_CLIENT_ID` / `VITE_OAUTH_CLIENT_ID`
   - Client Secret → `OAUTH_CLIENT_SECRET`
   - Authorization endpoint → `VITE_OAUTH_LOGIN_URL`

### Additional Setup for HYBRID-SESSION

For the Hybrid mode specifically, you also need to:

4. **Add a custom claim** to the `id_token` called `tenant` (or whatever you set `CLAIM_KEY` to). This claim should contain the tenant key — for example, `Alice`, `Bob`, or `Charlie`. In Okta, you'd add this under *Security > API > Authorization Servers > Claims*. In Auth0, use a *Login Action* that calls `api.idToken.setCustomClaim('tenant', ...)`.

5. **Set the scope** to `openid profile email` so the IdP returns a signed `id_token` that the backend can validate.

6. **Note the JWKS URL and issuer** for your authorization server — you'll need these for the backend to verify JWT signatures (`IDP_JWKS_URL`, `IDP_ISSUER`, `IDP_AUDIENCE`).

## Installing and Configuring the Sample App

### Installation

```bash
git clone https://github.com/sfc-gh-bhess/ex_cortex_agent_widget.git
cd ex_cortex_agent_widget
./setup.sh
```

The `setup.sh` script installs dependencies for the chat interface component, the chat server component, and the sample app in one go.

### Configuration for HYBRID-SESSION

The sample app includes **template environment files** to make configuration easier. For the Session Attribute mode, start with these:

```bash
cd sample-app
cp env.backend.var .env
cp env.frontend.var .env.local
```

Then edit `.env` (backend) with your values:

```bash
AUTH_MODE=HYBRID
# TENANT_ISOLATION_MODE=SESSION_VAR  (this is the default)

SNOWFLAKE_HOST=your_account.snowflakecomputing.com
SNOWFLAKE_DATABASE=MULTISALES
SNOWFLAKE_SCHEMA=DATA
SNOWFLAKE_PAT=<the PAT created by the Notebook>

OAUTH_TOKEN_URL=https://your-idp.example.com/oauth/token
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

IDP_JWKS_URL=https://your-idp.example.com/.well-known/jwks.json
IDP_ISSUER=https://your-idp.example.com
IDP_AUDIENCE=your_audience

SESSION_VAR_NAME=TENANT
CLAIM_KEY=tenant
```

And edit `.env.local` (frontend):

```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_AUTH_MODE=OAUTH

VITE_OAUTH_LOGIN_URL=https://your-idp.example.com/oauth/authorize
VITE_OAUTH_CLIENT_ID=your_client_id
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_OAUTH_SCOPE=openid profile email
```

Notice that the frontend always uses `VITE_AUTH_MODE=OAUTH` — the Hybrid distinction is entirely on the backend side, which is transparent to the user's browser.

There are also template files for the other modes (`env.backend.sso`, `env.backend.role`, `env.frontend.sso`, `env.frontend.role`) if you'd like to explore those instead.

## Running the Application

Start both the frontend and backend with a single command:

```bash
cd sample-app
npm run start:all
```

Or, if you prefer separate terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd sample-app
npm run start:server

# Terminal 2 — Frontend (port 3000)
cd sample-app
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

### A Quick Tour

1. **Login** — You'll see an OAuth login page. Click to authenticate with your Identity Provider. The IdP returns an authorization code, which the backend exchanges for tokens. In Hybrid mode, the backend also validates the JWT and extracts your `tenant` claim.

2. **Chat** — Once logged in, you'll see a floating chat button in the corner. Click it to open the chat interface. The agent is already configured and ready to go.

3. **Ask questions** — Try something like *"Which chicken sandwich sold the most in May 2024?"* The Cortex Agent will interpret your question, generate SQL against the semantic view, and return an answer — all scoped to your tenant's data thanks to the session attribute and Row Access Policy.

4. **Thread history** — Your conversations are saved as threads. Click the history icon in the chat to revisit previous conversations or start a new one.

5. **Data isolation in action** — If you log out and log back in as a different user mapped to a different tenant, you'll see completely different data. The same agent, the same tables, the same SQL — but the Row Access Policy ensures each tenant only sees their own rows.

## Start Building

The components in this repository are designed to get you from zero to a working "talk to your data" experience as quickly as possible. The frontend component handles the chat UX — streaming responses, thread management, agent selection, chart rendering. The backend component handles the Snowflake API plumbing — authentication, session attributes, role mapping, SSE streaming. All you need to bring is your data, a Cortex Agent, and an idea.

Clone the repo, run the Notebook, configure your IdP, and you'll have a working multi-tenant conversational data app in an afternoon. Then take the components and drop them into your own application.

**[Get started on GitHub →](https://github.com/sfc-gh-bhess/ex_cortex_agent_widget)**
