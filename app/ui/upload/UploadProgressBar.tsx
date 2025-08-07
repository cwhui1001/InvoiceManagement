'use client';

import { useState, useEffect } from 'react';
import { X, Upload, CheckCircle, XCircle, FileText } from 'lucide-react';

interface UploadProgress {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime: Date;
  estimatedTime?: number;
  error?: string;
}

interface UploadProgressBarProps {
  uploads: UploadProgress[];
  onDismiss: (id: string) => void;
}

export default function UploadProgressBar({ uploads, onDismiss }: UploadProgressBarProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Show only if there are active uploads
  const activeUploads = uploads.filter(upload => 
    upload.status === 'uploading' || upload.status === 'processing'
  );

  const completedUploads = uploads.filter(upload => 
    upload.status === 'completed' || upload.status === 'error'
  );

  if (!isVisible || uploads.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <FileText className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing OCR...';
      case 'completed':
        return 'OCR Complete';
      case 'error':
        return 'Processing Failed';
    }
  };

  const getProgressColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">
          File Uploads ({uploads.length})
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload List */}
      <div className="max-h-80 overflow-y-auto">
        {/* Active Uploads */}
        {activeUploads.map((upload) => {
          const elapsed = Math.floor((Date.now() - upload.startTime.getTime()) / 1000);
          
          return (
            <div key={upload.id} className="p-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(upload.status)}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {upload.filename}
                  </span>
                </div>
                <button
                  onClick={() => onDismiss(upload.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{getStatusText(upload.status)}</span>
                  <span>{upload.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(upload.status)}`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>Elapsed: {formatTime(elapsed)}</span>
                {upload.estimatedTime && (
                  <span>Est. remaining: {formatTime(upload.estimatedTime - elapsed)}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Recently Completed Uploads */}
        {completedUploads.slice(0, 3).map((upload) => (
          <div key={upload.id} className="p-3 border-b border-gray-100 last:border-b-0 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getStatusIcon(upload.status)}
                <span className="text-sm text-gray-600 truncate">
                  {upload.filename}
                </span>
              </div>
              <button
                onClick={() => onDismiss(upload.id)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {upload.error && (
              <p className="text-xs text-red-600 mt-1">{upload.error}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      {activeUploads.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {activeUploads.length} file{activeUploads.length > 1 ? 's' : ''} in progress
          </p>
        </div>
      )}
    </div>
  );
}
