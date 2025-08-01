// Import Supabase functions
import {
  fetchCardData,
  fetchFilteredInvoices,
  fetchInvoicesPages,
  fetchInvoiceById,
  fetchCustomers,
  fetchFilteredCustomers,
  fetchCategoryTotals,
  fetchUsersWithUploads,
  fetchUserCategoryTotals,
} from './data-supabase';

// Constants
const DATABASE_TYPE = 'supabase'; // Hardcode for Supabase only
const ITEMS_PER_PAGE = 6;

// Export all Supabase functions directly
export {
  fetchCardData,
  fetchFilteredInvoices,
  fetchInvoicesPages,
  fetchInvoiceById,
  fetchCustomers,
  fetchFilteredCustomers,
  fetchCategoryTotals,
  fetchUsersWithUploads,
  fetchUserCategoryTotals,
};

// Export updateInvoiceStatus function (assuming it's used)
export async function updateInvoiceStatus(invoiceId: string, newStatus: string) {
  try {
    const supabase = await createAdminClient();

    // Map UI status (lowercase) to database status (capitalized)
    const dbStatus = newStatus.toLowerCase() === 'done' ? 'Done' : 'Pending';

    console.log('Updating invoice status:', { invoiceId, newStatus, dbStatus });

    const { data, error } = await supabase
      .from('OINV')
      .update({
        Status: dbStatus,
      })
      .eq('DocNum', invoiceId)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Update successful:', data);
    revalidatePath('/dashboard/invoices');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

// Assuming createAdminClient and revalidatePath are available (e.g., from Next.js or Supabase utils)
import { createAdminClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';