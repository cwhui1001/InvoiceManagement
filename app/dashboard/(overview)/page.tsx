import { CardWrapper, Card } from '@/app/ui/dashboard/cards';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import { inter } from '@/app/ui/fonts';
import { fetchLatestInvoices, fetchCardData } from '@/app/lib/data';
 
export default async function Page() {
    const latestInvoices = await fetchLatestInvoices();
    const { numberOfInvoices, numberOfPendingInvoices } = await fetchCardData();
  return (
    <main>
      <h1 className={`${inter.className} text-3xl font-bold text-gray-900 mb-2`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-1">
        <CardWrapper
          totalInvoices={numberOfInvoices}
          totalPending={numberOfPendingInvoices}
          invoiceTrend={[2, 3, 5, 6, 4, 5, 7]} // trend line for Total Invoices
          pendingTrend={[1, 2, 1, 3, 2, 2, 3]} // trend line for Pending
        />

      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <LatestInvoices latestInvoices={latestInvoices.map(invoice => ({
          ...invoice,
          status: invoice.status === 'done' ? 'done' : 'pending',
        }))} />
      </div>
    </main>
  );
}