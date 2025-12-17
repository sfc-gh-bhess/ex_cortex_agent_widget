/**
 * Quick configuration check for newcomers.
 * Loads environment variables, runs validation, and prints the detected mode.
 */
require('dotenv').config();

const { loadConfig } = require('./config');

function main() {
  try {
    const config = loadConfig();
    const authMode = process.env.AUTH_MODE || 'OAUTH';

    console.log('✅ Configuration validated successfully\n');
    console.log(`Mode: ${config.mode.label}`);
    console.log(`API Version: ${config.AGENT_API_VERSION}`);
    console.log(`Auth Mode: ${authMode}`);
    console.log(`Snowflake: ${config.SNOWFLAKE_HOST} / ${config.SNOWFLAKE_DATABASE}.${config.SNOWFLAKE_SCHEMA}`);
    if (config.AGENT_SPEC_FILE) {
      console.log(`Inline Spec: ${config.AGENT_SPEC_FILE}`);
    }
    if (config.SNOWFLAKE_WAREHOUSE) {
      console.log(`Warehouse: ${config.SNOWFLAKE_WAREHOUSE}`);
    }
    if (config.SESSION_VAR_NAME) {
      console.log(`Session Variable: ${config.SESSION_VAR_NAME} (claim: ${config.CLAIM_KEY})`);
    }
    console.log('\nUse npm run start:server or start:all next.');
  } catch (error) {
    console.error('❌ Configuration error:', error.message);
    process.exit(1);
  }
}

main();

