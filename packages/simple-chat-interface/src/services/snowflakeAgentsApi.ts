/**
 * Snowflake Cortex Agents API Service
 * 
 * This service handles communication with our secure backend proxy,
 * which communicates with the Snowflake Cortex Agents REST API.
 * 
 * Security: The PAT token is kept secure on the backend server and never exposed to the browser.
 * 
 * Reference: https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents-rest-api
 */

import { ERROR_TEXT } from '../constants/textConstants';

/**
 * Snowflake Cortex Agent response interface based on API documentation
 */
export interface SnowflakeCortexAgent {
  name: string;              // Based on your console output
  agent_name?: string;       // Fallback if different
  created_on?: string;
  modified_on?: string;
  created_at?: string;       // Alternative field name
  modified_at?: string;      // Alternative field name
  database_name: string;
  schema_name: string;
  owner?: string;
  comment?: string;
  profile?: {
    display_name?: string;
    description?: string;
    starterQuestions?: string[] | string;
    agent_spec?: string;
    [key: string]: any; // Allow other fields
  };
  agent_spec?: string;       // JSON string containing the full agent specification
}

/**
 * Detailed agent response from Describe Cortex Agent API
 */
export interface SnowflakeAgentDetails {
  agent_spec: string;        // JSON string with full agent configuration
  name: string;
  database_name: string;
  schema_name: string;
  owner: string;
  created_on: string;
}

/**
 * Parsed agent specification from the agent_spec JSON field
 */
export interface CortexAgentSpec {
  profile?: {
    display_name?: string;
    description?: string;
    avatar?: string;
    color?: string;
    starterQuestions?: string[] | string; // Fallback location
  };
  instructions?: {
    response?: string;
    orchestration?: string;
    system?: string;
    sample_questions?: Array<{
      question: string;
    }>;
    starterQuestions?: string[] | string; // Fallback location
  };
  models?: {
    orchestration?: string;
  };
  tools?: Array<{
    tool_spec: {
      type: string;
      name: string;
      description: string;
    };
  }>;
  starterQuestions?: string[] | string; // Fallback location at root level
}

/**
 * API response wrapper for the list agents endpoint
 */
export interface ListAgentsResponse {
  data: SnowflakeCortexAgent[];
  next_page_token?: string;
}

/**
 * Our internal agent configuration interface (mapped from Snowflake response)
 */
export interface SnowflakeAgentConfig {
  id: string; // agent_name
  displayName: string;
  description?: string;
  starterQuestions: string[];
  visible: boolean; // For backward compatibility, default to true
  createdOn: string;
  modifiedOn: string;
  owner: string;
  tools?: string[]; // List of tool names
}

/**
 * Configuration for agents fetched from Snowflake
 */
export interface SnowflakeAgentsConfiguration {
  agents: Record<string, SnowflakeAgentConfig>;
  defaultAgent: string;
  lastFetched: string;
  source: 'snowflake-api';
}

/**
 * Fetches the list of Cortex Agents from our secure backend proxy
 */
export const fetchCortexAgents = async (backendUrl: string): Promise<SnowflakeCortexAgent[]> => {
  const endpoint = `${backendUrl}/api/agents`;
  
  
  try {
    // Create AbortController with 60 second timeout (handles Render.com free tier cold starts)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // If backend returns JSON error, use it directly (it's already formatted)
      if (contentType.includes('application/json')) {
        const errorJson = await response.json();
        // Backend now sends errorParts as an array to preserve structure
        const errorMessage = errorJson.errorParts 
          ? errorJson.errorParts.join('\n\n')  // Join array with double newlines
          : (errorJson.error || errorJson.message || JSON.stringify(errorJson, null, 2));
        const error = new Error(errorMessage);
        (error as any).fullMessage = errorMessage;
        throw error;
      }
      
      // If it's HTML or other format, create a generic error message
      const errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n${ERROR_TEXT.HTTP_ERROR_STATUS} ${response.status} ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).fullMessage = errorMessage;
      throw error;
    }

    const data = await response.json();
    
    // Check if data is directly an array (Snowflake returns agents directly)
    const agents = Array.isArray(data) ? data : (data.data || []);
    
    return agents;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle abort (timeout) error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        const errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n\nRequest timed out after 60 seconds.\n\n💡 Tip: The backend server (Render.com free tier) is taking too long to wake up from sleep, or there's a connection issue. Try refreshing the page in a moment.`;
        const timeoutError = new Error(errorMessage);
        (timeoutError as any).fullMessage = errorMessage;
        throw timeoutError;
      }
      throw fetchError;
    }
  } catch (error) {
    // Check if this is a network error (fetch failed, DNS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n\nFailed to connect to the backend server.\n\n💡 Tip: The backend server at ${backendUrl} is not running or not accessible, there's a typo in SNOWFLAKE_HOST in your backend .env file, or network/firewall is blocking the connection.`;
      const networkError = new Error(errorMessage);
      (networkError as any).fullMessage = errorMessage;
      throw networkError;
    }
    // Re-throw other errors (they already have proper formatting)
    throw error;
  }
};

/**
 * Fetches detailed information for a specific Cortex Agent using our secure backend proxy
 * This includes the full agent_spec with starter questions
 */
export const describeCortexAgent = async (backendUrl: string, agentName: string): Promise<SnowflakeAgentDetails> => {
  // Use agent name as-is for API compatibility (Snowflake is case-sensitive)
  const endpoint = `${backendUrl}/api/agents/${encodeURIComponent(agentName)}`;
  
  
  try {
    // Create AbortController with 60 second timeout (handles Render.com free tier cold starts)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

    
    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      
      // If backend returns JSON error, use it directly (it's already formatted)
      if (contentType.includes('application/json')) {
        try {
          const errorJson = await response.json();
          // Backend now sends errorParts as an array to preserve structure
          const errorMessage = errorJson.errorParts 
            ? errorJson.errorParts.join('\n\n')  // Join array with double newlines
            : (errorJson.error || errorJson.message || JSON.stringify(errorJson, null, 2));
          const error = new Error(errorMessage);
          (error as any).fullMessage = errorMessage;
          throw error;
        } catch (parseError) {
          // If parsing fails, create our own error message
          const errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n${ERROR_TEXT.HTTP_ERROR_STATUS} ${response.status} ${response.statusText}`;
          const error = new Error(errorMessage);
          (error as any).fullMessage = errorMessage;
          throw error;
        }
      }
      
      // If it's HTML or other format, create a generic error message
      const errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n${ERROR_TEXT.HTTP_ERROR_STATUS} ${response.status} ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).fullMessage = errorMessage;
      throw error;
    }

    const agentDetails = await response.json();
    
    
    return agentDetails;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Handle abort (timeout) error
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        const errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n\nRequest timed out after 60 seconds.\n\n💡 Tip: The backend server (Render.com free tier) is taking too long to wake up from sleep, or there's a connection issue. Try refreshing the page in a moment.`;
        const timeoutError = new Error(errorMessage);
        (timeoutError as any).fullMessage = errorMessage;
        throw timeoutError;
      }
      throw fetchError;
    }
  } catch (error) {
    // Check if this is a network error (fetch failed, DNS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n\nFailed to connect to the backend server.\n\n💡 Tip: The backend server at ${backendUrl} is not running or not accessible, there's a typo in SNOWFLAKE_HOST in your backend .env file, or network/firewall is blocking the connection.`;
      const networkError = new Error(errorMessage);
      (networkError as any).fullMessage = errorMessage;
      throw networkError;
    }
    // Re-throw other errors (they already have proper formatting)
    throw error;
  }
};

/**
 * Parses the agent_spec JSON string into a structured object
 */
export const parseAgentSpec = (agentSpecJson: string): CortexAgentSpec => {
  if (!agentSpecJson || agentSpecJson.trim() === '' || agentSpecJson === '{}') {
    return {};
  }
  
  try {
    const parsed = JSON.parse(agentSpecJson);
    return parsed;
  } catch (error) {
    return {};
  }
};

/**
 * Maps a Snowflake Cortex Agent to our internal agent configuration format
 */
export const mapSnowflakeAgentToConfig = (agent: SnowflakeCortexAgent): SnowflakeAgentConfig => {
  // Use 'name' field as primary, with agent_name as fallback
  const agentName = agent.name || agent.agent_name || 'unknown_agent';
  
  const spec = parseAgentSpec(agent.agent_spec || agent.profile?.agent_spec || '{}');
  
  // Extract starter questions from the agent_spec JSON
  
  let starterQuestions: string[] = [];
  
  // Primary location: spec.instructions.sample_questions (from Describe API)
  if (spec.instructions?.sample_questions && Array.isArray(spec.instructions.sample_questions)) {
    starterQuestions = spec.instructions.sample_questions
      .map(q => typeof q === 'object' ? q.question : q)
      .filter(q => q && typeof q === 'string');
  } 
  // Fallback locations
  else if (spec.instructions?.starterQuestions) {
    starterQuestions = Array.isArray(spec.instructions.starterQuestions) 
      ? spec.instructions.starterQuestions 
      : [spec.instructions.starterQuestions];
  } else if (agent.profile?.starterQuestions) {
    starterQuestions = Array.isArray(agent.profile.starterQuestions) 
      ? agent.profile.starterQuestions 
      : [agent.profile.starterQuestions];
  } else if (spec.starterQuestions) {
    starterQuestions = Array.isArray(spec.starterQuestions) 
      ? spec.starterQuestions 
      : [spec.starterQuestions];
  }
  
  // No fallback generation - if no starter questions found, keep empty array
  
  // Extract tool names
  const tools = spec.tools?.map(tool => tool.tool_spec.name) || [];
  
  const mappedConfig = {
    id: agentName,
    displayName: spec.profile?.display_name || agent.profile?.display_name || agentName,
    description: spec.profile?.description || agent.profile?.description || agent.comment || `AI agent: ${agentName}`,
    starterQuestions,
    visible: true, // Default to visible for all Snowflake agents
    createdOn: agent.created_on || agent.created_at || new Date().toISOString(),
    modifiedOn: agent.modified_on || agent.modified_at || new Date().toISOString(),
    owner: agent.owner || 'unknown',
    tools,
  };
  
  return mappedConfig;
};

/**
 * Fetches and transforms Cortex Agents into our configuration format
 */
export const fetchAgentsConfiguration = async (backendUrl: string): Promise<SnowflakeAgentsConfiguration> => {
  try {
    // Step 1: Fetch list of agents from Snowflake
    const snowflakeAgents = await fetchCortexAgents(backendUrl);
    
    
    // Step 2: For each agent, call Describe API to get detailed specs with starter questions
    // PARALLEL FETCH: Fetch all agents in parallel to reduce load time
    const agentsRecord: Record<string, SnowflakeAgentConfig> = {};
    let defaultAgent = '';
    
    const agentPromises = snowflakeAgents.map(async (agent, index) => {
      const agentName = agent.name || agent.agent_name || `agent_${index}`;
      
      try {
        // Fetch detailed agent specs including starter questions
        const agentDetails = await describeCortexAgent(backendUrl, agentName);
        
        // Combine the basic agent info with detailed specs
        const enhancedAgent = {
          ...agent,
          agent_spec: agentDetails.agent_spec, // Use the detailed agent_spec from Describe API
          owner: agentDetails.owner,
          created_on: agentDetails.created_on
        };
        
        const config = mapSnowflakeAgentToConfig(enhancedAgent);
        return { agentName, config, index };
      } catch (mappingError) {
        // Return null if agent fetch fails
        console.error(`Failed to fetch agent ${agentName}:`, mappingError);
        return null;
      }
    });
    
    // Wait for all agents to be fetched in parallel
    const results = await Promise.all(agentPromises);
    
    // Process results
    results.forEach(result => {
      if (result) {
        const { agentName, config, index } = result;
        agentsRecord[agentName] = config;
        
        // Set the first agent as default
        if (index === 0) {
          defaultAgent = agentName;
        }
      }
    });
    
    // Sort agents alphabetically and select the first one
    const agentNames = Object.keys(agentsRecord);
    
    // Check if we got any valid agents
    if (agentNames.length === 0) {
      throw new Error('No agents found or all agents failed to load. Please check your Snowflake Cortex Agents configuration.');
    }
    
    // Sort case-insensitively for better UX
    const sortedNames = agentNames.sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
    defaultAgent = sortedNames[0];
    
    
    return {
      agents: agentsRecord,
      defaultAgent,
      lastFetched: new Date().toISOString(),
      source: 'snowflake-api'
    };
  } catch (error) {
    // Just re-throw - fullMessage property is already attached to error object
    throw error;
  }
};

/**
 * Health check for the Cortex Agents API
 */
export const testCortexAgentsConnection = async (backendUrl: string): Promise<boolean> => {
  try {
    await fetchCortexAgents(backendUrl);
    return true;
  } catch (error) {
    return false;
  }
};
