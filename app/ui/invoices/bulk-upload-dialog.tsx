'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function BulkUploadDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload files.');
      }

      setSuccess(result.message);
      
      // Auto-close after 2 seconds on success
      setTimeout(() => {
        router.refresh(); // Refresh the page
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Upload Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload files.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl z-50">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium">
              Upload Invoice Files
            </Dialog.Title>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4">
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
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <p className="text-xs leading-5 text-gray-600">
                  PDF and image files, up to 10MB each
                </p>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                {success && (
                  <p className="mt-2 text-sm text-green-600">{success}</p>
                )}
                {isUploading && (
                  <p className="mt-2 text-sm text-gray-600">
                    Uploading files...
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
