// Example usage patterns for the new Supabase integration

// 1. Server Component (app/dashboard/page.tsx)
/*
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Fetch data on the server
  const { data: invoices } = await supabase
    .from('OINV')
    .select('*')
    .limit(10)
  
  return (
    <div>
      <h1>Dashboard</h1>
      {invoices?.map(invoice => (
        <div key={invoice.DocNum}>{invoice.CustName}</div>
      ))}
    </div>
  )
}
*/

// 2. Client Component (app/components/InvoiceList.tsx)
/*
'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    async function fetchInvoices() {
      const { data } = await supabase
        .from('OINV')
        .select('*')
        .limit(10)
      
      setInvoices(data || [])
    }
    
    fetchInvoices()
  }, [supabase])
  
  return (
    <div>
      {invoices.map(invoice => (
        <div key={invoice.DocNum}>{invoice.CustName}</div>
      ))}
    </div>
  )
}
*/

// 3. Server Action (app/actions/invoice-actions.ts)
/*
'use server'

import { createClient } from '@/utils/supabase/server'

export async function createInvoice(formData: FormData) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('OINV')
    .insert([
      {
        CustName: formData.get('customerName'),
        TotalwithGST: Number(formData.get('amount'))
      }
    ])
  
  if (error) {
    throw new Error('Failed to create invoice')
  }
  
  return data
}
*/

// 4. API Route (app/api/invoices/route.ts)
/*
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: invoices, error } = await supabase
    .from('OINV')
    .select('*')
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  return Response.json(invoices)
}
*/
