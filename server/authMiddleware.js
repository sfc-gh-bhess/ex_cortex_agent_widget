const HTTP_STATUS = {
  UNAUTHORIZED: 401
};

const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: 'Not authenticated'
};

/**
 * Builds auth middlewares for PAT and OAuth modes.
 * @param {Object} options
 * @param {'PAT'|'OAUTH'} options.authMode
 * @param {Object} options.tokenStore
 * @param {Function} options.tokenStore.getTokens
 * @param {Function} options.tokenStore.storeTokens
 * @param {Function} options.tokenStore.deleteTokens
 * @param {Object} options.oauthConfig
 * @param {Function} options.claimExtractor
 * @returns {{authenticate: Function, refreshTokenIfNeeded: Function}}
 */
function createAuthMiddleware({ authMode, tokenStore, oauthConfig, claimExtractor }) {
  const { getTokens, storeTokens, deleteTokens } = tokenStore;

  const authenticate = (req, res, next) => {
    if (authMode === 'PAT') {
      req.authMode = 'PAT';
      return next();
    }

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

  const refreshTokenIfNeeded = async (req, res, next) => {
    if (req.authMode === 'PAT') return next();

    const sessionId = req.sessionId;
    const tokens = req.tokens;
    if (!tokens) return next();

    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    if (tokens.expiresAt > fiveMinutesFromNow) {
      return next();
    }

    try {
      const response = await fetch(oauthConfig.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret
        })
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
      let newClaims = null;
      if (claimExtractor) {
        try {
          newClaims = await claimExtractor(data.access_token);
        } catch (error) {
          console.warn('⚠️  Failed to extract claims from refreshed token:', error.message);
        }
      }

      storeTokens(
        sessionId,
        data.access_token,
        data.refresh_token || tokens.refreshToken,
        data.expires_in,
        tokens.userId,
        newClaims
      );

      req.tokens = getTokens(sessionId);
      console.log('✅ Access token refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing token:', error.message);
      // Continue; downstream may return 401 if token expired
    }

    next();
  };

  return { authenticate, refreshTokenIfNeeded };
}

module.exports = { createAuthMiddleware };

