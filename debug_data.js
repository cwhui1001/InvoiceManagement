// Simple script to check database contents
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  try {
    console.log('=== CHECKING INVOICES (OINV) ===');
    const { data: invoices, error: invError } = await supabase
      .from('OINV')
      .select('DocNum, CardName, TotalwithGST')
      .limit(10);
    
    if (invError) {
      console.error('OINV Error:', invError);
    } else {
      console.log('Invoices found:', invoices?.length || 0);
      invoices?.forEach(inv => {
        console.log(`- Invoice ${inv.DocNum}: ${inv.CardName} - $${inv.TotalwithGST}`);
      });
    }

    console.log('\n=== CHECKING INVOICE LINES (INV1) ===');
    const { data: lines, error: lineError } = await supabase
      .from('INV1')
      .select('InvoiceDocNum, Category, Amount')
      .limit(10);
    
    if (lineError) {
      console.error('INV1 Error:', lineError);
    } else {
      console.log('Invoice lines found:', lines?.length || 0);
      lines?.forEach(line => {
        console.log(`- Invoice ${line.InvoiceDocNum}: ${line.Category} - $${line.Amount}`);
      });
    }

    console.log('\n=== CHECKING CATEGORIES ===');
    const { data: categories, error: catError } = await supabase
      .from('INV1')
      .select('Category, Amount')
      .not('Category', 'is', null);
    
    if (catError) {
      console.error('Category Error:', catError);
    } else {
      const categoryTotals = {};
      categories?.forEach(item => {
        const cat = item.Category;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.Amount || 0);
      });
      
      console.log('Category totals:');
      Object.entries(categoryTotals).forEach(([cat, total]) => {
        console.log(`- ${cat}: $${total}`);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkData();
