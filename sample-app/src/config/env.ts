/**
 * Environment configuration with validation and type safety
 * All sensitive data should be provided via environment variables
 *
 * SECURITY NOTE: The frontend communicates with a secure backend proxy
 * instead of directly calling Snowflake APIs. This keeps the PAT token secure
 * on the server side and prevents exposure in browser developer tools.
 *
 * Vite exposes env vars prefixed with VITE_ via import.meta.env
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

export interface AppConfig {
  backendUrl: string;
  applicationName: string;
  authMode: 'PAT' | 'OAUTH';
  oauth?: OAuthConfig;
}

/**
 * Validates that all required environment variables are present
 */
const validateEnvironment = (): AppConfig => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  if (!backendUrl) {
    throw new Error(
      'Missing required environment variable: VITE_BACKEND_URL\n' +
      'Please set this to your backend proxy server URL (e.g., http://localhost:3001)\n' +
      'See the README for setup instructions.'
    );
  }

  const authMode = (import.meta.env.VITE_AUTH_MODE || 'OAUTH') as 'PAT' | 'OAUTH';

  if (authMode !== 'PAT' && authMode !== 'OAUTH') {
    throw new Error(
      'Invalid VITE_AUTH_MODE. Must be "PAT" or "OAUTH".\n' +
      'See the README for setup instructions.'
    );
  }

  let oauth: OAuthConfig | undefined;
  if (authMode === 'OAUTH') {
    const loginUrl = import.meta.env.VITE_OAUTH_LOGIN_URL;
    const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI;

    const missing: string[] = [];
    if (!loginUrl) missing.push('VITE_OAUTH_LOGIN_URL');
    if (!clientId) missing.push('VITE_OAUTH_CLIENT_ID');
    if (!redirectUri) missing.push('VITE_OAUTH_REDIRECT_URI');

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
      responseType: import.meta.env.VITE_OAUTH_RESPONSE_TYPE || 'code',
      scope: import.meta.env.VITE_OAUTH_SCOPE || undefined,
      audience: import.meta.env.VITE_OAUTH_AUDIENCE || undefined,
      prompt: import.meta.env.VITE_OAUTH_PROMPT || undefined,
    };
  }

  const applicationName = import.meta.env.VITE_APPLICATION_NAME || 'ask_cortex';

  return {
    backendUrl,
    applicationName,
    authMode,
    oauth,
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
    throw new Error('OAuth is not configured. Set VITE_AUTH_MODE=OAUTH and provide OAuth environment variables.');
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
