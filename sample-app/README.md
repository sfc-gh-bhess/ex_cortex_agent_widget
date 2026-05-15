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

> **Streamlined alternatives:** If you already know which auth mode you need, use one of the mode-specific templates instead — they contain only the variables for that mode:
>
> | Mode | Backend | Frontend |
> |------|---------|----------|
> | Shared (PAT) | `cp env.backend.shared .env` | `cp env.frontend.shared .env.local` |
> | SSO (OAuth) | `cp env.backend.sso .env` | `cp env.frontend.sso .env.local` |
> | Hybrid — Session Attribute | `cp env.backend.var .env` | `cp env.frontend.var .env.local` |
> | Hybrid — Role-Based | `cp env.backend.role .env` | `cp env.frontend.role .env.local` |
>
> **IdP login but one Snowflake PAT (no tenant isolation):** use the Hybrid Session Attribute row above (`env.backend.var` / `env.frontend.var`), then follow [IdP login with shared PAT (no tenant isolation)](#idp-login-with-shared-pat-no-tenant-isolation).
>
> The `env.backend.example` / `env.frontend.example` files document all options across all modes.

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
VITE_BACKEND_URL=http://localhost:3001
VITE_AUTH_MODE=OAUTH

VITE_OAUTH_LOGIN_URL=https://your-idp.example.com/authorize
VITE_OAUTH_CLIENT_ID=your_client_id
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_OAUTH_SCOPE=openid profile email
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

| Mode | Backend `AUTH_MODE` | Frontend `VITE_AUTH_MODE` | Description |
|------|--------------------|-----------------------------|-------------|
| **PAT** | `PAT` | `PAT` | Shared Snowflake PAT. No login page. See `env.backend.shared` / `env.frontend.shared`. |
| **OAuth** | `OAUTH` | `OAUTH` | Per-user Snowflake tokens via IdP. |
| **Hybrid** | `HYBRID` | `OAUTH` | Shared PAT + IdP JWT claim injected as a session attribute (or role mapping). |

For Hybrid mode, the frontend always uses `VITE_AUTH_MODE=OAUTH`. Additional backend variables are required — see `env.backend.example`.

### IdP login with shared PAT (no tenant isolation)

If you want **users to sign in with an IdP** before using the app, but **all Snowflake / Cortex calls should use the same service PAT** (no per-user Snowflake tokens, and no row-level tenant isolation in Snowflake), use **Hybrid mode** with the Session Attribute templates: copy **`env.backend.var`** and **`env.frontend.var`**, then adjust:

- Set **`CLAIM_KEY=sub`** so the backend always receives a value from the OIDC `id_token` (`sub` is standard and does not require custom IdP claims). Other registered claims work if they are always present on the tokens your backend validates.
- Set **`SESSION_VAR_NAME`** to a name that your databases **do not** read in Row Access Policies, views, or other logic. The sample app still sends that session attribute on agent requests; if nothing in Snowflake enforces on it, **effective data access is the PAT user’s grants for every logged-in user**.

Do **not** pair an OAuth frontend template with **`AUTH_MODE=PAT`** (`env.backend.shared`): the backend will not expose `/auth/exchange`, and auth modes will disagree. This “gated app + shared PAT” pattern is **Hybrid**, not PAT.

The IdP controls **who may use the application**; it does not issue per-user Snowflake credentials in this variant. Treat IdP membership, network access, and the PAT’s Snowflake privileges as your security boundary.

## Identity Provider Configuration

Both OAuth and Hybrid modes require an external Identity Provider (IdP) such as Okta, Auth0, or any OIDC-compliant provider. PAT mode does not use an IdP.

### Common Setup (All OAuth/Hybrid Modes)

Register an application in your IdP with the following settings:

| Setting | Value | Notes |
|---------|-------|-------|
| **Application type** | Web Application (confidential client) | The backend exchanges tokens using `client_secret` via HTTP Basic Auth. A public/SPA client will not work. |
| **Grant types** | Authorization Code, Refresh Token | Refresh Token is recommended for automatic token renewal. |
| **Redirect URI** | `http://localhost:3000/auth/callback` | Must match `OAUTH_REDIRECT_URI` (backend) and `VITE_OAUTH_REDIRECT_URI` (frontend). Use your production URL in deployed environments. |

After creating the application, note the following values for your `.env` and `.env.local` files:

| IdP Value | Backend Variable | Frontend Variable |
|-----------|-----------------|-------------------|
| Token endpoint URL | `OAUTH_TOKEN_URL` | — |
| Client ID | `OAUTH_CLIENT_ID` | `VITE_OAUTH_CLIENT_ID` |
| Client Secret | `OAUTH_CLIENT_SECRET` | — (never exposed to browser) |
| Authorization endpoint | — | `VITE_OAUTH_LOGIN_URL` |

### OAuth Mode

In OAuth mode, the IdP issues tokens that Snowflake accepts directly via [External OAuth](https://docs.snowflake.com/en/user-guide/oauth-ext-overview). This requires configuration on both the IdP and Snowflake sides.

**IdP-side:**

- **Scope** — Define a scope named `session:role-any` on your authorization server. This is a Snowflake-specific scope that allows the token to assume any role granted to the user. Set `VITE_OAUTH_SCOPE=session:role-any` on the frontend.
- **Custom claims** — None required. Snowflake validates the token directly.

> *Okta:* Create an Authorization Server and add `session:role-any` as a custom scope.
> *Auth0:* Register a Custom API and add `session:role-any` as a permitted scope.

**Snowflake-side:**

Create an [External OAuth Security Integration](https://docs.snowflake.com/en/sql-reference/sql/create-security-integration-oauth-external) in Snowflake that trusts your IdP:

```sql
CREATE SECURITY INTEGRATION my_external_oauth
  TYPE = EXTERNAL_OAUTH
  ENABLED = TRUE
  EXTERNAL_OAUTH_TYPE = <OKTA | CUSTOM | ...>
  EXTERNAL_OAUTH_ISSUER = '<your IdP issuer URL>'
  EXTERNAL_OAUTH_JWS_KEYS_URL = '<your IdP JWKS URL>'
  EXTERNAL_OAUTH_TOKEN_USER_MAPPING_CLAIM = 'sub'
  EXTERNAL_OAUTH_SNOWFLAKE_USER_MAPPING_ATTRIBUTE = 'login_name'
  EXTERNAL_OAUTH_ANY_ROLE_MODE = 'ENABLE';
```

Refer to the [Snowflake External OAuth documentation](https://docs.snowflake.com/en/user-guide/oauth-ext-overview) for the full set of options and IdP-specific guides.

### Hybrid Mode

In Hybrid mode, the IdP is used **only for application authentication and tenant identification** — it is not integrated with Snowflake. The backend validates the IdP JWT itself and extracts claims. No Snowflake External OAuth integration is needed.

**Scope:**

Set `VITE_OAUTH_SCOPE=openid profile email` on the frontend. The `openid` scope is required so the IdP returns an `id_token` — a signed JWT that the backend validates to extract tenant and user information.

**Claim used as the “tenant” value (`CLAIM_KEY`):**

For **multi-tenant** isolation, add a custom claim (e.g. `tenant`) to the `id_token` (or `access_token`) and set `CLAIM_KEY` to match (default in templates: `tenant`).

For **IdP login with shared Snowflake only** (no isolation), use a claim that is always present without custom setup — typically **`CLAIM_KEY=sub`**. See [IdP login with shared PAT (no tenant isolation)](#idp-login-with-shared-pat-no-tenant-isolation).

| IdP | How to add a custom claim |
|-----|--------------------------|
| Okta | Security > API > Authorization Servers > Claims > Add Claim |
| Auth0 | Actions > Flows > Login > Add Action that sets `api.idToken.setCustomClaim('tenant', ...)` |

The claim value should match the tenant identifiers used in your data isolation strategy — for example, the `tenant_key` values in your `TENANT_ROLES` table (Role mode) or the values your Row Access Policy checks (Session Attribute mode).

**User identifier claim:**

The JWT must contain a claim that uniquely identifies the user. By default, the backend uses `email`. This value is hashed and appended to `ORIGIN_APPLICATION` to scope conversation threads per-user. To use a different claim, set `USERNAME_CLAIM_KEY` in the backend config.

**Token format:**

At least one of the `id_token` or `access_token` must be a JWT that contains **the claim named by `CLAIM_KEY`** (for example `tenant` or `sub`). The backend tries both tokens during validation. Most IdPs return a JWT `id_token` when the `openid` scope is requested.

> *Auth0 note:* By default, Auth0 returns an opaque `access_token`. The `id_token` is always a JWT and is usually sufficient for Hybrid mode. To also receive a JWT `access_token`, set `VITE_OAUTH_AUDIENCE` on the frontend.

**JWKS and Issuer:**

| Backend Variable | Value | Notes |
|-----------------|-------|-------|
| `IDP_JWKS_URL` | Your IdP's JWKS endpoint | Typically `https://your-idp.example.com/.well-known/jwks.json`. Used to verify JWT signatures. |
| `IDP_ISSUER` | Your IdP's issuer URL | Must match the `iss` claim in the JWT. The backend tries both with and without a trailing slash. |
| `IDP_AUDIENCE` | Expected `aud` claim value (optional) | If not set, `OAUTH_CLIENT_ID` is used — which matches the `id_token`'s `aud` for all OIDC-compliant IdPs. Only set this if your IdP uses a different audience value. |

**SESSION_VAR vs ROLE — IdP configuration is the same:**

Both Hybrid isolation modes use the same IdP setup described above. The difference is entirely on the backend and Snowflake side:

- **SESSION_VAR** — The tenant claim value is passed as a session attribute to the Cortex Agent for use with Snowflake Row Access Policies. See `env.backend.var`.
- **ROLE** — The tenant claim value is mapped to a Snowflake role via a lookup table and set via the `X-Snowflake-Role` header. See `env.backend.role`.

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
├── env.backend.example      Backend configuration template (all modes)
├── env.backend.shared       Backend template — Shared access (PAT) mode
├── env.backend.sso          Backend template — SSO (OAuth) mode
├── env.backend.var          Backend template — Hybrid Session Attribute mode
├── env.backend.role         Backend template — Hybrid Role mode
├── env.frontend.example     Frontend configuration template (all modes)
├── env.frontend.shared      Frontend template — Shared access (PAT) mode
├── env.frontend.sso         Frontend template — SSO (OAuth) mode
├── env.frontend.var         Frontend template — Hybrid Session Attribute mode
├── env.frontend.role        Frontend template — Hybrid Role mode
├── .env                     Backend config (gitignored)
├── .env.local               Frontend config (gitignored)
├── package.json
├── vite.config.ts           Vite build configuration
├── tsconfig.json
├── index.html               App entry point (served by Vite)
├── public/                  Static assets (favicon, images)
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
| Cannot connect to backend | Backend not running | Run `npm run start:server` and check `VITE_BACKEND_URL` |
| HTTP 401 Unauthorized | Invalid or expired token | **PAT:** Check `SNOWFLAKE_PAT`. **OAuth:** Verify IdP config and token exchange. **Hybrid:** Check `IDP_ISSUER`, `OAUTH_CLIENT_ID`, `CLAIM_KEY` |
| HTTP 404 Agent Not Found | Agent doesn't exist in specified database/schema | Verify `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, and agent name (case-sensitive) |
| OAuth login loops silently | IdP session persists after app logout | Set `VITE_OAUTH_PROMPT=login` in `.env.local` to force re-authentication |
| Port already in use | Previous process still running | `lsof -ti:3000 \| xargs kill -9` or `lsof -ti:3001 \| xargs kill -9` |
