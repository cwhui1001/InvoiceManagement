'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { deleteInvoice, updateBulkInvoiceStatus } from '@/app/lib/actions';

interface BulkActionsProps {
  selectedInvoices: string[];
  onDeselectAll: () => void;
  onActionComplete: () => void;
}

export default function BulkActions({ 
  selectedInvoices, 
  onDeselectAll, 
  onActionComplete 
}: BulkActionsProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await Promise.all(
        selectedInvoices.map(id => deleteInvoice(id))
      );
      onDeselectAll();
      onActionComplete();
      // Force a router refresh to ensure the UI updates
      router.refresh();
    } catch (error) {
      console.error('Error deleting invoices:', error);
      alert('Error deleting invoices. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleBulkStatusUpdate = async (status: 'pending' | 'done') => {
    setIsProcessing(true);
    try {
      await updateBulkInvoiceStatus(selectedInvoices, status);
      onDeselectAll();
      onActionComplete();
      // Force a router refresh to ensure the UI updates
      router.refresh();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Error updating invoice status. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowStatusMenu(false);
    }
  };

  if (selectedInvoices.length === 0) return null;

  return (
    <>
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center gap-2">
            {/* Status Update Button */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" />
                Set Status
              </button>
              
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <button
                    onClick={() => handleBulkStatusUpdate('pending')}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Set Pending
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('done')}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    Set Done
                  </button>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>

            {/* Cancel Button */}
            <button
              onClick={onDeselectAll}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <XMarkIcon className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"></div>
          <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Invoices</h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? 's' : ''}?{' '}
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isProcessing ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Click outside to close status menu */}
      {showStatusMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowStatusMenu(false)}
        />
      )}
    </>
  );
}
