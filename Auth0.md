# Auth0 Quick Start — Hybrid Mode

A step-by-step guide to configuring [Auth0](https://auth0.com) as the Identity Provider for the sample application in **Hybrid** mode. By the end you will have a working OAuth login flow with a custom `tenant` claim that the backend extracts for per-tenant data isolation.

> **Applies to both Hybrid sub-modes.** The Auth0 configuration is identical whether you use Session Variable or Role-Based isolation — that distinction is handled entirely by the backend and Snowflake. See the [sample-app README](sample-app/README.md#hybrid-mode) for details on each.

## What You'll End Up With

| Component | Result |
|-----------|--------|
| Auth0 Application | A **Regular Web Application** that issues tokens to the sample app |
| Login Action | A custom Action that adds a `tenant` claim to every `id_token` |
| Test Users | One or more users with a `tenant` value in their profile metadata |
| Sample App Config | `.env` and `.env.local` files wired to your Auth0 tenant |

## Prerequisites

- The sample app is cloned and dependencies are installed (`./setup.sh`).
- You have a Snowflake account with at least one [Cortex Agent](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) created.
- You have a Snowflake [Personal Access Token (PAT)](https://docs.snowflake.com/en/user-guide/personal-access-tokens) for the service account that will execute Cortex Agent queries.

---

## Step 1 — Create a Free Auth0 Account

1. Go to [https://auth0.com/signup](https://auth0.com/signup).
2. Sign up with an email address, Google, or GitHub account.
3. When prompted, choose a **tenant name** (e.g., `my-dev`). This becomes part of your Auth0 domain: `my-dev.us.auth0.com`.

> **Auth0 "tenant" vs. application tenant:** Auth0 uses the word *tenant* to mean your Auth0 account/domain. This is unrelated to the `tenant` claim you will configure later for multi-tenant data isolation in the sample app.

After sign-up you will land on the Auth0 Dashboard at `https://manage.auth0.com/`.

---

## Step 2 — Create an Application

1. In the left sidebar, click **Applications** → **Applications**.
2. Click the **+ Create Application** button (top right).
3. Fill in the dialog:

   | Field | Value |
   |-------|-------|
   | **Name** | `Cortex Agent Chat` (or any descriptive name) |
   | **Application Type** | **Regular Web Applications** |

4. Click **Create**.

You will land on the **Quick Start** tab. Switch to the **Settings** tab — that is where you will work for the rest of this step.

### Note Your Credentials

Near the top of the **Settings** tab you will see three values. Copy them somewhere safe — you will need them in [Step 6](#step-6--configure-the-sample-app):

| Field | Example Value | Used For |
|-------|---------------|----------|
| **Domain** | `my-dev.us.auth0.com` | Building endpoint URLs |
| **Client ID** | `aBcDeFgH1234...` | Frontend + backend config |
| **Client Secret** | `xYz789...` | Backend only (never exposed to browser) |

---

## Step 3 — Configure Application URIs

Scroll down the **Settings** tab to the **Application URIs** section and enter the following values:

| Field | Value |
|-------|-------|
| **Allowed Callback URLs** | `http://localhost:3000/auth/callback` |
| **Allowed Logout URLs** | `http://localhost:3000` |
| **Allowed Web Origins** | `http://localhost:3000` |

> For deployed environments, add your production URL(s) as additional comma-separated values in each field.

Scroll to the bottom of the page and click **Save Changes**.

---

## Step 4 — Enable Refresh Tokens (Recommended)

Refresh tokens let the backend silently renew sessions without forcing users to log in again.

1. Still on the **Settings** tab, scroll to **Advanced Settings** (expandable section near the bottom, just above **Save Changes**).
2. Open the **Grant Types** tab inside Advanced Settings.
3. Ensure the following are checked:
   - **Authorization Code** (enabled by default)
   - **Refresh Token**
4. Click **Save Changes** (at the bottom of the page, outside the Advanced Settings panel).

If you enable Refresh Tokens, you will also need to include the `offline_access` scope in your frontend configuration. This is noted in [Step 6](#step-6--configure-the-sample-app).

---

## Step 5 — Add the Tenant Claim via a Login Action

In Hybrid mode the backend validates the `id_token` JWT and extracts a claim called `tenant` to identify which tenant the user belongs to. Auth0 does not include this claim by default — you add it with a **Login Action**.

### 5a — Create the Action

1. In the left sidebar, click **Actions** → **Library**.
2. Click **+ Build Custom** (top right).
3. Fill in the dialog:

   | Field | Value |
   |-------|-------|
   | **Name** | `Add tenant claim` |
   | **Trigger** | **Login / Post Login** |
   | **Runtime** | Use the default (Node 18 or later) |

4. Click **Create**.

The Action code editor opens.

### 5b — Write the Action Code

Replace the entire contents of the editor with:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const tenant = event.user.app_metadata?.tenant;
  if (tenant) {
    api.idToken.setCustomClaim('tenant', tenant);
  }
};
```

This reads a `tenant` property from the user's **app_metadata** and sets it as a custom claim on the `id_token`. You will assign the `tenant` value to each user in the next step.

> **Namespaced claims:** Auth0 may warn that non-namespaced custom claims could collide with OIDC standard claims. The name `tenant` does not conflict with any standard claims, so the warning is safe to ignore. If you prefer, you can namespace it (e.g., `https://myapp.example.com/tenant`) and set `CLAIM_KEY` in the backend `.env` to match.

### 5c — Deploy the Action

Click **Deploy** (top right of the code editor). The status changes to **Deployed**.

### 5d — Add the Action to the Login Flow

1. In the left sidebar, click **Actions** → **Flows**.
2. Click the **Login** flow.
3. On the right panel you will see your **Custom** actions. Find **Add tenant claim** and drag it into the flow diagram between **Start** and **Complete**.
4. Click **Apply** (top right).

The action will now execute on every login.

---

## Step 5½ — Create Test Users

You need at least one user with a `tenant` value in their **app_metadata**.

### Create a user (if you don't already have one)

1. In the left sidebar, click **User Management** → **Users**.
2. Click **+ Create User**.
3. Enter an **Email** and **Password**, leave **Connection** as `Username-Password-Authentication`, and click **Create**.

### Assign the tenant value

1. Click the user's name to open their profile.
2. Scroll down to **app_metadata** (under the Metadata section).
3. Enter the following JSON and click **Save**:

```json
{
  "tenant": "acme"
}
```

Replace `acme` with whatever tenant identifier makes sense for your data. This value must match what your Snowflake data isolation strategy expects — for example, a `tenant_key` in your `TENANT_ROLES` mapping table (Role mode) or the values checked by your Row Access Policy (Session Variable mode).

> **Multiple tenants for testing:** Create a second user with a different tenant value (e.g., `{"tenant": "globex"}`) so you can verify that each user sees only their own data.

---

## Step 6 — Configure the Sample App

With your Auth0 credentials and domain in hand, configure the sample application.

### Derive the Auth0 Endpoint URLs

All endpoint URLs are derived from your Auth0 **Domain** (from [Step 2](#note-your-credentials)):

| Endpoint | URL Pattern | Example |
|----------|-------------|---------|
| Authorization | `https://<domain>/authorize` | `https://my-dev.us.auth0.com/authorize` |
| Token | `https://<domain>/oauth/token` | `https://my-dev.us.auth0.com/oauth/token` |
| JWKS | `https://<domain>/.well-known/jwks.json` | `https://my-dev.us.auth0.com/.well-known/jwks.json` |
| Issuer | `https://<domain>/` | `https://my-dev.us.auth0.com/` |

### Backend — `.env`

From the `sample-app/` directory, copy the template for the Hybrid mode you want:

```bash
# Session Variable mode
cp env.backend.var .env

# — or — Role-Based mode
cp env.backend.role .env
```

Then edit `.env` and fill in the Auth0-specific variables:

```bash
# OAuth (from Auth0 Application Settings)
OAUTH_TOKEN_URL=https://<domain>/oauth/token
OAUTH_CLIENT_ID=<Client ID>
OAUTH_CLIENT_SECRET=<Client Secret>
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback

# IdP JWT Validation
IDP_JWKS_URL=https://<domain>/.well-known/jwks.json
IDP_ISSUER=https://<domain>/
```

> **No `IDP_AUDIENCE` needed.** The backend validates the `id_token`'s `aud` claim against `OAUTH_CLIENT_ID` automatically, which is what Auth0 sets per the OIDC spec. You do not need to configure `IDP_AUDIENCE` separately.

Fill in the remaining Snowflake variables (`SNOWFLAKE_HOST`, `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, `SNOWFLAKE_PAT`) according to your Snowflake environment. See the comments in the template file for details.

### Frontend — `.env.local`

```bash
# Session Variable or Role-Based — frontend template is the same
cp env.frontend.role .env.local
# (env.frontend.var also works — they are identical)
```

Edit `.env.local`:

```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_AUTH_MODE=OAUTH

VITE_OAUTH_LOGIN_URL=https://<domain>/authorize
VITE_OAUTH_CLIENT_ID=<Client ID>
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_OAUTH_SCOPE=openid profile email
```

If you enabled Refresh Tokens in [Step 4](#step-4--enable-refresh-tokens-recommended), add `offline_access` to the scope:

```bash
VITE_OAUTH_SCOPE=openid profile email offline_access
```

> **`VITE_OAUTH_AUDIENCE`** is commented out in the template. You do **not** need to set it for Hybrid mode — the `id_token` (which carries the `tenant` claim) is returned without an audience parameter. Setting an audience would tell Auth0 to also issue a JWT-format `access_token`, which is unnecessary here.

### Quick Reference — All Auth0 Values

| Auth0 Dashboard Value | Backend Variable | Frontend Variable |
|-----------------------|-----------------|-------------------|
| Domain → `https://<domain>/oauth/token` | `OAUTH_TOKEN_URL` | — |
| Domain → `https://<domain>/authorize` | — | `VITE_OAUTH_LOGIN_URL` |
| Domain → `https://<domain>/.well-known/jwks.json` | `IDP_JWKS_URL` | — |
| Domain → `https://<domain>/` | `IDP_ISSUER` | — |
| Client ID | `OAUTH_CLIENT_ID` | `VITE_OAUTH_CLIENT_ID` |
| Client Secret | `OAUTH_CLIENT_SECRET` | — |

---

## Step 7 — Start and Test

```bash
cd sample-app
npm run start:all
```

Open [http://localhost:3000](http://localhost:3000).

1. You should see the login page. Click **Sign In**.
2. Auth0's Universal Login page appears. Enter the email and password for the test user you created in [Step 5½](#step-5--create-test-users).
3. After successful authentication, you are redirected back to the app and the chat interface loads.

Check the backend terminal output — you should see a line like:

```
✅ JWT validated, tenant=acme, email=user@example.com
```

This confirms the backend successfully validated the `id_token`, extracted the `tenant` claim, and identified the user.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| **Auth0 login page shows "Callback URL mismatch"** | Redirect URI does not match what Auth0 expects | Verify **Allowed Callback URLs** in Auth0 matches `http://localhost:3000/auth/callback` exactly (no trailing slash) |
| **Backend logs: "Could not extract 'tenant' claim from IdP tokens"** | The Login Action is not deployed, not added to the flow, or the user has no `tenant` in `app_metadata` | 1. Check **Actions → Flows → Login** — the action should appear between Start and Complete. 2. Check the user's **app_metadata** contains `{"tenant": "..."}` |
| **Backend logs: JWT validation errors for all issuer/audience combinations** | `IDP_ISSUER` is wrong, or `OAUTH_CLIENT_ID` doesn't match the Auth0 application | Set `IDP_ISSUER` to `https://<domain>/` (with trailing slash). Verify `OAUTH_CLIENT_ID` matches the **Client ID** from Auth0. |
| **Login succeeds but immediately redirects back to login** | Session cookie not being set (CORS or origin mismatch) | Verify `ALLOWED_ORIGINS` in `.env` includes `http://localhost:3000` and that `VITE_BACKEND_URL` is `http://localhost:3001` |
| **"Unauthorized" error after a period of inactivity** | Access token expired and no refresh token available | Enable Refresh Tokens ([Step 4](#step-4--enable-refresh-tokens-recommended)) and add `offline_access` to `VITE_OAUTH_SCOPE` |
| **Auth0 login loops (re-prompts on every visit)** | `VITE_OAUTH_PROMPT=login` is set | Remove or comment out `VITE_OAUTH_PROMPT` in `.env.local` (only use it during development when you need to switch between test users) |

---

## Appendix: Verifying Your Setup Without the Sample App

You can confirm Auth0 is issuing the right tokens before running the full application.

### Inspect the id_token

1. Complete a login flow (via the sample app or the [Auth0 Authentication API Debugger Extension](https://auth0.com/docs/customize/extensions/authentication-api-debugger-extension)).
2. Copy the `id_token` from the response.
3. Paste it into [https://jwt.io](https://jwt.io).
4. In the decoded payload, confirm:
   - `iss` matches your `IDP_ISSUER` (e.g., `https://my-dev.us.auth0.com/`)
   - `aud` matches your **Client ID**
   - `tenant` is present and has the expected value (e.g., `acme`)
   - `email` is present (used for per-user thread scoping)

If the `tenant` claim is missing, revisit [Step 5](#step-5--add-the-tenant-claim-via-a-login-action) and [Step 5½](#step-5--create-test-users).
