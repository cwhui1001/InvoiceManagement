'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface UploadProgress {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  estimatedTime?: number;
  error?: string;
  executionId?: string; // n8n execution ID
}

interface UploadContextType {
  uploads: UploadProgress[];
  addUpload: (upload: Omit<UploadProgress, 'startTime'>) => void;
  updateUpload: (id: string, updates: Partial<UploadProgress>) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const addUpload = useCallback((upload: Omit<UploadProgress, 'startTime'>) => {
    const newUpload: UploadProgress = {
      ...upload,
      startTime: new Date(),
    };
    console.log('UploadContext: Adding upload:', newUpload); // Debug log
    setUploads(prev => {
      const newUploads = [...prev, newUpload];
      console.log('UploadContext: Current uploads after add:', newUploads); // Debug log
      return newUploads;
    });
  }, []);

  const updateUpload = useCallback((id: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.id === id ? { ...upload, ...updates } : upload
      )
    );
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => 
      prev.filter(upload => 
        upload.status !== 'completed' && upload.status !== 'error'
      )
    );
  }, []);

  return (
    <UploadContext.Provider value={{
      uploads,
      addUpload,
      updateUpload,
      removeUpload,
      clearCompleted
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}

// Hook for tracking n8n execution progress
export function useN8nProgress(executionId: string, filename: string) {
  const { addUpload, updateUpload } = useUpload();
  
  const startTracking = useCallback(() => {
    const uploadId = `${executionId}-${Date.now()}`;
    
    // Add initial upload
    addUpload({
      id: uploadId,
      filename,
      status: 'uploading',
      progress: 0,
      executionId,
    });

    // Start polling n8n execution status
    const pollExecution = async () => {
      try {
        const response = await fetch(`/api/n8n/execution/${executionId}`);
        const execution = await response.json();
        
        if (execution.finished) {
          updateUpload(uploadId, {
            status: execution.success ? 'completed' : 'error',
            progress: 100,
            error: execution.success ? undefined : execution.error,
          });
        } else {
          // Estimate progress based on execution time and typical workflow duration
          const elapsed = Date.now() - new Date(execution.startedAt).getTime();
          const estimatedDuration = 30000; // 30 seconds typical duration
          const progress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
          
          updateUpload(uploadId, {
            status: execution.running ? 'processing' : 'uploading',
            progress,
            estimatedTime: estimatedDuration / 1000,
          });
          
          // Continue polling
          setTimeout(pollExecution, 2000);
        }
      } catch (error) {
        updateUpload(uploadId, {
          status: 'error',
          progress: 0,
          error: 'Failed to track execution progress',
        });
      }
    };

    // Start polling after a short delay
    setTimeout(pollExecution, 1000);
    
    return uploadId;
  }, [executionId, filename, addUpload, updateUpload]);

  return { startTracking };
}
