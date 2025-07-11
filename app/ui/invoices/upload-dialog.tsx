'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function UploadDialog({
  isOpen,
  onClose,
  invoiceId,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/invoices/${invoiceId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file.');
      }

      router.refresh(); // Refresh the page to show updated PDF link
      onClose();
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium">
              Upload Invoice PDF
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
                    <span>Select PDF file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <p className="text-xs leading-5 text-gray-600">
                  PDF files only, up to 10MB
                </p>
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                {isUploading && (
                  <p className="mt-2 text-sm text-gray-600">
                    Uploading...
                  </p>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
