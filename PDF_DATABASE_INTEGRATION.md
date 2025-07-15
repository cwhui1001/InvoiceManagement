# Invoice PDF Database Integration

## Overview
This system now properly integrates uploaded PDF files with the OINV database table by:

1. **Immediate Database Update**: When a PDF is uploaded, the system attempts to extract the invoice ID from the filename and immediately updates the `OINV` table with the PDF URL.

2. **N8N Webhook Integration**: The system sends the PDF data to n8n for OCR processing and data extraction.

3. **Callback Endpoint**: N8N can call back to update the database with extracted invoice data.

## Upload Process Flow

1. **File Upload** → `/api/upload`
   - Uploads PDF to Supabase storage
   - Extracts invoice ID from filename (e.g., "SO1000009.pdf" → "SO1000009")
   - Updates OINV table with `pdf_url` and `pdf_filename`
   - Triggers n8n webhook with file content

2. **N8N Processing** (Optional)
   - Processes PDF for OCR and data extraction
   - Calls back to `/api/invoices/callback` with extracted data

3. **Database Update** → `/api/invoices/callback`
   - Updates or creates invoice record in OINV table
   - Stores PDF URL and extracted data

## Database Schema Changes

The OINV table should have these columns:
- `pdf_url` (text) - Public URL to the PDF file
- `pdf_filename` (text) - Original filename of the PDF

## N8N Webhook Payload

The webhook receives:
```json
{
  "filename": "SO1000009.pdf",
  "originalFilename": "SO1000009.pdf",
  "uploadedFilename": "1642123456789-SO1000009.pdf",
  "fileUrl": "https://supabase.co/storage/v1/object/public/invoices/uploads/...",
  "fileType": "application/pdf",
  "fileSize": 123456,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "fileContent": "base64-encoded-pdf-content",
  "extractedInvoiceId": "SO1000009",
  "callbackUrl": "https://your-domain.com/api/invoices/callback",
  "supabase": {
    "bucketName": "invoices",
    "filePath": "uploads/1642123456789-SO1000009.pdf",
    "publicUrl": "https://supabase.co/storage/v1/object/public/invoices/uploads/..."
  }
}
```

## N8N Callback Format

N8N should POST to the callback URL with:
```json
{
  "invoiceId": "SO1000009",
  "customerName": "Extracted Customer Name",
  "totalAmount": 1234.56,
  "invoiceDate": "2025-01-15",
  "dueDate": "2025-02-15",
  "status": "pending",
  "pdfUrl": "https://supabase.co/storage/v1/object/public/invoices/uploads/...",
  "pdfFilename": "1642123456789-SO1000009.pdf",
  "extractedData": {
    // Additional extracted fields
  }
}
```

## Testing

1. **Upload a PDF** with invoice ID in filename (e.g., "SO1000009.pdf")
2. **Check OINV table** - should have `pdf_url` and `pdf_filename` populated
3. **Click invoice ID** in the UI - should open the PDF

## File Naming Convention

For automatic invoice ID extraction, name your PDF files like:
- `SO1000009.pdf`
- `INV123456.pdf`
- `invoice_ABC123.pdf`

The system uses regex pattern `/(\w+\d+)/i` to extract the invoice ID.
