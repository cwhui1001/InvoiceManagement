'use client';

import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useState } from 'react';
import { updateInvoiceStatus } from '@/app/lib/actions';

export default function InteractiveInvoiceStatus({ 
  id, 
  status, 
  onStatusChange 
}: { 
  id: string; 
  status: string; 
  onStatusChange?: (newStatus: string) => void;
}) {
  // Initialize with the correct status (ensure lowercase for UI)
  const [currentStatus, setCurrentStatus] = useState(status.toLowerCase() === 'done' ? 'done' : 'pending');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUpdating) return;

    const newStatus = currentStatus === 'pending' ? 'done' : 'pending';
    setIsUpdating(true);
    
    try {
      await updateInvoiceStatus(id, newStatus);
      setCurrentStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Error updating invoice status:', error);
      // Optionally notify user of error (e.g., toast notification)
      alert('Failed to update invoice status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleStatusToggle}
      disabled={isUpdating}
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50',
        {
          'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-300': currentStatus === 'pending',
          'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300': currentStatus === 'done',
        },
      )}
      title={`Click to mark as ${currentStatus === 'pending' ? 'done' : 'pending'}`}
    >
      {isUpdating ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
          Updating...
        </>
      ) : currentStatus === 'pending' ? (
        <>
          Pending
          <ClockIcon className="ml-1 w-3 h-3" />
        </>
      ) : (
        <>
          Done
          <CheckIcon className="ml-1 w-3 h-3" />
        </>
      )}
    </button>
  );
}