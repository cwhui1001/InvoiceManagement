# Invoice Management System

A modern, full-stack invoice management web application built with Next.js, TypeScript, and Supabase. This system streamlines invoice processing with intelligent PDF parsing, automated workflows, and comprehensive analytics.

## Features

### Core Functionality
- **Smart Invoice Upload**: Drag-and-drop interface with automatic PDF parsing and data extraction
- **Bulk Operations**: Process multiple invoices simultaneously with progress tracking
- **Advanced Filtering**: Search and filter invoices by date range, amount, status, and custom categories
- **PDF Management**: Store, view, and download invoice PDFs directly from the application
- **Real-time Updates**: Server-sent events for live progress tracking during bulk operations

### User Management
- **Role-Based Access Control**: Admin and user role separation with different permission levels
- **User Authentication**: Secure authentication powered by Supabase Auth
- **Admin Dashboard**: Comprehensive admin panel for user management and system oversight
- **Profile Management**: User profiles with customizable settings and preferences

### Analytics & Reporting
- **Interactive Charts**: Visual representations of invoice data using Chart.js and Recharts
- **Category Analysis**: Pie charts showing invoice distribution by categories
- **Top Uploaders**: Leaderboard tracking user contributions and upload statistics
- **Custom Date Ranges**: Flexible reporting periods for detailed analysis

### Automation & Integration
- **n8n Workflow Integration**: Automated invoice processing workflows
- **Smart Data Extraction**: Intelligent parsing of invoice fields from PDFs
- **Webhook Support**: Real-time notifications and third-party integrations
- **Background Processing**: Asynchronous handling of heavy operations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion for animations
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage for PDF files
- **Authentication**: Supabase Auth
- **Automation**: n8n workflow automation
- **Charts**: Chart.js, Recharts
- **UI Components**: Radix UI, Heroicons, Lucide Icons

## Prerequisites

- Node.js 18.x or higher
- npm or pnpm package manager
- Supabase account and project
- n8n instance (optional, for automation features)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cwhui1001/InvoiceManagement.git
   cd InvoiceManagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # n8n Configuration (optional)
   N8N_WEBHOOK_URL=your_n8n_webhook_url
   N8N_API_KEY=your_n8n_api_key
   
   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run the SQL migrations in your Supabase project:
   - Execute files from `/supabase-migrations/` folder in order
   - Set up storage buckets using `supabase-storage-setup.sql`

5. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
InvoiceManagement/
├── app/                      # Next.js App Router pages and API routes
│   ├── api/                  # API endpoints
│   │   ├── invoices/         # Invoice CRUD operations
│   │   ├── upload-n8n/       # n8n integration endpoints
│   │   └── users/            # User management APIs
│   ├── dashboard/            # Protected dashboard pages
│   │   ├── (overview)/       # Dashboard home with analytics
│   │   ├── invoices/         # Invoice management interface
│   │   └── admin-management/ # Admin-only features
│   ├── ui/                   # Reusable UI components
│   └── lib/                  # Utility functions and configurations
├── database/                 # Database migrations and scripts
├── n8n/                      # n8n workflow configurations
├── public/                   # Static assets
└── utils/                    # Shared utilities
```

## Usage

### For Regular Users

1. **Login**: Access the application and authenticate with your credentials
2. **Upload Invoices**: 
   - Navigate to the Invoices page
   - Click "Upload Invoice" or drag and drop PDF files
   - Review extracted data and make corrections if needed
3. **Manage Invoices**:
   - View all invoices in the table view
   - Use filters to find specific invoices
   - Click on any invoice to view details or download PDF
4. **View Analytics**: Check the dashboard for insights and statistics

### For Administrators

1. **User Management**:
   - Access Admin Management from the sidebar
   - Add, edit, or remove users
   - Assign roles and permissions
2. **System Monitoring**:
   - View system-wide statistics
   - Monitor upload activities
   - Track user engagement
3. **Bulk Operations**:
   - Process multiple invoices at once
   - Export data for reporting

## API Documentation

### Invoice Endpoints

- `GET /api/invoices` - Fetch all invoices with pagination
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get specific invoice details
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `POST /api/invoices/bulk-upload` - Upload multiple invoices
- `GET /api/invoices/[id]/pdf` - Download invoice PDF

### User Endpoints

- `GET /api/users/[username]/categories` - Get user's invoice categories
- `POST /api/users/[username]/categories` - Update user preferences

## Database Schema

The application uses the following main tables:

- `invoices` - Stores invoice metadata and extracted data
- `users` - User accounts and profiles
- `pdfs` - PDF file references and storage links
- `categories` - Invoice categorization
- `audit_logs` - System activity tracking

## Deployment

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Docker Deployment

```bash
docker-compose up -d
```

The application includes a Docker Compose configuration for easy containerized deployment.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

- All API routes are protected with authentication
- Role-based access control for sensitive operations
- Secure file upload with validation
- SQL injection prevention through parameterized queries
- XSS protection via React's built-in escaping

## Performance Optimizations

- Server-side rendering for improved SEO and initial load
- Image optimization with Next.js Image component
- Lazy loading of heavy components
- Database query optimization with proper indexing
- Caching strategies for frequently accessed data

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify Supabase credentials in `.env.local`
   - Check if Supabase project is active

2. **PDF Upload Failures**
   - Ensure storage bucket exists and has proper permissions
   - Check file size limits in Supabase storage settings

3. **Authentication Issues**
   - Clear browser cookies and local storage
   - Verify Supabase Auth settings

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- Workflow automation by [n8n](https://n8n.io/)
- UI components from [Radix UI](https://www.radix-ui.com/)