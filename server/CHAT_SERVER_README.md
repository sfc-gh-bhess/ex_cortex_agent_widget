# Cortex Chat Server Integration Guide

Add Snowflake Cortex chat capabilities to your Express application with a single file.

## Overview

The `chatServer.js` module provides all backend endpoints required by the Cortex `ChatInterface` React component. It's designed to be as simple to integrate as the frontend component itself.

## Why Use This Module?

✅ **Drop-in integration** - Add chat to your Express app in 10 lines of code  
✅ **Authentication agnostic** - Works with PAT, OAuth, or custom auth  
✅ **Thread management** - Built-in conversation history  
✅ **Error handling** - Automatic error responses with helpful tips  
✅ **Production ready** - Used in the sample application  
✅ **Zero dependencies** - Only requires `express` (which you already have)  

**Perfect for:**
- Adding chat to existing web applications
- Building custom Cortex Agents interfaces
- Prototyping with Snowflake Intelligence
- Production applications with user-specific access

## Quick Start

### Step 1: Copy `chatServer.js` to your project

Place `chatServer.js` in your server directory alongside your main Express application file.

### Step 2: Configure environment variables

Add these variables to your `.env` file:

```bash
SNOWFLAKE_HOST=your-account.snowflakecomputing.com
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema
```

### Step 3: Integrate into your Express app

```javascript
const express = require('express');
const { createChatRouter } = require('./chatServer');

const app = express();

// Create the chat router
const chatRouter = createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => {
    // Return Snowflake access token for this request
    return process.env.SNOWFLAKE_PAT; // or req.user.snowflakeToken
  }
});

// Mount it (optionally with your auth middleware)
app.use('/api', yourAuthMiddleware, chatRouter);

// Start server
app.listen(3001, () => {
  console.log('Server running with chat integration!');
});
```

That's it! Your frontend `ChatInterface` can now connect to these endpoints.

## Available Endpoints

Once mounted at `/api`, the following endpoints become available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents` | GET | List all available agents |
| `/api/agents/:name` | GET | Get details for a specific agent |
| `/api/agents/:name/messages` | POST | Send a message to an agent (streaming) |
| `/api/threads` | POST | Create a new conversation thread |
| `/api/threads` | GET | List all conversation threads |
| `/api/threads/:id` | GET | Get conversation history for a thread |
| `/api/threads/:id` | POST | Update thread name |
| `/api/threads/:id` | DELETE | Delete a thread |

## Configuration Options

### Required Options

```javascript
{
  snowflakeHost: string,        // Your Snowflake account hostname
  snowflakeDatabase: string,    // Database containing agents
  snowflakeSchema: string,      // Schema containing agents
  getAuthToken: (req) => string // Function to get auth token
}
```

### Optional Options

```javascript
{
  onError: (error) => void  // Custom error handler callback
}
```

## Authentication Strategies

The `getAuthToken` function is called for every request and should return a valid Snowflake access token. Here are common patterns:

### Option 1: PAT (Personal Access Token) - Simple

All users share the same token. Good for prototypes and internal tools.

```javascript
getAuthToken: (req) => process.env.SNOWFLAKE_PAT
```

### Option 2: OAuth - User-specific

Each user has their own token. Good for production applications.

```javascript
getAuthToken: (req) => {
  // Assuming you have authentication middleware that sets req.tokens
  return req.tokens?.accessToken;
}
```

### Option 3: Custom Authentication

Integrate with your existing auth system.

```javascript
getAuthToken: (req) => {
  // Your custom logic here
  const user = req.user; // from your auth middleware
  return user.snowflakeToken;
}
```

## Complete Example

Here's a complete example showing integration with custom authentication:

```javascript
const express = require('express');
const { createChatRouter } = require('./chatServer');

const app = express();

// Your existing middleware
app.use(express.json());

// Your existing authentication middleware
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization;
  // Your auth logic...
  req.user = { /* user data */ snowflakeToken: '...' };
  next();
};

// Create and mount chat router
const chatRouter = createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => req.user.snowflakeToken,
  onError: (error) => {
    // Custom error handling
    console.error('Chat error:', error);
    // Could send to error tracking service, etc.
  }
});

// Mount with your auth middleware
app.use('/api', authenticateUser, chatRouter);

// Your other routes...
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3001);
```

## Error Handling

The chat router handles errors automatically and returns appropriate HTTP status codes:

- `400` - Bad request (invalid agent name, missing parameters)
- `401` - Authentication error (no token provided)
- `404` - Not found (agent or thread doesn't exist)
- `500` - Internal server error

You can provide a custom error handler via the `onError` callback:

```javascript
const chatRouter = createChatRouter({
  // ... other config ...
  onError: (error) => {
    // Log to your monitoring service
    console.error('Chat server error:', error);
    
    // Send to error tracking
    errorTracker.captureException(error);
  }
});
```

## Frontend Integration

After setting up the backend, use the companion React package:

```bash
npm install @chat-overlay/simple-chat-interface
```

```jsx
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

See the [Frontend Package README](../packages/simple-chat-interface/README.md) for full documentation.

## Comparison: Frontend vs Backend

| Frontend | Backend |
|----------|---------|
| Copy component package | Copy `chatServer.js` file |
| Add `<FloatingChatInterface />` to JSX | Add `app.use('/api', chatRouter)` to Express |
| Configure `backendUrl` | Configure Snowflake connection |
| 3 lines of code | 10 lines of code |

Perfect symmetry! 🎯

## Advanced: Multiple Snowflake Environments

You can create multiple chat routers for different environments:

```javascript
const prodChatRouter = createChatRouter({
  snowflakeHost: process.env.PROD_SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.PROD_DATABASE,
  snowflakeSchema: process.env.PROD_SCHEMA,
  getAuthToken: (req) => req.user.prodToken
});

const devChatRouter = createChatRouter({
  snowflakeHost: process.env.DEV_SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.DEV_DATABASE,
  snowflakeSchema: process.env.DEV_SCHEMA,
  getAuthToken: (req) => req.user.devToken
});

app.use('/api/prod', prodChatRouter);
app.use('/api/dev', devChatRouter);
```

## Troubleshooting

### Issue: "No authentication token provided"

**Cause**: The `getAuthToken` function returned `null`, `undefined`, or an empty string.

**Solution**: Ensure your `getAuthToken` function returns a valid token:

```javascript
getAuthToken: (req) => {
  const token = process.env.SNOWFLAKE_PAT || req.user?.snowflakeToken;
  if (!token) {
    throw new Error('Snowflake token not configured');
  }
  return token;
}
```

### Issue: 401 Unauthorized from Snowflake

**Cause**: The token is invalid, expired, or doesn't have the required permissions.

**Solution**: 
- Verify the token is valid
- Check token permissions in Snowflake
- Implement token refresh logic if using OAuth

### Issue: 404 Agent not found

**Cause**: The agent doesn't exist in the specified database/schema, or the path is incorrect.

**Solution**:
- Verify `SNOWFLAKE_DATABASE` and `SNOWFLAKE_SCHEMA` are correct
- Check that agents exist in that location using Snowsight
- Ensure agent names match exactly (case-sensitive)

### Issue: CORS errors

**Cause**: The backend is not configured to accept requests from your frontend domain.

**Solution**: Configure CORS in your main Express app before mounting the chat router:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  credentials: true
}));
```

## Security Best Practices

1. **Never expose tokens in logs**: The chat server automatically redacts tokens in error messages
2. **Use HTTPS in production**: Always use secure connections
3. **Implement rate limiting**: Protect your endpoints from abuse (shown in `server.js` example)
4. **Validate user input**: The chat server validates agent names automatically
5. **Use environment variables**: Never hardcode credentials

## Next Steps

- See `server.js` for a complete sample application with OAuth support
- Review the [frontend integration docs](../packages/simple-chat-interface/README.md) for the `ChatInterface` component
- Check out [Snowflake Cortex Agents documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) for agent configuration

## Support

For issues or questions:
- Check the main [README.md](../README.md) in the project root
- Review the sample `server.js` implementation
- Consult [Snowflake Cortex documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents)

---

**Made with ❄️ using Snowflake Cortex**
