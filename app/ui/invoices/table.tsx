import { type InvoicesTable } from '@/app/lib/definitions';
import ClientInvoiceTable from './client-table';

export default function InvoicesTable({
  invoices,
}: {
  invoices: InvoicesTable[];
}) {
  return <ClientInvoiceTable invoices={invoices} />;
}
