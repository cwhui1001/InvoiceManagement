'use client';

import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { ArrowUpIcon } from '@heroicons/react/20/solid';
import { inter } from '@/app/ui/fonts';

const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

export function CardWrapper({
  totalInvoices,
  totalPending,
}: {
  totalInvoices: number;
  totalPending: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      <Card title="Total Invoices" value={totalInvoices} type="invoices" />
      <Card title="Pending Invoices" value={totalPending} type="pending" />
    </div>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'customers' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  const variants = {
    invoices: { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-700' },
    customers: { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-700' },
    pending: { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', text: 'text-amber-700' },
    collected: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-700' },
    default: { bg: 'from-gray-50 to-gray-100', border: 'border-gray-200', text: 'text-gray-700' },
  };

  const variant = variants[type] || variants.default;

  return (
    <div
      className={`group rounded-2xl bg-gradient-to-br ${variant.bg} p-6 shadow-sm border ${variant.border} transition-transform duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`mt-2 text-4xl font-semibold ${variant.text}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-white/40 backdrop-blur-sm`}>
            <Icon className={`h-6 w-6 ${variant.text}`} />
          </div>
        )}
      </div>

      {/* Optional trend indicator */}
      <div className="mt-5 flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-200">
        <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
        <span>12% from last month</span>
      </div>
    </div>
  );
}
