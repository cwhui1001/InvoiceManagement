'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { inter } from '@/app/ui/fonts';
import { LatestInvoice } from '@/app/lib/definitions';
import { formatDateFromObject } from '@/app/lib/utils';
import { UpdateInvoice } from '@/app/ui/invoices/buttons';
import { DocumentIcon } from '@heroicons/react/20/solid';
import RefreshButton from '../invoices/refresh-button';

export default function LatestInvoices({
  latestInvoices,
}: {
  latestInvoices: LatestInvoice[];
}) {
  const handlePdfView = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data.multiple) {
          const fileList = data.files.map((file: any) => 
            `${file.filename} (${new Date(file.created_at).toLocaleDateString()})`
          ).join('\n');
          
          const choice = confirm(
            `Multiple PDFs found for invoice ${invoiceId}:\n\n${fileList}\n\nClick OK to view the most recent PDF.`
          );
          
          if (choice && data.files.length > 0) {
            window.open(data.files[0].url, '_blank');
          }
        } else if (data.error) {
          alert(data.error);
        }
      } else {
        window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
      }
    } catch (error) {
      console.error('Error accessing PDF:', error);
      alert('Error accessing PDF file. Please try again.');
    }
  };

  return (
    <div className="flex w-full flex-col md:col-span-8">
      <div className="mb-6 flex items-center justify-between">
  <h2 className={`${inter.className} text-xl md:text-2xl font-bold text-gray-900`}>
    Latest Invoices
  </h2>
  <RefreshButton />
</div>

      <div className="flex grow flex-col justify-between rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden min-h-96">
        <div className="overflow-hidden">
          {/* Desktop Header Row */}
          <div className="hidden md:grid grid-cols-6 gap-4 items-center py-4 px-6 bg-gray-50 border-b border-gray-200">
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Invoice
            </div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              Date
            </div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider col-span-2">
              Customer
            </div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider text-right">
              Amount
            </div>
            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider text-right">
              Actions
            </div>
          </div>
          
          {/* Data Rows */}
          {latestInvoices.map((invoice, i) => (
            <div key={invoice.id}>
              {/* Desktop Layout */}
              <div
                className={clsx(
                  'hidden md:grid grid-cols-6 gap-4 items-center py-4 px-6 hover:bg-blue-50 transition-colors duration-200',
                  {
                    'border-t border-gray-100': i !== 0,
                  },
                )}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handlePdfView(invoice.id)}
                      className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors cursor-pointer flex items-center gap-1"
                    >
                      #{invoice.id}
                      {invoice.pdf_url && (
                        <DocumentIcon className="h-4 w-4 text-blue-500" />
                    )}
                  </button>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {formatDateFromObject(invoice.date)}
                </span>
                <span className="text-sm text-gray-800 truncate col-span-2 font-medium">
                  {invoice.name || 'Unknown Customer'}
                </span>
                <span className={`${inter.className} text-sm font-bold text-green-600 text-right`}>
                  {invoice.amount}
                </span>
                <div className="flex justify-end">
                  <UpdateInvoice id={invoice.id} />
                </div>
              </div>

              {/* Mobile Layout */}
              <div
                className={clsx(
                  'md:hidden py-5 px-4 hover:bg-blue-50 transition-colors duration-200',
                  {
                    'border-t border-gray-100': i !== 0,
                  },
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div>
                      <button
                        onClick={() => handlePdfView(invoice.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold flex items-center gap-1 text-sm"
                        >
                          #{invoice.id}
                          {invoice.pdf_url && (
                            <DocumentIcon className="h-4 w-4 text-blue-500" />
                        )}
                      </button>
                      <p className="text-xs text-gray-500 font-medium">
                        {formatDateFromObject(invoice.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`${inter.className} text-lg font-bold text-green-600`}>
                        {invoice.amount}
                      </p>
                    </div>
                    <UpdateInvoice id={invoice.id} />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-800 truncate font-medium">
                    {invoice.name || 'Unknown Customer'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
          
          <div className="ml-auto flex items-center">
            
          </div>
        </div>
      </div>
    </div>
  );
}