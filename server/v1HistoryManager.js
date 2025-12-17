/**
 * v1 Chat History Manager
 * 
 * In-memory storage for conversation history when using API v1.
 * This provides thread-like functionality for v1 which doesn't have native thread support.
 * 
 * Note: History is stored per-session in memory only and is lost on server restart.
 */

// Structure: Map<sessionId, Map<threadId, threadData>>
// threadData: { thread_id, thread_name, origin_application, created_on, updated_on, messages: [] }
const sessionStore = new Map();

// Global counters for IDs (simple incrementing integers)
let nextThreadId = 1;
let nextMessageId = 1;

/**
 * Create a new thread for a session
 * @param {string} sessionId - Session identifier
 * @param {string} [originApplication] - Application name for tracking
 * @returns {number} Generated thread ID (integer)
 */
function createThread(sessionId, originApplication = null) {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, new Map());
  }
  
  const threadId = nextThreadId++;
  const now = Date.now();
  
  sessionStore.get(sessionId).set(threadId, {
    thread_id: threadId,
    thread_name: `Thread ${new Date().toLocaleString()}`,
    origin_application: originApplication,
    created_on: now,
    updated_on: now,
    messages: []
  });
  
  console.log(`[v1History] Created thread ${threadId} for session ${sessionId.substring(0, 8)}`);
  return threadId;
}

/**
 * Get thread data for a session
 * @param {string} sessionId - Session identifier
 * @param {number|string} threadId - Thread identifier (will be converted to number)
 * @returns {Object|null} Thread data or null if not found
 */
function getThread(sessionId, threadId) {
  const threads = sessionStore.get(sessionId);
  if (!threads) return null;
  // Convert string to number if needed
  const numericThreadId = typeof threadId === 'string' ? parseInt(threadId, 10) : threadId;
  return threads.get(numericThreadId) || null;
}

/**
 * List all threads for a session
 * @param {string} sessionId - Session identifier
 * @returns {Array} Array of thread metadata
 */
function listThreads(sessionId) {
  const threads = sessionStore.get(sessionId);
  if (!threads) return [];
  
  return Array.from(threads.values()).map(t => ({
    thread_id: t.thread_id,
    thread_name: t.thread_name,
    origin_application: t.origin_application,
    created_on: t.created_on,
    updated_on: t.updated_on,
    message_count: t.messages.length
  }));
}

/**
 * Add a message to a thread
 * @param {string} sessionId - Session identifier
 * @param {number|string} threadId - Thread identifier
 * @param {string} role - Message role (user/assistant)
 * @param {*} content - Message content
 * @param {number} [parentId] - Parent message ID
 * @returns {number} Generated message ID (integer)
 * @throws {Error} If thread not found
 */
function addMessage(sessionId, threadId, role, content, parentId = 0) {
  const thread = getThread(sessionId, threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }
  
  const messageId = nextMessageId++;
  const now = Date.now();
  
  thread.messages.push({
    message_id: messageId,
    parent_id: parentId,
    role,
    content,
    created_on: now
  });
  
  thread.updated_on = now;
  console.log(`[v1History] Added ${role} message to thread ${threadId}`);
  
  return messageId;
}

/**
 * Update thread name
 * @param {string} sessionId - Session identifier
 * @param {number|string} threadId - Thread identifier
 * @param {string} name - New thread name
 * @throws {Error} If thread not found
 */
function updateThreadName(sessionId, threadId, name) {
  const thread = getThread(sessionId, threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }
  
  thread.thread_name = name;
  thread.updated_on = Date.now();
  console.log(`[v1History] Updated thread ${threadId} name to: ${name}`);
}

/**
 * Delete a thread
 * @param {string} sessionId - Session identifier
 * @param {number|string} threadId - Thread identifier
 * @returns {boolean} True if deleted, false if not found
 */
function deleteThread(sessionId, threadId) {
  const threads = sessionStore.get(sessionId);
  if (!threads) return false;
  
  // Convert string to number if needed
  const numericThreadId = typeof threadId === 'string' ? parseInt(threadId, 10) : threadId;
  const deleted = threads.delete(numericThreadId);
  if (deleted) {
    console.log(`[v1History] Deleted thread ${threadId}`);
  }
  return deleted;
}

/**
 * Generate a new message ID
 * @returns {number} Integer message ID
 */
function generateMessageId() {
  return nextMessageId++;
}

/**
 * Get thread count for a session (for debugging)
 * @param {string} sessionId - Session identifier
 * @returns {number} Number of threads
 */
function getThreadCount(sessionId) {
  const threads = sessionStore.get(sessionId);
  return threads ? threads.size : 0;
}

/**
 * Clear all threads for a session (cleanup)
 * @param {string} sessionId - Session identifier
 * @returns {boolean} True if session existed
 */
function clearSession(sessionId) {
  return sessionStore.delete(sessionId);
}

module.exports = {
  createThread,
  getThread,
  listThreads,
  addMessage,
  updateThreadName,
  deleteThread,
  generateMessageId,
  getThreadCount,
  clearSession
};

