import React, { useState } from 'react';
import { Booking } from '../types';
import { CloseIcon, MpesaIcon, AirtelMoneyIcon, CardIcon, BankIcon, ClipboardIcon, CheckIcon } from './IconComponents';
import { useToast } from './Toast';
import { useAppContext } from '../contexts/AppContext';

interface InvoiceModalProps {
  booking: Booking;
  onPayInvoiceSuccess: (bookingId: string) => void;
}

type PaymentMethod = 'mpesa' | 'airtel' | 'card' | 'bank';

const PaymentDetailRow: React.FC<{ label: string, value: string, canCopy?: boolean }> = ({ label, value, canCopy = false }) => {
    const toast = useToast();
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(value).then(() => {
            toast.success(`${label} copied!`);
        }, (err) => {
            toast.error('Failed to copy.');
        });
    };

    return (
        <div className="flex justify-between items-center py-2.5 group">
            <div>
                <span className="text-sm text-gray-500">{label}</span>
                <p className="text-md font-semibold text-gray-800">{value}</p>
            </div>
            {canCopy && (
                <button type="button" onClick={handleCopyToClipboard} className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-gray-200 transition-all text-gray-600 hover:text-primary" aria-label={`Copy ${label}`}>
                    <ClipboardIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

const GatewayButton: React.FC<{ icon: React.ReactNode, label: string, method: PaymentMethod, selectedMethod: PaymentMethod, setSelectedMethod: (method: PaymentMethod) => void }> = ({ icon, label, method, selectedMethod, setSelectedMethod }) => (
    <button
        type="button"
        onClick={() => setSelectedMethod(method)}
        className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 text-center ${selectedMethod === method ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-400'}`}
    >
        <div className="h-8 w-8 mb-1 flex items-center justify-center">{icon}</div>
        <span className="text-xs font-semibold text-gray-700">{label}</span>
    </button>
);

const InvoiceModal: React.FC<InvoiceModalProps> = ({ booking, onPayInvoiceSuccess }) => {
    const { dispatch } = useAppContext();
    const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
    const [isPaymentComplete, setIsPaymentComplete] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');

    const handlePayment = () => {
        setIsConfirmingPayment(true);
        setTimeout(() => {
          setIsConfirmingPayment(false);
          setIsPaymentComplete(true);
          // After showing success message for 2 seconds, call the success handler which will close the modal
          setTimeout(() => {
            onPayInvoiceSuccess(booking.id);
          }, 2000); 
        }, 3500); // Simulate payment processing time
    };

    const getButtonText = () => {
        switch (selectedMethod) {
            case 'card': return 'Proceed to Secure Payment';
            case 'mpesa':
            case 'airtel':
            case 'bank':
                return `I Have Paid KES ${booking.totalAmount?.toLocaleString()}, Confirm`;
            default: return `Pay KES ${booking.totalAmount?.toLocaleString()} Now`;
        }
    };

    if (isPaymentComplete) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md text-center animate-fade-in p-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckIcon className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
                    <p className="text-gray-600 mt-2">Your payment of KES {booking.totalAmount?.toLocaleString()} has been confirmed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
            <div className="p-6 relative">
              <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isConfirmingPayment || isPaymentComplete}>
                <CloseIcon className="w-6 h-6" />
              </button>

              {isConfirmingPayment ? (
                <div className="text-center py-12 animate-fade-in">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-700">Confirming your payment...</p>
                    <p className="text-sm text-gray-500">Please wait, do not close this window.</p>
                </div>
              ) : (
                <>
                    <h2 id="invoice-title" className="text-2xl font-bold text-gray-800 mb-4">Pay Invoice</h2>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
                        <span className="text-sm text-gray-600">Amount Due:</span>
                        <p className="text-3xl font-bold text-primary">KES {booking.totalAmount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">For service with {booking.provider.name}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <GatewayButton icon={<MpesaIcon className="h-8" />} label="M-Pesa" method="mpesa" selectedMethod={selectedMethod} setSelectedMethod={setSelectedMethod} />
                        <GatewayButton icon={<AirtelMoneyIcon className="h-8" />} label="Airtel Money" method="airtel" selectedMethod={selectedMethod} setSelectedMethod={setSelectedMethod} />
                        <GatewayButton icon={<CardIcon className="h-8 text-gray-700" />} label="Card" method="card" selectedMethod={selectedMethod} setSelectedMethod={setSelectedMethod} />
                        <GatewayButton icon={<BankIcon className="h-8 text-gray-700" />} label="Bank" method="bank" selectedMethod={selectedMethod} setSelectedMethod={setSelectedMethod} />
                    </div>
                    
                    <div className="animate-fade-in min-h-[160px] pt-2">
                        {selectedMethod === 'card' && (
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">You will be redirected to our secure payment gateway to complete your transaction.</p>
                            </div>
                        )}
                         {selectedMethod === 'mpesa' && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-700 mb-1 font-semibold">Pay via M-Pesa:</p>
                                <div className="divide-y divide-gray-200">
                                    <PaymentDetailRow label="Business No." value="247247" canCopy />
                                    <PaymentDetailRow label="Account No." value="VKENSERVE" canCopy />
                                    <PaymentDetailRow label="Amount" value={`KES ${booking.totalAmount?.toLocaleString()}`} />
                                </div>
                            </div>
                        )}
                        {selectedMethod === 'airtel' && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-700 mb-1 font-semibold">Pay via Airtel Money:</p>
                                <div className="divide-y divide-gray-200">
                                    <PaymentDetailRow label="Business Name" value="V-KEN SERVE" canCopy />
                                    <PaymentDetailRow label="Till Number" value="1234567" canCopy />
                                    <PaymentDetailRow label="Amount" value={`KES ${booking.totalAmount?.toLocaleString()}`} />
                                </div>
                            </div>
                        )}
                         {selectedMethod === 'bank' && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-700 mb-1 font-semibold">Pay via Bank Transfer:</p>
                                <div className="divide-y divide-gray-200">
                                    <PaymentDetailRow label="Bank Name" value="KCB Bank" />
                                    <PaymentDetailRow label="Account Name" value="V-Ken Serve Ltd." />
                                    <PaymentDetailRow label="Account Number" value="1234567890" canCopy />
                                    <PaymentDetailRow label="Branch" value="Kencom House" />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        type="button"
                        onClick={handlePayment} 
                        className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors"
                    >
                        {getButtonText()}
                    </button>
                </>
              )}
            </div>
          </div>
        </div>
    );
};

export default InvoiceModal;
