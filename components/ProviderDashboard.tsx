import React, { useState, useEffect } from 'react';
import { User, ServiceProvider, Booking, DetailedService } from '../types';
import { CheckIcon, CloseIcon, MessageBubbleIcon, StarIcon, SparklesIcon, TrashIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';
import * as api from '../frontend/services/api'; // Use the new API service
import { useToast } from './Toast';
import CalendarView from './CalendarView';
import EarningsTab from './EarningsTab';


interface ProviderDashboardProps {
  user: User;
  provider: ServiceProvider | null;
  bookings: Booking[];
  onUpdateBookingStatus: (booking: Booking, response: 'accept' | 'decline') => void;
  onOpenChat: (booking: Booking) => void;
  onOpenQuotation: (booking: Booking) => void;
  onCompleteJob: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
}

type DashboardTab = 'Bookings' | 'Services' | 'Calendar' | 'Availability' | 'Earnings';
type BookingSubTab = 'New' | 'Upcoming' | 'Past';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-primary bg-opacity-10 text-primary rounded-full p-3">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const StatusDisplay: React.FC<{ status: Booking['status'] }> = ({ status }) => {
    let baseClasses = "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full";
    let colorClasses = "";
    let icon: React.ReactNode = null;
    let displayText: string = status;

    switch(status) {
        case 'Pending Provider Confirmation':
            displayText = 'New Request';
            colorClasses = 'bg-yellow-100 text-yellow-800';
            icon = <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" aria-hidden="true"></div>;
            break;
        case 'Pending Customer Confirmation':
            displayText = 'Awaiting Customer';
            colorClasses = 'bg-orange-100 text-orange-800';
            icon = <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" aria-hidden="true"></div>;
            break;
        case 'Confirmed':
            colorClasses = 'bg-blue-100 text-blue-800';
            icon = <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" aria-hidden="true"></div>;
            break;
        case 'InProgress':
            colorClasses = 'bg-green-100 text-green-800';
            icon = <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" aria-hidden="true"></div>;
            break;
        case 'Completed':
            colorClasses = 'bg-gray-200 text-gray-800';
            icon = <CheckIcon className="w-3 h-3 text-gray-600 mr-1.5" aria-hidden="true" />;
            break;
        case 'Cancelled':
            colorClasses = 'bg-red-100 text-red-800';
            icon = <CloseIcon className="w-3 h-3 text-red-600 mr-1.5" aria-hidden="true" />;
            break;
        default:
            colorClasses = 'bg-gray-100 text-gray-800';
            icon = <div className="w-2 h-2 rounded-full bg-gray-500 mr-2" aria-hidden="true"></div>;
    }

    return (
        <span className={`${baseClasses} ${colorClasses}`}>
            {icon}
            {displayText}
        </span>
    );
};

const BookingRow: React.FC<{ booking: Booking, tab: BookingSubTab, onUpdateBookingStatus: ProviderDashboardProps['onUpdateBookingStatus'], onOpenChat: ProviderDashboardProps['onOpenChat'], onOpenQuotation: ProviderDashboardProps['onOpenQuotation'], onCompleteJob: (booking: Booking) => void, onCancelBooking: (booking: Booking) => void, isBlacklisted: boolean }> = ({ booking, tab, onUpdateBookingStatus, onOpenChat, onOpenQuotation, onCompleteJob, onCancelBooking, isBlacklisted }) => {
    
    const canCancel = booking.status === 'Confirmed' || booking.status === 'Pending Customer Confirmation';

    const getQuotationStatus = () => {
        if (!booking.quotationStatus || booking.quotationStatus === 'Draft') return null;
        
        const baseClass = "text-xs font-semibold px-2 py-1 rounded-full";
        switch (booking.quotationStatus) {
            case 'Sent': return <span className={`${baseClass} bg-blue-100 text-blue-800`}>Quote Sent</span>;
            case 'Accepted': return <span className={`${baseClass} bg-green-100 text-green-800`}>Quote Accepted</span>;
            case 'Declined': return <span className={`${baseClass} bg-red-100 text-red-800`}>Quote Declined</span>;
        }
    }
    
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-grow">
                <p className="font-semibold text-gray-800">{booking.provider.category}</p>
                <p className="text-sm text-gray-600">Customer: {booking.customer.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                    {new Date(booking.serviceDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
                 <div className="flex items-center gap-4">
                    {getQuotationStatus()}
                    <StatusDisplay status={booking.status} />
                 </div>
                 <div className="flex items-center gap-2 flex-wrap justify-end">
                    {tab === 'New' && !isBlacklisted && (
                        <div className="flex gap-2">
                            <button onClick={() => onUpdateBookingStatus(booking, 'accept')} className="bg-primary text-white p-2 rounded-full hover:bg-green-800 transition-colors" aria-label="Accept Booking">
                                <CheckIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => onUpdateBookingStatus(booking, 'decline')} className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors" aria-label="Decline Booking">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    {(tab === 'Upcoming' && (booking.status === 'Confirmed' || booking.status === 'InProgress' || booking.status === 'Pending Customer Confirmation')) && (
                        <>
                            <button onClick={() => onOpenQuotation(booking)} className="flex items-center gap-1 text-primary border border-primary text-xs font-bold py-2 px-3 rounded-md hover:bg-primary hover:text-white transition-colors">
                                {booking.quotationStatus ? (
                                    'View/Edit Quote'
                                ) : (
                                    <>
                                        <SparklesIcon className="w-4 h-4" />
                                        <span>Create Quote</span>
                                    </>
                                )}
                            </button>
                            <button onClick={() => onOpenChat(booking)} className="flex items-center gap-1 bg-secondary text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-gray-700 transition-colors">
                                <MessageBubbleIcon className="w-4 h-4" />
                                Chat
                            </button>
                        </>
                    )}
                     {tab === 'Upcoming' && booking.status === 'InProgress' && (
                        <button 
                            onClick={() => onCompleteJob(booking)} 
                            className="bg-green-600 text-white text-xs font-bold py-2 px-3 rounded-md hover:bg-green-700 transition-colors"
                        >
                            Mark as Complete
                        </button>
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
                    {tab === 'Past' && booking.status === 'Completed' && (
                        <div className="text-right mt-1">
                            {booking.totalAmount && booking.quotationStatus === 'Accepted' ? (
                                <p className={`text-md font-bold ${booking.paymentDate ? 'text-primary' : 'text-red-600'}`}>
                                    KES {booking.totalAmount.toLocaleString()}
                                </p>
                            ) : (
                                <p className="text-sm font-semibold text-gray-700">No final amount</p>
                            )}
                             {booking.paymentDate ? (
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">Paid</span>
                            ) : (
                                booking.totalAmount && <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">Payment Due</span>
                            )}
                            {booking.review ? (
                                <div className="flex items-center justify-end gap-1 mt-1" title={`Rated ${booking.review.rating} stars`}>
                                    <span className="text-xs text-gray-600">Review:</span>
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
                            ) : (
                                <p className="text-xs text-gray-500 italic mt-1">No review yet</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AvailabilityCalendar: React.FC<{ provider: ServiceProvider, onUpdateAvailability: (availability: Record<string, 'available' | 'unavailable' | 'booked'>) => void }> = ({ provider, onUpdateAvailability }) => {
    // This is a simplified weekly calendar for demonstration. A full implementation would be more complex.
    const toast = useToast();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
    const [localAvailability, setLocalAvailability] = useState<Record<string, 'available' | 'unavailable' | 'booked'>>(provider.availability || {});


    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + i);
        return d;
    });

    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    const toggleAvailability = (date: Date, time: string) => {
        const dateKey = date.toISOString().split('T')[0];
        const slotKey = `${dateKey}-${time}`; // e.g., "2024-07-28-08:00"
        
        setLocalAvailability(prev => {
            const newAvailability = { ...prev };
            // Simulate that 'booked' slots cannot be changed by provider, only 'available' or 'unavailable'
            if (newAvailability[slotKey] === 'booked') {
                toast.info("Booked slots cannot be changed directly.");
                return prev;
            } else if (newAvailability[slotKey] === 'available') {
                newAvailability[slotKey] = 'unavailable';
            } else if (newAvailability[slotKey] === 'unavailable') {
                delete newAvailability[slotKey]; // Remove to imply default 'available'
            } else {
                newAvailability[slotKey] = 'unavailable'; // Default is available, so first click makes it unavailable
            }
            return newAvailability;
        });
    };

    const goToPrevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(currentWeekStart.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(currentWeekStart.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const formatDateRange = () => {
        const endOfWeek = new Date(currentWeekStart);
        endOfWeek.setDate(currentWeekStart.getDate() + 6);
        return `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-4">Manage Your Availability</h3>
             <div className="flex justify-between items-center mb-4">
                <button onClick={goToPrevWeek} className="p-2 rounded-full hover:bg-gray-100">&lt; Previous Week</button>
                <h3 className="text-lg font-semibold text-gray-800">{formatDateRange()}</h3>
                <button onClick={goToNextWeek} className="p-2 rounded-full hover:bg-gray-100">Next Week &gt;</button>
            </div>
            <div className="overflow-x-auto">
                <div className="grid grid-cols-8 gap-1 min-w-[800px]">
                    <div className="font-semibold text-sm text-gray-500"></div>
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="text-center font-semibold text-gray-700 p-2">
                            <p>{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className="text-lg">{day.getDate()}</p>
                        </div>
                    ))}
                    {timeSlots.map(time => (
                        <React.Fragment key={time}>
                            <div className="text-right text-xs text-gray-500 pr-2 pt-2">{time}</div>
                            {weekDays.map(day => {
                                const dateKey = day.toISOString().split('T')[0];
                                const slotKey = `${dateKey}-${time}`;
                                const status = localAvailability[slotKey] || 'available'; // Default to available
                                
                                const isPast = day < today; // Check if the day itself is in the past
                                const isBooked = status === 'booked';

                                let slotClasses = `p-2 h-12 border rounded transition-colors flex items-center justify-center text-xs`;
                                if (isPast) {
                                    slotClasses += ` bg-gray-100 text-gray-400 cursor-not-allowed`;
                                } else if (isBooked) {
                                    slotClasses += ` bg-red-100 text-red-700 cursor-not-allowed`;
                                } else if (status === 'unavailable') {
                                    slotClasses += ` bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer`;
                                } else { // 'available' or default
                                    slotClasses += ` bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer`;
                                }

                                return (
                                    <div
                                        key={slotKey}
                                        onClick={() => !isPast && !isBooked && toggleAvailability(day, time)}
                                        className={slotClasses}
                                    >
                                      {isBooked ? 'Booked' : (status === 'unavailable' ? 'Unavailable' : 'Available')}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-4 text-center">Click on an 'Available' slot to mark it 'Unavailable', and vice-versa. Booked slots cannot be changed.</p>
             <div className="flex justify-end mt-4">
                 <button onClick={() => onUpdateAvailability(localAvailability)} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800">Save Availability</button>
             </div>
        </div>
    );
}

const ServicesManagementTab: React.FC<{ provider: ServiceProvider; onSave: (services: DetailedService[]) => void }> = ({ provider, onSave }) => {
    const [services, setServices] = useState<DetailedService[]>(
        provider.detailedServices && provider.detailedServices.length > 0
            ? provider.detailedServices
            : [{ id: `ds-${Date.now()}`, name: '', description: '', price: '' }]
    );
    const [isSuggesting, setIsSuggesting] = useState(false);
    const toast = useToast();

    const handleServiceChange = (id: string, field: keyof DetailedService, value: string) => {
        setServices(prev => prev.map(service => service.id === id ? { ...service, [field]: value } : service));
    };

    const addService = () => {
        setServices(prev => [...prev, { id: `ds-${Date.now()}`, name: '', description: '', price: '' }]);
    };

    const removeService = (id: string) => {
        if (services.length > 1) {
            setServices(prev => prev.filter(service => service.id !== id));
        } else {
            toast.error("You must have at least one service.");
        }
    };

    const handleAiSuggest = async () => {
        setIsSuggesting(true);
        try {
            const suggestions = await api.generateDetailedServices(provider.category, provider.description);
            setServices(suggestions);
            toast.success("AI has suggested some services for you!");
        } catch (error) {
            console.error("AI service suggestions error:", error);
            toast.error("Failed to get AI suggestions. Please try again.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSave = () => {
        // Filter out any empty services before saving
        const servicesToSave = services.filter(s => s.name.trim() !== '' && s.description.trim() !== '');
        if (servicesToSave.length === 0) {
            toast.error("Please add at least one valid service to save.");
            return;
        }
        onSave(servicesToSave);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Manage Your Service Menu</h3>
                <button 
                    onClick={handleAiSuggest} 
                    disabled={isSuggesting}
                    className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary-light/40 hover:bg-primary-light/70 px-3 py-2 rounded-lg disabled:opacity-60"
                >
                    {isSuggesting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div> : <SparklesIcon className="w-4 h-4"/>}
                    AI Suggest Services
                </button>
            </div>
            <div className="space-y-3 border border-gray-200 p-3 rounded-lg max-h-96 overflow-y-auto">
                {services.map((service) => ( // Use service.id as key
                    <div key={service.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded-lg">
                        <div className="col-span-12 sm:col-span-4"><input type="text" value={service.name} onChange={(e) => handleServiceChange(service.id!, 'name', e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md" placeholder="Service Name"/></div>
                        <div className="col-span-12 sm:col-span-5"><textarea value={service.description} onChange={(e) => handleServiceChange(service.id!, 'description', e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md" placeholder="Service Description" rows={1}/></div>
                        <div className="col-span-10 sm:col-span-2"><input type="text" value={service.price || ''} onChange={(e) => handleServiceChange(service.id!, 'price', e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md" placeholder="e.g., KES 2,500"/></div>
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-center h-full"><button type="button" onClick={() => removeService(service.id!)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-5 h-5"/></button></div>
                    </div>
                ))}
                 <button type="button" onClick={addService} className="text-sm font-semibold text-primary hover:text-green-800 mt-2">+ Add Service Manually</button>
            </div>
            <div className="flex justify-end">
                <button onClick={handleSave} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800">Save Changes</button>
            </div>
        </div>
    );
};

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, provider, bookings, onUpdateBookingStatus, onOpenQuotation, onOpenChat, onCompleteJob, onCancelBooking }) => {
  const { dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState<DashboardTab>('Bookings');
  const [activeBookingSubTab, setActiveBookingSubTab] = useState<BookingSubTab>('New');
  const toast = useToast();

  const onCreateProfile = () => dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerRegistration' } });
  const onEditProfile = () => dispatch({ type: 'OPEN_MODAL', payload: { type: 'editProviderDetails' } });

  if (!provider) {
    return (
        <div className="bg-gray-50 py-12 animate-fade-in">
            <div className="container mx-auto px-6 text-center">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <SparklesIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.name.split(' ')[0]}!</h1>
                    <p className="mt-4 text-lg text-gray-600">You're one step away from connecting with customers. Let's create your public provider profile.</p>
                    <p className="mt-2 text-sm text-gray-500">This is where you'll showcase your services, expertise, and set your rates.</p>
                    <button 
                        onClick={onCreateProfile} 
                        className="mt-8 bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-800 transition-transform transform hover:scale-105"
                    >
                        Create Your Public Profile
                    </button>
                </div>
            </div>
        </div>
    );
  }

  const newRequests = bookings.filter(b => b.status === 'Pending Provider Confirmation');
  const upcomingBookings = bookings.filter(b => b.status === 'Pending Customer Confirmation' || b.status === 'Confirmed' || b.status === 'InProgress');
  const pastBookings = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');
  
  const totalEarnings = pastBookings
    .filter(b => b.status === 'Completed' && b.quotationStatus === 'Accepted' && b.paymentDate)
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  const handleAiToggle = async () => {
      try {
          const updatedProvider = await api.updateProvider(provider.id, { aiAutoAcceptEnabled: !provider.aiAutoAcceptEnabled });
          dispatch({ type: 'UPDATE_PROVIDER', payload: { providerId: provider.id, updates: updatedProvider.provider } });
          toast.success(`AI Auto-Accept is now ${updatedProvider.provider.aiAutoAcceptEnabled ? 'ON' : 'OFF'}.`);
      } catch (error) {
          console.error("Failed to toggle AI Auto-Accept:", error);
          toast.error("Failed to update AI Auto-Accept setting.");
      }
  };

  const handleSaveServices = async (services: DetailedService[]) => {
      try {
          const updatedProvider = await api.updateProvider(provider.id, { detailedServices: services });
          dispatch({ type: 'UPDATE_PROVIDER', payload: { providerId: provider.id, updates: updatedProvider.provider } });
          toast.success("Your services menu has been updated!");
      } catch (error) {
          console.error("Failed to save services:", error);
          toast.error("Failed to save your services. Please try again.");
      }
  };

  const handleUpdateAvailability = async (newAvailability: Record<string, 'available' | 'unavailable' | 'booked'>) => {
    try {
        const updatedProvider = await api.updateProvider(provider.id, { availability: newAvailability });
        dispatch({ type: 'UPDATE_PROVIDER', payload: { providerId: provider.id, updates: updatedProvider.provider } });
        toast.success("Availability updated successfully!");
    } catch (error) {
        console.error("Failed to update availability:", error);
        toast.error("Failed to update availability. Please try again.");
    }
  };

  const renderBookingsSubTab = (list: Booking[], tab: BookingSubTab) => {
      if (tab === 'New' && provider.isBlacklisted) {
           return (
              <div className="text-center py-16 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <h3 className="text-xl font-semibold text-red-800">New Requests Suspended</h3>
                  <p className="mt-2 text-md text-gray-600 max-w-md mx-auto">You cannot receive new job requests while your account is suspended.</p>
              </div>
          );
      }
      
      if (list.length === 0) {
          let title = '';
          let message = '';

          switch(tab) {
              case 'New': title = "No New Requests"; message = "When a customer requests your service, it will appear here."; break;
              case 'Upcoming': title = "No Upcoming Bookings"; message = "Confirmed and in-progress jobs will be shown here."; break;
              case 'Past': title = "No Past Work Yet"; message = "Completed and cancelled jobs will be recorded here."; break;
          }

          return (
              <div className="text-center py-16 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                  <p className="mt-2 text-md text-gray-500 max-w-md mx-auto">{message}</p>
              </div>
          );
      }
      return (
          <div className="space-y-4">
              {list.map(booking => <BookingRow key={booking.id} booking={booking} tab={tab} onUpdateBookingStatus={onUpdateBookingStatus} onOpenChat={onOpenChat} onOpenQuotation={onOpenQuotation} onCompleteJob={onCompleteJob} onCancelBooking={onCancelBooking} isBlacklisted={provider.isBlacklisted || false} />)}
          </div>
      )
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        {provider.isBlacklisted && provider.blacklistEndDate && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg shadow-md mb-8" role="alert">
                <p className="font-bold">Account Suspended</p>
                <p>Your provider account has been temporarily suspended due to multiple job rejections. You will not appear in search results or receive new job requests until <span className="font-semibold">{new Date(provider.blacklistEndDate).toLocaleDateString()}</span>.</p>
            </div>
        )}

        <div className="flex flex-col md:flex-row justify-between md:items-start mb-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-800">Provider Dashboard</h1>
                <p className="text-lg text-gray-600">Welcome back, {user.name.split(' ')[0]}!</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end gap-3">
                <button onClick={onEditProfile} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800 transition-colors">
                    Edit Public Profile
                </button>
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                    <SparklesIcon className="w-5 h-5 text-primary"/>
                    <label htmlFor="ai-toggle" className="text-sm font-medium text-gray-700">AI Auto-Accept</label>
                    <button
                        id="ai-toggle"
                        onClick={handleAiToggle}
                        className={`${provider.aiAutoAcceptEnabled ? 'bg-primary' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors`}
                    >
                        <span className={`${provider.aiAutoAcceptEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
                    </button>
                </div>
            </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard title="Total Earnings (Est.)" value={`KES ${totalEarnings.toLocaleString()}`} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>} />
            <StatCard title="Total Jobs" value={bookings.length.toString()} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6m-6 4h6"/></svg>} />
            <StatCard title="Average Rating" value={provider.rating.toFixed(1)} icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>} />
        </div>

        {/* Main Dashboard Section */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="mb-4 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button onClick={() => setActiveTab('Bookings')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Bookings' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Bookings</button>
                <button onClick={() => setActiveTab('Services')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Services' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>My Services</button>
                <button onClick={() => setActiveTab('Calendar')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Calendar' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Calendar</button>
                <button onClick={() => setActiveTab('Availability')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Availability' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Availability</button>
                <button onClick={() => setActiveTab('Earnings')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'Earnings' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Earnings</button>
              </nav>
            </div>
            
            <div className="animate-fade-in">
              {activeTab === 'Bookings' && (
                <div>
                  <div className="mb-4 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button onClick={() => setActiveBookingSubTab('New')} disabled={provider.isBlacklisted} className={`relative whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed ${activeBookingSubTab === 'New' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                          New Requests {newRequests.length > 0 && !provider.isBlacklisted && <span className="ml-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{newRequests.length}</span>}
                      </button>
                      <button onClick={() => setActiveBookingSubTab('Upcoming')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeBookingSubTab === 'Upcoming' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Upcoming</button>
                      <button onClick={() => setActiveBookingSubTab('Past')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeBookingSubTab === 'Past' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Past Work</button>
                    </nav>
                  </div>
                  <div className="animate-fade-in">
                    {activeBookingSubTab === 'New' && renderBookingsSubTab(newRequests, 'New')}
                    {activeBookingSubTab === 'Upcoming' && renderBookingsSubTab(upcomingBookings, 'Upcoming')}
                    {activeBookingSubTab === 'Past' && renderBookingsSubTab(pastBookings, 'Past')}
                  </div>
                </div>
              )}
              {activeTab === 'Services' && <ServicesManagementTab provider={provider} onSave={handleSaveServices} />}
              {activeTab === 'Calendar' && <CalendarView bookings={bookings} onOpenChat={onOpenChat} />}
              {activeTab === 'Availability' && <AvailabilityCalendar provider={provider} onUpdateAvailability={handleUpdateAvailability} />}
              {activeTab === 'Earnings' && <EarningsTab bookings={bookings} />}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;