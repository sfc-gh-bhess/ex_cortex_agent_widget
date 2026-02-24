/**
 * Environment configuration with validation and type safety
 * All sensitive data should be provided via environment variables
 * 
 * SECURITY NOTE: The frontend now communicates with a secure backend proxy
 * instead of directly calling Snowflake APIs. This keeps the PAT token secure
 * on the server side and prevents exposure in browser developer tools.
 */

export interface OAuthConfig {
  loginUrl: string;
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope?: string;
  audience?: string;
  prompt?: string;
}

export interface SnowflakeConfig {
  backendUrl: string;
  applicationName: string;
  authMode: 'PAT' | 'OAUTH';
  oauth?: OAuthConfig;
  // Legacy fields kept for backward compatibility (not used for API calls)
  account: string;
  host: string;
  warehouse: string;
  demoUser: string;
  demoUserRole: string;
  agentEndpoint: string;
  database: string;
  schema: string;
}

/**
 * Validates that all required environment variables are present
 */
const validateEnvironment = (): SnowflakeConfig => {
  // Backend URL is always required
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  
  if (!backendUrl) {
    throw new Error(
      'Missing required environment variable: REACT_APP_BACKEND_URL\n' +
      'Please set this to your backend proxy server URL (e.g., http://localhost:3001)\n' +
      'See the README for setup instructions.'
    );
  }
  
  // Auth mode validation
  const authMode = (process.env.REACT_APP_AUTH_MODE || 'OAUTH') as 'PAT' | 'OAUTH';
  
  if (authMode !== 'PAT' && authMode !== 'OAUTH') {
    throw new Error(
      'Invalid REACT_APP_AUTH_MODE. Must be "PAT" or "OAUTH".\n' +
      'See the README for setup instructions.'
    );
  }
  
  // OAuth configuration (required for OAUTH mode)
  let oauth: OAuthConfig | undefined;
  if (authMode === 'OAUTH') {
    const loginUrl = process.env.REACT_APP_OAUTH_LOGIN_URL;
    const clientId = process.env.REACT_APP_OAUTH_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_OAUTH_REDIRECT_URI;

    const missing: string[] = [];
    if (!loginUrl) missing.push('REACT_APP_OAUTH_LOGIN_URL');
    if (!clientId) missing.push('REACT_APP_OAUTH_CLIENT_ID');
    if (!redirectUri) missing.push('REACT_APP_OAUTH_REDIRECT_URI');

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variable(s) for OAUTH mode: ${missing.join(', ')}\n` +
        'See the README for setup instructions.'
      );
    }

    oauth = {
      loginUrl: loginUrl!,
      clientId: clientId!,
      redirectUri: redirectUri!,
      responseType: process.env.REACT_APP_OAUTH_RESPONSE_TYPE || 'code',
      scope: process.env.REACT_APP_OAUTH_SCOPE || undefined,
      audience: process.env.REACT_APP_OAUTH_AUDIENCE || undefined,
      prompt: process.env.REACT_APP_OAUTH_PROMPT || undefined,
    };
  }

  const applicationName = process.env.REACT_APP_APPLICATION_NAME || 'ask_cortex';

  // Legacy variables (optional, kept for backward compatibility)
  const legacyVars = {
    account: process.env.REACT_APP_ACCOUNT || 'not-set',
    host: process.env.REACT_APP_HOST || 'not-set',
    warehouse: process.env.REACT_APP_WAREHOUSE || 'not-set',
    demoUser: process.env.REACT_APP_DEMO_USER || 'not-set',
    demoUserRole: process.env.REACT_APP_DEMO_USER_ROLE || 'not-set',
    agentEndpoint: process.env.REACT_APP_AGENT_ENDPOINT || 'not-set',
    database: process.env.REACT_APP_DATABASE || 'snowflake_intelligence',
    schema: process.env.REACT_APP_SCHEMA || 'agents',
  };

  return {
    backendUrl,
    applicationName,
    authMode,
    oauth,
    ...legacyVars,
  };
};

/**
 * Validated environment configuration
 * This will throw an error if any required variables are missing
 */
export const config = validateEnvironment();

/**
 * Build the full OAuth authorization URL with a fresh random state parameter.
 * Call this each time you redirect to the IdP so that every login attempt
 * gets a unique, unpredictable state value.
 */
export const buildOAuthLoginUrl = (): string => {
  if (!config.oauth) {
    throw new Error('OAuth is not configured. Set REACT_APP_AUTH_MODE=OAUTH and provide OAuth environment variables.');
  }
  const { loginUrl, clientId, redirectUri, responseType, scope, audience, prompt } = config.oauth;

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
    state,
  });
  if (scope) {
    params.set('scope', scope);
  }
  if (audience) {
    params.set('audience', audience);
  }
  if (prompt) {
    params.set('prompt', prompt);
  }
  return `${loginUrl}?${params.toString()}`;
};

/**
 * Get configuration status for display (without exposing values)
 */
export const getEnvConfigStatus = () => {
  const authMode = process.env.REACT_APP_AUTH_MODE || 'OAUTH';
  const isOAuth = authMode === 'OAUTH';

  const requiredEnvVars = [
    { key: 'REACT_APP_BACKEND_URL', label: 'Backend Proxy URL', set: !!process.env.REACT_APP_BACKEND_URL, required: true },
    { key: 'REACT_APP_AUTH_MODE', label: 'Auth Mode', set: !!process.env.REACT_APP_AUTH_MODE, required: false },
    { key: 'REACT_APP_OAUTH_LOGIN_URL', label: 'OAuth Login URL', set: !!process.env.REACT_APP_OAUTH_LOGIN_URL, required: isOAuth },
    { key: 'REACT_APP_OAUTH_CLIENT_ID', label: 'OAuth Client ID', set: !!process.env.REACT_APP_OAUTH_CLIENT_ID, required: isOAuth },
    { key: 'REACT_APP_OAUTH_REDIRECT_URI', label: 'OAuth Redirect URI', set: !!process.env.REACT_APP_OAUTH_REDIRECT_URI, required: isOAuth },
  ];

  const missingRequired = requiredEnvVars.filter(v => v.required && !v.set);
  const allSet = missingRequired.length === 0;

  return {
    envVars: requiredEnvVars,
    allSet,
    missingCount: missingRequired.length
  };
};

