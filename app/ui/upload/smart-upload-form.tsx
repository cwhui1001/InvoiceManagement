'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/ui/button';

interface Invoice {
  DocNum: string;
  CustName: string;
  DocDate: string;
}

export default function SmartUploadForm() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Load recent invoices on component mount
  useEffect(() => {
    fetchRecentInvoices();
  }, []);

  const fetchRecentInvoices = async () => {
    try {
      const response = await fetch('/api/invoices/recent');
      const invoices = await response.json();
      setRecentInvoices(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);
    setResults([]);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      // Add manual invoice ID if selected
      if (selectedInvoice) {
        formData.append('invoiceId', selectedInvoice);
      }

      const response = await fetch('/api/upload-smart', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResults(data.results || []);

      if (response.ok) {
        console.log('Upload completed:', data);
      } else {
        console.error('Upload failed:', data);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleManualLink = async (fileData: any, invoiceId: string) => {
    try {
      const response = await fetch('/api/invoices/link-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          pdfUrl: fileData.publicUrl,
          pdfFilename: fileData.storageFilename,
        }),
      });

      if (response.ok) {
        alert(`Successfully linked to invoice ${invoiceId}`);
        // Refresh results
        setResults(prev => prev.map(result => 
          result.publicUrl === fileData.publicUrl 
            ? { ...result, success: true, invoiceId, message: `Linked to invoice ${invoiceId}` }
            : result
        ));
      } else {
        alert('Failed to link PDF to invoice');
      }
    } catch (error) {
      console.error('Error linking PDF:', error);
      alert('Error linking PDF to invoice');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Smart PDF Upload</h2>
        
        {/* File Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select PDF Files
          </label>
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Manual Invoice Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link to Invoice (Optional)
          </label>
          <select
            value={selectedInvoice}
            onChange={(e) => setSelectedInvoice(e.target.value)}
            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Auto-detect from filename</option>
            {recentInvoices.map((invoice) => (
              <option key={invoice.DocNum} value={invoice.DocNum}>
                {invoice.DocNum} - {invoice.CustName} ({invoice.DocDate})
              </option>
            ))}
          </select>
        </div>

        {/* Upload Button */}
        <div className="mb-6">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Results</h3>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{result.filename}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.success ? '✅ ' : '⚠️ '}
                      {result.message || result.error}
                    </p>
                    {result.invoiceId && (
                      <p className="text-sm text-blue-600 mt-1">
                        Linked to Invoice: {result.invoiceId}
                      </p>
                    )}
                  </div>
                  
                  {/* Manual linking for unlinked files */}
                  {!result.success && result.publicUrl && (
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleManualLink(result, e.target.value);
                          }
                        }}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Link to Invoice</option>
                        {recentInvoices.map((invoice) => (
                          <option key={invoice.DocNum} value={invoice.DocNum}>
                            {invoice.DocNum} - {invoice.CustName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
