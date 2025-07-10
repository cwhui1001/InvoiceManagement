// data-supabase.ts - Supabase version using your OINV and INV1 tables
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
import { formatCurrency } from './utils';

// Fetch latest invoices from OINV table
export async function fetchLatestInvoices() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('OINV')
      .select('DocNum, CustName, DocDate, TotalwithGST')
      .order('DocDate', { ascending: false })
      .limit(5);

    if (error) throw error;

    const latestInvoices = data.map((invoice: any) => ({
      id: invoice.DocNum,
      name: invoice.CustName || 'Unknown Customer',
      amount: formatCurrency(invoice.TotalwithGST || 0),
      date: invoice.DocDate || 'Unknown Date',
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

    // Count unique customers (filter out null CustCode values)
    const { data: customerData, error: customerError } = await supabase
      .from('OINV')
      .select('CustCode, CustName')
      .not('CustName', 'is', null);

    if (customerError) throw customerError;

    // Get unique customer count based on CustName since CustCode might be null
    const uniqueCustomers = new Set(
      customerData
        .filter((item: any) => item.CustName)
        .map((item: any) => item.CustName.trim().toLowerCase())
    );
    const numberOfCustomers = uniqueCustomers.size;

    // Calculate totals (handle null values)
    const { data: totalsData, error: totalsError } = await supabase
      .from('OINV')
      .select('TotalwithGST, Totalb4GST');

    if (totalsError) throw totalsError;

    const totalRevenue = totalsData.reduce((sum: number, invoice: any) => {
      const amount = invoice.TotalwithGST || invoice.Totalb4GST || 0;
      return sum + amount;
    }, 0);

    return {
      numberOfCustomers,
      numberOfInvoices: invoiceCount || 0,
      totalRevenue: formatCurrency(totalRevenue),
      // Add these for compatibility with existing dashboard
      totalPaidInvoices: formatCurrency(totalRevenue),
      totalPendingInvoices: formatCurrency(0), // Since we don't have status info
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

// Fetch filtered invoices from OINV table
const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
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

    const { data: invoices, error } = await queryBuilder
      .order('DocDate', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) throw error;

    // Transform data to match expected format for the UI
    const transformedInvoices = invoices.map((invoice: any) => ({
      id: invoice.DocNum,
      customer_id: invoice.CustCode || invoice.DocNum, // Use DocNum as fallback
      name: invoice.CustName || 'Unknown Customer',
      email: '', // Not available in OINV schema
      image_url: '/customers/default-avatar.png', // Default image
      date: invoice.DocDate || 'Unknown Date',
      amount: invoice.TotalwithGST || invoice.Totalb4GST || 0,
      status: 'paid' as const, // Default status since not in schema
    }));

    return transformedInvoices;
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
      status: 'paid' as const, // Default status since not in schema
      date: data.DocDate,
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
