import React, { useState, useEffect } from 'react';
import { ServiceProvider, User, Booking } from '../types';
import { CloseIcon, MpesaIcon, ServiceCategoryIcon, CheckIcon, AirtelMoneyIcon, CardIcon, BankIcon, ClipboardIcon } from './IconComponents';
import { useToast } from './Toast';
import { useAppContext } from '../contexts/AppContext';
import BookingConfirmation from './BookingConfirmation';
import * as api from '../frontend/services/api'; // Import the new API service

interface BookingModalProps {
  provider: ServiceProvider;
  user: User;
  onSendRequest: (provider: ServiceProvider, serviceDate: Date, requestDetails: string, type: 'instant' | 'quote') => Promise<Booking>;
  onCustomerPaymentSuccess: (bookingId: string) => void;
  booking?: Booking; // If present, modal is for payment confirmation
  type: 'instant' | 'quote';
}

type PaymentMethod = 'mpesa' | 'airtel' | 'card' | 'bank';

const BookingModal: React.FC<BookingModalProps> = ({ provider, user, onSendRequest, onCustomerPaymentSuccess, booking, type }) => {
  const { dispatch } = useAppContext();
  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });
  
  const isPaymentMode = !!booking;
  
  const [step, setStep] = useState(isPaymentMode ? 3 : 1);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(isPaymentMode && booking ? new Date(booking.serviceDate) : null);
  const [requestDetails, setRequestDetails] = useState(isPaymentMode && booking ? booking.requestDetails || '' : '');
  const [selectedTime, setSelectedTime] = useState<string>(() => {
    if (isPaymentMode && booking) {
      const date = new Date(booking.serviceDate);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return '';
  });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const toast = useToast();

  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const PaymentDetailRow: React.FC<{ label: string, value: string, canCopy?: boolean }> = ({ label, value, canCopy = false }) => {
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(value).then(() => {
            toast.success(`${label} copied!`);
        }, (err) => {
            toast.error('Failed to copy.');
            console.error('Could not copy text: ', err);
        });
    };

    return (
        <div className="flex justify-between items-center py-2.5 group">
            <div>
                <span className="text-sm text-gray-500">{label}</span>
                <p className="text-md font-semibold text-gray-800">{value}</p>
            </div>
            {canCopy && (
                <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-gray-200 transition-all text-gray-600 hover:text-primary"
                    aria-label={`Copy ${label}`}
                >
                    <ClipboardIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
  };

  const handleSendBookingRequest = async () => {
    if (selectedDate && selectedTime) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const serviceDate = new Date(selectedDate);
      serviceDate.setHours(hours, minutes, 0, 0);
      
      if(type === 'instant'){
         setStep(3); // For instant book, go directly to payment (pre-payment phase)
      } else {
        const newBooking = await onSendRequest(provider, serviceDate, requestDetails, 'quote');
        setCreatedBooking(newBooking);
        setStep(4); // For quote request, go to confirmation screen
      }
    }
  };

  const handlePayment = async () => {
    setIsConfirmingPayment(true);
    // For instant booking, we need to create the booking first, then proceed to payment confirmation.
    // The actual onSendRequest will handle backend booking creation AND notification.
    if(type === 'instant' && selectedDate && selectedTime){
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const serviceDate = new Date(selectedDate);
        serviceDate.setHours(hours, minutes, 0, 0);
        // This will create the booking on the backend and simulate payment through onSendRequest's success.
        const newBooking = await onSendRequest(provider, serviceDate, requestDetails, 'instant');
        setCreatedBooking(newBooking);
    }
    
    // Simulate payment processing time, then set step to confirmation.
    setTimeout(() => {
      setIsConfirmingPayment(false);
      setStep(4);
    }, 3500);
  };

  const handleBookingComplete = () => {
    const bookingToUpdate = createdBooking || booking;
    if (bookingToUpdate) {
        // onCustomerPaymentSuccess is ONLY for when a customer pays for an *already accepted quote*.
        // The 'booking' prop will be present in that case (isPaymentMode will be true).
        if (isPaymentMode) { // This means we're dealing with an existing booking that needs final payment
            onCustomerPaymentSuccess(bookingToUpdate.id);
        } else {
            // This branch is for new bookings created within this modal instance.
            // For both 'instant' (after payment) and 'quote' (before payment), we just close.
            onClose();
        }
    } else {
        onClose();
    }
  };
  
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };
  
  const renderCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const goToPrevMonth = () => setCalendarMonth(new Date(year, month - 1, 1));
    const goToNextMonth = () => setCalendarMonth(new Date(year, month + 1, 1));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={goToPrevMonth} className="p-2 rounded-full hover:bg-gray-100" disabled={isPaymentMode}>
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h3 className="text-lg font-semibold text-gray-800">
                    {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button type="button" onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100" disabled={isPaymentMode}>
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500">
                {dayHeaders.map(day => <div key={day} className="font-medium">{day}</div>)}
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const dateString = date.toISOString().split('T')[0];
                    const status = provider.availability?.[dateString];
                    
                    const isPast = date < today;
                    const isToday = date.toDateString() === today.toDateString();
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    
                    const isClickable = !isPast && !isPaymentMode && status !== 'booked' && status !== 'unavailable';

                    let classes = "w-10 h-10 flex items-center justify-center rounded-full transition-colors";
                    
                    // Base styling from availability
                    if (isPast) {
                        classes += " text-gray-400";
                    } else if (isPaymentMode && !isSelected) {
                        classes += " text-gray-400";
                        if(isSelected) classes += " bg-primary text-white font-bold";
                    }
                    else {
                        switch(status) {
                            case 'available': classes += " bg-green-100 text-green-800 font-bold"; break;
                            case 'booked': classes += " bg-red-100 text-red-500 line-through"; break;
                            case 'unavailable': classes += " bg-gray-200 text-gray-500 line-through"; break;
                            default: classes += " text-gray-700";
                        }
                    }

                    // Interaction styling
                    if (isClickable) {
                        classes += " cursor-pointer hover:bg-primary hover:text-white";
                    } else {
                        classes += " cursor-not-allowed";
                    }

                    // Override with selected/today styling
                    if (isSelected) {
                        // Ensure selected style is prominent
                        classes = "w-10 h-10 flex items-center justify-center rounded-full transition-colors bg-primary text-white font-bold";
                    } else if (isToday && isClickable) {
                        classes += " ring-2 ring-primary";
                    }
                    
                    return <div key={day} onClick={() => isClickable && setSelectedDate(date)} className={classes}>{day}</div>;
                })}
            </div>
        </div>
    );
  };

  const GatewayButton: React.FC<{ icon: React.ReactNode, label: string, method: PaymentMethod }> = ({ icon, label, method }) => (
    <button
        type="button"
        onClick={() => setSelectedMethod(method)}
        className={`p-3 border-2 rounded-lg flex flex-col items-center justify-center transition-all duration-200 text-center ${selectedMethod === method ? 'border-primary bg-primary bg-opacity-5' : 'border-gray-200 hover:border-gray-400'}`}
    >
        <div className="h-8 w-8 mb-1 flex items-center justify-center">{icon}</div>
        <span className="text-xs font-semibold text-gray-700">{label}</span>
    </button>
  );

  const getButtonText = () => {
    switch (selectedMethod) {
        case 'card': return 'Proceed to Secure Payment';
        case 'mpesa':
        case 'airtel':
        case 'bank':
            return 'I Have Paid, Confirm Booking';
        default: return 'Pay KES 200 Now';
    }
  };

  const renderPaymentContent = () => {
    if (isConfirmingPayment) {
      return (
        <div className="text-center py-12 animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Confirming your booking...</p>
          <p className="text-sm text-gray-500">Please wait, do not close this window.</p>
        </div>
      );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Choose Payment Method</h2>
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-center">
                <span className="text-sm text-gray-600">Amount Due:</span>
                <span className="text-2xl font-bold text-primary ml-2">KES 200</span>
                <span className="text-sm text-gray-500"> (Booking Fee)</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <GatewayButton icon={<MpesaIcon className="h-8" />} label="M-Pesa" method="mpesa" />
                <GatewayButton icon={<AirtelMoneyIcon className="h-8" />} label="Airtel Money" method="airtel" />
                <GatewayButton icon={<CardIcon className="h-8 text-gray-700" />} label="Card" method="card" />
                <GatewayButton icon={<BankIcon className="h-8 text-gray-700" />} label="Bank" method="bank" />
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
                            <PaymentDetailRow label="Amount" value="KES 200" />
                        </div>
                    </div>
                )}
                {selectedMethod === 'airtel' && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-700 mb-1 font-semibold">Pay via Airtel Money:</p>
                        <div className="divide-y divide-gray-200">
                            <PaymentDetailRow label="Business Name" value="V-KEN SERVE" canCopy />
                            <PaymentDetailRow label="Till Number" value="1234567" canCopy />
                            <PaymentDetailRow label="Amount" value="KES 200" />
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
        </div>
    );
  }
  
  const title = type === 'instant' ? 'Instantly Book Service' : 'Request a Quote';
  const buttonText = type === 'instant' ? 'Proceed to Payment' : 'Send Booking Request';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled={isConfirmingPayment || step === 4}>
            <CloseIcon className="w-6 h-6" />
          </button>
          
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 id="booking-title" className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
              <div className="flex items-center space-x-4 mb-6">
                <img src={provider.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=007A33&color=fff&size=128`} alt={provider.name} className="w-24 h-24 rounded-lg object-cover" />
                <div>
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  <div className="flex items-center text-primary mt-1">
                    <ServiceCategoryIcon category={provider.category} className="w-5 h-5 mr-2" />
                    <p className="text-sm font-semibold">{provider.category}</p>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{provider.locations[0]}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                    <label htmlFor="requestDetails" className="block text-sm font-medium text-gray-700 mb-1">Describe your issue (optional)</label>
                    <textarea
                        id="requestDetails"
                        value={requestDetails}
                        onChange={(e) => setRequestDetails(e.target.value)}
                        placeholder="e.g., 'My kitchen sink is leaking from the base of the tap.'"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={2}
                    />
                    <p className="text-xs text-gray-500 mt-1">This helps the provider prepare. For custom jobs, this is used for the quote.</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select a Date</label>
                    {renderCalendar()}
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select a Time</label>
                    {selectedDate ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {Array.from({ length: 10 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`).map(time => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => !isPaymentMode && setSelectedTime(time)}
                                    disabled={isPaymentMode}
                                    className={`p-3 border rounded-lg text-sm font-semibold transition-colors ${
                                        selectedTime === time
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white border-gray-300 hover:border-primary hover:text-primary disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400'
                                    }`}
                                >
                                    {formatTime(time)}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-100 text-center p-4 rounded-lg">
                            <p className="text-sm text-gray-500">Please select a date to see available time slots.</p>
                        </div>
                    )}
                </div>
              </div>

              <button 
                onClick={handleSendBookingRequest} 
                disabled={!selectedDate || !selectedTime}
                className="w-full mt-6 bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {buttonText}
              </button>
            </div>
          )}

          {step === 3 && renderPaymentContent()}

          {step === 4 && (
            (() => {
              const bookingToShow = createdBooking || booking;
              if (!bookingToShow) return null;
              
              return <BookingConfirmation booking={bookingToShow} onDone={handleBookingComplete} />;
            })()
          )}

        </div>
      </div>
    </div>
  );
};
export default BookingModal;