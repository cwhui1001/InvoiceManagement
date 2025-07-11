# Invoice Management System with n8n Integration

This Next.js dashboard includes a comprehensive invoice management system with file upload capabilities and n8n workflow integration.

## Features

### Invoice Management
- **Search & Filter**: Search invoices by customer name, invoice number, or vendor. Filter by status (paid/pending).
- **View PDFs**: Click the document icon to view invoice PDFs in a new tab.
- **Edit & Delete**: Standard CRUD operations for invoice management.
- **Bulk Upload**: Single upload button at the top of the page for uploading multiple PDF/image files.

### File Upload & n8n Integration
- **Bulk Upload**: Upload multiple PDF or image files at once
- **Automatic Processing**: Files are automatically processed through n8n workflows
- **Webhook Integration**: Triggers n8n workflows for document processing, OCR, data extraction, etc.

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env.local` file:

```bash
# n8n Webhook URL for invoice processing
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/invoice-processing
```

### 2. Supabase Storage Setup
1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `invoices`
4. Set the bucket to public if you want direct PDF viewing

### 3. n8n Workflow Setup
Create an n8n workflow with a webhook trigger that accepts the following payload:

```json
{
  "type": "bulk_upload",
  "filename": "timestamp-filename.pdf",
  "originalName": "original-filename.pdf",
  "fileType": "application/pdf",
  "fileUrl": "https://your-supabase-url/storage/v1/object/public/invoices/bulk-uploads/filename.pdf",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

#### Sample n8n Workflow Ideas:
- **OCR Processing**: Extract text from uploaded images/PDFs
- **Data Extraction**: Parse invoice data (amounts, dates, customer info)
- **Email Notifications**: Send notifications when new invoices are uploaded
- **Integration with ERP**: Push invoice data to your ERP system
- **Approval Workflows**: Route invoices for approval based on amount thresholds

### 4. Database Schema Updates (Optional)
If you want to track uploaded files, you can add these columns to your OINV table:

```sql
ALTER TABLE "OINV" ADD COLUMN "pdf_url" TEXT;
ALTER TABLE "OINV" ADD COLUMN "pdf_filename" TEXT;
```

## Usage

### Uploading Invoices
1. Navigate to the Invoices page
2. Click the "Upload Invoices" button in the top right
3. Select one or more PDF or image files
4. Files will be uploaded and processed automatically
5. n8n workflows will be triggered for each uploaded file

### Viewing Invoice PDFs
- Click the document icon in the PDF column to view the invoice PDF
- PDFs open in a new browser tab

### Searching & Filtering
- Use the search bar to find invoices by customer name, invoice number, or vendor
- Use the status dropdown to filter by paid/pending status
- Pagination controls allow you to navigate through large invoice lists

## API Endpoints

### Bulk Upload
- **POST** `/api/invoices/bulk-upload`
- Accepts: `multipart/form-data` with `file` field
- Supported formats: PDF, images
- Returns: Upload confirmation with file URL

### Individual PDF View
- **GET** `/api/invoices/[id]/pdf`
- Returns: Redirect to PDF URL or 404 if not found

### Individual Upload (for future use)
- **POST** `/api/invoices/[id]/upload`
- Accepts: `multipart/form-data` with `file` field
- Associates uploaded file with specific invoice ID

## Troubleshooting

### Upload Issues
- Ensure files are PDF or image format
- Check file size limits (10MB per file)
- Verify Supabase storage bucket permissions

### n8n Integration Issues
- Verify webhook URL is accessible from your deployment
- Check n8n workflow is active
- Monitor n8n execution logs for errors

### PDF Viewing Issues
- Ensure Supabase storage bucket is public
- Check file exists in storage
- Verify PDF URLs are accessible
