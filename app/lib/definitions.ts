// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type Invoice = {
  id: string;
  customer_id: string;
  amount: number;
  date: Date;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestInvoice = {
  id: string;
  name: string;
  amount: string;
  date: Date;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestInvoiceRaw = Omit<LatestInvoice, 'amount'> & {
  amount: number;
};

export type InvoicesTable = {
  id: string;
  customer_id: string;
  name: string;
  email: string;
  image_url: string;
  date: Date;
  amount: number;
  status: 'pending' | 'paid';
  pdf_url?: string | null;
  delivery_date?: Date | null;
};

export type CustomersTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedCustomersTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_invoices: number;
  total_pending: string;
  total_paid: string;
};

export type CustomerField = {
  id: string;
  name: string;
};

export type InvoiceForm = {
  id: string;
  customer_id: string;
  amount: number;
  status: 'pending' | 'paid';
};

// New types for your Supabase schema
export type OINV = {
  DocNum: string;
  DocDate: Date;
  DueDate: Date;
  DeliveryDate?: Date | null;
  CustName: string;
  CustAddress: string;
  VendorName: string;
  CustCode: string;
  VendorCode: string;
  VendorAddresss: string;
  Totalb4GST: number;
  TotalwithGST: number;
  Status?: string | null;
  pdf_url?: string | null;
  pdf_filename?: string | null;
};

export type INV1 = {
  DocNum: string;
  No: number;
  ItemCode: string;
  Description: string;
  Quantity: number;
  UnitPrice: number;
  Tax: string;
  Amount: number;
};

// Updated LatestInvoiceRaw to match your OINV schema
export type LatestInvoiceRawSupabase = {
  DocNum: string;
  CustName: string;
  DocDate: Date;
  TotalwithGST: number;
};

// Updated InvoicesTable to match your schema
export type InvoicesTableSupabase = {
  DocNum: string;
  DocDate: Date;
  DueDate: Date;
  CustName: string;
  CustAddress: string;
  VendorName: string;
  CustCode: string;
  VendorCode: string;
  TotalwithGST: number;
  Totalb4GST: number;
};

// Customer type based on your schema
export type CustomerSupabase = {
  CustCode: string;
  CustName: string;
  CustAddress: string;
};
