/**
 * MarkdownFormatter Component
 * Handles rendering of markdown content from API responses
 */

import React from 'react';
import { Box, Typography, Paper, Link, alpha, Theme } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownFormatterProps {
  content: string;
  theme: Theme;
}

export const MarkdownFormatter: React.FC<MarkdownFormatterProps> = ({ content, theme }) => {
  if (!content) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Style paragraphs
        p: ({ children }) => (
          <Typography 
            variant="body2" 
            sx={{ 
              lineHeight: 1.7, 
              fontSize: { xs: '0.9rem', sm: '1rem', '@media (min-width: 2000px)': { fontSize: '0.875rem' } },
              mb: 1.5,
              '&:last-child': { mb: 0 },
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto'
            }}
          >
            {children}
          </Typography>
        ),
        
        // Style bold text from API
        strong: ({ children }) => (
          <Typography 
            component="span" 
            sx={{ 
              fontWeight: 700, 
              color: 'text.primary',
              fontSize: 'inherit'
            }}
          >
            {children}
          </Typography>
        ),
        
        // Style italic text from API
        em: ({ children }) => (
          <Typography 
            component="span" 
            sx={{ 
              fontStyle: 'italic',
              fontSize: 'inherit'
            }}
          >
            {children}
          </Typography>
        ),
        
        // Style unordered lists from API
        ul: ({ children }) => (
          <Box component="ul" sx={{ 
            margin: 0, 
            paddingLeft: 2,
            '& li': {
              marginBottom: 0.75,
              fontSize: { xs: '0.9rem', sm: '1rem', '@media (min-width: 2000px)': { fontSize: '0.875rem' } },
              lineHeight: 1.7,
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }
          }}>
            {children}
          </Box>
        ),
        
        // Style ordered lists from API
        ol: ({ children }) => (
          <Box component="ol" sx={{ 
            margin: 0, 
            paddingLeft: 2,
            '& li': {
              marginBottom: 0.75,
              fontSize: { xs: '0.9rem', sm: '1rem', '@media (min-width: 2000px)': { fontSize: '0.875rem' } },
              lineHeight: 1.7,
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }
          }}>
            {children}
          </Box>
        ),
        
        // Style list items from API
        li: ({ children }) => (
          <Typography 
            component="li" 
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1rem', '@media (min-width: 2000px)': { fontSize: '0.875rem' } },
              lineHeight: 1.7,
              mb: 0.75,
              '&:last-child': { mb: 0 },
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {children}
          </Typography>
        ),
        
        // Style inline code from API (if any)
        code: ({ children, inline }: any) => (
          inline ? (
            <Typography 
              component="code" 
              sx={{ 
                backgroundColor: alpha(theme.palette.grey[500], 0.1),
                padding: '2px 4px',
                borderRadius: 0.5,
                fontSize: '0.9em',
                fontFamily: 'monospace'
              }}
            >
              {children}
            </Typography>
          ) : (
            <Paper 
              sx={{ 
                p: 1.5, 
                backgroundColor: alpha(theme.palette.grey[500], 0.1),
                fontFamily: 'monospace',
                fontSize: '0.9em',
                borderRadius: 1
              }}
            >
              <Typography component="pre" sx={{ margin: 0, fontSize: 'inherit' }}>
                {children}
              </Typography>
            </Paper>
          )
        ),
        
        // Style links from API (if any)
        a: ({ href, children }) => (
          <Link 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              color: 'primary.main',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {children}
          </Link>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};


