import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // First, let's see what invoices we have
    const { data: invoices, error: invoiceError } = await supabase
      .from('OINV')
      .select('DocNum, CustName')
      .limit(5);

    if (invoiceError) {
      console.error('Error fetching invoices:', invoiceError);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    console.log('Found invoices:', invoices);

    // Check if any of these invoices have line items
    const invoiceChecks = await Promise.all(
      invoices.map(async (invoice) => {
        const { data: lineItems, error } = await supabase
          .from('INV1')
          .select('*')
          .eq('DocNum', invoice.DocNum);
        
        return {
          docNum: invoice.DocNum,
          custName: invoice.CustName,
          lineItemCount: lineItems?.length || 0,
          lineItems: lineItems || []
        };
      })
    );

    console.log('Invoice line item check:', invoiceChecks);

    // If there are invoices without line items, let's add some sample data
    const invoicesWithoutLineItems = invoiceChecks.filter(inv => inv.lineItemCount === 0);
    
    if (invoicesWithoutLineItems.length > 0) {
      const sampleLineItems = [];
      
      for (const invoice of invoicesWithoutLineItems.slice(0, 2)) { // Only add to first 2 invoices
        sampleLineItems.push(
          {
            DocNum: invoice.docNum,
            No: 1,
            Description: 'Sample Product A',
            Quantity: 2,
            UnitPrice: 50.00,
            Tax: 'GST 10%',
            Amount: 100.00,
          },
          {
            DocNum: invoice.docNum,
            No: 2,
            Description: 'Sample Product B',
            Quantity: 1,
            UnitPrice: 75.00,
            Tax: 'GST 10%',
            Amount: 75.00,
          }
        );
      }

      if (sampleLineItems.length > 0) {
        const { error: insertError } = await supabase
          .from('INV1')
          .insert(sampleLineItems);

        if (insertError) {
          console.error('Error inserting sample line items:', insertError);
        } else {
          console.log('Added sample line items:', sampleLineItems);
        }
      }
    }

    return NextResponse.json({
      message: 'Debug completed',
      invoices: invoices,
      invoiceChecks: invoiceChecks,
      sampleDataAdded: invoicesWithoutLineItems.length > 0
    });
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
