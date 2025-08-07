import { useUpload, useN8nProgress } from '@/app/contexts/UploadContext';
import { useCallback } from 'react';

interface UploadWithProgressOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function useUploadWithProgress(options?: UploadWithProgressOptions) {
  const { addUpload, updateUpload } = useUpload();

  const uploadFiles = useCallback(async (files: File[]) => {
    console.log(`Starting bulk upload for ${files ? files.length : 'undefined'} files`); // Debug log
    console.log('Files received:', files); // Debug log
    
    // Validate files input
    if (!files || files.length === 0) {
      const error = 'No files provided for upload';
      console.error(error);
      if (options?.onError) {
        options.onError(error);
      }
      throw new Error(error);
    }
    
    try {
      console.log('uploadFiles called with files:', files); // Debug log

      // Create FormData for all files at once (bulk upload)
      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`Adding file ${index}:`, file.name, file.size); // Debug log
        formData.append('file', file); // Use 'file' as key, not 'file_0', 'file_1'
      });

      // Send all files in one request
      console.log('Sending bulk upload request...'); // Debug log
      const response = await fetch('/api/invoices/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      console.log('API Response:', result); // Debug log
      console.log('Response structure:', {
        successfulUploads: result.successfulUploads,
        failedUploads: result.failedUploads,
        hasSuccessfulUploads: result.successfulUploads && result.successfulUploads.length > 0
      }); // Debug log
      console.log('Full successfulUploads array:', JSON.stringify(result.successfulUploads, null, 2)); // Debug log

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload files.');
      }

      // Process each successful upload result
      if (result.successfulUploads && result.successfulUploads.length > 0) {
        console.log('Processing successful uploads:', result.successfulUploads); // Debug log
        
        result.successfulUploads.forEach((upload: any) => {
          const uploadId = `upload-${Date.now()}-${Math.random()}`;
          
          console.log(`Adding upload to progress tracker:`, {
            id: uploadId,
            filename: upload.filename,
            executionId: upload.executionId,
            status: upload.executionId ? 'processing' : 'completed'
          }); // Debug log

          // TEMPORARY TEST: Always add upload to context to test if progress bar shows
          console.log(`FORCING upload to context for testing - ${upload.filename}`); // Debug log
          addUpload({
            id: uploadId,
            filename: upload.filename,
            status: 'processing', // Force processing status for testing
            progress: 25, // Start at 25%
            executionId: upload.executionId || 'test-123',
          });

          // If we have a real execution ID, track it
          if (upload.executionId) {
            console.log(`Found execution ID ${upload.executionId} for ${upload.filename}`); // Debug log
            console.log(`About to start n8n tracking for execution ID: ${upload.executionId}`); // Debug log
            trackN8nExecution(uploadId, upload.executionId);
          } else {
            console.log(`No execution ID for ${upload.filename} - will show test progress`); // Debug log
            // For testing, let's keep it in processing state for a while
            setTimeout(() => {
              updateUpload(uploadId, {
                status: 'completed',
                progress: 100,
              });
            }, 10000); // Complete after 10 seconds
          }
        });
      } else {
        console.log('No successful uploads found in response'); // Debug log
      }
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }, [addUpload, updateUpload, options]);

  const trackN8nExecution = useCallback(async (uploadId: string, executionId: string) => {
    console.log(`Starting n8n execution tracking for upload ${uploadId}, execution ${executionId}`); // Debug log
    
    const pollExecution = async (): Promise<void> => {
      try {
        console.log(`Polling n8n execution ${executionId}...`); // Debug log
        const response = await fetch(`/api/n8n/execution/${executionId}`);
        const execution = await response.json();
        
        console.log(`n8n execution ${executionId} status:`, {
          finished: execution.finished,
          status: execution.status,
          success: execution.success,
          startedAt: execution.startedAt,
          stoppedAt: execution.stoppedAt
        }); // Debug log
        
        // Add extra logging to understand the timing issue
        if (execution.startedAt) {
          const executionTime = execution.stoppedAt 
            ? new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()
            : Date.now() - new Date(execution.startedAt).getTime();
          console.log(`n8n execution ${executionId} timing - execution time: ${executionTime}ms`);
        }
        
        if (execution.finished) {
          const isSuccess = execution.success === true || execution.status === 'success';
          console.log(`n8n execution ${executionId} finished with success: ${isSuccess}`); // Debug log
          
          // Calculate the actual execution duration
          const actualExecutionTime = execution.stoppedAt 
            ? new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()
            : 80000; // Fallback to 80 seconds if no timing data
          
          console.log(`Using actual execution time for progress animation: ${actualExecutionTime}ms`);
          
          // Show progress animation over the ACTUAL execution duration
          const totalSteps = Math.ceil(actualExecutionTime / 1000); // One step per second
          const progressPerStep = (95 - 25) / totalSteps; // Progress from 25% to 95%
          
          let currentProgress = 25;
          let stepCount = 0;
          
          const animateProgress = () => {
            if (stepCount < totalSteps && currentProgress < 95) {
              currentProgress += progressPerStep;
              stepCount++;
              
              updateUpload(uploadId, {
                status: 'processing',
                progress: Math.min(95, Math.floor(currentProgress)),
                estimatedTime: totalSteps - stepCount,
              });
              
              setTimeout(animateProgress, 1000); // Update every second to match real time
            } else {
              // Finally complete
              updateUpload(uploadId, {
                status: isSuccess ? 'completed' : 'error',
                progress: 100,
                error: isSuccess ? undefined : execution.error || 'OCR processing failed',
              });
            }
          };
          animateProgress();
        } else {
          // Execution is still running
          const elapsed = Date.now() - new Date(execution.startedAt).getTime();
          const estimatedDuration = 80000; // 80 seconds based on your actual timing
          const progress = Math.min(95, Math.floor(25 + ((elapsed / estimatedDuration) * 70)));
          
          console.log(`n8n execution ${executionId} still running - elapsed: ${elapsed}ms, progress: ${progress}%`); // Debug log
          
          updateUpload(uploadId, {
            status: 'processing',
            progress,
            estimatedTime: Math.ceil((estimatedDuration - elapsed) / 1000),
          });
          
          // Continue polling every 1 second for more responsive progress
          setTimeout(pollExecution, 1000);
        }
      } catch (error) {
        console.error(`Error polling n8n execution ${executionId}:`, error); // Debug log
        updateUpload(uploadId, {
          status: 'error',
          progress: 85,
          error: 'Failed to track OCR progress',
        });
      }
    };

    // Start polling immediately, then every 3 seconds
    pollExecution(); // Poll immediately
    setTimeout(pollExecution, 1000); // Then poll again after 1 second
  }, [updateUpload]);

  return { uploadFiles };
}
