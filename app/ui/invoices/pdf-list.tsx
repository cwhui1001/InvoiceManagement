'use client';

import { useState, useEffect } from 'react';
import { DocumentIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface PdfFile {
  id: number;
  created_at: string;
  pdf_url: string;
  pdf_filename: string;
  pdf_uuid: string;
  oinv_uuid: string | null;
  uploader_display?: string;
  invoice_docnum?: string;
}

interface PdfListProps {
  invoiceId?: string;
  refreshTrigger?: number;
}

export default function PdfList({ invoiceId, refreshTrigger = 0 }: PdfListProps) {
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const url = invoiceId 
        ? `/api/invoices/pdfs?invoiceId=${invoiceId}`
        : '/api/invoices/pdfs';
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch PDFs');
      }

      setPdfs(data.pdfs);
      setError('');
    } catch (err) {
      console.error('Error fetching PDFs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch PDFs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, [invoiceId, refreshTrigger]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleView = (pdfId: number) => {
    const pdfUrl = `/api/invoices/pdfs/${pdfId}`;
    window.open(pdfUrl, '_blank');
  };

  const handleDownload = (pdfId: number, filename: string) => {
    const pdfUrl = `/api/invoices/pdfs/${pdfId}`;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading PDFs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchPdfs}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p>No PDF files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Uploaded PDF Files ({pdfs.length})
        </h3>
        <button
          onClick={fetchPdfs}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pdfs.map((pdf) => (
                <tr key={pdf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentIcon className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {pdf.pdf_filename}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        pdf.invoice_docnum 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pdf.invoice_docnum || 'Pending'}
                      </span>
                      {pdf.uploader_display && (
                        <span className="text-xs text-gray-500 mt-1">
                          by {pdf.uploader_display}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(pdf.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleView(pdf.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title="View PDF"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(pdf.id, pdf.pdf_filename)}
                        className="text-green-600 hover:text-green-900 flex items-center"
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
