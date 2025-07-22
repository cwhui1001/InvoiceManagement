'use client';

import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { ArrowUpIcon } from '@heroicons/react/20/solid';
import { inter } from '@/app/ui/fonts';
import { LineChart, Line, ResponsiveContainer, Tooltip, AreaChart, Area, ReferenceLine } from 'recharts';


const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

export function CardWrapper({
  totalInvoices,
  totalPending,
  invoiceTrend,
  pendingTrend,
}: {
  totalInvoices: number;
  totalPending: number;
  invoiceTrend: number[];
  pendingTrend: number[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
      <Card title="Total Invoices" value={totalInvoices} type="invoices" trendData={invoiceTrend} />
      <Card title="Pending Invoices" value={totalPending} type="pending" trendData={pendingTrend} />
    </div>
  );
}



export function Card({
  title,
  value,
  type,
  trendData,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'customers' | 'pending' | 'collected';
  trendData: number[];
}) {
  const Icon = iconMap[type];

  const variants = {
    invoices: { 
      bg: 'from-purple-50 to-purple-100', 
      border: 'border-purple-200', 
      text: 'text-purple-700',
      chartColor: '#8b5cf6',
      gradientId: 'purpleGradient'
    },
    customers: { 
      bg: 'from-green-50 to-green-100', 
      border: 'border-green-200', 
      text: 'text-green-700',
      chartColor: '#10b981',
      gradientId: 'greenGradient'
    },
    pending: { 
      bg: 'from-amber-50 to-amber-100', 
      border: 'border-amber-200', 
      text: 'text-amber-700',
      chartColor: '#f59e0b',
      gradientId: 'amberGradient'
    },
    collected: { 
      bg: 'from-blue-50 to-blue-100', 
      border: 'border-blue-200', 
      text: 'text-blue-700',
      chartColor: '#3b82f6',
      gradientId: 'blueGradient'
    },
  };

  const variant = variants[type] || {
    bg: 'from-gray-50 to-gray-100',
    border: 'border-gray-200',
    text: 'text-gray-700',
    chartColor: '#6b7280',
    gradientId: 'grayGradient'
  };

  // Prepare enhanced chart data
  const chartData = trendData.map((value, index) => ({
    name: `${index + 1}`,
    value,
    // Add a reference line at the average
    avg: trendData.reduce((a, b) => a + b, 0) / trendData.length
  }));

  // Calculate percentage change
  const percentageChange = trendData.length > 1 
    ? ((trendData[trendData.length - 1] - trendData[0]) / trendData[0]) * 100
    : 0;

  return (
    <div
      className={`group rounded-2xl bg-gradient-to-br ${variant.bg} p-6 shadow-sm border ${variant.border} transition-transform duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      {/* SVG gradient definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={variant.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={variant.chartColor} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={variant.chartColor} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
      </svg>

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

      {/* Enhanced chart container */}
      <div className="mt-4 h-20 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={variant.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={variant.chartColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={variant.chartColor} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={variant.chartColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${variant.gradientId})`}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                fill: '#fff',
                stroke: variant.chartColor
              }}
            />
            <ReferenceLine 
              y={chartData[0].avg} 
              stroke={variant.chartColor} 
              strokeDasharray="3 3" 
              strokeOpacity={0.5} 
            />
            <Tooltip
              content={({ payload, label }) => (
                <div className="bg-white p-2 shadow-lg rounded-md border border-gray-200">
                  <p className="font-medium text-sm">{`Day ${label}`}</p>
                  <p className="text-sm" style={{ color: variant.chartColor }}>
                    {payload && payload[0]?.value} {type === 'invoices' ? 'invoices' : type === 'pending' ? 'pending' : ''}
                  </p>
                </div>
              )}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      
    </div>
  );
}