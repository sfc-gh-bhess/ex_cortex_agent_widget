/**
 * Cortex Chat Server Router
 * 
 * A drop-in Express router that provides all backend endpoints needed for
 * the Cortex ChatInterface React component.
 * 
 * QUICK START:
 * ------------
 * const { createChatRouter } = require('./chatServer');
 * 
 * const chatRouter = createChatRouter({
 *   snowflakeHost: process.env.SNOWFLAKE_HOST,
 *   snowflakeDatabase: process.env.SNOWFLAKE_DATABASE,
 *   snowflakeSchema: process.env.SNOWFLAKE_SCHEMA,
 *   getAuthToken: (req) => {
 *     // Return the Snowflake access token for this request
 *     // PAT example: return process.env.SNOWFLAKE_PAT
 *     // OAuth example: return req.tokens?.accessToken
 *     // Custom: return req.user?.snowflakeToken
 *   }
 * });
 * 
 * app.use('/api', chatRouter);
 * 
 * REQUIRED ENDPOINTS FOR ChatInterface:
 * -------------------------------------
 * GET  /agents                      - List all agents
 * GET  /agents/:agentName           - Get agent details
 * POST /agents/:agentName/messages  - Send message (streaming)
 * POST /threads                     - Create new thread
 * GET  /threads                     - List all threads
 * GET  /threads/:threadId           - Get thread history
 * POST /threads/:threadId           - Update thread name
 * DELETE /threads/:threadId         - Delete thread
 * 
 * ENVIRONMENT VARIABLES:
 * ---------------------
 * SNOWFLAKE_HOST      - Your Snowflake account hostname
 * SNOWFLAKE_DATABASE  - Database containing your agents
 * SNOWFLAKE_SCHEMA    - Schema containing your agents
 * 
 * AUTHENTICATION:
 * --------------
 * This router does NOT handle authentication. You must provide the
 * getAuthToken function that returns a valid Snowflake access token.
 * 
 * You can protect routes using your own middleware:
 * app.use('/api', yourAuthMiddleware, chatRouter);
 */

const express = require('express');

// Constants
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

const MAX_AGENT_NAME_LENGTH = 100;

/**
 * Create a configured chat router
 * @param {Object} config - Configuration object
 * @param {string} config.snowflakeHost - Snowflake hostname
 * @param {string} config.snowflakeDatabase - Database name
 * @param {string} config.snowflakeSchema - Schema name
 * @param {Function} config.getAuthToken - Function to get auth token from request
 * @param {Function} [config.getSessionVariables] - Optional function returning session variables to inject into agent requests
 * @param {Function} [config.onError] - Optional error handler callback
 * @returns {express.Router} Configured Express router
 */
function createChatRouter(config) {
  const router = express.Router();
  
  // Validate configuration
  if (!config.snowflakeHost || !config.snowflakeDatabase || !config.snowflakeSchema) {
    throw new Error('chatServer: Missing required Snowflake configuration (host, database, schema)');
  }
  
  if (typeof config.getAuthToken !== 'function') {
    throw new Error('chatServer: getAuthToken must be a function');
  }
  
  const { snowflakeHost, snowflakeDatabase, snowflakeSchema, getAuthToken, getSessionVariables, onError } = config;
  
  // =========================================================================
  // Helper Functions
  // =========================================================================
  
  /**
   * Get Snowflake authentication headers for API requests
   */
  const getSnowflakeAuthHeaders = (req) => {
    const token = getAuthToken(req);
    if (!token) {
      throw new Error('No authentication token provided');
    }
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };
  
  /**
   * Validate agent name to prevent injection attacks
   */
  const validateAgentName = (agentName) => {
    if (!agentName || typeof agentName !== 'string') return false;
    const validPattern = /^[a-zA-Z0-9_\-\.]+$/;
    return validPattern.test(agentName) && agentName.length <= MAX_AGENT_NAME_LENGTH;
  };
  
  /**
   * Handle errors consistently
   */
  const handleError = (res, error, defaultStatus = HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error);
      } catch (e) {
        console.error('Error in custom error handler:', e);
      }
    }
    
    console.error('Chat router error:', error.message);
    
    // Don't send response if headers already sent
    if (!res.headersSent) {
      res.status(defaultStatus).json({
        error: error.message || 'An error occurred'
      });
    }
  };
  
  // =========================================================================
  // AGENT ROUTES
  // =========================================================================
  
  /**
   * GET /agents - List all Cortex Agents
   */
  router.get('/agents', async (req, res) => {
    try {
      const endpoint = `https://${snowflakeHost}/api/v2/databases/${snowflakeDatabase}/schemas/${snowflakeSchema}/agents`;
      
      console.log('📡 Fetching agents list from Snowflake...');
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getSnowflakeAuthHeaders(req)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Snowflake API error:', response.status, errorText);
        return res.status(response.status).json({
          error: `Snowflake API error: ${response.statusText}`,
          details: errorText
        });
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched ${Array.isArray(data) ? data.length : 'unknown'} agents`);
      
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  /**
   * GET /agents/:agentName - Get agent details
   */
  router.get('/agents/:agentName', async (req, res) => {
    try {
      const { agentName } = req.params;
      
      if (!validateAgentName(agentName)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid agent name'
        });
      }
      
      const endpoint = `https://${snowflakeHost}/api/v2/databases/${snowflakeDatabase}/schemas/${snowflakeSchema}/agents/${agentName}`;
      
      console.log(`📡 Fetching details for agent: ${agentName}...`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getSnowflakeAuthHeaders(req)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Snowflake API error:', response.status, errorText);
        return res.status(response.status).json({
          error: `Snowflake API error: ${response.statusText}`,
          details: errorText
        });
      }
      
      const data = await response.json();
      console.log(`✅ Successfully fetched details for agent: ${agentName}`);
      
      res.json(data);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  /**
   * POST /agents/:agentName/messages - Send message to agent (streaming)
   */
  router.post('/agents/:agentName/messages', async (req, res) => {
    try {
      const { agentName } = req.params;
      let requestBody = req.body;
      
      if (!validateAgentName(agentName)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid agent name'
        });
      }
      
      if (!requestBody.messages || !Array.isArray(requestBody.messages) || requestBody.messages.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Request body must include messages array with at least one message'
        });
      }
      
      if (typeof getSessionVariables === 'function') {
        const variables = getSessionVariables(req);
        if (variables && Object.keys(variables).length > 0) {
          requestBody = {
            ...requestBody,
            variables: { ...(requestBody.variables || {}), ...variables }
          };
        }
      }

      console.log(`💬 Sending message to agent: ${agentName}`);
      
      const endpoint = `https://${snowflakeHost}/api/v2/databases/${snowflakeDatabase}/schemas/${snowflakeSchema}/agents/${agentName}:run`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getSnowflakeAuthHeaders(req),
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Snowflake Agent API error:', response.status, errorText);
        return res.status(response.status).json({
          error: `Snowflake API error: ${response.statusText}`,
          details: errorText
        });
      }
      
      // Handle streaming response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/event-stream') || contentType?.includes('stream')) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx
        
        console.log('📡 Streaming response from agent...');
        
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
              res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Streaming failed' });
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
      handleError(res, error);
    }
  });
  
  // =========================================================================
  // THREAD ROUTES
  // =========================================================================
  
  /**
   * POST /threads - Create new thread
   */
  router.post('/threads', async (req, res) => {
    try {
      const { origin_application } = req.body;
      
      // Validate origin_application if provided
      if (origin_application && typeof origin_application !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'origin_application must be a string'
        });
      }
      
      const endpoint = `https://${snowflakeHost}/api/v2/cortex/threads`;
      const requestBody = origin_application ? { origin_application } : {};
      
      console.log(`Creating thread for application: ${origin_application || 'default'}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getSnowflakeAuthHeaders(req),
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
      
      const threadData = await response.json();
      console.log(`Thread created: ${threadData.thread_id}`);
      
      res.json(threadData);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  /**
   * GET /threads - List all threads
   */
  router.get('/threads', async (req, res) => {
    try {
      const endpoint = `https://${snowflakeHost}/api/v2/cortex/threads`;
      
      console.log('Fetching thread list...');
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getSnowflakeAuthHeaders(req)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Snowflake thread list error:', response.status, errorText);
        return res.status(response.status).json({
          error: `Failed to list threads: ${response.statusText}`,
          details: errorText
        });
      }
      
      const threadsArray = await response.json();
      console.log(`Retrieved ${threadsArray?.length || 0} threads`);
      
      res.json(threadsArray);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  /**
   * GET /threads/:threadId - Get thread history
   */
  router.get('/threads/:threadId', async (req, res) => {
    try {
      const { threadId } = req.params;
      const endpoint = `https://${snowflakeHost}/api/v2/cortex/threads/${threadId}`;
      
      console.log(`Fetching thread history for thread: ${threadId}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: getSnowflakeAuthHeaders(req)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Snowflake thread fetch error:', response.status, errorText);
        return res.status(response.status).json({
          error: `Failed to fetch thread: ${response.statusText}`,
          details: errorText
        });
      }
      
      const threadData = await response.json();
      console.log(`Retrieved thread ${threadId} with ${threadData.messages?.length || 0} messages`);
      
      res.json(threadData);
    } catch (error) {
      handleError(res, error);
    }
  });
  
  /**
   * POST /threads/:threadId - Update thread name
   */
  router.post('/threads/:threadId', async (req, res) => {
    try {
      const { threadId } = req.params;
      const { thread_name } = req.body;
      
      if (!thread_name || typeof thread_name !== 'string') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'thread_name is required and must be a string'
        });
      }
      
      const endpoint = `https://${snowflakeHost}/api/v2/cortex/threads/${threadId}`;
      
      console.log(`Updating thread ${threadId} name to: ${thread_name}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getSnowflakeAuthHeaders(req),
        body: JSON.stringify({ thread_name })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Snowflake thread update error:', response.status, errorText);
        return res.status(response.status).json({
          error: `Failed to update thread: ${response.statusText}`,
          details: errorText
        });
      }
      
      console.log(`Thread ${threadId} updated successfully`);
      res.json({ success: true, thread_id: threadId, thread_name });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  /**
   * DELETE /threads/:threadId - Delete thread
   */
  router.delete('/threads/:threadId', async (req, res) => {
    try {
      const { threadId } = req.params;
      const endpoint = `https://${snowflakeHost}/api/v2/cortex/threads/${threadId}`;
      
      console.log(`Deleting thread: ${threadId}`);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: getSnowflakeAuthHeaders(req)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Snowflake thread delete error:', response.status, errorText);
        return res.status(response.status).json({
          error: `Failed to delete thread: ${response.statusText}`,
          details: errorText
        });
      }
      
      console.log(`Thread ${threadId} deleted successfully`);
      res.json({ success: true, thread_id: threadId });
    } catch (error) {
      handleError(res, error);
    }
  });
  
  return router;
}

module.exports = { createChatRouter };

