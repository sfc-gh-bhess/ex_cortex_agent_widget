/**
 * Environment configuration with validation and type safety
 * All sensitive data should be provided via environment variables
 * 
 * SECURITY NOTE: The frontend now communicates with a secure backend proxy
 * instead of directly calling Snowflake APIs. This keeps the PAT token secure
 * on the server side and prevents exposure in browser developer tools.
 */

export interface SnowflakeConfig {
  backendUrl: string;  // URL of our secure backend proxy
  applicationName: string;  // Application name for thread tracking
  authMode: 'PAT' | 'OAUTH';  // Authentication mode
  oauthLoginUrl?: string;  // OAuth login URL (required for OAUTH mode)
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
  
  // OAuth login URL is only required for OAUTH mode
  const oauthLoginUrl = process.env.REACT_APP_OAUTH_LOGIN_URL;
  
  if (authMode === 'OAUTH' && !oauthLoginUrl) {
    throw new Error(
      'Missing required environment variable: REACT_APP_OAUTH_LOGIN_URL\n' +
      'This is required when REACT_APP_AUTH_MODE is set to "OAUTH".\n' +
      'Please set this to your OAuth Identity Provider login URL\n' +
      'See the README for setup instructions.'
    );
  }

  // Application name for thread tracking (optional, defaults to 'dash_desai')
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
    oauthLoginUrl,
    ...legacyVars,
  };
};

/**
 * Validated environment configuration
 * This will throw an error if any required variables are missing
 */
export const config = validateEnvironment();

/**
 * Get configuration status for display (without exposing values)
 */
export const getEnvConfigStatus = () => {
  const authMode = process.env.REACT_APP_AUTH_MODE || 'OAUTH';
  
  const requiredEnvVars = [
    { key: 'REACT_APP_BACKEND_URL', label: 'Backend Proxy URL', set: !!process.env.REACT_APP_BACKEND_URL, required: true },
    { key: 'REACT_APP_AUTH_MODE', label: 'Auth Mode', set: !!process.env.REACT_APP_AUTH_MODE, required: false },
    { key: 'REACT_APP_OAUTH_LOGIN_URL', label: 'OAuth Login URL', set: !!process.env.REACT_APP_OAUTH_LOGIN_URL, required: authMode === 'OAUTH' },
  ];

  const missingRequired = requiredEnvVars.filter(v => v.required && !v.set);
  const allSet = missingRequired.length === 0;

  return {
    envVars: requiredEnvVars,
    allSet,
    missingCount: missingRequired.length
  };
};

