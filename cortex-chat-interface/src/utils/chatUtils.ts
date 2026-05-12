/**
 * Chat utility functions
 * Helper functions for chat message processing and formatting
 */

import { CHAT_TEXT } from '../constants/textConstants';

/**
 * Split thinking text into paragraph chunks (2-3 sentences each)
 */
export const splitThinkingTextIntoParagraphs = (text: string): string[] => {
  // First split into sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 10);
  
  // Group sentences into paragraphs of 2-3 sentences
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    const paragraph = sentences.slice(i, i + 3).join(' ');
    if (paragraph.trim().length > 0) {
      paragraphs.push(paragraph);
    }
  }
  
  // If no meaningful paragraphs found, return the original text as a single paragraph
  return paragraphs.length > 0 ? paragraphs : [text.trim()].filter(t => t.length > 0);
};

/**
 * Extract SQL query from tool result data
 */
export const extractSqlQuery = (data: any): string | null => {
  try {
    // Check for SQL in various possible locations based on Slack parser logic
    if (data?.content) {
      for (const item of data.content) {
        if (item?.json?.sql) {
          return item.json.sql.trim();
        }
      }
    }
    
    // Fallback: check if SQL is directly in data
    if (data?.sql) {
      return data.sql.trim();
    }
    
    // Additional fallback: look for SQL patterns in text
    if (data?.text && data.text.includes('SELECT')) {
      const sqlMatch = data.text.match(/SELECT[\s\S]*?;/i);
      return sqlMatch ? sqlMatch[0].trim() : null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Extract verification info from tool result data
 */
export const extractVerificationInfo = (data: any) => {
  try {
    const verification: any = {};
    
    // Check for verification info in nested content (based on Slack parser logic)
    if (data?.content) {
      for (const item of data.content) {
        if (item?.json) {
          const jsonData = item.json;
          if (jsonData.verification !== undefined) verification.verification = jsonData.verification;
          if (jsonData.validated !== undefined) verification.validated = jsonData.validated;
          if (jsonData.query_verified !== undefined) verification.query_verified = jsonData.query_verified;
          if (jsonData.verified_query_used !== undefined) verification.verified_query_used = jsonData.verified_query_used;
          if (jsonData.query_validation !== undefined) verification.query_validation = jsonData.query_validation;
        }
      }
    }
    
    // Fallback: check if verification info is directly in data
    if (data?.verified_query_used !== undefined) verification.verified_query_used = data.verified_query_used;
    if (data?.query_verified !== undefined) verification.query_verified = data.query_verified;
    if (data?.validated !== undefined) verification.validated = data.validated;
    if (data?.verification !== undefined) verification.verification = data.verification;
    
    return Object.keys(verification).length > 0 ? verification : null;
  } catch (error) {
    return null;
  }
};

/**
 * Get greeting based on time of day
 * Greetings are defined in textConstants.ts for easy customization
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  // Pick random greeting from appropriate time period
  const getRandomGreeting = (options: string[]) => 
    options[Math.floor(Math.random() * options.length)];
  
  if (hour < 12) return getRandomGreeting(CHAT_TEXT.GREETINGS.MORNING);
  if (hour < 17) return getRandomGreeting(CHAT_TEXT.GREETINGS.AFTERNOON);
  if (hour < 22) return getRandomGreeting(CHAT_TEXT.GREETINGS.EVENING);
  return getRandomGreeting(CHAT_TEXT.GREETINGS.NIGHT);
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (date: Date): string => {
  return new Date(date).toLocaleTimeString();
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Format time for display
 */
export const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

