'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/utils/supabase/server';
import { OINV, INV1 } from './definitions';

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
        DocDate: formData.header.DocDate,
        DueDate: formData.header.DueDate,
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
