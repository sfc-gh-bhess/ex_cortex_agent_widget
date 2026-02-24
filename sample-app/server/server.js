/**
 * Secure Backend Proxy Server for Snowflake Cortex Agents
 * 
 * This server acts as a proxy between the frontend and Snowflake APIs,
 * keeping the Personal Access Token (PAT) secure on the server side.
 * 
 * Security Features:
 * - PAT is never exposed to the browser/client
 * - CORS configured for specific origins
 * - Request validation and sanitization
 * - Rate limiting to prevent abuse
 * - Proper error handling without exposing sensitive info
 * 
 * INTEGRATION NOTE:
 * This is a sample application that demonstrates how to integrate the chatServer module.
 * The chatServer.js file provides all endpoints needed for the ChatInterface component
 * and can be dropped into any Express application. See chatServer.js for more details.
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
require('dotenv').config();
const { createRemoteJWKSet, jwtVerify } = require('jose');
const { createChatRouter } = require('@cortex-chat/server');

const app = express();

// ============================================================================
// Constants
// ============================================================================

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404
};

const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: 'Not authenticated'
};

const CONFIG = {
  DEFAULT_PORT: 3001,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100
};

// Render uses PORT, local dev uses SERVER_PORT
const PORT = process.env.PORT || process.env.SERVER_PORT || CONFIG.DEFAULT_PORT;

// Authentication mode: 'PAT', 'OAUTH', or 'HYBRID'
const AUTH_MODE = process.env.AUTH_MODE || 'OAUTH';
console.log(`🔐 Authentication mode: ${AUTH_MODE}`);

// ============================================================================
// Configuration & Validation
// ============================================================================

/**
 * Validate required environment variables
 */
const validateEnvironment = () => {
  // Always required
  const required = [
    'SNOWFLAKE_HOST',
    'SNOWFLAKE_DATABASE',
    'SNOWFLAKE_SCHEMA'
  ];

  // Add mode-specific requirements
  if (AUTH_MODE === 'PAT') {
    required.push('SNOWFLAKE_PAT');
  } else if (AUTH_MODE === 'OAUTH') {
    required.push('OAUTH_TOKEN_URL', 'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_REDIRECT_URI');
  } else if (AUTH_MODE === 'HYBRID') {
    required.push(
      'SNOWFLAKE_PAT',
      'OAUTH_TOKEN_URL', 'OAUTH_CLIENT_ID', 'OAUTH_CLIENT_SECRET', 'OAUTH_REDIRECT_URI',
      'IDP_JWKS_URL', 'IDP_ISSUER', 'IDP_AUDIENCE',
      'SESSION_VAR_NAME', 'CLAIM_KEY'
    );
  } else {
    console.error('❌ Invalid AUTH_MODE. Must be "PAT", "OAUTH", or "HYBRID"');
    process.exit(1);
  }

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${AUTH_MODE} mode:`, missing.join(', '));
    process.exit(1);
  }

  console.log(`✅ All required environment variables for ${AUTH_MODE} mode are set`);
};

validateEnvironment();

// Snowflake configuration from environment
const SNOWFLAKE_CONFIG = {
  host: process.env.SNOWFLAKE_HOST,
  database: process.env.SNOWFLAKE_DATABASE,
  schema: process.env.SNOWFLAKE_SCHEMA
};

// OAuth configuration from environment
const OAUTH_CONFIG = {
  tokenUrl: process.env.OAUTH_TOKEN_URL,
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT_URI
};

// HYBRID mode configuration (IdP JWT validation + session variables)
const HYBRID_CONFIG = AUTH_MODE === 'HYBRID' ? {
  jwksUrl: process.env.IDP_JWKS_URL,
  issuer: process.env.IDP_ISSUER,
  audience: process.env.IDP_AUDIENCE,
  sessionVarName: process.env.SESSION_VAR_NAME,
  claimKey: process.env.CLAIM_KEY,
} : null;

// JWKS key set for HYBRID mode JWT validation (caches keys automatically)
const jwks = AUTH_MODE === 'HYBRID'
  ? createRemoteJWKSet(new URL(HYBRID_CONFIG.jwksUrl))
  : null;

// ============================================================================
// Token Store and Session Management
// ============================================================================

/**
 * In-memory token store
 * Maps session ID to user token data
 * Structure: { sessionId: { accessToken, refreshToken, expiresAt, userId } }
 */
const tokenStore = new Map();

/**
 * Generate a secure session ID
 */
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Store tokens for a session
 * @param {string} tenant - Tenant identifier extracted from IdP claims (HYBRID mode only)
 */
const storeTokens = (sessionId, accessToken, refreshToken, expiresIn, userId = 'unknown', tenant = null) => {
  // Calculate expiry time (current time + expires_in seconds)
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  tokenStore.set(sessionId, {
    accessToken,
    refreshToken,
    expiresAt,
    userId,
    tenant
  });
  
  const tenantInfo = tenant ? `, tenant: ${tenant}` : '';
  console.log(`🔐 Stored tokens for session: ${sessionId.substring(0, 8)}... (expires in ${expiresIn}s${tenantInfo})`);
};

/**
 * Get tokens for a session
 */
const getTokens = (sessionId) => {
  return tokenStore.get(sessionId);
};

/**
 * Delete tokens for a session
 */
const deleteTokens = (sessionId) => {
  const existed = tokenStore.delete(sessionId);
  if (existed) {
    console.log(`🗑️  Deleted tokens for session: ${sessionId.substring(0, 8)}...`);
  }
  return existed;
};

// ============================================================================
// Middleware Configuration
// ============================================================================

/**
 * CORS configuration - restrict to specific origins in production
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow localhost
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : [];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

/**
 * Rate limiting to prevent abuse
 * Adjust limits based on your needs
 */
const limiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT_WINDOW_MS,
  max: CONFIG.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitize error messages to prevent information leakage
 */
const sanitizeError = (error) => {
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An error occurred while processing your request',
      code: 'INTERNAL_ERROR'
    };
  }
  
  // In development, provide more details (but still sanitize sensitive data)
  return {
    message: error.message?.replace(/Bearer\s+[\w-]+/g, 'Bearer [REDACTED]') || 'Unknown error',
    code: error.code || 'UNKNOWN_ERROR'
  };
};

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Authentication middleware - adapts based on AUTH_MODE
 */
const authenticate = (req, res, next) => {
  if (AUTH_MODE === 'PAT') {
    req.authMode = 'PAT';
    return next();
  }
  
  // OAUTH and HYBRID modes: Require valid session
  const sessionId = req.cookies.session_id;
  
  if (!sessionId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.NOT_AUTHENTICATED,
      message: 'No session found. Please log in.'
    });
  }
  
  const tokens = getTokens(sessionId);
  
  if (!tokens) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      error: ERROR_MESSAGES.NOT_AUTHENTICATED,
      message: 'Invalid or expired session. Please log in again.'
    });
  }
  
  req.sessionId = sessionId;
  req.tokens = tokens;
  req.authMode = AUTH_MODE; // 'OAUTH' or 'HYBRID'
  next();
};

/**
 * Middleware to refresh access token if needed (within 5 minutes of expiry)
 * Applies in OAUTH and HYBRID modes
 */
const refreshTokenIfNeeded = async (req, res, next) => {
  if (req.authMode === 'PAT') {
    return next();
  }
  
  const sessionId = req.sessionId;
  const tokens = req.tokens;
  
  if (!tokens) {
    return next();
  }
  
  // Check if token expires within 5 minutes
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
  
  if (tokens.expiresAt <= fiveMinutesFromNow) {
    console.log(`🔄 Access token expiring soon, refreshing for session: ${sessionId.substring(0, 8)}...`);
    
    try {
      const response = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: OAUTH_CONFIG.clientId,
          client_secret: OAUTH_CONFIG.clientSecret,
        }),
      });
      
      if (!response.ok) {
        console.error('❌ Token refresh failed:', response.status);
        deleteTokens(sessionId);
        res.clearCookie('session_id');
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
          error: 'Token refresh failed',
          code: 'REFRESH_FAILED'
        });
      }
      
      const data = await response.json();
      
      // In HYBRID mode, re-validate JWT and extract tenant from refreshed tokens
      let tenant = tokens.tenant; // preserve existing tenant by default
      if (AUTH_MODE === 'HYBRID') {
        const tokensToTry = [data.id_token, data.access_token].filter(Boolean);
        const issuerVariants = [
          HYBRID_CONFIG.issuer,
          HYBRID_CONFIG.issuer.endsWith('/') ? HYBRID_CONFIG.issuer.slice(0, -1) : HYBRID_CONFIG.issuer + '/',
        ];
        const audienceVariants = [HYBRID_CONFIG.audience];
        if (OAUTH_CONFIG.clientId && OAUTH_CONFIG.clientId !== HYBRID_CONFIG.audience) {
          audienceVariants.push(OAUTH_CONFIG.clientId);
        }
        for (const jwt of tokensToTry) {
          let found = false;
          for (const issuer of issuerVariants) {
            for (const audience of audienceVariants) {
              try {
                const { payload } = await jwtVerify(jwt, jwks, { issuer, audience });
                const extracted = payload[HYBRID_CONFIG.claimKey];
                if (extracted) {
                  tenant = extracted;
                  found = true;
                  console.log(`✅ Re-validated tenant on refresh: ${tenant}`);
                  break;
                }
              } catch (err) {
                // Continue trying next combination
              }
            }
            if (found) break;
          }
          if (found) break;
        }
      }
      
      storeTokens(
        sessionId,
        data.access_token,
        data.refresh_token || tokens.refreshToken,
        data.expires_in,
        tokens.userId,
        tenant
      );
      
      req.tokens = getTokens(sessionId);
      
      console.log('✅ Access token refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing token:', error.message);
    }
  }
  
  next();
};

// ============================================================================
// Integrate Chat Server Module
// ============================================================================

/**
 * Create and mount the chat router
 * This provides all endpoints needed for the ChatInterface component
 */
const chatRouter = createChatRouter({
  snowflakeHost: SNOWFLAKE_CONFIG.host,
  snowflakeDatabase: SNOWFLAKE_CONFIG.database,
  snowflakeSchema: SNOWFLAKE_CONFIG.schema,
  getAuthToken: (req) => {
    if (req.authMode === 'PAT' || req.authMode === 'HYBRID') {
      return process.env.SNOWFLAKE_PAT;
    }
    return req.tokens?.accessToken;
  },
  getSessionVariables: AUTH_MODE === 'HYBRID' ? (req) => {
    const sessionId = req.cookies?.session_id;
    const tokens = sessionId ? getTokens(sessionId) : null;
    if (tokens?.tenant) {
      console.log(`📋 Injecting session variable ${HYBRID_CONFIG.sessionVarName}=${tokens.tenant}`);
      return {
        [HYBRID_CONFIG.sessionVarName]: {
          value: tokens.tenant,
          type: 'string',
          is_session_variable: true
        }
      };
    }
    return null;
  } : undefined,
  onError: (error) => {
    console.error('Chat server error:', error.message);
  }
});

// Mount chat router with authentication middleware
app.use('/api', authenticate, refreshTokenIfNeeded, chatRouter);

// ============================================================================
// Sample Application Routes
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ============================================================================
// Authentication Endpoints
// ============================================================================

if (AUTH_MODE === 'OAUTH' || AUTH_MODE === 'HYBRID') {
  /**
   * OAuth token exchange endpoint
   * POST /auth/exchange
   * In HYBRID mode, also validates the IdP JWT and extracts the tenant claim.
   */
  app.post('/auth/exchange', async (req, res) => {
    try {
      const { code, state } = req.body;
      
      if (!code) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
          error: 'Authorization code is required' 
        });
      }
      
      console.log('🔐 Exchanging authorization code for tokens...');
      
      const response = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: OAUTH_CONFIG.redirectUri,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token exchange failed:', response.status, errorText);
        return res.status(response.status).json({ 
          error: 'Token exchange failed',
          details: errorText
        });
      }
      
      const tokenData = await response.json();
      
      // In HYBRID mode, validate JWT and extract the tenant claim
      let tenant = null;
      if (AUTH_MODE === 'HYBRID') {
        const tokensToTry = [tokenData.id_token, tokenData.access_token].filter(Boolean);
        let validated = false;

        // Normalize issuer: allow match with or without trailing slash
        const issuerVariants = [
          HYBRID_CONFIG.issuer,
          HYBRID_CONFIG.issuer.endsWith('/') ? HYBRID_CONFIG.issuer.slice(0, -1) : HYBRID_CONFIG.issuer + '/',
        ];

        // Per OIDC spec, the id_token audience is the client ID, while the
        // access_token audience is the API identifier. Try both so we can
        // validate whichever token contains the claim we need.
        const audienceVariants = [HYBRID_CONFIG.audience];
        if (OAUTH_CONFIG.clientId && OAUTH_CONFIG.clientId !== HYBRID_CONFIG.audience) {
          audienceVariants.push(OAUTH_CONFIG.clientId);
        }
        
        for (const jwt of tokensToTry) {
          for (const issuer of issuerVariants) {
            for (const audience of audienceVariants) {
              try {
                const { payload } = await jwtVerify(jwt, jwks, { issuer, audience });
                const extracted = payload[HYBRID_CONFIG.claimKey];
                if (extracted) {
                  tenant = extracted;
                  validated = true;
                  console.log(`✅ JWT validated, ${HYBRID_CONFIG.claimKey}=${tenant}`);
                  break;
                }
              } catch (err) {
                // Expected — trying multiple issuer/audience combinations
              }
            }
            if (validated) break;
          }
          if (validated) break;
        }
        
        if (!validated || !tenant) {
          console.error(`❌ Could not extract '${HYBRID_CONFIG.claimKey}' claim from IdP tokens. Ensure the claim exists and IDP_ISSUER / IDP_AUDIENCE are correct.`);
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            error: 'JWT validation failed',
            message: `Could not extract '${HYBRID_CONFIG.claimKey}' claim from IdP tokens`
          });
        }
      }
      
      const sessionId = generateSessionId();
      
      storeTokens(
        sessionId,
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expires_in,
        tokenData.user_id || 'unknown',
        tenant
      );
      
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
      };
      
      res.cookie('session_id', sessionId, cookieOptions);
      
      console.log(`✅ Token exchange successful (mode: ${AUTH_MODE})`);
      
      res.json({ 
        success: true,
        expiresIn: tokenData.expires_in
      });
    } catch (error) {
      console.error('❌ Error during token exchange:', error.message);
      res.status(500).json({ error: sanitizeError(error) });
    }
  });

  /**
   * Logout endpoint
   * POST /auth/logout
   */
  app.post('/auth/logout', (req, res) => {
    const sessionId = req.cookies.session_id;
    
    if (sessionId) {
      deleteTokens(sessionId);
    }
    
    res.clearCookie('session_id');
    
    console.log('👋 User logged out');
    
    res.json({ success: true });
  });

  /**
   * Check authentication status
   * GET /auth/status
   */
  app.get('/auth/status', (req, res) => {
    const sessionId = req.cookies.session_id;
    
    if (!sessionId) {
      return res.json({ authenticated: false });
    }
    
    const tokens = getTokens(sessionId);
    
    if (!tokens) {
      res.clearCookie('session_id');
      return res.json({ authenticated: false });
    }
    
    if (tokens.expiresAt <= Date.now()) {
      deleteTokens(sessionId);
      res.clearCookie('session_id');
      return res.json({ authenticated: false });
    }
    
    res.json({ 
      authenticated: true,
      userId: tokens.userId,
      expiresAt: tokens.expiresAt
    });
  });
} else {
  // PAT mode: always authenticated
  app.get('/auth/status', (req, res) => {
    res.json({ 
      authenticated: true, 
      mode: 'PAT' 
    });
  });
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Catch-all for undefined routes
 */
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: sanitizeError(err) });
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, () => {
  console.log('\n🚀 Secure Snowflake Proxy Server Started');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏔️  Snowflake Host: ${SNOWFLAKE_CONFIG.host}`);
  console.log(`📊 Database: ${SNOWFLAKE_CONFIG.database}`);
  console.log(`📁 Schema: ${SNOWFLAKE_CONFIG.schema}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  if (AUTH_MODE === 'HYBRID') {
    console.log(`🔑 HYBRID: IdP JWKS: ${HYBRID_CONFIG.jwksUrl}`);
    console.log(`🔑 HYBRID: Session var: ${HYBRID_CONFIG.sessionVarName} (from claim: ${HYBRID_CONFIG.claimKey})`);
  }
  console.log('✨ Chat server integrated at /api/*');
  console.log('Available endpoints:');
  console.log('  GET  /health                          - Health check');
  if (AUTH_MODE === 'OAUTH' || AUTH_MODE === 'HYBRID') {
    console.log('  POST /auth/exchange                   - OAuth token exchange');
    console.log('  POST /auth/logout                     - Logout');
    console.log('  GET  /auth/status                     - Auth status');
  }
  console.log('  GET  /api/agents                      - List all agents');
  console.log('  GET  /api/agents/:agentName           - Get agent details');
  console.log('  POST /api/agents/:agentName/messages  - Send message to agent');
  console.log('  POST /api/threads                     - Create thread');
  console.log('  GET  /api/threads                     - List threads');
  console.log('  GET  /api/threads/:id                 - Get thread history');
  console.log('  POST /api/threads/:id                 - Update thread name');
  console.log('  DELETE /api/threads/:id               - Delete thread');
  console.log('\n✨ Ready to accept requests!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
