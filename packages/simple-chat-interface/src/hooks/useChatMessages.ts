/**
 * useChatMessages Hook
 * Manages chat message state and streaming logic
 */

import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { ChartContent } from '../types/chart';
import { useConfig } from '../contexts/ConfigContext';
import { extractSqlQuery, extractVerificationInfo } from '../utils/chatUtils';
import { ERROR_TEXT, API_DEFAULTS, getApiStatusMessage } from '../constants/textConstants';

const MAX_MESSAGES = 100;

export const useChatMessages = (selectedAgent: string) => {
  const { backendUrl, applicationName, onError } = useConfig();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Threading support: track thread ID and parent message ID
  const threadIdRef = useRef<string | null>(null);
  const parentMessageIdRef = useRef<number>(0);
  
  // Helper to create a new thread
  const createNewThread = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(`${backendUrl}/api/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin_application: applicationName || 'simple_chat_interface'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to create thread:', response.status);
        return null;
      }
      
      // Snowflake returns a JSON object with thread metadata
      const threadData = await response.json();
      // Extract and return the thread_id
      return String(threadData.thread_id);
    } catch (error) {
      console.error('Error creating thread:', error);
      return null;
    }
  }, [backendUrl, applicationName]);

  // Helper to transform API message to ChatMessage format
  const transformApiMessage = useCallback((apiMessage: any, index: number): ChatMessage | null => {
    try {
      const messagePayload = typeof apiMessage.message_payload === 'string' 
        ? JSON.parse(apiMessage.message_payload)
        : apiMessage.message_payload;
      
      const baseMessage: ChatMessage = {
        id: `${apiMessage.message_id}_${apiMessage.role}`,
        text: '',
        sender: apiMessage.role as 'user' | 'assistant',
        timestamp: new Date(apiMessage.created_on),
        status: 'sent'
      };
      
      // Handle user messages
      if (apiMessage.role === 'user') {
        const content = messagePayload.content || [];
        const textContent = content.find((c: any) => c.type === 'text');
        baseMessage.text = textContent?.text || '';
        return baseMessage;
      }
      
      // Handle assistant messages - parse complex content array
      if (apiMessage.role === 'assistant') {
        const content = messagePayload.content || [];
        let fullText = '';
        const thinkingTexts: string[] = [];
        const sqlQueries: any[] = [];
        const charts: any[] = [];
        const annotations: any[] = [];
        
        content.forEach((item: any) => {
          if (item.type === 'text' && item.text) {
            fullText += item.text;
          } else if (item.type === 'thinking' && item.thinking?.text) {
            thinkingTexts.push(item.thinking.text);
          } else if (item.type === 'tool_result' && item.tool_result) {
            // Extract SQL from tool results
            const toolContent = item.tool_result.content || [];
            toolContent.forEach((tc: any) => {
              if (tc.json?.sql) {
                sqlQueries.push({ sql: tc.json.sql });
              }
            });
          } else if (item.type === 'chart' && item.chart?.chart_spec) {
            try {
              const chartSpec = typeof item.chart.chart_spec === 'string'
                ? JSON.parse(item.chart.chart_spec)
                : item.chart.chart_spec;
              charts.push({ type: 'vega-lite', chart_spec: chartSpec });
            } catch (e) {
              // Skip invalid chart specs
            }
          }
        });
        
        baseMessage.text = fullText;
        baseMessage.thinkingTexts = thinkingTexts.length > 0 ? thinkingTexts : undefined;
        baseMessage.sqlQueries = sqlQueries.length > 0 ? sqlQueries : undefined;
        baseMessage.charts = charts.length > 0 ? charts : undefined;
        
        return baseMessage;
      }
      
      return null;
    } catch (error) {
      console.error('Error transforming API message:', error, apiMessage);
      return null;
    }
  }, []);
  
  // Load thread history from backend
  const loadThread = useCallback(async (threadId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${backendUrl}/api/threads/${threadId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to load thread:', response.status);
        return false;
      }
      
      const threadData = await response.json();
      const apiMessages = threadData.messages || [];
      
      // Sort messages by created_on timestamp (oldest first)
      const sortedMessages = [...apiMessages].sort((a, b) => a.created_on - b.created_on);
      
      // Transform API messages to ChatMessage format
      const transformedMessages: ChatMessage[] = [];
      sortedMessages.forEach((apiMsg: any, index: number) => {
        const chatMsg = transformApiMessage(apiMsg, index);
        if (chatMsg) {
          transformedMessages.push(chatMsg);
        }
      });
      
      // Set messages state
      setMessages(transformedMessages);
      
      // Update thread state
      threadIdRef.current = threadId;
      
      // Set parent message ID to the last message's message_id (after sorting)
      if (sortedMessages.length > 0) {
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        parentMessageIdRef.current = lastMessage.message_id;
      }
      
      return true;
      
    } catch (error) {
      console.error('Error loading thread:', error);
      return false;
    }
  }, [backendUrl, transformApiMessage]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Create a new thread if we don't have one yet
    if (!threadIdRef.current) {
      const newThreadId = await createNewThread();
      if (newThreadId) {
        threadIdRef.current = newThreadId;
      } else {
        console.warn('Failed to create thread, continuing without thread_id');
      }
    }

    const messageId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: messageId + '_user',
      text: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    const assistantMessageId = messageId + '_assistant';
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
      status: 'thinking',
      isStreaming: true,
      streamingStatus: 'Processing your request...',
      thinkingSteps: [],
      sqlQueries: [],
      timeline: [],
      toolsUsed: []
    };

    setMessages(prev => {
      const newMessages = [...prev, userMessage, assistantMessage];
      // Trim to max messages to prevent memory issues
      return newMessages.length > MAX_MESSAGES 
        ? newMessages.slice(-MAX_MESSAGES) 
        : newMessages;
    });
    setIsLoading(true);

    // Create AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Use current parent message ID (from previous metadata response)
      const currentParentMessageId = parentMessageIdRef.current;
      
      // Build request body with thread info
      const requestBody: any = {
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: message.trim()
              }
            ]
          }
        ],
        tool_choice: {
          type: "auto"
        },
        stream: true
      };

      // Add threading fields if we have a thread ID
      if (threadIdRef.current) {
        const threadIdNum = parseInt(threadIdRef.current, 10);
        if (!isNaN(threadIdNum)) {
          requestBody.thread_id = threadIdNum;
          requestBody.parent_message_id = currentParentMessageId;
        } else {
          console.warn(`Invalid thread_id: ${threadIdRef.current}, cannot parse as integer`);
        }
      } else {
        console.log('No thread_id available, sending message without threading');
      }

      // Call backend proxy instead of Snowflake directly (secure: PAT never exposed to browser)
      const backendEndpoint = `${backendUrl}/api/agents/${encodeURIComponent(selectedAgent)}/messages`;
      
      const response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
        credentials: 'include' // Include cookies for session-based authentication
      });

      if (!response.ok) {
        // Try to get JSON error message from backend
        let errorMessage = `${ERROR_TEXT.API_ERROR}: ${response.status} ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            // Backend now sends errorParts as an array to preserve structure
            errorMessage = errorData.errorParts 
              ? errorData.errorParts.join('\n\n')  // Join array with double newlines
              : (errorData.error || errorData.message || errorMessage);
          }
        } catch {
          // If parsing fails, use default message
        }
        // Attach fullMessage to preserve \n\n (Error.message normalizes newlines)
        const error = new Error(errorMessage);
        (error as any).fullMessage = errorMessage;
        throw error;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const errorMessage = ERROR_TEXT.NO_READABLE_STREAM;
        const error = new Error(errorMessage);
        (error as any).fullMessage = errorMessage;
        throw error;
      }

      const decoder = new TextDecoder();
      let assistantText = '';
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);

              if (currentEvent === 'response.text.delta' && data.text) {
                assistantText += data.text;
                const currentText = assistantText;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg, 
                        text: currentText,
                        status: 'thinking' as const,
                        isStreaming: true
                      }
                    : msg
                ));
              } else if (currentEvent === 'response.status' && data.message) {
                const statusMessage = getApiStatusMessage(data.message);
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg, 
                        status: 'thinking' as const,
                        streamingStatus: statusMessage,
                        thinkingSteps: (msg.thinkingSteps || []).includes(statusMessage) 
                          ? msg.thinkingSteps 
                          : [...(msg.thinkingSteps || []), statusMessage],
                        timeline: [
                          ...(msg.timeline || []),
                          { type: 'status', content: statusMessage, timestamp: new Date() }
                        ]
                      }
                    : msg
                ));

              } else if (currentEvent === 'response.tool_result') {
                const toolStatus = API_DEFAULTS.PROCESSING_RESULTS;
                const sqlQuery = extractSqlQuery(data);
                const verificationInfo = extractVerificationInfo(data);
                
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { 
                        ...msg, 
                        status: 'thinking' as const,
                        streamingStatus: toolStatus,
                        thinkingSteps: (msg.thinkingSteps || []).includes(toolStatus) 
                          ? msg.thinkingSteps 
                          : [...(msg.thinkingSteps || []), toolStatus],
                        sqlQueries: sqlQuery 
                          ? [...(msg.sqlQueries || []), { 
                              sql: sqlQuery, 
                              verification: verificationInfo || undefined 
                            }]
                          : msg.sqlQueries,
                        timeline: [
                          ...(msg.timeline || []),
                          { type: 'tool', content: toolStatus, timestamp: new Date() },
                          ...(sqlQuery ? [{ type: 'sql' as const, content: sqlQuery, timestamp: new Date() }] : [])
                        ]
                      }
                    : msg
                ));
              } else if (currentEvent === 'response.thinking' && data.thinking && data.thinking.text) {
                const thinkingText = data.thinking.text.trim();
                if (thinkingText) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { 
                          ...msg, 
                          status: 'thinking' as const,
                          thinkingTexts: [...(msg.thinkingTexts || []), thinkingText],
                          timeline: [
                            ...(msg.timeline || []),
                            { type: 'thinking', content: thinkingText, timestamp: new Date() }
                          ]
                        }
                      : msg
                  ));
                }
              } else if (currentEvent === 'response.thinking.delta' && data.text) {
                const deltaText = data.text;
                if (deltaText) {
                  setMessages(prev => prev.map(msg => {
                    if (msg.id === assistantMessageId) {
                      const currentThinkingTexts = msg.thinkingTexts || [];
                      const lastIndex = currentThinkingTexts.length - 1;
                      
                      if (lastIndex >= 0) {
                        const updatedThinkingTexts = [...currentThinkingTexts];
                        updatedThinkingTexts[lastIndex] = updatedThinkingTexts[lastIndex] + deltaText;
                        
                        return {
                          ...msg,
                          status: 'thinking' as const,
                          thinkingTexts: updatedThinkingTexts
                        };
                      } else {
                        return {
                          ...msg,
                          status: 'thinking' as const,
                          thinkingTexts: [deltaText],
                          timeline: [
                            ...(msg.timeline || []),
                            { type: 'thinking', content: 'Processing thinking...', timestamp: new Date() }
                          ]
                        };
                      }
                    }
                    return msg;
                  }));
                }
              } else if (currentEvent === 'response.chart') {
                // Extract chart_spec, ignoring extra fields like content_index and tool_use_id
                const chart_spec = data.chart_spec || data;
                if (chart_spec) {
                  try {
                    // Parse the chart spec (it's a stringified JSON)
                    const chartSpec = typeof chart_spec === 'string' 
                      ? JSON.parse(chart_spec)
                      : chart_spec;
                    
                    const chartContent: ChartContent = {
                      type: 'vega-lite' as const,
                      chart_spec: chartSpec
                    };
                    
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            charts: [...(msg.charts || []), chartContent],
                            timeline: [
                              ...(msg.timeline || []),
                              { type: 'chart', content: 'Chart visualization added', timestamp: new Date() }
                            ]
                          }
                        : msg
                    ));
                  } catch (parseError) {
                    console.error('Failed to parse chart specification:', parseError);
                  }
                }
              } else if (currentEvent === 'response.text.annotation') {
                // Handle annotations (citations, sources, references, etc.)
                if (data) {
                  try {
                    // Extract annotation from nested structure
                    const annotationData = data.annotation || data;
                    
                    const annotation = {
                      type: annotationData.type || 'citation',
                      start_index: data.start_index,
                      end_index: data.end_index,
                      annotation_index: data.annotation_index,
                      content_index: data.content_index,
                      text: annotationData.text,
                      url: annotationData.doc_id, // Use doc_id as URL
                      title: annotationData.doc_title,
                      source: annotationData.source,
                      doc_id: annotationData.doc_id,
                      search_result_id: annotationData.search_result_id,
                      index: annotationData.index
                    };
                    
                    setMessages(prev => prev.map(msg => 
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            annotations: [...(msg.annotations || []), annotation],
                            timeline: [
                              ...(msg.timeline || []),
                              { 
                                type: 'annotation', 
                                content: `Citation: ${annotation.title || 'Reference'}`, 
                                timestamp: new Date() 
                              }
                            ]
                          }
                        : msg
                    ));
                  } catch (annotationError) {
                    // Skip malformed annotation data
                    console.warn('Failed to process annotation:', annotationError);
                  }
                }
              } else if (currentEvent === 'metadata') {
                // Handle metadata event - contains message_id for threading
                if (data && data.metadata && data.metadata.message_id) {
                  const messageId = data.metadata.message_id;
                  // Store this message_id to use as parent_message_id for the next message
                  parentMessageIdRef.current = messageId;
                }
              }
            } catch (parseError) {
              // Skip malformed streaming data
            }
          }
        }
      }

      // Mark message as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              text: assistantText || ERROR_TEXT.RESPONSE_COMPLETED, 
              status: 'sent' as const,
              isStreaming: false,
              streamingStatus: undefined,
            }
          : msg
      ));

      return { success: true, assistantMessageId };

    } catch (error) {
      // Handle abort error specifically
      if (error instanceof Error && error.name === 'AbortError') {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { 
                ...msg, 
                text: '', 
                status: 'error' as const, 
                error: `${ERROR_TEXT.ERROR_PREFIX}\n\n${ERROR_TEXT.USER_CANCELED}`,
                isStreaming: false,
                streamingStatus: undefined
              }
            : msg
        ));
      } else {
        // Check if this is a network error (connection lost during streaming)
        let errorMessage: string;
        if (error instanceof TypeError && 
            (error.message.includes('network') || 
             error.message.includes('fetch') || 
             error.message.includes('Failed to fetch'))) {
          // Network error during streaming - format with ERROR_PREFIX and tips
          errorMessage = `${ERROR_TEXT.ERROR_PREFIX}\n\nConnection lost during streaming.\n\n💡 Tip: The backend server at ${backendUrl} stopped or crashed, network connection was interrupted, or the backend server is no longer running.`;
        } else {
          // Use fullMessage property to preserve \n\n (Error.message normalizes newlines)
          errorMessage = error instanceof Error ? ((error as any).fullMessage || error.message) : ERROR_TEXT.UNKNOWN_ERROR;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
          ? { 
              ...msg, 
              text: '', 
              status: 'error' as const, 
              error: errorMessage,
              isStreaming: false,
              streamingStatus: undefined
            }
          : msg
        ));
        if (onError && typeof errorMessage === 'string') {
          onError(errorMessage);
        }
      }
      return { success: false, error };
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [isLoading, selectedAgent, backendUrl, onError]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current && isLoading) {
      abortControllerRef.current.abort();
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current && isLoading) {
      abortControllerRef.current.abort();
    }
    
    setMessages([]);
    setIsLoading(false);
    abortControllerRef.current = null;
    
    // Reset threading: clear thread ID (new one will be created) and reset parent message ID
    threadIdRef.current = null;
    parentMessageIdRef.current = 0;
  }, [isLoading]);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelRequest,
    clearMessages,
    loadThread
  };
};


