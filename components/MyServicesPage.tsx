import React from 'react';
import { Booking, User, UserRole } from '../types';
import { MessageBubbleIcon, CheckIcon, StarIcon, CloseIcon, ClipboardIcon } from './IconComponents';
import { useToast } from './Toast';

interface MyBookingsPageProps {
  bookings: Booking[];
  currentUser: User;
  onLeaveReview: (booking: Booking) => void;
  onOpenChat: (booking: Booking) => void;
  onViewQuotation: (booking: Booking) => void;
  onConfirmAndPay: (booking: Booking) => void;
  onPayInvoice: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
}

const getStatusBadgeClass = (status: Booking['status']) => {
  switch (status) {
    case 'Pending Provider Confirmation':
    case 'Pending Customer Confirmation':
      return 'bg-yellow-100 text-yellow-800';
    case 'Confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'InProgress':
      return 'bg-green-100 text-green-800';
    case 'Completed':
      return 'bg-gray-200 text-gray-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ bookings, currentUser, onLeaveReview, onOpenChat, onViewQuotation, onConfirmAndPay, onPayInvoice, onCancelBooking }) => {
  // Sort bookings by service date, most recent first
  const sortedBookings = [...bookings].sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  // Group bookings into active and past
  const activeStatuses: Booking['status'][] = ['Pending Provider Confirmation', 'Pending Customer Confirmation', 'Confirmed', 'InProgress'];
  const activeBookings = sortedBookings.filter(b => activeStatuses.includes(b.status));
  const pastBookings = sortedBookings.filter(b => !activeStatuses.includes(b.status));

  const renderBookingCard = (booking: Booking) => {
    const toast = useToast();
    const handleCopyOtp = () => {
        if(booking.otp) {
            navigator.clipboard.writeText(booking.otp).then(() => {
                toast.success("OTP copied to clipboard!");
            }).catch(err => {
                toast.error("Failed to copy OTP.");
                console.error("Could not copy text: ", err);
            });
        }
    };
    
    const isProviderView = currentUser.role === UserRole.PROVIDER;
    const displayName = isProviderView ? booking.customer.name : booking.provider.name;
    const displayRole = isProviderView ? 'Customer' : 'Provider';
    const providerLogo = booking.provider.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.provider.name)}&background=007A33&color=fff&size=128`;
    const canCancel = activeStatuses.includes(booking.status) && booking.status !== 'InProgress';

    const getQuotationContent = () => {
        switch (booking.quotationStatus) {
            case 'Sent':
                return <button onClick={() => onViewQuotation(booking)} className="bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-blue-600 transition-colors">View & Respond to Quotation</button>;
            case 'Accepted':
                return <div className="text-sm text-green-700 bg-green-100 p-2 rounded-md"><span>Accepted Quote: </span><strong className="font-bold">KES {booking.totalAmount?.toLocaleString()}</strong></div>;
            case 'Declined':
                return <div className="text-sm text-red-700 bg-red-100 p-2 rounded-md">Quotation Declined</div>;
            default:
                return null;
        }
    };


    return (
      <div key={booking.id} className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm transition-shadow hover:shadow-md flex flex-col sm:flex-row items-start sm:space-x-4">
        <img src={providerLogo} alt={booking.provider.name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 mb-4 sm:mb-0" />
        
        <div className="flex-grow w-full">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start">
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900">{booking.provider.category}</h3>
              <p className="text-sm text-primary font-medium">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {new Date(booking.serviceDate).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:text-right flex flex-col items-start sm:items-end space-y-2 flex-shrink-0">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(booking.status)}`}>
                {booking.status.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              {(booking.status === 'Confirmed' || booking.status === 'Pending Customer Confirmation') && currentUser.role === UserRole.CUSTOMER && booking.otp && (
                <div className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md">
                  <span>Service OTP: </span>
                  <strong className="font-mono tracking-widest bg-white px-2 py-1 rounded-sm shadow-inner">{booking.otp}</strong>
                </div>
              )}
              {isProviderView && (booking.status === 'Confirmed' || booking.status === 'InProgress') && booking.otp && (
                <div className="text-sm text-gray-700 bg-green-50 border border-green-200 p-2 rounded-md flex items-center gap-2">
                  <div>
                      <span>Service OTP: </span>
                      <strong className="font-mono tracking-widest bg-white px-2 py-1 rounded-sm shadow-inner">{booking.otp}</strong>
                  </div>
                  <button onClick={handleCopyOtp} className="p-1.5 rounded-full hover:bg-gray-200 transition-colors" aria-label="Copy OTP">
                    <ClipboardIcon className="w-4 h-4 text-gray-600"/>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
             <div className="flex items-center gap-2 pt-1 flex-wrap">
                {getQuotationContent()}
                
                {booking.status === 'Pending Provider Confirmation' && (
                    <div className="text-sm text-gray-600">Awaiting provider's response...</div>
                )}
                
                {booking.status === 'Pending Customer Confirmation' && (
                    <button 
                        onClick={() => onConfirmAndPay(booking)}
                        className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-md hover:bg-green-800 transition-colors animate-pulse"
                    >
                        Confirm & Pay Fee
                    </button>
                )}

                {(booking.status === 'Confirmed' || booking.status === 'InProgress') && currentUser.role === UserRole.CUSTOMER && (
                    <button 
                      onClick={() => onOpenChat(booking)}
                      className="flex items-center gap-1 bg-secondary text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <MessageBubbleIcon className="w-4 h-4" />
                      Chat
                    </button>
                )}
                {booking.status === 'Completed' && currentUser.role === UserRole.CUSTOMER && (
                    !booking.review ? (
                        <button 
                          onClick={() => onLeaveReview(booking)}
                          className="bg-primary text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-green-800 transition-colors"
                        >
                          Leave a Review
                        </button>
                    ) : (
                       <div className="flex items-center gap-2 p-2 rounded-md bg-gray-100" title={`You rated ${booking.review.rating} stars`}>
                            <span className="text-xs font-semibold text-gray-700">Your Review:</span>
                            <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                    <StarIcon
                                        key={i}
                                        className={`w-4 h-4 ${i < booking.review!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                        filled={i < booking.review!.rating}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                )}
                 {canCancel && (
                    <button 
                        onClick={() => onCancelBooking(booking)}
                        className="flex items-center gap-1 text-red-600 border border-red-200 text-xs font-bold py-2 px-3 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <CloseIcon className="w-4 h-4" />
                        Cancel
                    </button>
                )}
              </div>
               {booking.status === 'Completed' && !booking.paymentDate && booking.totalAmount && currentUser.role === UserRole.CUSTOMER && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center sm:text-right">
                        <p className="text-sm font-bold text-red-700">Payment Due: KES {booking.totalAmount.toLocaleString()}</p>
                        {booking.dueDate && <p className="text-xs text-red-600">Due by {new Date(booking.dueDate).toLocaleDateString()}</p>}
                        <button 
                            onClick={() => onPayInvoice(booking)}
                            className="mt-2 w-full sm:w-auto bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Pay Invoice Now
                        </button>
                    </div>
                )}
                {booking.status === 'Completed' && booking.paymentDate && (
                    <div className="p-2 bg-green-50 text-green-800 rounded-md text-sm font-semibold flex items-center gap-2">
                        <CheckIcon className="w-5 h-5"/>
                        Paid on {new Date(booking.paymentDate).toLocaleDateString()}
                    </div>
                )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">My Bookings</h1>
        
        {bookings.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-10">
            {activeBookings.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">Active & Upcoming</h2>
                <div className="space-y-4">
                  {activeBookings.map(renderBookingCard)}
                </div>
              </section>
            )}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b">Past Bookings</h2>
                <div className="space-y-4">
                  {pastBookings.map(renderBookingCard)}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="text-center py-16 max-w-lg mx-auto">
             <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-4 text-2xl font-semibold text-gray-800">No Bookings Yet</h3>
            <p className="mt-2 text-md text-gray-500">When you book a service with one of our trusted providers, your appointment details will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;