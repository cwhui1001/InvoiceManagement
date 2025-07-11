'use client';

import { useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import BulkUploadDialog from './bulk-upload-dialog';

export default function UploadButton() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowUploadDialog(true)}
        className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        <span className="hidden md:block">Upload Invoices</span>
        <CloudArrowUpIcon className="h-5 md:ml-4" />
      </button>

      <BulkUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
      />
    </>
  );
}
