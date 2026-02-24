# Cortex Chat Server

Express router module providing all backend endpoints required by the [`@chat-overlay/simple-chat-interface`](../packages/simple-chat-interface/README.md) React component. Drop it into any Express app to add Snowflake Cortex Agents chat capabilities.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Your Express Application                                          │
│                                                                    │
│  ┌──────────────────────┐                                          │
│  │  Your auth, CORS,    │                                          │
│  │  rate limiting, etc. │                                          │
│  └──────────┬───────────┘                                          │
│             │                                                      │
│             ▼                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  chatServer.js  (createChatRouter)                           │  │
│  │                                                              │  │
│  │  GET  /agents               List available agents            │  │
│  │  GET  /agents/:name         Agent details                    │  │
│  │  POST /agents/:name/messages  Send message (SSE stream)     │  │
│  │  POST /threads              Create thread                    │  │
│  │  GET  /threads              List threads                     │  │
│  │  GET  /threads/:id          Thread history                   │  │
│  │  POST /threads/:id          Rename thread                    │  │
│  │  DELETE /threads/:id        Delete thread                    │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                              │
└─────────────────────┼──────────────────────────────────────────────┘
                      │  HTTPS
                      ▼
           ┌──────────────────────┐
           │  Snowflake           │
           │  Cortex Agents API   │
           └──────────────────────┘
```

The module is **authentication-agnostic**. It delegates token retrieval to a `getAuthToken` callback you provide, so it works with any auth system. Protect routes using your own middleware (`app.use('/api', yourAuthMiddleware, chatRouter)`).

The companion `server.js` in this directory is a **sample application** that demonstrates full integration with session management, CORS, rate limiting, and three authentication modes (PAT, OAuth, Hybrid).

## Quick Start

### 1. Copy `chatServer.js` to your project

### 2. Set environment variables

```bash
SNOWFLAKE_HOST=your-account.snowflakecomputing.com
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema
```

### 3. Integrate

```javascript
const express = require('express');
const { createChatRouter } = require('./chatServer');

const app = express();
app.use(express.json());

const chatRouter = createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT
});

app.use('/api', chatRouter);
app.listen(3001);
```

The frontend `ChatInterface` component can now connect to `http://localhost:3001`.

## Configuration

### `createChatRouter(config)`

**Required:**

| Option | Type | Description |
|--------|------|-------------|
| `snowflakeHost` | `string` | Snowflake account hostname (e.g., `acme.snowflakecomputing.com`) |
| `snowflakeDatabase` | `string` | Database containing your Cortex Agents |
| `snowflakeSchema` | `string` | Schema containing your Cortex Agents |
| `getAuthToken` | `(req) => string` | Returns a valid Snowflake access token for the given request |

**Optional:**

| Option | Type | Description |
|--------|------|-------------|
| `getSessionVariables` | `(req) => object \| null` | Returns session variables to inject into agent requests (see [Hybrid mode](#hybrid-pat--idp-tenant-extraction)) |
| `onError` | `(error) => void` | Custom error handler callback |

## Authentication Strategies

The `getAuthToken` callback is called on every Snowflake API request. How you implement it determines the authentication model.

### PAT (Personal Access Token)

All users share a single Snowflake token. Simplest setup — good for prototypes, demos, and internal tools.

```javascript
const chatRouter = createChatRouter({
  // ... Snowflake config ...
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT
});

app.use('/api', chatRouter);
```

### OAuth (Per-User Tokens)

Each user authenticates via an Identity Provider and gets their own Snowflake access token. Your auth middleware stores tokens on `req` (e.g., `req.tokens`).

```javascript
const chatRouter = createChatRouter({
  // ... Snowflake config ...
  getAuthToken: (req) => req.tokens?.accessToken
});

app.use('/api', authenticate, chatRouter);
```

### Hybrid (PAT + IdP Tenant Extraction)

Users authenticate via an IdP (for app access and tenant identification), but all Snowflake API calls use a shared service PAT. A claim from the IdP JWT — such as `tenant` — is extracted and passed to the Cortex Agent as a **session variable**, enabling row-level data filtering per tenant.

```javascript
const chatRouter = createChatRouter({
  // ... Snowflake config ...
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT,
  getSessionVariables: (req) => {
    const tenant = req.tokens?.tenant;
    if (!tenant) return null;
    return {
      TENANT: {
        value: tenant,
        type: 'string',
        is_session_variable: true
      }
    };
  }
});

app.use('/api', authenticate, chatRouter);
```

The `getSessionVariables` callback is invoked on every agent message request (`POST /agents/:name/messages`). If it returns an object, those variables are merged into the request payload sent to Snowflake:

```json
{
  "messages": [...],
  "variables": {
    "TENANT": { "value": "Alice", "type": "string", "is_session_variable": true }
  }
}
```

The variable name (e.g., `TENANT`) and the IdP claim key are configurable. See `env.backend.example` for the `SESSION_VAR_NAME` and `CLAIM_KEY` environment variables.

### Custom Authentication

Integrate with any auth system by implementing `getAuthToken`:

```javascript
getAuthToken: (req) => {
  const user = req.user; // from your auth middleware
  return user.snowflakeToken;
}
```

## Endpoints

All endpoints are relative to the mount path (e.g., if mounted at `/api`, the agents list is `GET /api/agents`).

### `GET /agents`

Lists all Cortex Agents in the configured database/schema.

**Response:**
```json
{
  "agents": {
    "my_agent": {
      "displayName": "My Agent",
      "visible": true,
      "starterQuestions": ["What can you help me with?"],
      "description": "A helpful agent"
    }
  },
  "defaultAgent": "my_agent"
}
```

### `GET /agents/:name`

Returns details for a specific agent.

### `POST /agents/:name/messages`

Sends a message to an agent. Returns a **Server-Sent Events** (SSE) stream.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": [{ "type": "text", "text": "Hello" }] }
  ],
  "thread_id": "optional_thread_id",
  "stream": true
}
```

**SSE events:** `response.text.delta`, `response.status`, `response.tool_result`, `response.thinking`, `response.chart`, `response.text.annotation`, `metadata`.

### `POST /threads`

Creates a new conversation thread.

**Request:** `{ "origin_application": "my_app" }`

### `GET /threads`

Lists all threads. Supports `?applicationName=my_app` query parameter.

### `GET /threads/:id`

Returns thread metadata and message history.

### `POST /threads/:id`

Updates thread name. **Request:** `{ "thread_name": "New name" }`. **Response:** `204 No Content`.

### `DELETE /threads/:id`

Deletes a thread. **Response:** `204 No Content`.

## Error Handling

The router returns appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| `400` | Invalid request (bad agent name, missing parameters) |
| `401` | No authentication token provided |
| `404` | Agent or thread not found |
| `500` | Internal server error |

Use the `onError` callback for custom logging or alerting:

```javascript
const chatRouter = createChatRouter({
  // ... config ...
  onError: (error) => {
    console.error('Chat error:', error);
    errorTracker.captureException(error);
  }
});
```

## Advanced: Multiple Snowflake Environments

Create separate routers for different environments:

```javascript
const prodChat = createChatRouter({
  snowflakeHost: process.env.PROD_HOST,
  snowflakeDatabase: process.env.PROD_DB,
  snowflakeSchema: process.env.PROD_SCHEMA,
  getAuthToken: (req) => req.user.prodToken
});

const devChat = createChatRouter({
  snowflakeHost: process.env.DEV_HOST,
  snowflakeDatabase: process.env.DEV_DB,
  snowflakeSchema: process.env.DEV_SCHEMA,
  getAuthToken: (req) => req.user.devToken
});

app.use('/api/prod', prodChat);
app.use('/api/dev', devChat);
```

## Security Best Practices

1. **Never expose tokens to the browser.** The chat server runs server-side; tokens stay on the backend.
2. **Use HTTPS in production.** Configure TLS termination at your load balancer or reverse proxy.
3. **Add rate limiting.** Protect endpoints from abuse (the sample `server.js` demonstrates this).
4. **Validate user input.** The router validates agent names automatically.
5. **Use environment variables** for all credentials.
6. **Add auth middleware** before the chat router (`app.use('/api', auth, chatRouter)`).

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No authentication token provided" | `getAuthToken` returned null/undefined | Ensure the function returns a valid token |
| 401 Unauthorized from Snowflake | Token invalid, expired, or insufficient permissions | Verify token validity; implement refresh logic for OAuth |
| 404 Agent not found | Agent doesn't exist in the specified database/schema | Check `SNOWFLAKE_DATABASE`, `SNOWFLAKE_SCHEMA`, agent name (case-sensitive) |
| CORS errors | Backend not accepting frontend origin | Configure CORS before mounting the router (see sample `server.js`) |

## Related

- [Top-level README](../README.md) — Architecture overview and quick start
- [Frontend Package](../packages/simple-chat-interface/README.md) — React component API and embedding guide
- [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) — Agent configuration
- [Cortex Agents REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api) — API reference

## License

MIT
