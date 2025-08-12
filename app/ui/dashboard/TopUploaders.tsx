'use client';

import { UserIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface TopUploader {
  username: string;
  displayName: string;
  uploadCount: number;
}

interface TopUploadersProps {
  uploaders: TopUploader[];
}

export default function TopUploaders({ uploaders }: TopUploadersProps) {
  if (!uploaders || uploaders.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
          Top Uploaders
        </h3>
        <p className="text-gray-500 text-center py-8">No upload data available</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />
        Top 10 Users by Upload Count
      </h3>
      
      <div className="space-y-3">
        {uploaders.map((uploader, index) => (
          <div 
            key={uploader.username}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${
                index === 0 ? 'bg-yellow-500' : 
                index === 1 ? 'bg-gray-400' : 
                index === 2 ? 'bg-amber-600' : 
                'bg-blue-500'
              }`}>
                {index + 1}
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800">{uploader.displayName}</p>
                  {uploader.displayName !== uploader.username && (
                    <p className="text-xs text-gray-500">@{uploader.username}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-blue-600">{uploader.uploadCount}</p>
              <p className="text-xs text-gray-500">
                {uploader.uploadCount === 1 ? 'upload' : 'uploads'}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {uploaders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Total uploads: {uploaders.reduce((sum, u) => sum + u.uploadCount, 0)}
          </p>
        </div>
      )}
    </div>
  );
}
