import { CardWrapper, Card } from '@/app/ui/dashboard/cards';
import { inter } from '@/app/ui/fonts';
import { fetchLatestInvoices, fetchCardData, fetchCategoryTotals } from '@/app/lib/data';
import CategoryPieChart from '@/app/ui/dashboard/CategoryPieChart';

export default async function Page() {
  console.log('Starting Page render');
  const latestInvoices = await fetchLatestInvoices();
  const { numberOfInvoices, numberOfPendingInvoices } = await fetchCardData();
  const categoryTotals = await fetchCategoryTotals();
  
  return (
    <main className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className={`${inter.className} text-3xl font-bold text-gray-900`}>
          Dashboard Overview
        </h1>
        <p className="text-gray-600 mt-1">Key metrics and insights</p>
      </div>
      
      {/* First row with two cards */}
      <div className="grid gap-6 sm:grid-cols-1">
        
          <CardWrapper
            totalInvoices={numberOfInvoices}
            totalPending={numberOfPendingInvoices}
            invoiceTrend={[2, 3, 5, 6, 4, 5, 7]}
            pendingTrend={[1, 2, 1, 3, 2, 2, 3]}
          />
      </div>
      
      {/* Second row with pie chart (full width) */}
      <div className="mt-6">
        <div className="bg-gradient-to-br from-yellow-50 to-white p-4 rounded-xl shadow-md h-[450px] sm:h-[400px]">
          <CategoryPieChart categoryTotals={categoryTotals} />
        </div>
      </div>
    </main>
  );
}