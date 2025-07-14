import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Image from 'next/image';
import { inter } from '@/app/ui/fonts';
import { LatestInvoice } from '@/app/lib/definitions';
export default async function LatestInvoices({
  latestInvoices,
}: {
  latestInvoices: LatestInvoice[];
}) {
  return (
    <div className="flex w-full flex-col md:col-span-8">
      <h2 className={`${inter.className} mb-4 text-xl md:text-2xl`}>
        Latest Invoices
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gray-50 p-4 min-h-96">
        <div className="bg-white px-6 py-4">
          {/* Desktop Header Row */}
          <div className="hidden md:grid grid-cols-5 gap-4 items-center py-2 border-b border-gray-200 mb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Invoice
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Date
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide col-span-2">
              Customer
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
              Amount
            </div>
          </div>
          
          {/* Data Rows */}
          {latestInvoices.map((invoice, i) => {
            return (
              <div key={invoice.id}>
                {/* Desktop Layout */}
                <div
                  className={clsx(
                    'hidden md:grid grid-cols-5 gap-4 items-center py-3',
                    {
                      'border-t': i !== 0,
                    },
                  )}
                >
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 mr-2">
                      <span className="text-sm font-semibold text-blue-600">
                        {invoice.name ? invoice.name.charAt(0).toUpperCase() : 'C'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      #{invoice.id}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {invoice.date}
                  </span>
                  <span className="text-sm text-gray-800 truncate col-span-2">
                    {invoice.name || 'Unknown Customer'}
                  </span>
                  <span className={`${inter.className} text-sm font-medium text-green-600 text-right`}>
                    {invoice.amount}
                  </span>
                </div>

                {/* Mobile Layout */}
                <div
                  className={clsx(
                    'md:hidden py-4 px-2',
                    {
                      'border-t border-gray-200': i !== 0,
                    },
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 mr-3">
                        <span className="text-sm font-semibold text-blue-600">
                          {invoice.name ? invoice.name.charAt(0).toUpperCase() : 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          #{invoice.id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {invoice.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${inter.className} text-lg font-semibold text-green-600`}>
                        {invoice.amount}
                      </p>
                    </div>
                  </div>
                  <div className="ml-13">
                    <p className="text-sm text-gray-800 truncate">
                      {invoice.name || 'Unknown Customer'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-500" />
          <h3 className="ml-2 text-sm text-gray-500 ">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}
