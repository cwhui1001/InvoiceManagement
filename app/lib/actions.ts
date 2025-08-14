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
  originalDocNum: string,
  formData: {
    header: OINV;
    lineItems: INV1[];
  }
) {
  try {
    const supabase = await createAdminClient();
    const newDocNum = formData.header.DocNum;

    // Check if DocNum has changed
    if (originalDocNum !== newDocNum) {
      // DocNum has changed - need to create new record and delete old one
      
      // First check if new DocNum already exists
      const { data: existingInvoice, error: checkError } = await supabase
        .from('OINV')
        .select('DocNum')
        .eq('DocNum', newDocNum)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking for existing DocNum:', checkError);
        throw new Error('Failed to validate new document number');
      }

      if (existingInvoice) {
        throw new Error(`Document number ${newDocNum} already exists. Please use a different number.`);
      }

      // Create new invoice with new DocNum
      const { error: insertHeaderError } = await supabase
        .from('OINV')
        .insert({
          DocNum: newDocNum,
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
          Status: formData.header.Status || 'Pending',
          pdf_url: formData.header.pdf_url,
          uuid: formData.header.uuid,
        });

      if (insertHeaderError) {
        console.error('Error creating new invoice header:', insertHeaderError);
        throw new Error('Failed to create new invoice header');
      }

      // Insert new line items with new DocNum
      const { error: insertLineItemsError } = await supabase
        .from('INV1')
        .insert(formData.lineItems);

      if (insertLineItemsError) {
        console.error('Error creating new line items:', insertLineItemsError);
        // Rollback: delete the header we just created
        await supabase.from('OINV').delete().eq('DocNum', newDocNum);
        throw new Error('Failed to create new line items');
      }

      // Now delete the old invoice (line items first due to foreign key)
      const { error: deleteOldLineItemsError } = await supabase
        .from('INV1')
        .delete()
        .eq('DocNum', originalDocNum);

      if (deleteOldLineItemsError) {
        console.error('Error deleting old line items:', deleteOldLineItemsError);
        // Continue anyway as the new invoice is already created
      }

      const { error: deleteOldHeaderError } = await supabase
        .from('OINV')
        .delete()
        .eq('DocNum', originalDocNum);

      if (deleteOldHeaderError) {
        console.error('Error deleting old invoice header:', deleteOldHeaderError);
        // Continue anyway as the new invoice is already created
      }
      
    } else {
      // DocNum hasn't changed - regular update
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
        .eq('DocNum', originalDocNum);

      if (headerError) {
        console.error('Error updating invoice header:', headerError);
        throw new Error('Failed to update invoice header');
      }

      // Delete existing line items
      const { error: deleteError } = await supabase
        .from('INV1')
        .delete()
        .eq('DocNum', originalDocNum);

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
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    console.log('Attempting to delete invoice with ID:', invoiceId);
    const supabase = await createAdminClient();

    // First, get the invoice data including PDF info
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('OINV')
      .select('DocNum, pdf_url')
      .eq('DocNum', invoiceId)
      .single();

    console.log('Invoice lookup result:', { invoiceData, invoiceError });

    if (invoiceError) {
      console.error('Error finding invoice:', invoiceError);
      throw new Error(`Failed to find invoice: ${invoiceError.message}`);
    }

    // Get associated PDF files from the pdf table
    const { data: pdfFiles, error: pdfError } = await supabase
      .from('pdf')
      .select('pdf_url, pdf_uuid')
      .ilike('pdf_url', `%${invoiceData.DocNum}%`);

    if (pdfError) {
      console.log('Warning: Could not fetch PDF files:', pdfError);
    }

    console.log('Found PDF files to delete:', pdfFiles);

    // Helper function to extract file path from Supabase URL
    const getFilePathFromUrl = (url: string): { bucket: string; path: string } | null => {
      if (!url) return null;
      
      // Extract bucket and path from Supabase storage URLs
      // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
      // or: https://{project}.supabase.co/storage/v1/object/{bucket}/{path}
      const match = url.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
      if (match) {
        return {
          bucket: match[1],
          path: match[2]
        };
      }
      return null;
    };

    // Delete files from Supabase storage
    const filesToDelete = new Set<string>();

    // Add files from OINV table
    if (invoiceData.pdf_url) {
      filesToDelete.add(invoiceData.pdf_url);
    }

    // Add files from pdf table
    if (pdfFiles && pdfFiles.length > 0) {
      pdfFiles.forEach(pdfFile => {
        if (pdfFile.pdf_url) {
          filesToDelete.add(pdfFile.pdf_url);
        }
      });
    }

    // Delete each file from storage
    for (const fileUrl of filesToDelete) {
      try {
        const fileInfo = getFilePathFromUrl(fileUrl);
        if (fileInfo) {
          console.log(`Deleting file from bucket "${fileInfo.bucket}": ${fileInfo.path}`);
          
          const { error: storageError } = await supabase.storage
            .from(fileInfo.bucket)
            .remove([fileInfo.path]);

          if (storageError) {
            console.error(`Failed to delete file ${fileInfo.path} from bucket ${fileInfo.bucket}:`, storageError);
            // Continue with deletion even if file removal fails
          } else {
            console.log(`Successfully deleted file: ${fileInfo.path}`);
          }
        } else {
          console.log('Could not extract file path from URL:', fileUrl);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileUrl, fileError);
        // Continue with deletion even if individual file deletion fails
      }
    }

    // Delete records from pdf table
    if (pdfFiles && pdfFiles.length > 0) {
      // Use the specific UUIDs of the files we found to ensure precise deletion
      const pdfUuids = pdfFiles.map(file => file.pdf_uuid);
      
      const { error: deletePdfError } = await supabase
        .from('pdf')
        .delete()
        .in('pdf_uuid', pdfUuids);

      if (deletePdfError) {
        console.error('Error deleting PDF records:', deletePdfError);
        // Continue with deletion even if PDF records deletion fails
      } else {
        console.log(`Successfully deleted ${pdfUuids.length} PDF records from pdf table`);
      }
    }

    // Delete line items first (due to foreign key constraint)
    const { error: deleteLineItemsError } = await supabase
      .from('INV1')
      .delete()
      .eq('DocNum', invoiceData.DocNum);

    if (deleteLineItemsError) {
      console.error('Error deleting line items:', deleteLineItemsError);
      throw new Error('Failed to delete line items');
    }

    // Delete invoice header
    const { error: deleteHeaderError } = await supabase
      .from('OINV')
      .delete()
      .eq('DocNum', invoiceData.DocNum);

    if (deleteHeaderError) {
      console.error('Error deleting invoice header:', deleteHeaderError);
      throw new Error('Failed to delete invoice header');
    }

    console.log(`Successfully deleted invoice ${invoiceId} and associated files`);
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw error;
  }
}

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
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

export async function updateBulkInvoiceStatus(invoiceIds: string[], newStatus: string) {
  try {
    const supabase = await createAdminClient();

    // Map UI status (lowercase) to database status (capitalized)
    const dbStatus = newStatus.toLowerCase() === 'done' ? 'Done' : 'Pending';

    console.log('Updating bulk invoice status:', { invoiceIds, newStatus, dbStatus });

    const { data, error } = await supabase
      .from('OINV')
      .update({
        Status: dbStatus,
      })
      .in('DocNum', invoiceIds)
      .select();

    if (error) {
      console.error('Supabase bulk update error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Bulk update successful:', data);
    revalidatePath('/dashboard/invoices');
    return { success: true, updatedCount: data?.length || 0 };
  } catch (error) {
    console.error('Error updating bulk invoice status:', error);
    throw error;
  }
}
