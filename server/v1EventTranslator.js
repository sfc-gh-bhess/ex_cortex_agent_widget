/**
 * v1 to v2 Event Translator
 * 
 * Translates v1 streaming events to v2 format for consistent frontend experience.
 * This allows v1 API responses to be consumed by a frontend expecting v2 events.
 */

/**
 * Emit thinking event (when agent is processing)
 * @param {Function} writeSSE - SSE writer function
 * @param {string} text - Thinking text
 */
function emitThinkingEvent(writeSSE, text) {
  writeSSE('message.delta', {
    id: 'msg_thinking',
    object: 'message.delta',
    delta: {
      content: [{
        type: 'thinking',
        thinking: text
      }]
    }
  });
}

/**
 * Emit status event
 * @param {Function} writeSSE - SSE writer function
 * @param {string} status - Status message
 */
function emitStatusEvent(writeSSE, status) {
  writeSSE('status', {
    type: 'status',
    status: status
  });
}

/**
 * Emit text delta (streaming text response)
 * @param {Function} writeSSE - SSE writer function
 * @param {string} text - Text content
 */
function emitTextDelta(writeSSE, text) {
  writeSSE('message.delta', {
    id: 'msg_text',
    object: 'message.delta',
    delta: {
      content: [{
        type: 'text',
        text: text
      }]
    }
  });
}

/**
 * Emit tool result event
 * @param {Function} writeSSE - SSE writer function
 * @param {Object} result - Tool result data
 */
function emitToolResult(writeSSE, result) {
  writeSSE('tool_result', {
    type: 'tool_result',
    result: result
  });
}

/**
 * Emit metadata (message and thread IDs)
 * @param {Function} writeSSE - SSE writer function
 * @param {string} messageId - Message identifier
 * @param {string} threadId - Thread identifier
 */
function emitMetadata(writeSSE, messageId, threadId) {
  writeSSE('metadata', {
    type: 'metadata',
    message_id: messageId,
    thread_id: threadId,
    timestamp: Date.now()
  });
}

/**
 * Emit done event (end of stream)
 * @param {Function} writeSSE - SSE writer function
 */
function emitDone(writeSSE) {
  writeSSE('done', '[DONE]');
}

/**
 * Translate a v1 event to v2 format and write it
 * @param {Object} v1Event - v1 event object with {event, data}
 * @param {Function} writeSSE - SSE writer function
 * @returns {boolean} True if [DONE] detected, false otherwise
 */
function translateEvent(v1Event, writeSSE) {
  // Skip execution_trace events
  if (v1Event.event === 'execution_trace') {
    return false;
  }
  
  // Parse event data
  let payload;
  try {
    payload = v1Event.data === '[DONE]' ? '[DONE]' : JSON.parse(v1Event.data || '{}');
  } catch {
    payload = v1Event.data;
  }
  
  // Check for done
  if (payload === '[DONE]') {
    return true; // Signal done without emitting (caller will emit)
  }
  
  // Clean response.chart events - remove extra fields
  if (v1Event.event === 'response.chart' && payload?.chart_spec) {
    // Only keep chart_spec field (remove content_index, tool_use_id, etc.)
    writeSSE('response.chart', {
      chart_spec: payload.chart_spec
    });
    return false;
  }
  
  // Clean final response event - remove tool_use_id from chart objects
  if (v1Event.event === 'response' && payload?.content && Array.isArray(payload.content)) {
    const cleanedContent = payload.content.map(item => {
      if (item.type === 'chart' && item.chart) {
        // Remove tool_use_id from chart objects
        const { tool_use_id, ...cleanChart } = item.chart;
        return { ...item, chart: cleanChart };
      }
      return item;
    });
    writeSSE('response', { ...payload, content: cleanedContent });
    return false;
  }
  
  // Skip empty delta content arrays
  if (payload?.delta?.content && Array.isArray(payload.delta.content) && payload.delta.content.length === 0) {
    return false;
  }
  
  // Handle message.delta events - need to extract and translate v1 format to v2
  if (v1Event.event === 'message.delta' && payload?.delta?.content && Array.isArray(payload.delta.content)) {
    // Process each content item in the delta
    payload.delta.content.forEach(item => {
      // Handle text content
      if (item.type === 'text' && item.text) {
        // Emit as response.text.delta for v2 compatibility
        writeSSE('response.text.delta', {
          content_index: item.index || 0,
          text: item.text
        });
      }
      
      // Handle chart content
      const chartSpec = item?.chart_spec || item?.chart?.chart_spec;
      if (chartSpec) {
        // Emit as response.chart event (v2 format)
        writeSSE('response.chart', {
          chart_spec: typeof chartSpec === 'string' 
            ? chartSpec 
            : JSON.stringify(chartSpec)
        });
      }
      
      // Handle other content types (tool_use, tool_results, etc.)
      // These get forwarded as-is in the original message.delta event
    });
    
    // Also forward the original message.delta for tool_use and tool_results
    // but filter out text and chart items since we already emitted them
    const filteredContent = payload.delta.content.filter(item => 
      item.type !== 'text' && item.type !== 'chart'
    );
    
    if (filteredContent.length > 0) {
      writeSSE(v1Event.event, {
        ...payload,
        delta: {
          ...payload.delta,
          content: filteredContent
        }
      });
    }
    
    return false;
  }
  
  // Forward other events as-is
  writeSSE(v1Event.event, payload);
  return false;
}

/**
 * Extract SQL from v1 event payload
 * @param {Object} payload - Event payload
 * @returns {string|null} SQL string or null if not found
 */
function extractSQLFromPayload(payload) {
  return payload?.delta?.content?.[1]?.tool_results?.content?.[0]?.json?.sql || null;
}

/**
 * Check if event should be skipped
 * @param {Object} event - Event object
 * @param {Object} payload - Parsed payload
 * @returns {boolean} True if should skip
 */
function shouldSkipEvent(event, payload) {
  if (event.event === 'execution_trace') return true;
  if (payload?.delta?.content && Array.isArray(payload.delta.content) && payload.delta.content.length === 0) {
    return true;
  }
  return false;
}

module.exports = {
  emitThinkingEvent,
  emitStatusEvent,
  emitTextDelta,
  emitToolResult,
  emitMetadata,
  emitDone,
  translateEvent,
  extractSQLFromPayload,
  shouldSkipEvent
};

