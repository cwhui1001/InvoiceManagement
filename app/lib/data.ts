import postgres from 'postgres';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

// Import Supabase functions
import {
  fetchLatestInvoices as fetchLatestInvoicesSupabase,
  fetchCardData as fetchCardDataSupabase,
  fetchFilteredInvoices as fetchFilteredInvoicesSupabase,
  fetchInvoicesPages as fetchInvoicesPagesSupabase,
  fetchInvoiceById as fetchInvoiceByIdSupabase,
  fetchCustomers as fetchCustomersSupabase,
} from './data-supabase';

// Database selection based on environment variable
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgres';
const ITEMS_PER_PAGE = 6;

// Only initialize postgres connection if using postgres
let sql: any = null;
if (DATABASE_TYPE === 'postgres' && process.env.POSTGRES_URL) {
  sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
}

// export async function fetchRevenue() {
//   try {
//     // Artificially delay a response for demo purposes.
//     // Don't do this in production :)

//     // console.log('Fetching revenue data...');
//     // await new Promise((resolve) => setTimeout(resolve, 3000));

//     const data = await sql<Revenue[]>`SELECT * FROM revenue`;

//     // console.log('Data fetch completed after 3 seconds.');

//     return data;
//   } catch (error) {
//     console.error('Database Error:', error);
//     throw new Error('Failed to fetch revenue data.');
//   }
// }

export async function fetchLatestInvoices() {
  // Use Supabase if configured, otherwise fall back to postgres
  if (DATABASE_TYPE === 'supabase') {
    return fetchLatestInvoicesSupabase();
  }
  
  // Original postgres implementation updated for OINV schema
  try {
    if (!sql) {
      throw new Error('Postgres connection not available. Check DATABASE_TYPE and POSTGRES_URL.');
    }
    
    // Test connection first
    await sql`SELECT 1`;
    
    const data = await sql`
      SELECT DocNum, CustName, DocDate, TotalwithGST
      FROM OINV
      ORDER BY DocDate DESC 
      LIMIT 5`;

    const latestInvoices = data.map((invoice: any) => ({
      id: invoice.DocNum,
      name: invoice.CustName,
      amount: formatCurrency(invoice.TotalwithGST || 0),
      date: invoice.DocDate,
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices. Please try again later.');
  }
}

export async function fetchCardData() {
  // Use Supabase if configured, otherwise fall back to postgres
  if (DATABASE_TYPE === 'supabase') {
    return fetchCardDataSupabase();
  }
  
  // Original postgres implementation updated for OINV schema
  try {
    if (!sql) {
      throw new Error('Postgres connection not available. Check DATABASE_TYPE and POSTGRES_URL.');
    }
    
    // Count total invoices
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM OINV`;
    
    // Count unique customers from OINV table
    const customerCountPromise = sql`SELECT COUNT(DISTINCT CustCode) FROM OINV WHERE CustCode IS NOT NULL`;
    
    // Calculate total revenue
    const revenuePromise = sql`SELECT SUM(TotalwithGST) as total FROM OINV WHERE TotalwithGST IS NOT NULL`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      revenuePromise,
    ]);

    const numberOfInvoices = Number(data[0][0].count ?? '0');
    const numberOfCustomers = Number(data[1][0].count ?? '0');
    const totalRevenue = Number(data[2][0].total ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalRevenue: formatCurrency(totalRevenue),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  // Use Supabase if configured, otherwise fall back to postgres
  if (DATABASE_TYPE === 'supabase') {
    return fetchFilteredInvoicesSupabase(query, currentPage);
  }
  
  // Original postgres implementation updated for OINV schema
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    if (!sql) {
      throw new Error('Postgres connection not available. Check DATABASE_TYPE and POSTGRES_URL.');
    }
    
    const invoices = await sql`
      SELECT
        DocNum as id,
        CustCode as customer_id,
        CustName as name,
        '' as email,
        '' as image_url,
        DocDate as date,
        TotalwithGST as amount,
        'paid' as status
      FROM OINV
      WHERE
        CustName ILIKE ${`%${query}%`} OR
        DocNum ILIKE ${`%${query}%`} OR
        CustCode ILIKE ${`%${query}%`} OR
        VendorName ILIKE ${`%${query}%`}
      ORDER BY DocDate DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  // Use Supabase if configured, otherwise fall back to postgres
  if (DATABASE_TYPE === 'supabase') {
    return fetchInvoicesPagesSupabase(query);
  }
  
  // Original postgres implementation updated for OINV schema
  try {
    if (!sql) {
      throw new Error('Postgres connection not available. Check DATABASE_TYPE and POSTGRES_URL.');
    }
    
    const data = await sql`SELECT COUNT(*)
    FROM OINV
    WHERE
      CustName ILIKE ${`%${query}%`} OR
      DocNum ILIKE ${`%${query}%`} OR
      CustCode ILIKE ${`%${query}%`} OR
      VendorName ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  // Use Supabase if configured, otherwise fall back to postgres
  if (DATABASE_TYPE === 'supabase') {
    return fetchInvoiceByIdSupabase(id);
  }
  
  // Original postgres implementation updated for OINV schema
  try {
    if (!sql) {
      throw new Error('Postgres connection not available. Check DATABASE_TYPE and POSTGRES_URL.');
    }
    
    const data = await sql`
      SELECT
        DocNum as id,
        CustCode as customer_id,
        TotalwithGST as amount,
        'paid' as status,
        DocDate as date,
        CustName as customerName,
        CustAddress as customerAddress,
        VendorName as vendorName,
        Totalb4GST as totalBeforeGST
      FROM OINV
      WHERE DocNum = ${id};
    `;

    if (data.length === 0) {
      throw new Error('Invoice not found');
    }

    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

// Add these new exported functions for Supabase compatibility
export async function fetchCustomers() {
  // Use Supabase if configured, otherwise fall back to postgres
  if (DATABASE_TYPE === 'supabase') {
    return fetchCustomersSupabase();
  }
  
  // Original postgres implementation updated for OINV schema
  try {
    if (!sql) {
      throw new Error('Postgres connection not available. Check DATABASE_TYPE and POSTGRES_URL.');
    }
    
    const customers = await sql`
      SELECT DISTINCT
        CustCode as id,
        CustName as name
      FROM OINV
      WHERE CustCode IS NOT NULL AND CustName IS NOT NULL
      ORDER BY CustName ASC
    `;

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  // Use Supabase if configured
  if (DATABASE_TYPE === 'supabase') {
    // For now, just return customers without filtering in Supabase version
    return fetchCustomersSupabase();
  }
  
  // Original postgres implementation updated for OINV schema
  try {
    if (!sql) {
      throw new Error('Postgres connection not available. Check DATABASE_TYPE and POSTGRES_URL.');
    }
    
    const data = await sql`
		SELECT
		  CustCode as id,
		  CustName as name,
		  '' as email,
		  '' as image_url,
		  COUNT(*) AS total_invoices,
		  0 AS total_pending,
		  SUM(COALESCE(TotalwithGST, 0)) AS total_paid
		FROM OINV
		WHERE CustCode IS NOT NULL 
		  AND (CustName ILIKE ${`%${query}%`} OR CustCode ILIKE ${`%${query}%`})
		GROUP BY CustCode, CustName
		ORDER BY CustName ASC
	  `;

    const customers = data.map((customer: any) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
