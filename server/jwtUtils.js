const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

function buildJwksClient(appConfig) {
  if (!appConfig.IDP_JWKS_URL) return null;

  return jwksClient({
    jwksUri: appConfig.IDP_JWKS_URL,
    cache: true,
    cacheMaxAge: 600000,
    rateLimit: true,
    jwksRequestsPerMinute: 10
  });
}

async function extractClaimsFromToken(accessToken, jwksClientInstance, appConfig) {
  if (!accessToken || !jwksClientInstance) return null;

  const decoded = jwt.decode(accessToken, { complete: true });
  if (!decoded?.header?.kid) {
    throw new Error('Token missing kid in header');
  }

  const key = await jwksClientInstance.getSigningKey(decoded.header.kid);
  const signingKey = key.getPublicKey();

  const verifyOptions = { algorithms: ['RS256'] };
  if (appConfig.IDP_ISSUER) verifyOptions.issuer = appConfig.IDP_ISSUER;
  if (appConfig.IDP_AUDIENCE) verifyOptions.audience = appConfig.IDP_AUDIENCE;

  return jwt.verify(accessToken, signingKey, verifyOptions);
}

module.exports = {
  buildJwksClient,
  extractClaimsFromToken
};

