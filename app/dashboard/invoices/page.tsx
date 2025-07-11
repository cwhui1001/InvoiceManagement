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
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl">Invoices</h1>
        <UploadButton />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <InvoiceSearch placeholder="Search invoices..." />
        <InvoiceStatusFilter />
      </div>
      <InvoicesTable invoices={invoices} />
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}