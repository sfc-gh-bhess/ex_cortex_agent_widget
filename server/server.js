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
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { loadConfig } = require('./config');
const { createChatRouter } = require('./chatServer');
const { createV1ChatRouter } = require('./chatServerV1');

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

// Authentication mode: 'PAT' or 'OAUTH'
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
  } else {
    console.error('❌ Invalid AUTH_MODE. Must be "PAT" or "OAUTH"');
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

// Load unified configuration (includes API version, fixed agent, inline spec, etc.)
let appConfig;
try {
  appConfig = loadConfig();
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

// Additional validation for hybrid mode
if (AUTH_MODE === 'OAUTH' && appConfig.SESSION_VAR_NAME && !process.env.SNOWFLAKE_PAT) {
  console.error('❌ Hybrid mode error: SNOWFLAKE_PAT is required when SESSION_VAR_NAME is set with AUTH_MODE=OAUTH');
  process.exit(1);
}

// Log mode detection
if (AUTH_MODE === 'OAUTH' && appConfig.SESSION_VAR_NAME && process.env.SNOWFLAKE_PAT) {
  console.log('🔀 Hybrid PAT-OAUTH mode detected: OAuth for user auth, PAT for Snowflake, claims for session variables');
}

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

// ============================================================================
// JWT Validation Setup (for OAuth claims extraction)
// ============================================================================

let jwksClientInstance = null;

// Setup JWKS client if OAuth mode and JWKS URL configured
if (AUTH_MODE === 'OAUTH' && appConfig.IDP_JWKS_URL) {
  jwksClientInstance = jwksClient({
    jwksUri: appConfig.IDP_JWKS_URL,
    cache: true,
    cacheMaxAge: 600000, // 10 minutes
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });
  console.log('✅ JWKS client configured for JWT validation');
}

/**
 * Extract and validate claims from access token
 * @param {string} accessToken - Access token to validate
 * @returns {Promise<Object|null>} Claims object or null
 */
async function extractClaimsFromToken(accessToken) {
  if (!accessToken || !jwksClientInstance) return null;
  
  try {
    // Decode token to get header
    const decoded = jwt.decode(accessToken, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      console.warn('⚠️  Token missing kid in header');
      return null;
    }
    
    // Get signing key from JWKS
    const key = await jwksClientInstance.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();
    
    // Verify and decode with validation
    const verifyOptions = {
      algorithms: ['RS256']
    };
    
    // Add issuer validation if configured
    if (appConfig.IDP_ISSUER) {
      verifyOptions.issuer = appConfig.IDP_ISSUER;
    }
    
    // Add audience validation if configured
    if (appConfig.IDP_AUDIENCE) {
      verifyOptions.audience = appConfig.IDP_AUDIENCE;
    }
    
    const claims = jwt.verify(accessToken, signingKey, verifyOptions);
    console.log('✅ JWT validated and claims extracted');
    return claims;
  } catch (error) {
    console.error('❌ JWT validation failed:', error.message);
    // If claims extraction is configured (JWKS URL set), require valid JWT
    if (appConfig.IDP_JWKS_URL) {
      throw new Error(`Invalid or expired JWT token: ${error.message}`);
    }
    return null;
  }
}

// ============================================================================
// Token Store and Session Management
// ============================================================================

/**
 * In-memory token store
 * Maps session ID to user token data
 * Structure: { sessionId: { accessToken, refreshToken, expiresAt, userId, claims } }
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
 */
const storeTokens = (sessionId, accessToken, refreshToken, expiresIn, userId = 'unknown', claims = null) => {
  // Calculate expiry time (current time + expires_in seconds)
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  tokenStore.set(sessionId, {
    accessToken,
    refreshToken,
    expiresAt,
    userId,
    claims  // Store OAuth claims server-side
  });
  
  const claimsInfo = claims ? ` (with ${Object.keys(claims).length} claims)` : '';
  console.log(`🔐 Stored tokens for session: ${sessionId.substring(0, 8)}...${claimsInfo} (expires in ${expiresIn}s)`);
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
    // PAT mode: No session required, will use PAT from env
    req.authMode = 'PAT';
    return next();
  }
  
  // OAUTH mode: Require valid session
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
  req.authMode = 'OAUTH';
  next();
};

/**
 * Middleware to refresh access token if needed (within 5 minutes of expiry)
 * Only applies in OAUTH mode
 */
const refreshTokenIfNeeded = async (req, res, next) => {
  // Skip in PAT mode
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
      // Call OAuth token endpoint with refresh_token grant
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
        // Clear the session and return 401
        deleteTokens(sessionId);
        res.clearCookie('session_id');
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
          error: 'Token refresh failed',
          code: 'REFRESH_FAILED'
        });
      }
      
      const data = await response.json();
      
      // Extract claims from new access token
      let newClaims = null;
      if (jwksClientInstance) {
        try {
          newClaims = await extractClaimsFromToken(data.access_token);
        } catch (error) {
          console.warn('⚠️  Failed to extract claims from refreshed token:', error.message);
          // Continue with refresh but without claims
        }
      }
      
      // Update stored tokens with new access token and claims
      storeTokens(
        sessionId,
        data.access_token,
        data.refresh_token || tokens.refreshToken, // Some providers don't return a new refresh token
        data.expires_in,
        tokens.userId,
        newClaims  // Store refreshed claims
      );
      
      // Update req.tokens so the current request uses the new token
      req.tokens = getTokens(sessionId);
      
      console.log('✅ Access token refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing token:', error.message);
      // Don't block the request, let it proceed with the old token
      // If the old token is expired, Snowflake will return 401
    }
  }
  
  next();
};

// ============================================================================
// Integrate Chat Server Module
// ============================================================================

/**
 * Helper to get authentication token for a request
 */
function getAuthTokenForRequest(req) {
  // PAT mode: Use PAT from environment
  if (req.authMode === 'PAT') {
    return process.env.SNOWFLAKE_PAT;
  }
  
  // Hybrid mode: OAuth for user auth, but PAT for Snowflake API
  // Detected by: AUTH_MODE=OAUTH + SESSION_VAR_NAME is set
  if (appConfig.SESSION_VAR_NAME && process.env.SNOWFLAKE_PAT) {
    return process.env.SNOWFLAKE_PAT;
  }
  
  // Standard OAUTH mode: Use session-based access token
  return req.tokens?.accessToken;
}

/**
 * Helper to get OAuth claims for a request
 */
function getClaimsForRequest(req) {
  if (req.authMode === 'PAT') return null;
  return req.tokens?.claims || null;
}

/**
 * Create and mount the appropriate chat router based on API version
 */
let chatRouter;

if (appConfig.AGENT_API_VERSION === 'v1') {
  console.log('🔧 Creating v1 chat router...');
  chatRouter = createV1ChatRouter({
    ...appConfig,
    snowflakeHost: SNOWFLAKE_CONFIG.host,
    getAuthToken: getAuthTokenForRequest,
    getClaimsForRequest: getClaimsForRequest
  });
  console.log('✅ v1 chat router created');
} else {
  console.log('🔧 Creating v2 chat router...');
  chatRouter = createChatRouter({
    ...appConfig,
    snowflakeHost: SNOWFLAKE_CONFIG.host,
    snowflakeDatabase: SNOWFLAKE_CONFIG.database,
    snowflakeSchema: SNOWFLAKE_CONFIG.schema,
    getAuthToken: getAuthTokenForRequest,
    onError: (error) => {
      console.error('Chat server error:', error.message);
    }
  });
  console.log('✅ v2 chat router created');
}

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

if (AUTH_MODE === 'OAUTH') {
  /**
   * OAuth token exchange endpoint
   * POST /auth/exchange
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
    
    // Exchange authorization code for access token
    // Use redirect URI from environment (must match what was used in the authorization request)
    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        client_id: OAUTH_CONFIG.clientId,
        client_secret: OAUTH_CONFIG.clientSecret,
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
    
    // Extract claims from access token (if JWT validation configured)
    let claims = null;
    if (jwksClientInstance) {
      try {
        claims = await extractClaimsFromToken(tokenData.access_token);
      } catch (error) {
        console.error('❌ Claims extraction failed:', error.message);
        return res.status(401).json({ error: error.message });
      }
    }
    
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Store tokens AND claims in memory
    storeTokens(
      sessionId,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_in,
      tokenData.user_id || 'unknown',
      claims  // Store claims server-side
    );
    
    // Set secure httpOnly cookie
    // For localhost development with different ports (3000 frontend, 3001 backend),
    // we need to set the domain explicitly to 'localhost' (without port)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
      // Set domain to 'localhost' in development to share across ports
      domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
    };
    
    res.cookie('session_id', sessionId, cookieOptions);
    
    console.log('✅ OAuth token exchange successful');
    
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
    
    // Check if token is expired
    if (tokens.expiresAt <= Date.now()) {
      deleteTokens(sessionId);
      res.clearCookie('session_id');
      return res.json({ authenticated: false });
    }
    
    res.json({ 
      authenticated: true,
      mode: 'OAUTH',
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
  console.log('✨ Chat server integrated at /api/*');
  console.log('Available endpoints:');
  console.log('  GET  /health                          - Health check');
  if (AUTH_MODE === 'OAUTH') {
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
