import { CardWrapper, Card } from '@/app/ui/dashboard/cards';
import { inter } from '@/app/ui/fonts';
import { fetchCardData, fetchCategoryTotals, fetchUsersWithUploads, fetchTopUploaders } from '@/app/lib/data';
import CategoryPieChart from '@/app/ui/dashboard/CategoryPieChart';
import UserCategoryPieChart from '@/app/ui/dashboard/UserCategoryPieChart';
import TopUploaders from '@/app/ui/dashboard/TopUploaders';

export default async function Page() {
  console.log('Starting Page render');
  const { numberOfInvoices, numberOfPendingInvoices } = await fetchCardData();
  const categoryTotals = await fetchCategoryTotals();
  const usersWithUploads = await fetchUsersWithUploads();
  const topUploaders = await fetchTopUploaders();
  
  return (
    <main className="p-4 md:p-4">
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
        <div className="bg-gradient-to-br from-yellow-50 to-white p-4 rounded-xl shadow-md h-[500px] sm:h-[450px]">
          <CategoryPieChart categoryTotals={categoryTotals} />
        </div>
      </div>

      {/* Third row with user category pie chart */}
      <div className="mt-6">
        <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl shadow-md h-[600px] sm:h-[550px]">
          <UserCategoryPieChart users={usersWithUploads} />
        </div>
      </div>

      {/* Fourth row with top uploaders */}
      <div className="mt-6">
        <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md">
          <TopUploaders uploaders={topUploaders} />
        </div>
      </div>
    </main>
  );
}