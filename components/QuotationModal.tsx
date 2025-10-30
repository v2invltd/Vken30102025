

import React, { useState, useEffect } from 'react';
import { Booking, QuotationItem, User, UserRole } from '../types';
import { CloseIcon, TrashIcon, SparklesIcon } from './IconComponents';
import { useToast } from './Toast';
import * as api from '../frontend/services/api';
import { useAppContext } from '../contexts/AppContext';

interface QuotationModalProps {
  booking: Booking;
  mode: 'edit' | 'view'; // 'edit' for provider, 'view' for customer
  currentUser: User;
  onSendQuotation: (bookingId: string, items: QuotationItem[], total: number) => void;
  onRespondToQuotation: (bookingId: string, response: 'Accepted' | 'Declined') => void;
}

const QuotationModal: React.FC<QuotationModalProps> = ({ booking, mode, currentUser, onSendQuotation, onRespondToQuotation }) => {
  const { dispatch } = useAppContext();
  const toast = useToast();
  const [items, setItems] = useState<QuotationItem[]>(booking.quotationItems || [{ id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
  const [total, setTotal] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setTotal(newTotal);
  }, [items]);

  const handleItemChange = (id: string, field: keyof Omit<QuotationItem, 'id'>, value: string | number) => {
    setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addNewItem = () => {
    setItems(prev => [...prev, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    } else {
      toast.error("You must have at least one item in the quotation.");
    }
  };

  const handleAiGenerate = async () => {
      if (!booking.requestDetails) {
          toast.error("No customer details to generate a quote from. Please create one manually.");
          return;
      }
      setIsGenerating(true);
      try {
          const generatedItems = await api.generateQuotationItems(booking.provider, booking.requestDetails);
          const newItemsWithIds: QuotationItem[] = generatedItems.map((item, index) => ({
              ...item,
              id: `ai-item-${Date.now()}-${index}`
          }));
          setItems(newItemsWithIds);
          toast.success("AI has generated a draft quotation!");
      } catch (error) {
          toast.error("Failed to generate AI quotation. Please try again or create one manually.");
          console.error(error);
      } finally {
          setIsGenerating(false);
      }
  };
  
  const handleSend = () => {
    // Validation
    for(const item of items) {
        if (!item.description.trim() || item.quantity <= 0 || item.unitPrice < 0) {
            toast.error("Please ensure all items have a valid description, quantity, and price.");
            return;
        }
    }
    onSendQuotation(booking.id, items, total);
  }

  const isProvider = currentUser.role === UserRole.PROVIDER;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="quotation-title">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg flex justify-between items-center flex-shrink-0">
          <div>
            <h2 id="quotation-title" className="text-xl font-bold text-gray-800">
                {mode === 'edit' ? 'Create Quotation' : 'View Quotation'}
            </h2>
            <p className="text-sm text-gray-500">For {isProvider ? booking.customer.name : booking.provider.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow p-6 overflow-y-auto">
             {booking.requestDetails && (
                <div className="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800">Customer's Request:</p>
                    <p className="text-sm text-blue-700 italic">"{booking.requestDetails}"</p>
                </div>
             )}
            <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-500 px-2">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>
                {/* Items */}
                {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-gray-50 p-2 rounded-lg">
                        <div className="col-span-12 sm:col-span-6">
                            {mode === 'edit' ? (
                                <input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder={`e.g., Labor Charges`} />
                            ) : (
                                <p className="text-sm text-gray-800">{item.description}</p>
                            )}
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                             {mode === 'edit' ? (
                                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md text-center" min="1"/>
                            ) : (
                                <p className="text-sm text-center text-gray-800">{item.quantity}</p>
                            )}
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                             {mode === 'edit' ? (
                                <input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-md text-right" min="0"/>
                            ) : (
                                <p className="text-sm text-right text-gray-800">{item.unitPrice.toLocaleString()}</p>
                            )}
                        </div>
                        <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                            <p className="text-sm font-semibold text-right text-gray-800 w-full">{(item.quantity * item.unitPrice).toLocaleString()}</p>
                             {mode === 'edit' && (
                                <button onClick={() => removeItem(item.id)} className="ml-2 text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-5 h-5"/></button>
                            )}
                        </div>
                    </div>
                ))}
                
                {mode === 'edit' && (
                    <div className="flex items-center justify-between">
                         <button onClick={addNewItem} className="text-sm font-semibold text-primary hover:text-green-800">+ Add Line Item</button>
                         <button onClick={handleAiGenerate} disabled={isGenerating} className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary-light/40 hover:bg-primary-light/70 px-3 py-2 rounded-lg disabled:opacity-60">
                             {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div> : <SparklesIcon className="w-4 h-4"/>}
                             Generate with AI
                         </button>
                    </div>
                )}
            </div>
            {/* Total */}
            <div className="mt-6 pt-4 border-t-2 border-gray-200 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between font-bold text-lg">
                        <span className="text-gray-800">Grand Total:</span>
                        <span className="text-primary">KES {total.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end flex-shrink-0 space-x-3">
          {mode === 'edit' ? (
            <button onClick={handleSend} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800">Send Quotation</button>
          ) : (
             booking.quotationStatus === 'Sent' && (
                <>
                    <button onClick={() => onRespondToQuotation(booking.id, 'Declined')} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700">Decline</button>
                    <button onClick={() => onRespondToQuotation(booking.id, 'Accepted')} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800">Accept Quotation</button>
                </>
             )
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationModal;