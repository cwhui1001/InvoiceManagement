'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { CustomerField, OINV, INV1 } from '@/app/lib/definitions';
import { updateInvoice } from '../../lib/actions';
import { convertDateToInputFormat, convertDateFromInputFormat, formatDateFromObject } from '@/app/lib/utils';
import { createClient } from '@/utils/supabase/client';

interface EditInvoiceFormProps {
  invoiceData: {
    header: OINV;
    lineItems: INV1[];
  };
  customers: CustomerField[];
}

export default function EditInvoiceForm({ invoiceData, customers }: EditInvoiceFormProps) {
  const supabase = createClient();
  const [categories, setCategories] = useState<string[]>([]);
  
  // Store the original DocNum to handle DocNum changes
  const originalDocNum = invoiceData.header.DocNum;
  
  // Debug: Log the invoice data to see what we're receiving
  console.log('Invoice Data:', invoiceData);
  console.log('Line Items:', invoiceData.lineItems);
  
  const [formData, setFormData] = useState({
    header: invoiceData.header,
    lineItems: invoiceData.lineItems && invoiceData.lineItems.length > 0 
      ? invoiceData.lineItems
      : [
        {
          DocNum: invoiceData.header.DocNum,
          No: 1,
          ItemCode: '',
          Description: '',
          Quantity: 1,
          UnitPrice: 0,
          Tax: '',
          Category: '', // Initialize as empty, will be set after fetching categories
          Amount: 0,
          Discount: null,
        } as INV1
      ]
  });

  // Fetch unique categories from INV1 table
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('INV1')
        .select('Category')
        .not('Category', 'is', null)
        .order('Category', { ascending: true });
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      // Extract unique categories and log for debugging
      const uniqueCategories = [...new Set(data?.map(item => item.Category).filter(Boolean))];
      console.log('Fetched Categories:', uniqueCategories); // Debug log
      setCategories(uniqueCategories);
      
      // Set default category for line items if not already set
      if (uniqueCategories.length > 0) {
        setFormData(prev => ({
          ...prev,
          lineItems: prev.lineItems.map(item => ({
            ...item,
            Category: item.Category || uniqueCategories[0] // Default to first category if not set
          }))
        }));
      }
    };
    
    fetchCategories();
  }, []);

  const handleHeaderChange = (field: keyof OINV, value: string | number | Date) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        header: {
          ...prev.header,
          [field]: value
        }
      };
      
      // If DocNum changes, update all line items to use the new DocNum
      if (field === 'DocNum' && typeof value === 'string') {
        newFormData.lineItems = prev.lineItems.map(item => ({
          ...item,
          DocNum: value
        }));
      }
      
      return newFormData;
    });
  };

  const handleLineItemChange = (index: number, field: keyof INV1, value: string | number) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: value
    };
    
    // Recalculate amount if quantity, unit price, or discount changes
    if (field === 'Quantity' || field === 'UnitPrice' || field === 'Discount') {
      const quantity = field === 'Quantity' ? Number(value) : newLineItems[index].Quantity;
      const unitPrice = field === 'UnitPrice' ? Number(value) : newLineItems[index].UnitPrice;
      const discount = field === 'Discount' ? Number(value) : (newLineItems[index].Discount || 0);
      const subtotal = (quantity || 0) * (unitPrice || 0);
      newLineItems[index].Amount = subtotal - (discount || 0);
    }
    
    setFormData(prev => ({
      ...prev,
      lineItems: newLineItems
    }));
    
    // Recalculate totals
    recalculateTotals(newLineItems);
  };

  const addLineItem = () => {
    const newLineItem: INV1 = {
      DocNum: formData.header.DocNum,
      No: formData.lineItems.length + 1,
      ItemCode: '',
      Description: '',
      Quantity: 1,
      UnitPrice: 0,
      Tax: '',
      Category: categories.length > 0 ? categories[0] : '', // Default to first category if available
      Amount: 0,
      Discount: null,
    };
    
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newLineItem]
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      const newLineItems = formData.lineItems.filter((_, i) => i !== index);
      // Renumber the line items
      const renumberedItems = newLineItems.map((item, i) => ({
        ...item,
        No: i + 1
      }));
      
      setFormData(prev => ({
        ...prev,
        lineItems: renumberedItems
      }));
      
      recalculateTotals(renumberedItems);
    }
  };

  const recalculateTotals = (lineItems: INV1[]) => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.Amount || 0), 0);
    const gstRate = 0.1; // 10% GST
    const gstAmount = subtotal * gstRate;
    const totalWithGST = subtotal + gstAmount;
    
    handleHeaderChange('Totalb4GST', subtotal);
    handleHeaderChange('TotalwithGST', totalWithGST);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate DocNum
    if (!formData.header.DocNum || formData.header.DocNum.trim() === '') {
      alert('Document Number is required');
      return;
    }
    
    try {
      await updateInvoice(originalDocNum, formData);
      // Redirect or show success message
    } catch (error) {
      console.error('Error updating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the invoice';
      alert(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Header Section */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
            <p className="text-sm text-gray-600 mt-1">Basic information about the invoice</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Number */}
            <div>
              <label htmlFor="docNum" className="block text-sm font-medium text-gray-700 mb-2">
                Document Number
                {formData.header.DocNum !== originalDocNum && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (Changed from: {originalDocNum})
                  </span>
                )}
              </label>
              
                <input
                  id="docNum"
                  name="docNum"
                  type="text"
                  value={formData.header.DocNum}
                  onChange={(e) => handleHeaderChange('DocNum', e.target.value)}
                  className={`block w-full rounded-md border py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formData.header.DocNum !== originalDocNum 
                      ? 'border-amber-300 bg-amber-50' 
                      : 'border-gray-300 bg-white'
                  }`}
                  placeholder="Enter document number..."
                />
                
            </div>

            {/* Customer Code */}
            <div>
              <label htmlFor="custCode" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Code
              </label>
              <input
                id="custCode"
                name="custCode"
                type="text"
                value={formData.header.CustCode || ''}
                onChange={(e) => handleHeaderChange('CustCode', e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer code..."
              />
            </div>

            {/* Customer Name */}
            <div>
              <label htmlFor="custName" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                id="custName"
                name="custName"
                type="text"
                value={formData.header.CustName || ''}
                onChange={(e) => handleHeaderChange('CustName', e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer name..."
              />
            </div>

            {/* Document Date */}
            <div>
              <label htmlFor="docDate" className="block text-sm font-medium text-gray-700 mb-2">
                Document Date
              </label>
              <input
                id="docDate"
                name="docDate"
                type="date"
                value={convertDateToInputFormat(formData.header.DocDate)}
                onChange={(e) => handleHeaderChange('DocDate', convertDateFromInputFormat(e.target.value) || new Date())}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={convertDateToInputFormat(formData.header.DueDate)}
                onChange={(e) => handleHeaderChange('DueDate', convertDateFromInputFormat(e.target.value) || new Date())}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date
              </label>
              <input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                value={convertDateToInputFormat(formData.header.DeliveryDate || null)}
                onChange={(e) => handleHeaderChange('DeliveryDate', convertDateFromInputFormat(e.target.value) || new Date())}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Customer Address */}
            <div className="md:col-span-2">
              <label htmlFor="custAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Address
              </label>
              <textarea
                id="custAddress"
                name="custAddress"
                value={formData.header.CustAddress || ''}
                onChange={(e) => handleHeaderChange('CustAddress', e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter customer address..."
              />
            </div>

            {/* Vendor Name */}
            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Name
              </label>
              <input
                id="vendorName"
                name="vendorName"
                type="text"
                value={formData.header.VendorName || ''}
                onChange={(e) => handleHeaderChange('VendorName', e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter vendor name..."
              />
            </div>

            {/* Vendor Address */}
            <div>
              <label htmlFor="vendorAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Address
              </label>
              <textarea
                id="vendorAddress"
                name="vendorAddress"
                value={formData.header.VendorAddresss || ''}
                onChange={(e) => handleHeaderChange('VendorAddresss', e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter vendor address..."
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
              <p className="text-sm text-gray-600 mt-1">Add and manage invoice line items</p>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.lineItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">Item {index + 1}</span>
                  </div>
                  {formData.lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Code
                    </label>
                    <input
                      type="text"
                      value={item.ItemCode || ''}
                      onChange={(e) => handleLineItemChange(index, 'ItemCode', e.target.value)}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="Enter item code..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.Description || ''}
                      onChange={(e) => handleLineItemChange(index, 'Description', e.target.value)}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="Enter item description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={item.Category || ''}
                      onChange={(e) => handleLineItemChange(index, 'Category', e.target.value)}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      placeholder="Enter category..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.Quantity || ''}
                      onChange={(e) => handleLineItemChange(index, 'Quantity', parseInt(e.target.value) || 0)}
                      className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      min="1"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.UnitPrice || ''}
                        onChange={(e) => handleLineItemChange(index, 'UnitPrice', parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.Discount || ''}
                        onChange={(e) => handleLineItemChange(index, 'Discount', parseFloat(e.target.value) || 0)}
                        className="block w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.Amount || ''}
                        readOnly
                        className="block w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm bg-gray-100 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Information
                  </label>
                  <input
                    type="text"
                    value={item.Tax || ''}
                    onChange={(e) => handleLineItemChange(index, 'Tax', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="GST, VAT, etc."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Section */}
        <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-6">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invoice Totals</h3>
            <p className="text-sm text-gray-600 mt-1">Calculated amounts with GST</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Before GST
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.header.Totalb4GST || ''}
                    readOnly
                    className="block w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm bg-gray-100 font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total With GST
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.header.TotalwithGST || ''}
                    readOnly
                    className="block w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm bg-blue-50 font-bold text-blue-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </Link>
          <Button 
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Update Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}