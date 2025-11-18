/**
 * ThreadPanel Component
 * Collapsible side panel for managing conversation threads
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useThreadManagement, ThreadMetadata } from '../hooks/useThreadManagement';

export interface ThreadPanelProps {
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string | null) => void;
  onNewChat: () => void;
  containerMode?: 'viewport' | 'container'; // 'viewport' uses fixed positioning, 'container' uses absolute
  open: boolean;
  onToggle: () => void;
}

const PANEL_WIDTH = 280;

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  selectedThreadId,
  onThreadSelect,
  onNewChat,
  containerMode = 'viewport',
  open,
  onToggle
}) => {
  const theme = useTheme();
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  
  const { threads, loading, listThreads, renameThread, deleteThread } = useThreadManagement();

  // Load threads when panel opens
  useEffect(() => {
    if (open) {
      listThreads();
    }
  }, [open, listThreads]);

  const handleThreadClick = useCallback((threadId: string) => {
    onThreadSelect(threadId);
    onToggle(); // Close panel after selection on mobile
  }, [onThreadSelect, onToggle]);

  const handleNewChat = useCallback(() => {
    onNewChat();
    onToggle(); // Close panel after new chat on mobile
  }, [onNewChat, onToggle]);

  const handleStartEdit = useCallback((threadId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(threadId);
    setEditingName(currentName || 'Untitled');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingThreadId(null);
    setEditingName('');
  }, []);

  const handleSaveEdit = useCallback(async (threadId: string) => {
    if (editingName.trim()) {
      const success = await renameThread(threadId, editingName.trim());
      if (success) {
        setEditingThreadId(null);
        setEditingName('');
      }
    }
  }, [editingName, renameThread]);

  const handleDeleteClick = useCallback((threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreadToDelete(threadId);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (threadToDelete) {
      const success = await deleteThread(threadToDelete);
      if (success) {
        // If the deleted thread was selected, clear selection
        if (selectedThreadId === threadToDelete) {
          onNewChat();
        }
      }
    }
    setDeleteDialogOpen(false);
    setThreadToDelete(null);
  }, [threadToDelete, deleteThread, selectedThreadId, onNewChat]);

  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setThreadToDelete(null);
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  return (
    <>
      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={open}
        onClose={onToggle}
        variant="temporary"
        ModalProps={containerMode === 'container' ? {
          container: document.querySelector('[data-chat-container="true"]') as HTMLElement,
          disablePortal: false,
          keepMounted: true,
          BackdropProps: {
            sx: {
              position: 'absolute'
            }
          }
        } : undefined}
        sx={{
          zIndex: containerMode === 'container' ? 1201 : 10001,
          ...(containerMode === 'container' && { 
            position: 'absolute',
            '& .MuiModal-root': {
              position: 'absolute'
            }
          }),
          '& .MuiDrawer-paper': {
            width: PANEL_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.default',
            ...(containerMode === 'container' && { position: 'absolute', height: '100%' })
          }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              Conversations
            </Typography>
            <IconButton size="small" onClick={onToggle}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* New Chat Button */}
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewChat}
              sx={{ textTransform: 'none' }}
            >
              New Chat
            </Button>
          </Box>

          <Divider />

          {/* Thread List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : threads.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No conversations yet
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {threads.map((thread) => {
                  const threadIdStr = String(thread.thread_id);
                  const isSelected = selectedThreadId === threadIdStr;
                  const isEditing = editingThreadId === threadIdStr;
                  const displayName = thread.thread_name || 'Untitled';

                  return (
                    <ListItem
                      key={thread.thread_id}
                      disablePadding
                      sx={{
                        borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                        bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent'
                      }}
                    >
                      {isEditing ? (
                        <Box sx={{ p: 2, width: '100%', display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit(threadIdStr);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            size="small"
                            autoFocus
                            fullWidth
                            sx={{ flex: 1 }}
                          />
                          <IconButton size="small" onClick={() => handleSaveEdit(threadIdStr)}>
                            <CheckIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={handleCancelEdit}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <ListItemButton
                          onClick={() => handleThreadClick(threadIdStr)}
                          sx={{
                            py: 1.5,
                            px: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                          }}
                        >
                          <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 1 }}>
                            <ListItemText
                              primary={displayName}
                              primaryTypographyProps={{
                                noWrap: true,
                                fontSize: '0.95rem',
                                fontWeight: isSelected ? 600 : 400
                              }}
                              sx={{ flex: 1, minWidth: 0 }}
                            />
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Rename">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleStartEdit(threadIdStr, displayName, e)}
                                  sx={{ 
                                    opacity: 0.7,
                                    '&:hover': { opacity: 1 }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDeleteClick(threadIdStr, e)}
                                  sx={{ 
                                    opacity: 0.7,
                                    '&:hover': { opacity: 1, color: 'error.main' }
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {formatDate(thread.updated_on)}
                          </Typography>
                        </ListItemButton>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
        container={containerMode === 'container' 
          ? document.querySelector('[data-chat-container="true"]') as HTMLElement 
          : undefined
        }
        sx={{
          zIndex: containerMode === 'container' ? 1202 : 10002,
          ...(containerMode === 'container' && { 
            position: 'absolute',
            '& .MuiDialog-container': {
              position: 'absolute',
              height: '100%'
            }
          })
        }}
      >
        <DialogTitle>Delete Conversation?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

