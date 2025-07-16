'use client';

import { useState, useEffect } from 'react';
import { DocumentIcon, LinkIcon } from '@heroicons/react/24/outline';

interface PdfFile {
  id: number;
  created_at: string;
  InvoiceID: string | null;
  pdf_url: string;
  pdf_filename: string;
}

export default function PdfManagement() {
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [linkingPdf, setLinkingPdf] = useState<number | null>(null);

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pdfs');
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

  const linkPdfToInvoice = async (pdfId: number, invoiceId: string) => {
    if (!invoiceId.trim()) {
      alert('Please enter an invoice ID');
      return;
    }

    try {
      setLinkingPdf(pdfId);
      
      const response = await fetch('/api/admin/pdfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfId, invoiceId: invoiceId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link PDF');
      }

      alert('PDF linked successfully!');
      fetchPdfs(); // Refresh the list
    } catch (err) {
      console.error('Error linking PDF:', err);
      alert(err instanceof Error ? err.message : 'Failed to link PDF');
    } finally {
      setLinkingPdf(null);
    }
  };

  const handleLinkSubmit = (pdfId: number, e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const invoiceId = formData.get('invoiceId') as string;
    linkPdfToInvoice(pdfId, invoiceId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">PDF Management</h2>
        <button
          onClick={fetchPdfs}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {pdfs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No PDF files found.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Invoice ID
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
                          <div className="text-sm text-gray-500">
                            ID: {pdf.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        pdf.InvoiceID 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pdf.InvoiceID || 'Not linked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pdf.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <form onSubmit={(e) => handleLinkSubmit(pdf.id, e)} className="flex items-center gap-2">
                        <input
                          type="text"
                          name="invoiceId"
                          placeholder="Enter Invoice ID"
                          defaultValue={pdf.InvoiceID || ''}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={linkingPdf === pdf.id}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {linkingPdf === pdf.id ? 'Linking...' : 'Link'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
