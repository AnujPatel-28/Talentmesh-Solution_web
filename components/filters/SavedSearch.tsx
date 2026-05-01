'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Tooltip,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { 
  Save, 
  Bookmark, 
  Trash2, 
  Play, 
  Plus, 
  Search as SearchIcon 
} from 'lucide-react';
import { SearchApi } from '@/lib/api/search';
import { useAuth } from '@/lib/auth/AuthContext';
import { QueryFilter } from '@/types/filters';

interface SavedSearchProps {
  currentFilters: QueryFilter;
  onApply: (filters: QueryFilter) => void;
}

export const SavedSearch: React.FC<SavedSearchProps> = ({ currentFilters, onApply }) => {
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchSavedSearches = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await SearchApi.getSavedSearches(user.id);
    if (data) setSavedSearches(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSavedSearches();
  }, [user]);

  const handleSave = async () => {
    if (!user || !searchName.trim()) return;
    setIsSaving(true);
    const { error } = await SearchApi.saveSearch(user.id, searchName, currentFilters);
    setIsSaving(false);
    
    if (!error) {
      setIsDialogOpen(false);
      setSearchName('');
      fetchSavedSearches();
    } else {
      alert(`Failed to save: ${error}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this saved search?')) {
      const { error } = await SearchApi.deleteSavedSearch(id);
      if (!error) fetchSavedSearches();
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Bookmark size={18} color="#2563eb" />
          <Typography variant="subtitle2" fontWeight={700}>Saved Searches</Typography>
        </Box>
        <Tooltip title="Save Current Filters">
          <IconButton 
            size="small" 
            onClick={() => setIsDialogOpen(true)}
            sx={{ color: '#2563eb', bgcolor: 'blue.50', '&:hover': { bgcolor: 'blue.100' } }}
          >
            <Plus size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : savedSearches.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', px: 1 }}>
          No saved searches yet.
        </Typography>
      ) : (
        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <List dense disablePadding>
            {savedSearches.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Apply Filters">
                        <IconButton size="small" onClick={() => onApply(item.filters)} sx={{ color: '#10b981' }}>
                          <Play size={14} fill="currentColor" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(item.id)} sx={{ color: 'error.main' }}>
                          <Trash2 size={14} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  sx={{ 
                    py: 1, 
                    '&:hover': { bgcolor: 'grey.50' },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <ListItemText 
                    primary={item.name} 
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }}
                    secondary={new Date(item.created_at).toLocaleDateString()}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
                {index < savedSearches.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Save Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4, width: 320 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontStyle: 'italic' }}>Save Search</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Give this combination of filters a name to quickly access it later.
          </Typography>
          <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="e.g., Senior React Devs in SF"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!searchName.trim() || isSaving}
            sx={{ 
                borderRadius: 2, 
                fontWeight: 700, 
                px: 3, 
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
