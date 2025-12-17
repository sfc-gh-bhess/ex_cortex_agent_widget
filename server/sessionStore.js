/**
 * In-memory token store used by the OAuth flow.
 * Separated from server.js for clarity and reusability.
 */
const crypto = require('crypto');

const tokenStore = new Map();

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function storeTokens(sessionId, accessToken, refreshToken, expiresIn, userId = 'unknown', claims = null) {
  const expiresAt = Date.now() + expiresIn * 1000;

  tokenStore.set(sessionId, {
    accessToken,
    refreshToken,
    expiresAt,
    userId,
    claims
  });

  const claimsInfo = claims ? ` (with ${Object.keys(claims).length} claims)` : '';
  console.log(`🔐 Stored tokens for session: ${sessionId.substring(0, 8)}...${claimsInfo} (expires in ${expiresIn}s)`);
}

function getTokens(sessionId) {
  return tokenStore.get(sessionId);
}

function deleteTokens(sessionId) {
  const existed = tokenStore.delete(sessionId);
  if (existed) {
    console.log(`🗑️  Deleted tokens for session: ${sessionId.substring(0, 8)}...`);
  }
  return existed;
}

module.exports = {
  generateSessionId,
  storeTokens,
  getTokens,
  deleteTokens
};

