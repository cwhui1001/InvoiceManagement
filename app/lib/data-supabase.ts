import { createClient, createAdminClient } from '@/utils/supabase/server';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
  OINV,
  INV1,
  LatestInvoiceRawSupabase,
  InvoicesTableSupabase,
  CustomerSupabase,
} from './definitions';
import { formatCurrency, convertFromDateInputFormat, parseStringToDate, formatDateFromObject } from './utils';

// Constants
const ITEMS_PER_PAGE = 6;

// Fetch card data from OINV table
export async function fetchCardData() {
  try {
    const supabase = await createClient();

    const { count: invoiceCount, error: invoiceError } = await supabase
      .from('OINV')
      .select('*', { count: 'exact', head: true });
    if (invoiceError) throw invoiceError;

    const { count: pendingCount, error: pendingError } = await supabase
      .from('OINV')
      .select('*', { count: 'exact', head: true })
      .eq('Status', 'Pending');
    if (pendingError) throw pendingError;

    const { data: totalsData, error: totalsError } = await supabase
      .from('OINV')
      .select('TotalwithGST, Totalb4GST');
    if (totalsError) throw totalsError;

    const totalRevenue = (totalsData || []).reduce((sum: number, inv: any) => {
      const amount = inv.TotalwithGST || inv.Totalb4GST || 0;
      return sum + amount;
    }, 0);

    return {
      numberOfInvoices: invoiceCount || 0,
      numberOfPendingInvoices: pendingCount || 0,
      totalRevenue,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

// Fetch filtered invoices from OINV table with PDF upload info
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  status?: string,
  dateFrom?: string,
  dateTo?: string,
  amountMin?: string,
  amountMax?: string
) {
  try {
  const supabase = await createClient();
  // Use admin client just for PDF table (RLS likely blocking anon)
  const admin = createAdminClient();
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    let queryBuilder = supabase
      .from('OINV')
      .select('*')
      .or(`CustName.ilike.%${query}%,DocNum.ilike.%${query}%,CustCode.ilike.%${query}%,VendorName.ilike.%${query}%`);

    if (status) {
      const dbStatus = status.toLowerCase() === 'done' ? 'Done' : 'Pending';
      queryBuilder = queryBuilder.eq('Status', dbStatus);
      console.log('fetchFilteredInvoices - Applied status filter:', dbStatus);
    }

    const { data: invoices, error } = await queryBuilder.order('DocDate', { ascending: false });
    if (error) throw error;

    // Fetch PDFs with admin client
    let pdfUploads: any[] = [];
    try {
      console.log('[fetchFilteredInvoices] Fetching PDFs with admin client...');
      const { data: pdfs, error: pdfErr } = await admin
        .from('pdf')
        .select('id,pdf_filename,pdf_url,uploader_username,created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (pdfErr) throw pdfErr;
      pdfUploads = pdfs || [];
      console.log(`[fetchFilteredInvoices] Retrieved ${pdfUploads.length} PDFs (first 2):`, pdfUploads.slice(0,2));
    } catch (e) {
      console.error('[fetchFilteredInvoices] Admin PDF fetch failed:', e);
    }

    // Heuristic: try to match invoice DocNum inside original filename (after removing timestamp prefix)
    const matchPdfForInvoice = (docNum: any) => {
      if (!docNum) return null;
      const docStr = String(docNum).toLowerCase();
      return pdfUploads.find(p => {
        if (!p.pdf_filename) return false;
        const cleaned = p.pdf_filename.replace(/^\d+-/, '').toLowerCase();
        return cleaned.includes(docStr);
      }) || null;
    };

    // Pre-build maps for quick lookup
    const pdfByFilename = new Map<string, any>();
    const pdfByUrl = new Map<string, any>();
    pdfUploads.forEach(p => {
      if (p.pdf_filename) pdfByFilename.set(p.pdf_filename, p);
      if (p.pdf_url) pdfByUrl.set(p.pdf_url, p);
    });

    let transformedInvoices = (invoices || []).map((invoice: any) => {
      let uploaderUsername: string | null = null;
      let hasUploadedPdf = false;
      let pdfUrl: string | null = invoice.pdf_url || null; // may already be on invoice

      // 1. Direct invoice.username column if present
      if (invoice.username) {
        uploaderUsername = invoice.username;
        hasUploadedPdf = !!(invoice.pdf_url || invoice.pdf_filename);
      } else {
        // 2. Try exact filename match
        let matched: any = null;
        if (invoice.pdf_filename && pdfByFilename.has(invoice.pdf_filename)) {
          matched = pdfByFilename.get(invoice.pdf_filename);
        }
        // 3. Try exact url match
        if (!matched && invoice.pdf_url && pdfByUrl.has(invoice.pdf_url)) {
          matched = pdfByUrl.get(invoice.pdf_url);
        }
        // 4. Try heuristic match (DocNum inside filename) if still nothing
        if (!matched) matched = matchPdfForInvoice(invoice.DocNum);

        if (matched) {
          uploaderUsername = matched.uploader_username || null;
          if (!pdfUrl) pdfUrl = matched.pdf_url || null;
          hasUploadedPdf = true;
        }
      }

      return {
        id: invoice.DocNum,
        customer_id: invoice.CustCode || invoice.DocNum,
        name: invoice.CustName || 'Unknown Customer',
        email: '',
        image_url: '/customers/default-avatar.png',
        docNum: invoice.DocNum,
        date: parseStringToDate(invoice.DocDate) || new Date(),
        amount: invoice.TotalwithGST || invoice.Totalb4GST || 0,
        status: invoice.Status === 'Done' ? 'done' : 'pending',
        pdf_url: pdfUrl,
        delivery_date: invoice.DeliveryDate ? parseStringToDate(invoice.DeliveryDate) : null,
        uploader_username: uploaderUsername,
        has_uploaded_pdf: hasUploadedPdf,
      };
    });

    if (dateFrom || dateTo) {
      transformedInvoices = transformedInvoices.filter(inv => {
        const d = inv.date as Date;
        if (!d) return false;
        if (dateFrom) {
          if (d < new Date(dateFrom)) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
            to.setHours(23,59,59,999);
          if (d > to) return false;
        }
        return true;
      });
    }

    if (amountMin || amountMax) {
      transformedInvoices = transformedInvoices.filter(inv => {
        const amt = Number(inv.amount) || 0;
        if (amountMin && amt < parseFloat(amountMin)) return false;
        if (amountMax && amt > parseFloat(amountMax)) return false;
        return true;
      });
    }

    return transformedInvoices.slice(offset, offset + ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

// Fetch invoice by DocNum from OINV table
export async function fetchInvoiceById(docNum: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('OINV')
      .select('*')
      .eq('DocNum', docNum)
      .single();

    if (error) throw error;

    const invoice = {
      id: data.DocNum,
      customer_id: data.CustCode,
      amount: data.TotalwithGST,
      status: 'done' as const, // Default status (update if Status is available)
      date: parseStringToDate(data.DocDate) || new Date(),
      customerName: data.CustName,
      customerAddress: data.CustAddress,
      vendorName: data.VendorName,
      totalBeforeGST: data.Totalb4GST,
    };

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

// Fetch invoice details (line items) from INV1 table
export async function fetchInvoiceDetails(docNum: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('INV1')
      .select('*')
      .eq('DocNum', docNum)
      .order('No', { ascending: true });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice details.');
  }
}

// Fetch invoice pages count for pagination
export async function fetchInvoicesPages(query: string) {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('OINV')
      .select('*', { count: 'exact', head: true })
      .or(`CustName.ilike.%${query}%,DocNum.ilike.%${query}%,CustCode.ilike.%${query}%,VendorName.ilike.%${query}%`);

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

// Fetch customers from OINV table (unique customers)
export async function fetchCustomers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('OINV')
      .select('CustCode, CustName')
      .not('CustCode', 'is', null)
      .order('CustName', { ascending: true });

    if (error) throw error;

    // Remove duplicates based on CustCode
    const uniqueCustomers = data.reduce((acc: CustomerField[], current: any) => {
      const existing = acc.find(item => item.id === current.CustCode);
      if (!existing) {
        acc.push({
          id: current.CustCode,
          name: current.CustName,
        });
      }
      return acc;
    }, []);

    return uniqueCustomers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch customers.');
  }
}

// Fetch filtered customers from OINV table
export async function fetchFilteredCustomers(query: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('OINV')
      .select(`
        CustCode,
        CustName,
        TotalwithGST
      `)
      .or(`CustName.ilike.%${query}%,CustCode.ilike.%${query}%`)
      .not('CustCode', 'is', null);

    if (error) throw error;

    // Aggregate data by customer
    const customers = data.reduce((acc: any[], current: any) => {
      const existing = acc.find(item => item.id === current.CustCode);
      if (existing) {
        existing.total_invoices += 1;
        existing.total_paid = (existing.total_paid || 0) + (current.TotalwithGST || 0);
      } else {
        acc.push({
          id: current.CustCode,
          name: current.CustName,
          email: '',
          image_url: '',
          total_invoices: 1,
          total_pending: 0, // Assuming no pending count here; adjust if needed
          total_paid: current.TotalwithGST || 0,
        });
      }
      return acc;
    }, []);

    // Format currency for total_paid
    const formattedCustomers = customers.map((customer: any) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return formattedCustomers;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch filtered customers.');
  }
}

// Fetch complete invoice data for editing (header + line items)
export async function fetchInvoiceForEdit(docNum: string) {
  try {
    const supabase = createAdminClient();
    
    // Fetch invoice header
    const { data: invoiceHeader, error: headerError } = await supabase
      .from('OINV')
      .select('*')
      .eq('DocNum', docNum)
      .single();

    if (headerError) throw headerError;

    console.log('Fetched invoice header:', invoiceHeader);

    // Fetch invoice line items
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('INV1')
      .select('*')
      .eq('DocNum', docNum)
      .order('No', { ascending: true });

    if (lineItemsError) {
      console.error('Error fetching line items:', lineItemsError);
      throw lineItemsError;
    }

    console.log('Fetched line items for DocNum', docNum, ':', lineItems);

    return {
      header: {
        ...invoiceHeader,
        DocDate: parseStringToDate(invoiceHeader.DocDate) || new Date(),
        DueDate: parseStringToDate(invoiceHeader.DueDate) || new Date(),
        DeliveryDate: invoiceHeader.DeliveryDate ? parseStringToDate(invoiceHeader.DeliveryDate) : null,
      },
      lineItems: lineItems || []
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice for editing.');
  }
}

// ... (other imports and functions unchanged)

export async function fetchCategoryTotals() {
  console.log('Starting fetchCategoryTotals');
  try {
    const supabase = await createAdminClient();

    // Pull all needed numeric fields so we can validate Amount and fall back if missing
    const { data, error } = await supabase
      .from('INV1')
      .select('Category, Amount, Quantity, UnitPrice');

    if (error) throw error;

    type CategoryTotal = { Category: string; TotalAmount: number; lineCount: number };

    const totalsMap = new Map<string, CategoryTotal>();

    (data ?? []).forEach((item: any) => {
      // Normalize category
      let rawCategory: string | null = item.Category;
      let category = (rawCategory && rawCategory.trim()) || 'Uncategorized';

      // Prefer explicit Amount; if null/0 but we have Quantity & UnitPrice, derive
      const qty = Number(item.Quantity) || 0;
      const unit = Number(item.UnitPrice) || 0;
      const derived = qty * unit; // before tax assumption
      let amount = Number(item.Amount);
      if (!amount || amount === 0) {
        amount = derived; // fallback
      }
      if (!Number.isFinite(amount)) amount = 0;

      const existing = totalsMap.get(category);
      if (existing) {
        existing.TotalAmount += amount;
        existing.lineCount += 1;
      } else {
        totalsMap.set(category, { Category: category, TotalAmount: amount, lineCount: 1 });
      }
    });

    // Convert to array & sort descending by amount for consistent chart ordering
    const totals = Array.from(totalsMap.values())
      .map(t => ({ Category: t.Category, TotalAmount: Number(t.TotalAmount.toFixed(2)) }))
      .sort((a, b) => b.TotalAmount - a.TotalAmount);

    // Debug summary
    console.log('Category totals summary:', totals);

    return totals.length > 0 ? totals : [{ Category: 'No Data', TotalAmount: 0 }];
  } catch (error) {
    console.error('Database Error in fetchCategoryTotals:', error);
    throw new Error('Failed to fetch category totals.');
  }
}

// Fetch all users who have uploaded files
export async function fetchUsersWithUploads() {
  try {
    const supabase = await createAdminClient();
    
    // Get users from profiles table who have uploaded PDFs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, full_name');

    if (profileError) throw profileError;

    // Get PDFs with uploader information
    const { data: pdfs, error: pdfError } = await supabase
      .from('pdf')
      .select('uploader_user_id, uploader_username')
      .not('uploader_username', 'is', null);

    if (pdfError) throw pdfError;

    // Combine profile and PDF data
    const usersWithUploads = profiles
      ?.filter(profile => 
        pdfs?.some(pdf => pdf.uploader_user_id === profile.id || pdf.uploader_username === profile.username)
      )
      .map(profile => ({
        id: profile.id,
        username: profile.username,
        full_name: profile.full_name,
        display_name: profile.full_name || profile.username
      })) || [];

    // Add users who have uploaded but might not be in profiles table
    const additionalUsers = pdfs
      ?.filter(pdf => pdf.uploader_username && !usersWithUploads.some(u => u.username === pdf.uploader_username))
      .map(pdf => ({
        id: pdf.uploader_user_id || `temp-${pdf.uploader_username}`,
        username: pdf.uploader_username,
        full_name: pdf.uploader_username,
        display_name: pdf.uploader_username
      }))
      .filter((user, index, self) => index === self.findIndex(u => u.username === user.username)) || [];

    return [...usersWithUploads, ...additionalUsers];
  } catch (error) {
    console.error('Database Error in fetchUsersWithUploads:', error);
    throw new Error('Failed to fetch users with uploads.');
  }
}

// Fetch top 10 users who uploaded the most invoices
export async function fetchTopUploaders() {
  try {
    const supabase = await createAdminClient();
    
    // Get upload counts by username from PDF table
    const { data: pdfCounts, error: pdfError } = await supabase
      .from('pdf')
      .select('uploader_username')
      .not('uploader_username', 'is', null);

    if (pdfError) throw pdfError;

    // Count uploads per user
    const uploadCounts = new Map<string, number>();
    (pdfCounts || []).forEach(pdf => {
      const username = pdf.uploader_username;
      if (username) {
        uploadCounts.set(username, (uploadCounts.get(username) || 0) + 1);
      }
    });

    // Get user profiles for display names
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('username, full_name');

    const profileMap = new Map();
    (profiles || []).forEach(profile => {
      if (profile.username) {
        profileMap.set(profile.username, profile.full_name || profile.username);
      }
    });

    // Convert to array and sort by upload count
    const topUploaders = Array.from(uploadCounts.entries())
      .map(([username, count]) => ({
        username,
        displayName: profileMap.get(username) || username,
        uploadCount: count
      }))
      .sort((a, b) => b.uploadCount - a.uploadCount)
      .slice(0, 10); // Top 10

    return topUploaders;
  } catch (error) {
    console.error('Database Error in fetchTopUploaders:', error);
    throw new Error('Failed to fetch top uploaders.');
  }
}

// Fetch category totals for a specific user
export async function fetchUserCategoryTotals(username: string) {
  try {
    const supabase = await createAdminClient();
    
    console.log(`Fetching category totals for user: ${username}`);
    // Step 1: PDFs uploaded by user
    const { data: userPdfs, error: userPdfErr } = await supabase
      .from('pdf')
      .select('pdf_filename, pdf_url')
      .eq('uploader_username', username)
      .limit(500);
    if (userPdfErr) {
      console.warn('Error fetching user PDFs:', userPdfErr.message);
    }
    if (!userPdfs || userPdfs.length === 0) {
      console.log('User has no PDFs uploaded');
      return [{ Category: 'No Data', TotalAmount: 0 }];
    }

    const pdfFilenames = [...new Set(userPdfs.filter(p => p.pdf_filename).map(p => p.pdf_filename))];
    const pdfUrls = [...new Set(userPdfs.filter(p => p.pdf_url).map(p => p.pdf_url))];

    // Step 2: Match invoices by filename/url (chunk queries to stay under limits)
    let docNums: string[] = [];
    const chunk = async (list: string[], size: number, field: 'pdf_filename' | 'pdf_url') => {
      for (let i = 0; i < list.length; i += size) {
        const sub = list.slice(i, i + size);
        const { data: invChunk, error: invErr } = await supabase
          .from('OINV')
          .select('DocNum, ' + field)
          .in(field, sub);
        if (!invErr && invChunk) {
          docNums.push(...(invChunk as any[]).map(i => (i as any).DocNum));
        }
      }
    };
    if (pdfFilenames.length) await chunk(pdfFilenames, 100, 'pdf_filename');
    if (pdfUrls.length) await chunk(pdfUrls, 100, 'pdf_url');
    docNums = [...new Set(docNums)];

    // Step 3: Optional username column linkage
    if (docNums.length === 0) {
      try {
        const { data: invoicesByUsername, error: userInvErr } = await supabase
          .from('OINV')
          .select('DocNum, username')
          .eq('username', username);
        if (!userInvErr && invoicesByUsername) {
          docNums = invoicesByUsername.map(i => i.DocNum);
        }
      } catch (e) {
        console.warn('Username linkage failed (column may not exist).');
      }
    }

    if (!docNums.length) {
      console.log('No invoices matched uploaded PDFs or username');
      return [{ Category: 'No Data', TotalAmount: 0 }];
    }
    console.log(`Found ${docNums.length} invoices for user ${username}`);

    // Step 4: Fetch line items
    const { data: lineItems, error: lineErr } = await supabase
      .from('INV1')
      .select('Category, Amount, Quantity, UnitPrice, DocNum')
      .in('DocNum', docNums);
    if (lineErr) throw lineErr;
    if (!lineItems || !lineItems.length) {
      return [{ Category: 'No Data', TotalAmount: 0 }];
    }

    // Step 5: Aggregate
    const totalsMap = new Map<string, number>();
    lineItems.forEach((li: any) => {
      const category = (li.Category && li.Category.trim()) || 'Uncategorized';
      const qty = Number(li.Quantity) || 0;
      const unit = Number(li.UnitPrice) || 0;
      let amount = Number(li.Amount) || 0;
      if (!amount || amount === 0) amount = qty * unit;
      if (!Number.isFinite(amount)) amount = 0;
      totalsMap.set(category, (totalsMap.get(category) || 0) + amount);
    });

    const totals = Array.from(totalsMap.entries())
      .map(([Category, TotalAmount]) => ({ Category, TotalAmount: Number(TotalAmount.toFixed(2)) }))
      .sort((a, b) => b.TotalAmount - a.TotalAmount);

    return totals.length ? totals : [{ Category: 'No Data', TotalAmount: 0 }];
  } catch (error) {
    console.error('Database Error in fetchUserCategoryTotals (outer catch):', error);
    return [{ Category: 'No Data', TotalAmount: 0 }];
  }
}