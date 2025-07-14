import { notFound } from 'next/navigation';
import { fetchInvoiceForEdit, fetchCustomers } from '@/app/lib/data-supabase';
import EditInvoiceForm from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  try {
    const [invoiceData, customers] = await Promise.all([
      fetchInvoiceForEdit(id),
      fetchCustomers()
    ]);
    
    if (!invoiceData) {
      notFound();
    }

    return (
      <main>
        <Breadcrumbs
          breadcrumbs={[
            { label: 'Invoices', href: '/dashboard/invoices' },
            {
              label: 'Edit Invoice',
              href: `/dashboard/invoices/${id}/edit`,
              active: true,
            },
          ]}
        />
        <EditInvoiceForm invoiceData={invoiceData} customers={customers} />
      </main>
    );
  } catch (error) {
    console.error('Error loading invoice:', error);
    notFound();
  }
}
