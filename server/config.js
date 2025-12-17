/**
 * Configuration Manager
 * 
 * Centralized configuration loading and validation for the Cortex Agent backend.
 * This module loads environment variables, validates them based on the selected mode,
 * and loads/parses the agent specification file if provided.
 */

const fs = require('fs');
const path = require('path');

/**
 * Load and validate configuration from environment variables
 * @returns {Object} Validated configuration object
 * @throws {Error} If required configuration is missing or invalid
 */
function loadConfig() {
  const config = {
    // API version selection
    AGENT_API_VERSION: process.env.AGENT_API_VERSION || 'v2',
    
    // Fixed agent mode
    FIXED_AGENT_NAME: process.env.FIXED_AGENT_NAME || null,
    
    // Inline agent specification
    AGENT_SPEC_FILE: process.env.AGENT_SPEC_FILE || null,
    agentSpec: null, // Will be populated if AGENT_SPEC_FILE is provided
    
    // v1 SQL execution
    SNOWFLAKE_WAREHOUSE: process.env.SNOWFLAKE_WAREHOUSE || null,
    
    // Hybrid PAT-OAUTH mode (v1 only)
    SESSION_VAR_NAME: process.env.SESSION_VAR_NAME || null,
    CLAIM_KEY: process.env.CLAIM_KEY || 'email',
    
    // Snowflake connection (from existing env vars)
    SNOWFLAKE_HOST: process.env.SNOWFLAKE_HOST,
    SNOWFLAKE_DATABASE: process.env.SNOWFLAKE_DATABASE,
    SNOWFLAKE_SCHEMA: process.env.SNOWFLAKE_SCHEMA,
    
    // OAuth/JWT configuration
    IDP_JWKS_URL: process.env.IDP_JWKS_URL || null,
    IDP_ISSUER: process.env.IDP_ISSUER || null,
    IDP_AUDIENCE: process.env.IDP_AUDIENCE || null,
  };
  
  // Validate API version
  if (!['v1', 'v2'].includes(config.AGENT_API_VERSION)) {
    throw new Error(`Invalid AGENT_API_VERSION: ${config.AGENT_API_VERSION}. Must be 'v1' or 'v2'`);
  }
  
  // Load and parse agent spec file if provided
  if (config.AGENT_SPEC_FILE) {
    const specPath = path.isAbsolute(config.AGENT_SPEC_FILE)
      ? config.AGENT_SPEC_FILE
      : path.join(process.cwd(), config.AGENT_SPEC_FILE);
    
    try {
      console.log(`📄 Loading agent specification from: ${specPath}`);
      const specContent = fs.readFileSync(specPath, 'utf-8');
      config.agentSpec = JSON.parse(specContent);
      console.log(`✅ Agent specification loaded successfully`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`AGENT_SPEC_FILE not found: ${specPath}`);
      } else if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in AGENT_SPEC_FILE: ${error.message}`);
      } else {
        throw new Error(`Failed to load AGENT_SPEC_FILE: ${error.message}`);
      }
    }
  }
  
  // Validation: v1 requires warehouse
  if (config.AGENT_API_VERSION === 'v1' && !config.SNOWFLAKE_WAREHOUSE) {
    throw new Error('SNOWFLAKE_WAREHOUSE is required when AGENT_API_VERSION=v1');
  }
  
  // Validation: v1 requires inline spec
  if (config.AGENT_API_VERSION === 'v1' && !config.AGENT_SPEC_FILE) {
    throw new Error('AGENT_SPEC_FILE is required when AGENT_API_VERSION=v1');
  }
  
  // Validation: inline spec requires fixed agent name
  if (config.AGENT_SPEC_FILE && !config.FIXED_AGENT_NAME) {
    throw new Error('FIXED_AGENT_NAME is required when AGENT_SPEC_FILE is set');
  }
  
  // Validation: session var requires claim key
  if (config.SESSION_VAR_NAME && !config.CLAIM_KEY) {
    throw new Error('CLAIM_KEY is required when SESSION_VAR_NAME is set');
  }
  
  // Log configuration summary
  console.log('\n📋 Configuration Summary:');
  console.log(`   API Version: ${config.AGENT_API_VERSION}`);
  console.log(`   Fixed Agent: ${config.FIXED_AGENT_NAME || 'No (query Snowflake for agents)'}`);
  console.log(`   Inline Spec: ${config.AGENT_SPEC_FILE ? 'Yes' : 'No'}`);
  if (config.AGENT_API_VERSION === 'v1') {
    console.log(`   Warehouse: ${config.SNOWFLAKE_WAREHOUSE}`);
    if (config.SESSION_VAR_NAME) {
      console.log(`   Session Variable: ${config.SESSION_VAR_NAME} (from claim: ${config.CLAIM_KEY})`);
    }
  }
  console.log('');
  
  return config;
}

module.exports = { loadConfig };

