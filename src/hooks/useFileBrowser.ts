/**
 * useFileBrowser Hook
 * Manages file browsing and operations
 */

import { useState, useCallback } from 'react';
import { FileInfo, DirectoryListing, FileType } from '../types/controller';

interface UseFileBrowserReturn {
  // State
  currentPath: string;
  files: FileInfo[];
  selectedFiles: string[];
  isLoading: boolean;
  error: string | null;
  
  // Navigation
  navigateTo: (path: string) => Promise<void>;
  goBack: () => void;
  goUp: () => void;
  goHome: () => void;
  
  // File management
  listFiles: (deviceId: string, path: string) => Promise<DirectoryListing>;
  deleteFile: (deviceId: string, filePath: string) => Promise<boolean>;
  downloadFile: (deviceId: string, filePath: string) => Promise<Blob>;
  
  // Selection
  selectFile: (fileId: string) => void;
  deselectFile: (fileId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Filters
  filterByType: (type: FileType | null) => void;
  searchFiles: (query: string) => void;
  sortBy: (field: 'name' | 'size' | 'date') => void;
}

export const useFileBrowser = (): UseFileBrowserReturn => {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FileType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'size' | 'date'>('name');

  const navigateTo = useCallback(async (path: string) => {
    setCurrentPath(path);
    // In real scenario, this would fetch files from the device
    setFiles([]);
  }, []);

  const goBack = useCallback(() => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      const newPath = '/' + parts.join('/');
      setCurrentPath(newPath);
    }
  }, [currentPath]);

  const goUp = useCallback(() => {
    goBack();
  }, [goBack]);

  const goHome = useCallback(() => {
    setCurrentPath('/');
  }, []);

  const listFiles = useCallback(
    async (deviceId: string, path: string): Promise<DirectoryListing> => {
      setIsLoading(true);
      setError(null);
      try {
        // In real scenario, this would make API call to device
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
          currentPath: path,
          files: [],
          totalSize: 0,
          fileCount: 0,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to list files';
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteFile = useCallback(async (deviceId: string, filePath: string): Promise<boolean> => {
    setError(null);
    try {
      // In real scenario, this would call device API
      setFiles(prev => prev.filter(f => f.path !== filePath));
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMsg);
      return false;
    }
  }, []);

  const downloadFile = useCallback(
    async (deviceId: string, filePath: string): Promise<Blob> => {
      setError(null);
      try {
        // In real scenario, this would download from device
        return new Blob([''], { type: 'application/octet-stream' });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to download file';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const selectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) return prev;
      return [...prev, fileId];
    });
  }, []);

  const deselectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(id => id !== fileId));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFiles(files.map(f => f.fileId));
  }, [files]);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const filterByType = useCallback((type: FileType | null) => {
    setFilterType(type);
  }, []);

  const searchFiles = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const sortBy = useCallback((field: 'name' | 'size' | 'date') => {
    setSortField(field);
    
    const sorted = [...files].sort((a, b) => {
      switch (field) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return a.size - b.size;
        case 'date':
          return a.modifiedAt - b.modifiedAt;
        default:
          return 0;
      }
    });
    
    setFiles(sorted);
  }, [files]);

  return {
    currentPath,
    files,
    selectedFiles,
    isLoading,
    error,
    navigateTo,
    goBack,
    goUp,
    goHome,
    listFiles,
    deleteFile,
    downloadFile,
    selectFile,
    deselectFile,
    selectAll,
    clearSelection,
    filterByType,
    searchFiles,
    sortBy,
  };
};
