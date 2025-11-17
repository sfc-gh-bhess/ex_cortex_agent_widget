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
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
require('dotenv').config();
const { HTTP_STATUS, ERROR_MESSAGES, CONFIG } = require('./constants');

const app = express();
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
 */
const storeTokens = (sessionId, accessToken, refreshToken, expiresIn, userId = 'unknown') => {
  // Calculate expiry time (current time + expires_in seconds)
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  tokenStore.set(sessionId, {
    accessToken,
    refreshToken,
    expiresAt,
    userId
  });
  
  console.log(`🔐 Stored tokens for session: ${sessionId.substring(0, 8)}... (expires in ${expiresIn}s)`);
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
  methods: ['GET', 'POST', 'OPTIONS'],
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
 * Get authentication headers for Snowflake API
 * Adapts based on AUTH_MODE
 */
const getSnowflakeAuthHeaders = (req) => {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (req.authMode === 'PAT') {
    // PAT mode: Use PAT from environment
    return {
      ...baseHeaders,
      'Authorization': `Bearer ${process.env.SNOWFLAKE_PAT}`
    };
  }
  
  // OAUTH mode: Use session-based access token
  const tokens = req.tokens;
  if (!tokens) {
    throw new Error('No valid session found');
  }
  
  return {
    ...baseHeaders,
    'Authorization': `Bearer ${tokens.accessToken}`
  };
};

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

/**
 * Validate agent name to prevent injection attacks
 */
const validateAgentName = (agentName) => {
  if (!agentName || typeof agentName !== 'string') {
    return false;
  }
  
  // Allow alphanumeric, underscore, hyphen, and dot
  const validPattern = /^[a-zA-Z0-9_\-\.]+$/;
  return validPattern.test(agentName) && agentName.length <= CONFIG.MAX_AGENT_NAME_LENGTH;
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
      
      // Update stored tokens with new access token
      storeTokens(
        sessionId,
        data.access_token,
        data.refresh_token || tokens.refreshToken, // Some providers don't return a new refresh token
        data.expires_in,
        tokens.userId
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
// API Routes
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
    
    // Generate session ID
    const sessionId = generateSessionId();
    
    // Store tokens in memory
    storeTokens(
      sessionId,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_in,
      tokenData.user_id || 'unknown'
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
// Cortex Agent API Endpoints
// ============================================================================

/**
 * List all Cortex Agents
 * GET /api/agents
 */
app.get('/api/agents', authenticate, refreshTokenIfNeeded, async (req, res) => {
  try {
    const endpoint = `https://${SNOWFLAKE_CONFIG.host}/api/v2/databases/${SNOWFLAKE_CONFIG.database}/schemas/${SNOWFLAKE_CONFIG.schema}/agents`;
    
    console.log('📡 Fetching agents list from Snowflake...');
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getSnowflakeAuthHeaders(req),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // Handle OAuth token rejection
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        const errorParts = [
          ERROR_MESSAGES.ERROR_PREFIX,
          `${ERROR_MESSAGES.HTTP_ERROR_STATUS} ${response.status} ${response.statusText}`,
          '💡 Tip: OAuth token was rejected. Verify your Identity Provider is configured for Snowflake API access.'
        ];
        console.error('❌ Snowflake API error:', response.status);
        return res.status(response.status).json({ errorParts });
      }
      
      // Build error message as array of parts (preserves structure better than string with \n\n)
      const errorParts = [
        ERROR_MESSAGES.ERROR_PREFIX,
        `${ERROR_MESSAGES.HTTP_ERROR_STATUS} ${response.status} ${response.statusText}`
      ];
      
      // For 400/401, skip error details (they're not helpful)
      // For 404 and others, include Snowflake's error details
      if (response.status !== HTTP_STATUS.BAD_REQUEST && response.status !== HTTP_STATUS.UNAUTHORIZED) {
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            const details = errorData.error || errorData.message || JSON.stringify(errorData, null, 2);
            errorParts.push(details);
          } catch {
            // JSON parsing failed, use default message
          }
        }
      }
      
      // Add helpful configuration hints based on status code
      if (response.status === HTTP_STATUS.BAD_REQUEST) {
        errorParts.push(ERROR_MESSAGES.TIPS.BAD_REQUEST);
      } else if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        errorParts.push(ERROR_MESSAGES.TIPS.UNAUTHORIZED);
      } else if (response.status === HTTP_STATUS.NOT_FOUND) {
        errorParts.push(ERROR_MESSAGES.TIPS.NOT_FOUND);
      }
      
      console.error('❌ Snowflake API error:', response.status, errorParts.join('\n'));
      
      return res.status(response.status).json({
        errorParts  // Send as array instead of single string
      });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched ${Array.isArray(data) ? data.length : 'unknown'} agents`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching agents:', error.message);
    
    // Check if this is a network error (DNS, connection failed, etc.)
    if (error.cause?.code === 'ENOTFOUND' || error.message.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED') {
      const errorParts = [
        ERROR_MESSAGES.ERROR_PREFIX,
        `${ERROR_MESSAGES.HTTP_ERROR_STATUS} ${HTTP_STATUS.SERVICE_UNAVAILABLE} Service Unavailable`,
        ERROR_MESSAGES.TIPS.SERVICE_UNAVAILABLE
      ];
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({ errorParts });
    }
    
    res.status(500).json({ error: sanitizeError(error) });
  }
});

/**
 * Get details for a specific Cortex Agent
 * GET /api/agents/:agentName
 */
app.get('/api/agents/:agentName', authenticate, refreshTokenIfNeeded, async (req, res) => {
  try {
    const { agentName } = req.params;
    
    // Validate agent name to prevent injection
    if (!validateAgentName(agentName)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERROR_MESSAGES.TIPS.INVALID_AGENT_NAME
      });
    }
    
    const endpoint = `https://${SNOWFLAKE_CONFIG.host}/api/v2/databases/${SNOWFLAKE_CONFIG.database}/schemas/${SNOWFLAKE_CONFIG.schema}/agents/${agentName}`;
    
    console.log(`📡 Fetching details for agent: ${agentName}...`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getSnowflakeAuthHeaders(req),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // Build error message as array of parts (preserves structure better than string with \n\n)
      const errorParts = [
        ERROR_MESSAGES.ERROR_PREFIX,
        `${ERROR_MESSAGES.HTTP_ERROR_STATUS} ${response.status} ${response.statusText}`
      ];
      
      // For 400/401, skip error details (they're not helpful)
      // For 404 and others, include Snowflake's error details
      if (response.status !== HTTP_STATUS.BAD_REQUEST && response.status !== HTTP_STATUS.UNAUTHORIZED) {
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            const details = errorData.error || errorData.message || JSON.stringify(errorData, null, 2);
            errorParts.push(details);
          } catch {
            // JSON parsing failed, use default message
          }
        }
      }
      
      // Add helpful configuration hints based on status code
      if (response.status === HTTP_STATUS.BAD_REQUEST) {
        errorParts.push(ERROR_MESSAGES.TIPS.BAD_REQUEST);
      } else if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        errorParts.push(ERROR_MESSAGES.TIPS.UNAUTHORIZED);
      } else if (response.status === HTTP_STATUS.NOT_FOUND) {
        errorParts.push(ERROR_MESSAGES.TIPS.NOT_FOUND_AGENT(agentName));
      }
      
      console.error('❌ Snowflake API error:', response.status, errorParts.join('\n'));
      
      return res.status(response.status).json({
        errorParts  // Send as array instead of single string
      });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched details for agent: ${agentName}`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching agent details:', error.message);
    
    // Check if this is a network error (DNS, connection failed, etc.)
    if (error.cause?.code === 'ENOTFOUND' || error.message.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED') {
      const errorParts = [
        ERROR_MESSAGES.ERROR_PREFIX,
        `${ERROR_MESSAGES.HTTP_ERROR_STATUS} ${HTTP_STATUS.SERVICE_UNAVAILABLE} Service Unavailable`,
        ERROR_MESSAGES.TIPS.SERVICE_UNAVAILABLE
      ];
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({ errorParts });
    }
    
    res.status(500).json({ error: sanitizeError(error) });
  }
});

/**
 * Create a new thread for conversation tracking
 * POST /api/threads
 */
app.post('/api/threads', authenticate, refreshTokenIfNeeded, async (req, res) => {
  try {
    const { origin_application } = req.body;
    
    // Validate origin_application if provided
    if (origin_application && typeof origin_application !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: 'origin_application must be a string' 
      });
    }
    
    // Build Snowflake API URL for thread creation
    const snowflakeUrl = `https://${SNOWFLAKE_CONFIG.host}/api/v2/cortex/threads`;
    
    // Get auth headers (handles both PAT and OAUTH modes)
    const headers = getSnowflakeAuthHeaders(req);
    
    // Prepare request body
    const requestBody = origin_application ? { origin_application } : {};
    
    console.log(`Creating thread for application: ${origin_application || 'default'}`);
    
    // Call Snowflake Threads API
    const response = await fetch(snowflakeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Snowflake thread creation error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Failed to create thread: ${response.statusText}`,
        details: errorText
      });
    }
    
    // Return the raw response from Snowflake as-is
    const threadData = await response.json();
    console.log(`Thread created: ${threadData.thread_id}`);
    
    // Return the entire thread object from Snowflake
    res.json(threadData);

    const resp2 = await fetch(`${snowflakeUrl}/${threadData.thread_id}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({"thread_name": `New Thread ${new Date().toISOString()}`})
    });

  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
      error: ERROR_MESSAGES.TIPS.UNEXPECTED_ERROR,
      details: error.message 
    });
  }
});

/**
 * Send message to Cortex Agent (streaming endpoint)
 * POST /api/agents/:agentName/messages
 */
app.post('/api/agents/:agentName/messages', authenticate, refreshTokenIfNeeded, async (req, res) => {
  try {
    const { agentName } = req.params;
    const requestBody = req.body;
    
    // Validate inputs
    if (!validateAgentName(agentName)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.TIPS.INVALID_AGENT_NAME });
    }
    
    // Validate request body has messages
    if (!requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: ERROR_MESSAGES.TIPS.MESSAGES_REQUIRED });
    }
    
    console.log(`💬 Sending message to agent: ${agentName}`);
    
    // Build Snowflake agent messaging endpoint dynamically
    // Format: https://{host}/api/v2/databases/{db}/schemas/{schema}/agents/{agent}:run
    const agentEndpoint = `https://${SNOWFLAKE_CONFIG.host}/api/v2/databases/${SNOWFLAKE_CONFIG.database}/schemas/${SNOWFLAKE_CONFIG.schema}/agents/${agentName}:run`;
    
    console.log('body', JSON.stringify(requestBody));
    // Make request to Snowflake Agent endpoint
    const response = await fetch(agentEndpoint, {
      method: 'POST',
      headers: getSnowflakeAuthHeaders(req),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // Build error message as array of parts (preserves structure better than string with \n\n)
      const errorParts = [
        ERROR_MESSAGES.ERROR_PREFIX,
        `${ERROR_MESSAGES.HTTP_ERROR_STATUS} ${response.status} ${response.statusText}`
      ];
      
      // For 400/401, skip error details (they're not helpful)
      // For 404 and others, include Snowflake's error details
      if (response.status !== HTTP_STATUS.BAD_REQUEST) { // && response.status !== HTTP_STATUS.UNAUTHORIZED) {
        if (contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            const details = errorData.error || errorData.message || JSON.stringify(errorData, null, 2);
            errorParts.push(details);
          } catch {
            // JSON parsing failed, use default message
          }
        }
      }
      
      // Add helpful configuration hints based on status code and content type
      if (response.status === 400) {
        errorParts.push('💡 Tip: Check your SNOWFLAKE_DATABASE and SNOWFLAKE_SCHEMA in the backend .env file. Make sure they exist and you have access to them.');
      } else if (response.status === 401) {
        errorParts.push('💡 Tip: Check your SNOWFLAKE_PAT (Personal Access Token) in the backend .env file. Make sure it\'s valid and not expired.');
      } else if (response.status === 404) {
        errorParts.push('💡 Tip: Check your SNOWFLAKE_HOST in the backend .env file. Make sure it\'s correct and accessible.');
      }
      
      console.error('❌ Snowflake Agent API error:', response.status, errorParts.join('\n'));
      
      return res.status(response.status).json({
        errorParts  // Send as array instead of single string
      });
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('text/event-stream') || contentType?.includes('stream')) {
      // Set headers for SSE streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx
      
      console.log('📡 Streaming response from agent...');
      
      // Use Node.js streams to pipe the response
      const reader = response.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              res.end();
              console.log('✅ Streaming complete');
              break;
            }
            
            // Write chunk to response
            if (!res.write(value)) {
              // Backpressure - wait for drain
              await new Promise(resolve => res.once('drain', resolve));
            }
          }
        } catch (error) {
          console.error('❌ Stream error:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Streaming failed' });
          } else {
            res.end();
          }
        }
      };
      
      // Handle client disconnect
      req.on('close', () => {
        console.log('⚠️  Client disconnected');
        reader.cancel();
      });
      
      pump();
    } else {
      // Non-streaming response
      const data = await response.json();
      console.log('✅ Received non-streaming response from agent');
      res.json(data);
    }
  } catch (error) {
    console.error('❌ Error sending message to agent:', error.message);
    
    if (!res.headersSent) {
      // Check if this is a network error (DNS, connection failed, etc.)
      if (error.cause?.code === 'ENOTFOUND' || error.message.includes('fetch failed') || error.cause?.code === 'ECONNREFUSED') {
        const errorParts = [
          ERROR_MESSAGES.ERROR_PREFIX,
          'Failed to connect to Snowflake',
          '💡 Tip: Check your SNOWFLAKE_HOST in the backend .env file. Make sure it\'s correct and accessible (format: account.snowflakecomputing.com)'
        ];
        return res.status(503).json({ errorParts });
      }
      
      res.status(500).json({ error: sanitizeError(error) });
    }
  }
});

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
  console.log('Available endpoints:');
  console.log('  GET  /health                          - Health check');
  console.log('  GET  /api/agents                      - List all agents');
  console.log('  GET  /api/agents/:agentName           - Get agent details');
  console.log('  POST /api/agents/:agentName/messages  - Send message to agent');
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

