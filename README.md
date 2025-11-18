# Snowflake Cortex Agents Chat Application

A complete chat application powered by [Snowflake Cortex Agents](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents) via the [REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api). This project demonstrates how to integrate the reusable `simple-chat-interface` package and `chatServer.js` backend module into a production-ready application with authentication, threading, and more.

## 🎯 What's Included

This repository contains:

1. **Reusable React Package** (`packages/simple-chat-interface/`) - Drop-in chat components
2. **Reusable Backend Module** (`server/chatServer.js`) - Express router for Cortex Agents API
3. **Sample Application** - Complete demo app showing how to integrate both

## 📦 Quick Start (Sample App)

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Snowflake Account** with:
  - Access to Snowflake Intelligence
  - At least one Cortex Agent created ([Guide](https://quickstarts.snowflake.com/guide/getting-started-with-snowflake-intelligence/))
  - Personal Access Token (PAT) or OAuth configured

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd awesome-custom-cortex-agents-rest-api-react-app
```

2. **Install dependencies**

```bash
npm install
```

This installs dependencies for:
- The main sample application
- The `simple-chat-interface` package

3. **Configure environment variables**

**Backend Configuration:**
```bash
cp env.backend.example .env
```

Edit `.env` and configure:

```bash
# Snowflake Connection
SNOWFLAKE_HOST=your-account.snowflakecomputing.com
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema

# Authentication Mode: "PAT" or "OAUTH"
AUTH_MODE=PAT

# PAT Mode: Provide your Personal Access Token
SNOWFLAKE_PAT=your_pat_token

# OAuth Mode: Provide these (if using OAUTH)
# IDP_LOGIN_URL=https://your-idp.com/oauth/authorize
# IDP_TOKEN_URL=https://your-idp.com/oauth/token
# OAUTH_CLIENT_ID=your_client_id
# OAUTH_CLIENT_SECRET=your_client_secret
# OAUTH_REDIRECT_URI=http://localhost:3001/auth/callback

# CORS (optional, defaults to http://localhost:3000)
ALLOWED_ORIGINS=http://localhost:3000

# Server Port (optional, defaults to 3001)
PORT=3001
```

**Frontend Configuration:**
```bash
cp env.frontend.example .env.local
```

Edit `.env.local` and configure:

```bash
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:3001

# Authentication Mode: must match backend AUTH_MODE
REACT_APP_AUTH_MODE=PAT

# OAuth Mode: Provide login URL (if using OAUTH)
# REACT_APP_OAUTH_LOGIN_URL=http://localhost:3001/auth/login

# Application Name (for thread tracking)
REACT_APP_APPLICATION_NAME=dash_desai
```

4. **Start the application**

```bash
npm run start:all
```

This starts:
- Frontend on [http://localhost:3000](http://localhost:3000)
- Backend on [http://localhost:3001](http://localhost:3001)

## 🔐 Authentication Modes

This application supports two authentication modes:

### PAT Mode (Simple)
- All users share the same Personal Access Token
- Best for: Prototypes, demos, internal tools
- Configuration: Set `AUTH_MODE=PAT` in both frontend and backend

### OAuth Mode (Production)
- Each user authenticates with an external Identity Provider
- Each user gets their own Snowflake access token
- Best for: Production applications with user-specific access
- Configuration: Set `AUTH_MODE=OAUTH` in both frontend and backend

**To switch modes:**
```bash
# Backend
AUTH_MODE=PAT npm run start:server

# Frontend  
REACT_APP_AUTH_MODE=PAT npm start
```

## 🧩 Using the Reusable Components

### Frontend Package Integration

Add the chat interface to **your existing React app**:

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

See [`packages/simple-chat-interface/README.md`](packages/simple-chat-interface/README.md) for full documentation.

### Backend Module Integration

Add the chat server to **your existing Express app**:

1. Copy `server/chatServer.js` to your project
2. Integrate it:

```javascript
const { createChatRouter } = require('./chatServer');

const chatRouter = createChatRouter({
  snowflakeHost: process.env.SNOWFLAKE_HOST,
  snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
  snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
  getAuthToken: (req) => process.env.SNOWFLAKE_PAT // or your auth logic
});

app.use('/api', chatRouter);
```

See [`server/CHAT_SERVER_README.md`](server/CHAT_SERVER_README.md) for full documentation.

## ✨ Features

- 🤖 **Multi-Agent Support** - Switch between different Cortex Agents
- 🧵 **Thread Management** - Create, list, and revisit conversation threads
- 💭 **Thinking Visualization** - See the agent's reasoning process (optional)
- 📊 **Chart Support** - Automatic visualization with Vega-Lite
- 🗣️ **Voice Input** - Speech-to-text for hands-free interaction
- 🎨 **Dark/Light Themes** - Automatic theme switching
- 🔐 **Dual Auth Modes** - PAT or OAuth, configurable without code changes
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ♿ **Accessible** - WCAG 2.1 compliant

## 📂 Project Structure

```
.
├── packages/simple-chat-interface/    # Reusable React chat package
│   ├── src/
│   │   ├── components/               # React components
│   │   ├── hooks/                    # Custom hooks
│   │   ├── services/                 # API services
│   │   └── index.ts                  # Package exports
│   └── README.md                     # Package documentation
│
├── server/
│   ├── chatServer.js                 # Reusable Express router module
│   ├── server.js                     # Sample application server
│   └── CHAT_SERVER_README.md         # Backend integration docs
│
├── src/                              # Sample application frontend
│   ├── components/                   # App-specific components
│   ├── contexts/                     # React contexts (Auth, Theme)
│   ├── pages/                        # Login, OAuth callback pages
│   ├── services/                     # Auth service
│   └── index.tsx                     # App entry point
│
├── .env                              # Backend config (gitignored)
├── .env.local                        # Frontend config (gitignored)
├── env.backend.example               # Backend config template
├── env.frontend.example              # Frontend config template
└── README.md                         # This file
```

## 🔧 Development

### Run frontend only:
```bash
npm start
```

### Run backend only:
```bash
npm run start:server
```

### Build for production:
```bash
npm run build
```

### Build with custom backend URL:
```bash
REACT_APP_BACKEND_URL=https://your-api.com npm run build
```

## 🐛 Troubleshooting

### Common Issues

**1. Cannot connect to backend**
- Ensure backend is running: `npm run start:server`
- Check `REACT_APP_BACKEND_URL` in `.env.local`

**2. HTTP 401 Unauthorized**
- **PAT Mode**: Verify `SNOWFLAKE_PAT` in `.env` is valid and not expired
- **OAuth Mode**: Check OAuth configuration and token refresh logic

**3. HTTP 400 Bad Request**
- Verify `SNOWFLAKE_DATABASE` and `SNOWFLAKE_SCHEMA` exist
- Ensure you have access to them in Snowflake

**4. HTTP 404 Agent Not Found**
- Check that agents exist in your database/schema
- Agent names are case-sensitive

**5. Thread panel not appearing**
- Only available in `FloatingChatInterface`
- Click the history icon (📜) in the chat input area

**6. Voice input not working**
- Requires Chrome, Edge, or Safari (not Firefox)
- Must grant microphone permissions
- HTTPS required in production

**7. Port already in use**
```bash
# Kill frontend (port 3000)
lsof -ti:3000 | xargs kill -9

# Kill backend (port 3001)
lsof -ti:3001 | xargs kill -9
```

## 📖 Documentation

- [Frontend Package Documentation](packages/simple-chat-interface/README.md)
- [Backend Module Documentation](server/CHAT_SERVER_README.md)
- [Snowflake Cortex Agents Docs](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents)
- [Cortex Agents REST API](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api)

## 📝 License

MIT

## 💬 Questions

For questions, comments, or feedback, reach out to [Dash DesAI](https://www.linkedin.com/in/dash-desai/).

---

**Made with ❄️ using Snowflake Cortex**
