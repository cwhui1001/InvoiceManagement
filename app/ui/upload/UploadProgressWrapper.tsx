'use client';

import { useUpload } from '@/app/contexts/UploadContext';
import UploadProgressBar from './UploadProgressBar';

export default function UploadProgressWrapper() {
  const { uploads, removeUpload } = useUpload();

  console.log('UploadProgressWrapper: Current uploads:', uploads); // Debug log

  // Only show if there are uploads
  if (uploads.length === 0) {
    console.log('UploadProgressWrapper: No uploads to show'); // Debug log
    return null;
  }

  console.log('UploadProgressWrapper: Showing progress bar with uploads:', uploads); // Debug log

  return (
    <UploadProgressBar 
      uploads={uploads} 
      onDismiss={removeUpload} 
    />
  );
}
