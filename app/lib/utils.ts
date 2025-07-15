import { Revenue } from './definitions';

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

// Date conversion utilities
export const parseStringToDate = (dateStr: string | null | undefined): Date | null => {
  // Handle null, undefined, or empty string
  if (!dateStr || dateStr === 'Unknown Date' || dateStr === 'NULL') {
    return null;
  }
  
  let date: Date;
  
  try {
    // Try different date parsing strategies
    if (dateStr.includes('/')) {
      // Handle DD/MM/YYYY format (like 23/04/2024)
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateStr);
      }
    } else if (dateStr.includes('.')) {
      // Handle DD.MM.YYYY format (like 20.06.2025)
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Month is 0-indexed
        const year = parseInt(parts[2]);
        date = new Date(year, month, day);
      } else {
        date = new Date(dateStr);
      }
    } else if (dateStr.includes('-') && dateStr.length <= 10) {
      // Handle DD-MMM-YY format (like 06-May-24) or ISO format (2023-10-26)
      if (dateStr.match(/\d{1,2}-[A-Za-z]{3}-\d{2}$/)) {
        // Convert 06-May-24 to proper format
        const parts = dateStr.split('-');
        const day = parts[0];
        const month = parts[1];
        const year = '20' + parts[2]; // Convert YY to 20YY
        date = new Date(`${day} ${month} ${year}`);
      } else {
        // ISO format like 2023-10-26
        date = new Date(dateStr);
      }
    } else {
      // Handle other formats (like "May 6, 2024")
      date = new Date(dateStr);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateStr);
      return null;
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
};

export const formatDateFromObject = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) {
    return 'Unknown Date';
  }
  
  // Format as DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

export const convertDateToInputFormat = (date: Date | null): string => {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  // Format as YYYY-MM-DD for date inputs
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const convertDateFromInputFormat = (dateStr: string): Date | null => {
  if (!dateStr) {
    return null;
  }
  
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};

// Legacy functions for backward compatibility
export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-GB', // Changed to en-GB for DD/MM/YYYY format
) => {
  const date = parseStringToDate(dateStr);
  return formatDateFromObject(date);
};

// Convert DD/MM/YYYY to YYYY-MM-DD for date inputs
export const convertToDateInputFormat = (dateStr: string): string => {
  const date = parseStringToDate(dateStr);
  return convertDateToInputFormat(date);
};

// Convert YYYY-MM-DD to DD/MM/YYYY format
export const convertFromDateInputFormat = (dateStr: string): string => {
  const date = convertDateFromInputFormat(dateStr);
  return formatDateFromObject(date);
};

export const generateYAxis = (revenue: Revenue[]) => {
  // Calculate what labels we need to display on the y-axis
  // based on highest record and in 1000s
  const yAxisLabels = [];
  const highestRecord = Math.max(...revenue.map((month) => month.revenue));
  const topLabel = Math.ceil(highestRecord / 1000) * 1000;

  for (let i = topLabel; i >= 0; i -= 1000) {
    yAxisLabels.push(`$${i / 1000}K`);
  }

  return { yAxisLabels, topLabel };
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};
