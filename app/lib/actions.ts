'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/utils/supabase/server';
import { OINV, INV1 } from './definitions';

// Helper function to convert Date object to database format
const formatDateForDatabase = (date: Date | null): string | null => {
  if (!date || isNaN(date.getTime())) {
    return null;
  }
  
  // Since your database columns are TEXT type, use DD/MM/YYYY format
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`; // DD/MM/YYYY
};

export async function updateInvoice(
  docNum: string,
  formData: {
    header: OINV;
    lineItems: INV1[];
  }
) {
  try {
    const supabase = createAdminClient();

    // Update the invoice header in OINV table
    const { error: headerError } = await supabase
      .from('OINV')
      .update({
        DocDate: formatDateForDatabase(formData.header.DocDate),
        DueDate: formatDateForDatabase(formData.header.DueDate),
        DeliveryDate: formData.header.DeliveryDate ? formatDateForDatabase(formData.header.DeliveryDate) : null,
        CustName: formData.header.CustName,
        CustAddress: formData.header.CustAddress,
        VendorName: formData.header.VendorName,
        CustCode: formData.header.CustCode,
        VendorCode: formData.header.VendorCode,
        VendorAddresss: formData.header.VendorAddresss,
        Totalb4GST: formData.header.Totalb4GST,
        TotalwithGST: formData.header.TotalwithGST,
      })
      .eq('DocNum', docNum);

    if (headerError) {
      console.error('Error updating invoice header:', headerError);
      throw new Error('Failed to update invoice header');
    }

    // Delete existing line items
    const { error: deleteError } = await supabase
      .from('INV1')
      .delete()
      .eq('DocNum', docNum);

    if (deleteError) {
      console.error('Error deleting existing line items:', deleteError);
      throw new Error('Failed to delete existing line items');
    }

    // Insert new line items
    const { error: insertError } = await supabase
      .from('INV1')
      .insert(formData.lineItems);

    if (insertError) {
      console.error('Error inserting line items:', insertError);
      throw new Error('Failed to insert line items');
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

export async function deleteInvoice(docNum: string) {
  try {
    const supabase = createAdminClient();

    // Delete line items first (due to foreign key constraint)
    const { error: deleteLineItemsError } = await supabase
      .from('INV1')
      .delete()
      .eq('DocNum', docNum);

    if (deleteLineItemsError) {
      console.error('Error deleting line items:', deleteLineItemsError);
      throw new Error('Failed to delete line items');
    }

    // Delete invoice header
    const { error: deleteHeaderError } = await supabase
      .from('OINV')
      .delete()
      .eq('DocNum', docNum);

    if (deleteHeaderError) {
      console.error('Error deleting invoice header:', deleteHeaderError);
      throw new Error('Failed to delete invoice header');
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

export async function updateInvoiceStatus(docNum: string, newStatus: string) {
  try {
    const supabase = createAdminClient();

    // Map UI status to database status
    const dbStatus = newStatus === 'paid' ? 'Done' : 'Pending';

    console.log('Updating invoice status:', { docNum, newStatus, dbStatus });

    const { data, error } = await supabase
      .from('OINV')
      .update({
        Status: dbStatus,
      })
      .eq('DocNum', docNum)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Update successful:', data);
    revalidatePath('/dashboard/invoices');
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}
