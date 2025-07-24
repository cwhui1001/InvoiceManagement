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

// Fetch latest invoices from OINV table
export async function fetchLatestInvoices() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('OINV')
      .select('DocNum, CustName, DocDate, TotalwithGST, created_at, Status')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const latestInvoices = data.map((invoice: any) => ({
      id: invoice.DocNum,
      name: invoice.CustName || 'Unknown Customer',
      amount: formatCurrency(invoice.TotalwithGST || 0),
      date: parseStringToDate(invoice.DocDate) || new Date(),
      status: invoice.Status === 'Done' ? 'done' : 'pending',
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices. Please try again later.');
  }
}

// Fetch card data from OINV table
export async function fetchCardData() {
  try {
    const supabase = await createClient();

    // Count total invoices
    const { count: invoiceCount, error: invoiceError } = await supabase
      .from('OINV')
      .select('*', { count: 'exact', head: true });

    if (invoiceError) throw invoiceError;

    // Count pending invoices
    const { count: pendingCount, error: pendingError } = await supabase
      .from('OINV')
      .select('*', { count: 'exact', head: true })
      .eq('Status', 'Pending');

    if (pendingError) throw pendingError;

    // Get totals
    const { data: totalsData, error: totalsError } = await supabase
      .from('OINV')
      .select('TotalwithGST, Totalb4GST');

    if (totalsError) throw totalsError;

    const totalRevenue = totalsData.reduce((sum: number, invoice: any) => {
      const amount = invoice.TotalwithGST || invoice.Totalb4GST || 0;
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

// Fetch filtered invoices from OINV table
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
  status?: string,
  dateFrom?: string,
  dateTo?: string,
  amountMin?: string,
  amountMax?: string
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const supabase = await createClient();
    let queryBuilder = supabase
      .from('OINV')
      .select('*');

    // Add search filter if query is provided
    if (query) {
      queryBuilder = queryBuilder.or(
        `CustName.ilike.%${query}%,DocNum.ilike.%${query}%,VendorName.ilike.%${query}%`
      );
    }

    // Add status filter if provided
    if (status) {
      const normalizedStatus = status.toLowerCase();
      let dbStatus: string;
      if (normalizedStatus === 'done') dbStatus = 'Done';
      else if (normalizedStatus === 'pending') dbStatus = 'Pending';
      else {
        console.warn('fetchFilteredInvoices - Unsupported status value:', status, 'defaulting to no filter');
        dbStatus = '';
      }
      if (dbStatus) {
        queryBuilder = queryBuilder.eq('Status', dbStatus);
        console.log('fetchFilteredInvoices - Applied status filter:', dbStatus);
      }
    }

    // Fetch all records first (we'll apply date and amount filtering in JavaScript)
    const { data: invoices, error } = await queryBuilder
      .order('DocDate', { ascending: false });

    if (error) throw error;

    // Transform data to match expected format for the UI
    let transformedInvoices = invoices.map((invoice: any) => {
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
        pdf_url: invoice.pdf_url || null,
        delivery_date: invoice.DeliveryDate ? parseStringToDate(invoice.DeliveryDate) : null,
      };
    });

    // Apply date filtering in JavaScript
    if (dateFrom || dateTo) {
      transformedInvoices = transformedInvoices.filter(invoice => {
        const invoiceDate = invoice.date;
        if (!invoiceDate) return false;
        
        let passesDateFilter = true;
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          passesDateFilter = passesDateFilter && invoiceDate >= fromDate;
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          passesDateFilter = passesDateFilter && invoiceDate <= toDate;
        }
        
        return passesDateFilter;
      });
    }

    // Apply amount filtering in JavaScript
    if (amountMin || amountMax) {
      transformedInvoices = transformedInvoices.filter(invoice => {
        const invoiceAmount = Number(invoice.amount);
        if (isNaN(invoiceAmount)) return false;
        
        let passesAmountFilter = true;
        
        if (amountMin) {
          const minAmount = parseFloat(amountMin);
          passesAmountFilter = passesAmountFilter && invoiceAmount >= minAmount;
        }
        
        if (amountMax) {
          const maxAmount = parseFloat(amountMax);
          passesAmountFilter = passesAmountFilter && invoiceAmount <= maxAmount;
        }
        
        return passesAmountFilter;
      });
    }

    // Apply pagination after filtering
    const paginatedInvoices = transformedInvoices.slice(offset, offset + ITEMS_PER_PAGE);

    return paginatedInvoices;
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
    
    const { data, error } = await supabase
      .from('INV1')
      .select('Category, Amount');

    if (error) throw error;

    type CategoryTotal = { Category: string; TotalAmount: number };

    const totals = (data ?? []).reduce<CategoryTotal[]>((acc, item) => {
      const category = item.Category || 'Unknown';
      const amount = item.Amount || 0;
      console.log('Processing item:', { category, amount }); // Log each item processed
      const existing = acc.find(i => i.Category === category);
      if (existing) {
        existing.TotalAmount += amount;
      } else {
        acc.push({ Category: category, TotalAmount: amount });
      }
      return acc;
    }, []);

    
    // Fallback if no data
    return totals.length > 0 ? totals : [{ Category: 'No Data', TotalAmount: 0 }];
  } catch (error) {
    console.error('Database Error in fetchCategoryTotals:', error);
    throw new Error('Failed to fetch category totals.');
  }
}