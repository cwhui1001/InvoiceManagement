import { Suspense } from 'react';
import { InvoiceSearch } from '@/app/ui/invoices/search';
import { InvoiceStatusFilter } from '@/app/ui/invoices/status-filter';
import InvoicesTable from '@/app/ui/invoices/table';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Metadata } from 'next';
import { fetchFilteredInvoices, fetchInvoicesPages } from '@/app/lib/data';
import Pagination from '@/app/ui/invoices/pagination';
import UploadButton from '@/app/ui/invoices/upload-button';

export const metadata: Metadata = {
  title: 'Invoices',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params?.query || '';
  const status = params?.status || '';
  const currentPage = Number(params?.page) || 1;

  const [invoices, totalPages] = await Promise.all([
    fetchFilteredInvoices(query, currentPage, status),
    fetchInvoicesPages(query),
  ]);

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your invoices and track payments
            </p>
          </div>
          <UploadButton />
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <InvoiceSearch placeholder="Search invoices..." />
            </div>
            <div className="sm:w-48">
              <InvoiceStatusFilter />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="mb-6">
        <Suspense fallback={<InvoicesTableSkeleton />}>
          <InvoicesTable invoices={invoices} />
        </Suspense>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}