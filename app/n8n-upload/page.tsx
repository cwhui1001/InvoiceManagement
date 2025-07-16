import N8NUploadForm from '@/app/ui/upload/n8n-upload-form';

export default function N8NUploadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invoice Upload with n8n
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Simply upload your invoice PDFs and let the n8n workflow handle OCR processing, 
            invoice detection, and database linking automatically.
          </p>
        </div>
        
        <N8NUploadForm />
      </div>
    </div>
  );
}
