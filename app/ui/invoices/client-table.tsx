'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UpdateInvoice, DeleteInvoice } from '@/app/ui/invoices/buttons';
import InteractiveInvoiceStatus from '@/app/ui/invoices/interactive-status';
import BulkActions from '@/app/ui/invoices/bulk-actions';
import { formatDateToLocal, formatCurrency, formatDateFromObject } from '@/app/lib/utils';
import { type InvoicesTable } from '@/app/lib/definitions';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, DocumentIcon } from '@heroicons/react/24/outline';

type SortField = 'id' | 'date' | 'name' | 'amount' | 'status';
type SortDirection = 'asc' | 'desc';

export default function ClientInvoiceTable({
  invoices,
}: {
  invoices: InvoicesTable[];
}) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debug logging
  console.log('Invoices data:', invoices.map(inv => ({
    id: inv.id,
    has_uploaded_pdf: inv.has_uploaded_pdf,
    uploader_username: inv.uploader_username
  })));

  // Handle PDF viewing
  const handlePdfView = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Handle multiple PDFs case
        const data = await response.json();
        if (data.multiple) {
          // Show modal or dropdown with multiple PDF options
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
        // Single PDF case - the response is already the PDF
        window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
      }
    } catch (error) {
      console.error('Error accessing PDF:', error);
      alert('Error accessing PDF file. Please try again.');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvoices = [...invoices].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle different data types
    if (sortField === 'date') {
      aValue = new Date(a.date).getTime();
      bValue = new Date(b.date).getTime();
    } else if (sortField === 'amount') {
      aValue = Number(a.amount);
      bValue = Number(b.amount);
    } else if (sortField === 'name') {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortField === 'id') {
      aValue = a.id.toLowerCase();
      bValue = b.id.toLowerCase();
    } else if (sortField === 'status') {
      aValue = a.status.toLowerCase();
      bValue = b.status.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Bulk selection functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allInvoiceIds = sortedInvoices.map(invoice => invoice.id);
      setSelectedInvoices(allInvoiceIds);
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleDeselectAll = () => {
    setSelectedInvoices([]);
  };

  const handleActionComplete = () => {
    setRefreshKey(prev => prev + 1);
    // This will trigger a re-render and the parent component should refetch data
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      scope="col" 
      className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col">
          <ChevronUpIcon 
            className={`w-3 h-3 ${sortField === field && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
          />
          <ChevronDownIcon 
            className={`w-3 h-3 -mt-1 ${sortField === field && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
          />
        </div>
      </div>
    </th>
  );
  return (
    <div className="mt-6 flow-root pb-6">
      {/* Bulk Actions */}
      <BulkActions
        selectedInvoices={selectedInvoices}
        onDeselectAll={handleDeselectAll}
        onActionComplete={handleActionComplete}
      />
      
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden">
          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100">
            {sortedInvoices?.map((invoice: InvoicesTable) => (
              <div
                key={invoice.id}
                className="p-6 hover:bg-blue-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex flex-col">
                      <button
                        onClick={() => handlePdfView(invoice.id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors cursor-pointer flex items-center gap-1"
                        title={invoice.pdf_url ? 'Click to view PDF' : 'No PDF available'}
                      >
                        #{invoice.docNum || invoice.id}
                        {invoice.pdf_url && (
                          <DocumentIcon className="h-4 w-4 text-blue-500" />
                        )}
                      </button>
                      <span className="text-xs text-gray-500 mt-0.5">
                        {invoice.uploader_username
                          ? `uploaded by ${invoice.uploader_username}`
                          : invoice.has_uploaded_pdf
                            ? 'uploaded file'
                            : 'uploaded by user'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{invoice.name}</p>
                      <p className="text-sm text-gray-500 font-medium">{formatDateFromObject(invoice.date)}</p>
                    </div>
                  </div>
                  <InteractiveInvoiceStatus id={invoice.id} status={invoice.status} />
                </div>
                <div className="flex w-full items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateInvoice id={invoice.id} />
                    <DeleteInvoice id={invoice.id} onModalStateChange={setIsModalOpen} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop Table */}
          <div className="overflow-x-auto">
            <table className="hidden min-w-full text-gray-900 md:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === sortedInvoices.length && sortedInvoices.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <SortableHeader field="id">Invoice ID</SortableHeader>
                  <SortableHeader field="date">Date</SortableHeader>
                  <SortableHeader field="name">Customer</SortableHeader>
                  <SortableHeader field="amount">Total Amount</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedInvoices?.map((invoice: InvoicesTable) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-blue-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex flex-col">
                          <button
                            onClick={() => handlePdfView(invoice.id)}
                            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors cursor-pointer flex items-center gap-1"
                            title={invoice.pdf_url ? 'Click to view PDF' : 'No PDF available'}
                          >
                            #{invoice.docNum || invoice.id}
                            {invoice.pdf_url && (
                              <DocumentIcon className="h-4 w-4 text-blue-500" />
                            )}
                          </button>
                          <span className="text-xs text-gray-500 mt-0.5">
                            {invoice.uploader_username
                              ? `uploaded by ${invoice.uploader_username}`
                              : invoice.has_uploaded_pdf
                                ? 'uploaded file'
                                : 'uploaded by user'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-600">
                        {formatDateFromObject(invoice.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">{invoice.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        {formatCurrency(invoice.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <InteractiveInvoiceStatus id={invoice.id} status={invoice.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-2">
                        <UpdateInvoice id={invoice.id} />
                        <DeleteInvoice id={invoice.id} onModalStateChange={setIsModalOpen} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
