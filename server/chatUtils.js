/**
 * Shared Utilities for Chat Routers
 * 
 * Common helper functions used by both v1 and v2 chat routers.
 * This includes SSE helpers, validation, and agent response builders.
 */

const MAX_AGENT_NAME_LENGTH = 100;

/**
 * Create SSE (Server-Sent Events) writer function
 * @param {Response} res - Express response object
 * @returns {Function} Function to write SSE events
 */
function createSSEWriter(res) {
  return (eventName, dataObj) => {
    if (eventName) res.write(`event: ${eventName}\n`);
    const dataStr = dataObj === '[DONE]' ? dataObj : JSON.stringify(dataObj);
    res.write(`data: ${dataStr}\n\n`);
  };
}

/**
 * Validate agent name to prevent injection attacks
 * @param {string} agentName - Agent name to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateAgentName(agentName) {
  if (!agentName || typeof agentName !== 'string') return false;
  const validPattern = /^[a-zA-Z0-9_\-\.]+$/;
  return validPattern.test(agentName) && agentName.length <= MAX_AGENT_NAME_LENGTH;
}

/**
 * Get session ID from request
 * @param {Request} req - Express request object
 * @returns {string|null} Session ID or null
 */
function getSessionId(req) {
  return req.sessionId || req.cookies?.session_id || null;
}

/**
 * Build fake agent response for fixed/inline mode
 * @param {Object} config - Configuration object
 * @returns {Object} Agent response object
 */
function buildFakeAgentResponse(config) {
  const agentName = config.FIXED_AGENT_NAME;
  return {
    name: agentName,
    model: config.agentSpec?.model || 'claude-4-sonnet',
    created_on: Date.now(),
    updated_on: Date.now(),
    description: config.agentSpec?.description || 'Cortex Agent'
  };
}

/**
 * Build fake agent list for fixed/inline mode
 * @param {Object} config - Configuration object
 * @returns {Array} Array with single agent
 */
function buildFakeAgentList(config) {
  return [buildFakeAgentResponse(config)];
}

/**
 * Check if agent is allowed (when fixed agent mode enabled)
 * @param {string} agentName - Agent name to check
 * @param {Object} config - Configuration object
 * @returns {boolean} True if allowed, false otherwise
 */
function isAgentAllowed(agentName, config) {
  if (!config.FIXED_AGENT_NAME) return true;
  return agentName === config.FIXED_AGENT_NAME;
}

/**
 * Merge inline spec with payload
 * Used by both v1 and v2 routers when AGENT_SPEC_FILE is set
 * @param {Object} agentSpec - Agent specification from file
 * @param {Object} payload - Request payload
 * @returns {Object} Merged object
 */
function mergeInlineSpec(agentSpec, payload) {
  return { ...agentSpec, ...payload };
}

module.exports = {
  createSSEWriter,
  validateAgentName,
  getSessionId,
  buildFakeAgentResponse,
  buildFakeAgentList,
  isAgentAllowed,
  mergeInlineSpec
};

