'use client';

import { useState } from 'react';
import { Button } from '@/app/ui/button';

export default function N8NUploadForm() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    setResults([]);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setMessage('❌ Please select files to upload');
      return;
    }

    setUploading(true);
    setResults([]);
    setMessage(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload-n8n', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
        setMessage(`✅ ${data.successCount}/${data.totalFiles} files processed successfully! n8n will handle invoice detection and database linking.`);
      } else {
        setMessage(`❌ Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('❌ Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Upload</h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload PDF invoices - n8n workflow will handle OCR and database linking automatically
          </p>
        </div>

        {/* n8n Workflow Status */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="font-medium text-blue-900">n8n Workflow Integration</h3>
          </div>
          <p className="text-sm text-blue-800 mt-2">
            Files will be processed through your n8n Invoice OCR workflow which will:
          </p>
          <ul className="text-sm text-blue-800 mt-1 space-y-1">
            <li>• Extract invoice data using OCR</li>
            <li>• Detect invoice numbers automatically</li>
            <li>• Link PDFs to the correct invoices in Supabase</li>
            <li>• Handle all database updates</li>
          </ul>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Invoice Files
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {files && files.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Selected {files.length} file{files.length > 1 ? 's' : ''}:
              <ul className="mt-1 space-y-1">
                {Array.from(files).map((file, index) => (
                  <li key={index} className="text-xs text-gray-500">
                    • {file.name} ({Math.round(file.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <Button
            onClick={handleUpload}
            disabled={uploading || !files || files.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload & Process with n8n
              </>
            )}
          </Button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-md text-sm mb-4 ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Processing Results</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border text-sm ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{result.filename}</p>
                    <p className={`text-xs mt-1 ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.success ? '✅ ' : '❌ '}
                      {result.message || result.error}
                    </p>
                    {result.success && result.publicUrl && (
                      <p className="text-xs text-gray-500 mt-1">
                        File stored in Supabase • n8n will process shortly
                      </p>
                    )}
                  </div>
                  {result.publicUrl && (
                    <a
                      href={result.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View File
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Files are uploaded to Supabase storage</li>
            <li>2. n8n workflow receives the files automatically</li>
            <li>3. OCR extracts invoice data and numbers</li>
            <li>4. Database is updated with PDF links</li>
            <li>5. No manual filename formatting needed! 🎉</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
