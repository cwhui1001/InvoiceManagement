import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { UploadProvider } from '@/app/contexts/UploadContext';
import UploadProgressBar from '@/app/ui/upload/UploadProgressBar';
import UploadProgressWrapper from '@/app/ui/upload/UploadProgressWrapper';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <UploadProvider>
          {children}
          <UploadProgressWrapper />
        </UploadProvider>
      </body>
    </html>
  );
}
