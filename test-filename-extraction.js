// Test filename extraction logic
const testFiles = [
  "1752571237639-KARA INVOICE.pdf",
  "1752570625153-KARA INVOICE.pdf", 
  "1752569654701-Multiple Line.pdf",
  "587878.pdf",
  "587878-invoice.pdf",
  "invoice-587878.pdf",
  "SO587878.pdf",
  "587878_final.pdf"
];

const invoiceIdPatterns = [
  /^(\d+)$/,                      // Exact number match: 587878
  /^(\d+)\./,                     // Number with extension: 587878.pdf
  /(\d+)/,                        // Any numbers: 587878, 123456
  /(\w+\d+)/i,                    // SO1000009, INV123, etc.
  /invoice[_-]?(\w+\d+)/i,        // invoice_SO1000009, invoice-123
  /(\w+\d+)[\._-]/i,              // SO1000009.pdf, INV123_file
];

console.log("=== FILENAME EXTRACTION TEST ===");
console.log("Looking for invoice: 587878");
console.log("");

testFiles.forEach(filename => {
  console.log(`Testing: ${filename}`);
  let invoiceId = null;
  
  for (let i = 0; i < invoiceIdPatterns.length; i++) {
    const pattern = invoiceIdPatterns[i];
    const match = filename.match(pattern);
    
    if (match) {
      invoiceId = match[1];
      console.log(`  ✅ Found: "${invoiceId}" using pattern ${i + 1}: ${pattern}`);
      
      // Check if this matches our target invoice
      if (invoiceId === '587878') {
        console.log(`  🎯 MATCHES TARGET INVOICE 587878!`);
      } else {
        console.log(`  ❌ Does not match target invoice 587878`);
      }
      break;
    }
  }
  
  if (!invoiceId) {
    console.log(`  ❌ No invoice ID found`);
  }
  
  console.log("");
});
