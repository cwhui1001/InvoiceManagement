'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useUploadWithProgress } from '@/app/hooks/useUploadWithProgress';
import { useUpload } from '@/app/contexts/UploadContext';

export default function BulkUploadDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  console.log('🔥🔥🔥 BULK UPLOAD DIALOG COMPONENT RENDERED 🔥🔥🔥', { isOpen });
  
  // Add event listener to catch any form submissions
  useEffect(() => {
    const handleFormSubmit = (e: any) => {
      console.log('🚨🚨🚨 FORM SUBMISSION DETECTED 🚨🚨🚨', e);
    };
    
    const handleFileChange = (e: any) => {
      console.log('🚨🚨🚨 FILE INPUT CHANGE DETECTED 🚨🚨🚨', e);
      if (e.target && e.target.files) {
        console.log('🚨🚨🚨 FILES SELECTED:', Array.from(e.target.files).map((f: any) => f.name));
      }
    };
    
    const handleDragDrop = (e: any) => {
      console.log('🚨🚨🚨 DRAG/DROP EVENT DETECTED 🚨🚨🚨', e.type, e);
    };
    
    // Global event listeners
    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('change', handleFileChange, true); // Use capture phase
    document.addEventListener('dragover', handleDragDrop);
    document.addEventListener('drop', handleDragDrop);
    
    return () => {
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('change', handleFileChange, true);
      document.removeEventListener('dragover', handleDragDrop);
      document.removeEventListener('drop', handleDragDrop);
    };
  }, []);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const router = useRouter();
  const { uploadFiles } = useUploadWithProgress();
  const { addUpload } = useUpload(); // Add this for testing

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file types
    const invalidFiles = Array.from(files).filter(file => 
      !file.type.includes('pdf') && !file.type.includes('image')
    );

    if (invalidFiles.length > 0) {
      setError('Please select only PDF or image files.');
      return;
    }

    setError('');
    setSelectedFiles(Array.from(files));
    setShowConfirmation(true);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    console.log('=== DIALOG HANDLE UPLOAD CALLED ===');
    console.log('Selected files:', selectedFiles.map(f => f.name));
    console.log('uploadFiles function:', typeof uploadFiles);

    setError('');
    setSuccess('');

    try {
      console.log('BulkUploadDialog: Starting upload for files:', selectedFiles.map(f => f.name));
      
      // Start the upload with n8n progress tracking (shown in bottom-right corner)
      console.log('BulkUploadDialog: About to call uploadFiles hook');
      await uploadFiles(selectedFiles);
      console.log('BulkUploadDialog: uploadFiles hook completed');

      console.log('BulkUploadDialog: Upload completed successfully');
      
      // Show success message and close dialog immediately
      setSuccess('Files uploaded successfully! n8n OCR processing will be shown in bottom-right corner.');
      setShowConfirmation(false);
      
      // Close dialog immediately - n8n progress will be shown in bottom-right corner
      setTimeout(() => {
        onClose();
        resetDialog();
        router.refresh(); // Refresh the page
      }, 1500);

    } catch (err) {
      console.error('BulkUploadDialog: Upload Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload files.');
    }
  };

  const resetDialog = () => {
    setSelectedFiles([]);
    setShowConfirmation(false);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (newFiles.length === 0) {
      setShowConfirmation(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl z-50 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium">
              Upload Invoice Files
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Upload Process:</strong> Files will be uploaded and processed through OCR. 
                The system will automatically extract invoice information and link files to invoices when possible.
              </p>
            </div>

            
            {!showConfirmation ? (
              // File Selection Phase
              <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                <div className="text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                    >
                      <span>Select PDF or image files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="application/pdf,image/*"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs leading-5 text-gray-600">
                    PDF and image files, up to 10MB each
                  </p>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
              </div>
            ) : (
              // File Confirmation Phase
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    Selected Files ({selectedFiles.length})
                  </h3>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Select Different Files
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {file.type.includes('pdf') ? (
                            <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                              <span className="text-red-600 text-xs font-medium">PDF</span>
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-medium">IMG</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove file"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                
                {success && (
                  <p className="text-sm text-green-600">{success}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {showConfirmation && (
              <button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
