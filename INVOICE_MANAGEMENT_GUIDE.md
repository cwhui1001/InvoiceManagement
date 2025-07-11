# Invoice Management System - Setup Guide

## Quick Setup

1. **Run the Supabase Storage Setup**:
   Execute the SQL in `supabase-storage-setup.sql` in your Supabase SQL Editor to create the storage bucket and policies.

2. **Environment Variables**:
   Your `.env.local` is already configured correctly with the n8n webhook URL.

3. **Test the Upload**:
   - Go to http://localhost:3005/dashboard/invoices
   - Click "Upload Invoices" button at the top
   - Select PDF or image files
   - Files will be uploaded to Supabase Storage and trigger your n8n webhook

## Environment Variables

Your current configuration in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://crbgqchlqpcokwwkgohb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# n8n Webhook URL
N8N_WEBHOOK_URL=https://420d-211-24-62-73.ngrok-free.app/webhook/fcdb67a5-1424-4182-99c0-1e7458b53828

# Database Selection
DATABASE_TYPE=supabase
```

## n8n Webhook Integration

Your webhook at `https://420d-211-24-62-73.ngrok-free.app/webhook/fcdb67a5-1424-4182-99c0-1e7458b53828` will receive:

```json
{
  "filename": "original-filename.pdf",
  "originalFilename": "original-filename.pdf",
  "uploadedFilename": "1736637425123-original-filename.pdf",
  "fileUrl": "https://crbgqchlqpcokwwkgohb.supabase.co/storage/v1/object/public/invoices/uploads/1736637425123-original-filename.pdf",
  "fileType": "application/pdf",
  "fileSize": 1234567,
  "timestamp": "2025-01-11T15:30:25.123Z"
}
```

## Features Implemented

✅ **Single Upload Button at Top**
- Blue "Upload Invoices" button in the header
- Opens modal dialog for file selection
- Supports multiple file uploads

✅ **Search and Filter**
- Real-time search with debounced input
- Status filtering (All, Paid, Pending)
- URL-based search parameters

✅ **PDF Management**
- Bulk upload PDF and image files to Supabase Storage
- File validation and error handling
- Success/error feedback

✅ **n8n Integration**
- Webhook trigger on file upload
- Structured payload with file metadata
- Error handling for webhook failures

✅ **User Interface**
- Responsive design for mobile and desktop
- Modal dialogs for file upload
- Loading states and error messages
- Accessible components with proper ARIA labels

## Supabase Storage Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create the invoices storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for file access
-- (See supabase-storage-setup.sql for complete policies)
```

## API Endpoints

- `POST /api/upload` - Bulk file upload endpoint
- Files are stored in Supabase Storage under `invoices/uploads/`
- Each file gets a unique timestamp prefix

## File Support

- **PDF Files**: `application/pdf`
- **Image Files**: `image/*` (JPG, PNG, etc.)
- **Max Size**: 10MB per file
- **Multiple Files**: Yes, unlimited

## Troubleshooting

1. **Upload Fails**: Check if the `invoices` storage bucket exists in Supabase
2. **Webhook Not Triggered**: Verify the N8N_WEBHOOK_URL in `.env.local`
3. **Storage Policies**: Run the SQL setup script if files can't be uploaded
