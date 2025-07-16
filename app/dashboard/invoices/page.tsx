import { Suspense } from 'react';
import { InvoiceSearch } from '@/app/ui/invoices/search';
import { StatusFilter } from '@/app/ui/invoices/status-filter-individual';
import { DateRangeFilter } from '@/app/ui/invoices/date-range-filter';
import { AmountRangeFilter } from '@/app/ui/invoices/amount-range-filter';
import InvoicesTable from '@/app/ui/invoices/table';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Metadata } from 'next';
import { fetchFilteredInvoices, fetchInvoicesPages } from '@/app/lib/data';
import Pagination from '@/app/ui/invoices/pagination';
import UploadButton from '@/app/ui/invoices/upload-button';
import RefreshButton from '@/app/ui/invoices/refresh-button';
import PdfList from '@/app/ui/invoices/pdf-list';
import PdfManagement from '@/app/ui/admin/pdf-management';

export const metadata: Metadata = {
  title: 'Invoices',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: string;
    amountMax?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params?.query || '';
  const status = params?.status || '';
  const dateFrom = params?.dateFrom || '';
  const dateTo = params?.dateTo || '';
  const amountMin = params?.amountMin || '';
  const amountMax = params?.amountMax || '';
  const currentPage = Number(params?.page) || 1;

  const [invoices, totalPages] = await Promise.all([
    fetchFilteredInvoices(query, currentPage, status, dateFrom, dateTo, amountMin, amountMax),
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
          <div className="flex items-center gap-3">
            <RefreshButton />
            <UploadButton />
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <InvoiceSearch placeholder="Search invoices..." />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <StatusFilter />
              <DateRangeFilter />
              <AmountRangeFilter />
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

      {/* PDF Files Section */}
      <div className="mb-6">
        <PdfList />
      </div>

      {/* PDF Management Section */}
      <div className="mb-6">
        <PdfManagement />
      </div>

      {/* Pagination Section */}
      <div className="flex justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}