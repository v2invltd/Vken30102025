import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
// FIX: Import NewProviderData from types.ts
import { Location, ServiceCategory, ServiceProvider, User, UserRole, Booking, Review, Message, QuotationItem, DetailedService, Notification, JobAlert, LegalDocType, NewProviderData } from './types';
import * as api from './frontend/services/api'; // Import all API functions
import { useAppContext, AppView } from './contexts/AppContext';
import { LOCATIONS } from './constants'; // Import for initial provider generation

// Components
import BackToTopButton from './components/BackToTopButton';
import { SparklesIcon } from './components/IconComponents';
import { CUSTOMER_TERMS, PRIVACY_POLICY, PROVIDER_TERMS } from './legal';
import { useToast } from './components/Toast';

// Lazy-loaded components
const Header = lazy(() => import('./components/Header'));
const Footer = lazy(() => import('./components/Footer'));
const HomePage = lazy(() => import('./components/HomePage'));
const SearchResults = lazy(() => import('./components/SearchResults'));
const AiAssistant = lazy(() => import('./components/AiAssistant'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const LocationSelectorModal = lazy(() => import('./components/LocationSelectorModal'));
const ProviderDetailModal = lazy(() => import('./components/ProviderDetailModal'));
const BookingModal = lazy(() => import('./components/BookingModal'));
const ChatbotModal = lazy(() => import('./components/ChatbotModal'));
const MyBookingsPage = lazy(() => import('./components/MyServicesPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const ProviderDashboard = lazy(() => import('./components/ProviderDashboard'));
const KycModal = lazy(() => import('./components/KycModal'));
const ProviderRegistrationModal = lazy(() => import('./components/ProviderRegistrationModal'));
const ReviewModal = lazy(() => import('./components/ReviewModal'));
const OtpModal = lazy(() => import('./components/OtpModal'));
const ChatModal = lazy(() => import('./components/ChatModal'));
const QuotationModal = lazy(() => import('./components/QuotationModal'));
const ProviderAcceptanceModal = lazy(() => import('./components/ProviderAcceptanceModal'));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal'));
const DisclaimerModal = lazy(() => import('./components/DisclaimerModal'));
const InvoiceModal = lazy(() => import('./components/InvoiceModal'));
const ForgotPasswordModal = lazy(() => import('./components/ForgotPasswordModal'));
const LocalHub = lazy(() => import('./components/LocalHub'));


// FIX: Removed NewProviderData interface from here. It's now in types.ts
const ChatbotButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-5 right-5 bg-primary text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 active:scale-100 transition-transform z-30"
    aria-label="Open AI Assistant"
  >
    <SparklesIcon className="w-8 h-8" />
  </button>
);

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen w-screen fixed inset-0 bg-white/80 backdrop-blur-sm z-[200]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
    </div>
);

// Haversine distance calculation
const getDistance = (coords1: { lat: number; lon: number }, coords2: { lat: number; lon: number }): number => {
    if (!coords1 || !coords2) return Infinity;
    const R = 6371; // Radius of the earth in km
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


const App: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { view, modal, selectedLocation, activeSearchCategory, currentUser, providers, bookings, userCoordinates, favoriteProviderIds, isInitialProvidersLoaded, isInitializing } = state;

  const [isAiSearchLoading, setIsAiSearchLoading] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);

  const toast = useToast();

  // Combined initialization effect to run on first load
  useEffect(() => {
    const initializeApp = async () => {
      // Task 1: Check for existing auth token and fetch user data
      const authPromise = async () => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
          try {
            const user = await api.fetchCurrentUser();
            dispatch({ type: 'LOGIN', payload: user });
            // Fetch user-specific data in parallel after login
            await Promise.all([
              api.fetchMyBookings().then(bookings => dispatch({ type: 'SET_BOOKINGS', payload: bookings })),
              api.fetchMyNotifications().then(notifications => dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })),
              api.fetchMyJobAlerts().then(alerts => dispatch({ type: 'SET_JOB_ALERTS', payload: alerts }))
            ]);
          } catch (error) {
            console.error("Failed to re-authenticate user:", error);
            localStorage.removeItem('jwtToken');
            dispatch({ type: 'LOGOUT' });
          }
        }
      };

      // Task 2: Fetch initial providers
      const providersPromise = api.fetchAllProviders()
        .then(fetchedProviders => {
          dispatch({ type: 'SET_PROVIDERS', payload: fetchedProviders });
        })
        .catch(error => {
          console.error("Error fetching initial providers:", error);
          dispatch({ type: 'SET_PROVIDERS', payload: [] });
        })
        .finally(() => {
          dispatch({ type: 'SET_INITIAL_PROVIDERS_LOADED', payload: true });
        });

      // Task 3: Attempt to get geolocation
      const geolocationPromise = new Promise<void>((resolve) => {
        if (!navigator.geolocation) {
          console.warn("Geolocation is not supported by this browser.");
          resolve();
          return;
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            dispatch({ type: 'SET_USER_COORDINATES', payload: { lat: latitude, lon: longitude } });
            try {
              const city = await api.getCityFromCoordinates(latitude, longitude);
              if (city) {
                dispatch({ type: 'SET_LOCATION', payload: city });
              }
            } catch (error) {
              console.warn("Could not determine city from coordinates via API.", error);
            } finally {
              resolve();
            }
          },
          (error) => {
            console.warn(`Geolocation error: ${error.message}`);
            resolve();
          },
          { timeout: 5000, maximumAge: 600000 }
        );
      });
      
      // Wait for all critical initial tasks to complete
      await Promise.all([authPromise(), providersPromise, geolocationPromise]);

      // After all initialization is done, turn off the loading screen
      dispatch({ type: 'SET_INITIALIZING', payload: false });
    };

    initializeApp();
    // This effect should only run once.
  }, [dispatch]);

  // Effect to open location selector *after* initialization is complete
  useEffect(() => {
    // Only run this check if the app is NOT initializing and no location has been set.
    if (!isInitializing && !selectedLocation && !modal) {
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'locationSelector' } });
    }
  }, [isInitializing, selectedLocation, modal, dispatch]);


  const handleAiSearch = async (query: string) => {
    setIsAiSearchLoading(true);
    setAiSearchError(null);
    try {
      const result = await api.parseServiceRequest(query, userCoordinates);
      if (result.error || !result.serviceCategory) {
        setAiSearchError(result.error || "Could not understand the service category. Please be more specific.");
        if (!modal) {
           dispatch({
            type: 'OPEN_MODAL',
            payload: {
              type: 'chatbot',
              props: { initialMessage: `I had trouble understanding that. Could you try rephrasing? For example, say "I need a plumber in Nairobi."` }
            }
          });
        }
        return;
      }

      if (result.groundingChunks && result.groundingChunks.length > 0) {
        dispatch({ type: 'SET_SEARCH_GROUNDING_SOURCES', payload: result.groundingChunks });
      }

      if (result.location) {
        dispatch({ type: 'SET_LOCATION', payload: result.location });
      }
      
      dispatch({ type: 'CLOSE_MODAL' });
      handleSelectCategory(result.serviceCategory);

    } catch (error) {
      setAiSearchError("An error occurred while searching. Please try again.");
      console.error("AI Search Error:", error);
    } finally {
      setIsAiSearchLoading(false);
    }
  };

  const handleSelectCategory = useCallback(async (category: ServiceCategory) => {
    if (!selectedLocation) {
        toast.info("Please select a location first to see providers.");
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'locationSelector' } });
        return;
    }
    dispatch({ type: 'SET_VIEW', payload: AppView.SEARCH });
    dispatch({ type: 'SET_ACTIVE_SEARCH_CATEGORY', payload: category });
    dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: true });
    
    await new Promise(resolve => setTimeout(resolve, 300)); 

    try {
      const searchResults = await api.searchProviders(category, selectedLocation);

      if (searchResults.length === 0 && !modal) {
        dispatch({
          type: 'OPEN_MODAL',
          payload: {
            type: 'chatbot',
            props: { initialMessage: `We couldn't find any registered providers for ${category} in ${selectedLocation}. Can I help you search for something else?` }
          }
        });
      }
      
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: searchResults });

    } catch (error) {
      toast.error("An error occurred while searching for providers.");
      console.error("Search Providers Error:", error);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    } finally {
      dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: false });
    }
  }, [dispatch, selectedLocation, modal, toast]);
  
  const handleFindNearMe = useCallback(() => {
    if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.");
        return;
    }
    dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: true });
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const currentUserCoords = { lat: latitude, lon: longitude };
            dispatch({ type: 'SET_USER_COORDINATES', payload: currentUserCoords });

            // Calculate distances for all providers
            const providersWithDistance = providers
                .map(provider => ({
                    provider,
                    distance: provider.coordinates ? getDistance(currentUserCoords, provider.coordinates) : Infinity,
                }))
                .sort((a, b) => a.distance - b.distance); // Sort by distance ascending

            dispatch({ type: 'SET_SEARCH_RESULTS', payload: providersWithDistance.map(p => p.provider) });
            dispatch({ type: 'SET_ACTIVE_SEARCH_CATEGORY', payload: "Providers Near You" as any });
            dispatch({ type: 'SET_VIEW', payload: AppView.SEARCH });
            dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: false });
        },
        (error) => {
            toast.error("Could not get your location. Please enable location services in your browser settings.");
            console.error("Geolocation error:", error);
            dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: false });
        }
    );
  }, [dispatch, providers, toast]);
  
  const handleAuthSuccess = async (user: { name: string; email: string; phone: string; role: UserRole; id?: string }, isNewUser: boolean, token?: string) => {
    if (token) {
        localStorage.setItem('jwtToken', token);
    }
    const loggedInUser: User = { ...user, id: user.id || `user-${Date.now()}`, kycVerified: false };
    dispatch({ type: 'LOGIN', payload: loggedInUser });
    dispatch({ type: 'CLOSE_MODAL' });
    toast.success(`Welcome, ${loggedInUser.name}!`);
    
    try {
      const fetchedBookings = await api.fetchMyBookings();
      dispatch({ type: 'SET_BOOKINGS', payload: fetchedBookings });
      const fetchedNotifications = await api.fetchMyNotifications();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: fetchedNotifications });
      const fetchedAlerts = await api.fetchMyJobAlerts();
      dispatch({ type: 'SET_JOB_ALERTS', payload: fetchedAlerts });
    } catch (error) {
      console.error("Failed to fetch user data after login:", error);
      toast.error("Failed to load your bookings, notifications, or alerts.");
    }

    // For new providers, take them to their empty dashboard to start setup.
    if (isNewUser && loggedInUser.role === UserRole.PROVIDER) {
      dispatch({ type: 'SET_VIEW', payload: AppView.PROVIDER_DASHBOARD });
    }

    if (state.postLoginAction) {
        state.postLoginAction();
        dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: null });
    }
  };
  
  const handleProviderRegister = (user: { name: string; email: string; phone: string }) => {
    dispatch({ type: 'CLOSE_MODAL' });
    dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerRegistration', props: { pendingUser: user } } });
  };
  
  const handleProviderRegistrationComplete = async (data: Partial<ServiceProvider & NewProviderData>, pendingUser?: { name: string, email: string, phone: string }) => {
    const userToLogin = currentUser || (pendingUser ? { ...pendingUser, id: `user-${Date.now()}`, role: UserRole.CUSTOMER, kycVerified: false } : null);
    if(!userToLogin) {
      toast.error("No user session found. Please log in again.");
      return;
    }

    // EDIT MODE: If an ID is present, it's an update.
    if (data.id && currentUser) {
      try {
        const { businessName, ...restOfData } = data;
        const updatePayload: Partial<ServiceProvider> = {
          ...restOfData,
          name: businessName, // API expects 'name', form uses 'businessName'
        };
        const response = await api.updateProvider(data.id, updatePayload);
        const updatedProvider = response.provider;

        dispatch({ type: 'UPDATE_PROVIDER', payload: { providerId: updatedProvider.id, updates: updatedProvider } });

        // Update user's business name if it changed
        if (currentUser.businessName !== businessName) {
            const userUpdateResponse = await api.updateCurrentUser({ businessName: businessName });
            dispatch({ type: 'UPDATE_USER', payload: userUpdateResponse.user });
        }
        
        dispatch({ type: 'CLOSE_MODAL' });
        toast.success("Profile updated successfully!");

      } catch (error) {
        console.error("Provider update failed:", error);
        toast.error("Failed to update profile. Please try again.");
      }
      return;
    }

    // CREATE MODE: No ID present, create a new provider.
    try {
      const newProviderDataForAPI = {
          name: data.businessName!,
          category: data.category!,
          locations: data.locations!,
          description: data.description!,
          hourlyRate: data.hourlyRate!,
          logoUrl: data.logoUrl!,
          coverImageUrl: data.coverImageUrl!,
          expertise: data.expertise!,
          latitude: data.latitude!,
          longitude: data.longitude!,
          kraPin: data.kraPin!,
      };
      
      const response = await api.createProvider(newProviderDataForAPI);
      const newProvider = response.provider;

      dispatch({ type: 'ADD_PROVIDER', payload: newProvider });
      
      const updatedUser: User = { 
        ...userToLogin,
        id: newProvider.ownerId,
        name: userToLogin.name,
        email: userToLogin.email,
        phone: userToLogin.phone,
        role: UserRole.PROVIDER,
        businessName: data.businessName,
        kraPin: data.kraPin,
        kycVerified: false,
      };
      dispatch({ type: 'LOGIN', payload: updatedUser });

      dispatch({ type: 'CLOSE_MODAL' });
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'kyc' } });
      toast.info("Profile created! Please complete your KYC verification.");

    } catch (error) {
      console.error("Provider registration failed:", error);
      toast.error("Failed to register provider profile. Please try again.");
    }
  };
  
  const handleKycSuccess = async (updatedUserData: Partial<User>) => {
    if (!currentUser) { 
        toast.error("User not logged in."); 
        dispatch({type: 'CLOSE_MODAL' }); 
        return; 
    }
    try {
        const response = await api.updateCurrentUser({ ...updatedUserData, kycVerified: true });
        const updatedUser = response.user;
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });

        if (updatedUser.role === UserRole.PROVIDER && updatedUser.kycVerified) {
            const providerProfile = providers.find(p => p.ownerId === updatedUser.id);
            if (providerProfile) {
                await api.updateProvider(providerProfile.id, { kycVerified: true });
                dispatch({ 
                    type: 'UPDATE_PROVIDER', 
                    payload: { 
                        providerId: providerProfile.id, 
                        updates: { kycVerified: true } 
                    } 
                });
            }
        }
        dispatch({ type: 'CLOSE_MODAL' });
        toast.success("KYC details submitted for verification!");
        if(updatedUser.role === UserRole.PROVIDER) {
          dispatch({ type: 'SET_VIEW', payload: AppView.PROVIDER_DASHBOARD });
        }
    } catch (error) {
        console.error("KYC submission failed:", error);
        toast.error("Failed to submit KYC. Please try again.");
    }
  };

  const handleSendBookingRequest = async (provider: ServiceProvider, serviceDate: Date, requestDetails: string, type: 'instant' | 'quote'): Promise<Booking> => {
    if (!currentUser) throw new Error("Current user not found");
    
    const newBookingData = {
      providerId: provider.id,
      serviceDate: serviceDate.toISOString(),
      requestDetails,
      bookingType: type,
      otp: Math.floor(1000 + Math.random() * 9000).toString(),
      status: 'Pending Provider Confirmation' as Booking['status'],
    };

    try {
      const response = await api.createBooking(newBookingData);
      const newBooking = response.booking;

      dispatch({ type: 'ADD_BOOKING', payload: newBooking });
      
      const notificationMessage = type === 'instant' 
        ? `${currentUser.name} has instantly booked and paid for a ${provider.category} service. Please confirm.`
        : `${currentUser.name} has requested a ${provider.category} service.`;

      await api.createNotification({
          userId: provider.ownerId,
          message: notificationMessage,
          bookingId: newBooking.id,
      });

      if(type === 'quote') {
          toast.success("Booking request sent!");
      } else {
          toast.success("Booking fee paid! Awaiting provider confirmation.");
      }

      if (provider.category === ServiceCategory.FINANCIAL_SERVICES) {
        console.log(`Simulating external email notification for Financial Services booking ID: ${newBooking.id}`);
        toast.info("VTwo Investments has been notified of your Financial Services request!");
      }

      if (provider.aiAutoAcceptEnabled && type === 'quote') {
        toast.info(`AI is reviewing the request for ${provider.name}...`);
        const decision = await api.decideBookingAction(newBooking);
        setTimeout(() => {
          if (decision.action === 'accept') {
            handleUpdateBookingStatus(newBooking, 'accept');
            toast.success(`AI automatically accepted your booking! Reason: ${decision.reason}`);
          } else {
            toast.error(`AI declined the booking. Reason: ${decision.reason}`);
            handleUpdateBookingStatus(newBooking, 'decline');
          }
        }, 2500);
      }
      return newBooking;

    } catch (error) {
      console.error("Booking request failed:", error);
      toast.error("Failed to send booking request. Please try again.");
      throw error;
    }
  };
  
  const handleUpdateBookingStatus = async (booking: Booking, response: 'accept' | 'decline' | 'cancel') => {
    let newStatus: Booking['status'] = booking.status;
    let customerMessage = '';
    let providerMessage = '';

    if (response === 'accept') {
        newStatus = booking.bookingType === 'instant' 
            ? 'Confirmed' 
            : 'Pending Customer Confirmation';
        customerMessage = booking.bookingType === 'instant'
            ? `Your booking with ${booking.provider.name} is confirmed!`
            : `Your booking with ${booking.provider.name} has been accepted. Please pay the booking fee to confirm.`;
    } else if (response === 'decline') {
        newStatus = 'Cancelled';
        customerMessage = `Your booking request with ${booking.provider.name} has been declined.`;
    } else if (response === 'cancel') {
        newStatus = 'Cancelled';
        const canceller = currentUser?.id === booking.customer.id ? 'The customer' : 'The provider';
        const otherParty = currentUser?.id === booking.customer.id ? booking.provider : booking.customer;
        
        customerMessage = currentUser?.id === booking.customer.id ? `You have successfully cancelled your booking with ${booking.provider.name}.` : `${canceller} has cancelled your booking.`;
        providerMessage = currentUser?.id === booking.provider.ownerId ? `You have successfully cancelled your booking with ${booking.customer.name}.` : `${canceller} has cancelled the booking.`;
    }
    
    try {
        const updatedBookingResponse = await api.updateBooking(booking.id, { status: newStatus });
        dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });
        
        // Notify customer
        if (customerMessage) {
            await api.createNotification({
                userId: booking.customer.id,
                message: customerMessage,
                bookingId: booking.id,
            });
        }
        // Notify provider (relevant for cancellations by customer)
        if (providerMessage) {
            await api.createNotification({
                userId: booking.provider.ownerId,
                message: providerMessage,
                bookingId: booking.id,
            });
        }


        dispatch({ type: 'CLOSE_MODAL' });
        toast.info(`Booking has been ${response === 'accept' ? 'accepted' : (response === 'decline' ? 'declined' : 'cancelled')}.`);
    } catch (error) {
        console.error(`Failed to ${response} booking:`, error);
        toast.error(`Failed to ${response} booking. Please try again.`);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    dispatch({
        type: 'OPEN_MODAL',
        payload: {
            type: 'confirmation',
            props: {
                title: 'Cancel Booking',
                message: `Are you sure you want to cancel this booking with ${currentUser?.id === booking.customer.id ? booking.provider.name : booking.customer.name}? This action cannot be undone.`,
                onConfirm: () => handleUpdateBookingStatus(booking, 'cancel'),
                confirmText: 'Yes, Cancel Booking',
            }
        }
    });
};


  const handleCustomerPaymentSuccess = async (bookingId: string) => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if (!bookingToUpdate) return;
    try {
        const updatedBookingResponse = await api.updateBooking(bookingId, { status: 'Confirmed' });
        dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });
        toast.success("Payment successful! Your booking is confirmed.");
        dispatch({ type: 'CLOSE_MODAL' });

        await api.createNotification({
            userId: bookingToUpdate.provider.ownerId,
            message: `${bookingToUpdate.customer.name} has confirmed their booking with payment.`,
            bookingId: bookingToUpdate.id,
        });

    } catch (error) {
        console.error("Customer payment failed:", error);
        toast.error("Failed to confirm payment. Please try again.");
    }
  };
  
  const handleLeaveReview = async (bookingId: string, review: Review) => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if (!bookingToUpdate || !currentUser) return;
    
    try {
        const updatedBookingResponse = await api.updateBooking(bookingId, { review: review });
        dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });
        
        const provider = providers.find(p => p.id === bookingToUpdate.provider.id);
        if (provider) {
            const newReviewsList = [...(provider.reviewsList || []), review];
            const newTotalRating = newReviewsList.reduce((sum, r) => sum + r.rating, 0);
            const newAverageRating = parseFloat((newTotalRating / newReviewsList.length).toFixed(1));
            
            await api.updateProvider(provider.id, {
                rating: newAverageRating,
            });
            dispatch({ type: 'UPDATE_PROVIDER', payload: { providerId: provider.id, updates: { rating: newAverageRating, reviewsCount: newReviewsList.length } } });
        }
        
        toast.success("Thank you for your review!");
        dispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
        console.error("Leaving review failed:", error);
        toast.error("Failed to submit review. Please try again.");
    }
  };
  
  const handleOtpVerified = async (bookingId: string) => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if (!bookingToUpdate) return;
    try {
        const updatedBookingResponse = await api.updateBooking(bookingId, { status: 'InProgress' });
        dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });
        toast.success("Service started successfully!");
        dispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
        console.error("OTP verification failed:", error);
        toast.error("Failed to verify OTP. Please try again.");
    }
  };
  
  const handleSendMessage = async (bookingId: string, messageText: string) => {
    if (!currentUser) return;
    const newMessage: Message = {
      senderId: currentUser.id,
      text: messageText,
      timestamp: new Date()
    };
    try {
        const bookingToUpdate = bookings.find(b => b.id === bookingId);
        if (!bookingToUpdate) return;
        const updatedChatHistory = [...(bookingToUpdate.chatHistory || []), newMessage];
        const updatedBookingResponse = await api.updateBooking(bookingId, { chatHistory: updatedChatHistory });
        dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });

        const recipientId = bookingToUpdate.customer.id === currentUser.id ? bookingToUpdate.provider.ownerId : bookingToUpdate.customer.id;
        await api.createNotification({
            userId: recipientId,
            message: `${currentUser.name} sent you a message regarding booking ${bookingId.split('-')[1]}.`,
            bookingId: bookingId,
        });

    } catch (error) {
        console.error("Sending message failed:", error);
        toast.error("Failed to send message.");
    }
  };
  
  const handleSendQuotation = async (bookingId: string, items: QuotationItem[], total: number) => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if (!bookingToUpdate) return;
    try {
        const updatedBookingResponse = await api.updateBooking(bookingId, {
            quotationItems: items,
            totalAmount: total,
            quotationStatus: 'Sent'
        });
        dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });

        await api.createNotification({
            userId: bookingToUpdate.customer.id,
            message: `${bookingToUpdate.provider.name} sent you a quotation for KES ${total.toLocaleString()}.`,
            bookingId: bookingId,
        });
        
        toast.success("Quotation sent to the customer!");
        dispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
        console.error("Sending quotation failed:", error);
        toast.error("Failed to send quotation. Please try again.");
    }
  };
  
  const handleRespondToQuotation = async (bookingId: string, responseStatus: 'Accepted' | 'Declined') => {
    const bookingToUpdate = bookings.find(b => b.id === bookingId);
    if (!bookingToUpdate) return;
    try {
        const updatedBookingResponse = await api.updateBooking(bookingId, { quotationStatus: responseStatus });
        dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });

        await api.createNotification({
            userId: bookingToUpdate.provider.ownerId,
            message: `${bookingToUpdate.customer.name} has ${responseStatus.toLowerCase()} your quotation.`,
            bookingId: bookingId,
        });

        toast.info(`You have ${responseStatus.toLowerCase()} the quotation.`);
        dispatch({ type: 'CLOSE_MODAL' });
    } catch (error) {
        console.error("Responding to quotation failed:", error);
        toast.error("Failed to respond to quotation. Please try again.");
    }
  };
  
    const handleCompleteJob = async (booking: Booking) => {
        try {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 7);
            
            const updatedBookingResponse = await api.updateBooking(booking.id, { status: 'Completed', dueDate: dueDate.toISOString() });
            dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });
            toast.success('Job marked as complete. Invoice sent!');

            await api.createNotification({
                userId: booking.customer.id,
                message: `${booking.provider.name} has marked your booking as complete. An invoice of KES ${booking.totalAmount?.toLocaleString()} is now due.`,
                bookingId: booking.id,
            });

        } catch (error) {
            console.error("Completing job failed:", error);
            toast.error("Failed to mark job as complete. Please try again.");
        }
    };

    const handlePayInvoiceSuccess = async (bookingId: string) => {
        const bookingToUpdate = bookings.find(b => b.id === bookingId);
        if (!bookingToUpdate) return;
        try {
            const updatedBookingResponse = await api.updateBooking(bookingId, { paymentDate: new Date().toISOString() });
            dispatch({ type: 'UPDATE_BOOKING', payload: updatedBookingResponse.booking });
            dispatch({ type: 'CLOSE_MODAL' });
            toast.success(`Payment of KES ${bookingToUpdate.totalAmount?.toLocaleString()} successful! Thank you.`);

            await api.createNotification({
                userId: bookingToUpdate.provider.ownerId,
                message: `${bookingToUpdate.customer.name} has paid the invoice for booking ${bookingId.split('-')[1]}.`,
                bookingId: bookingId,
            });

        } catch (error) {
            console.error("Invoice payment failed:", error);
            toast.error("Failed to process invoice payment. Please try again.");
        }
    };

  const handleShowLegalDoc = useCallback((type: LegalDocType) => {
      let title = '';
      let content = '';
      switch (type) {
          case 'customer':
              title = "Terms of Service";
              content = CUSTOMER_TERMS;
              break;
          case 'provider':
              title = "Provider Agreement";
              content = PROVIDER_TERMS;
              break;
          case 'privacy':
              title = "Privacy Policy";
              content = PRIVACY_POLICY;
              break;
      }
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'disclaimer', props: { title, content } } });
  }, [dispatch]);

  useEffect(() => {
    if (activeSearchCategory && isInitialProvidersLoaded && selectedLocation) {
      handleSelectCategory(activeSearchCategory);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, isInitialProvidersLoaded]);

  const onGoHome = useCallback(() => {
    dispatch({ type: 'SET_VIEW', payload: AppView.HOME });
    window.scrollTo(0, 0);
  }, [dispatch]);

  const featuredProviders = useMemo(() => {
    return providers
      .filter(p => p.rating >= 4.5)
      .sort((a, b) => b.reviewsCount - a.reviewsCount)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }, [providers]);

    const handleBookProvider = useCallback((provider: ServiceProvider, type: 'instant' | 'quote') => {
        if (!currentUser) {
            dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: () => handleBookProvider(provider, type) });
            dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: 'Please log in or register to book a service.' } } });
            return;
        }
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { provider, user: currentUser, type } } });
    }, [currentUser, dispatch]);


  const handleViewProviderDetails = useCallback((provider: ServiceProvider) => {
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerDetail', props: { provider, onBook: handleBookProvider } } });
  }, [dispatch, handleBookProvider]);

  const isProviderFavorite = useCallback((providerId: string): boolean => {
      return favoriteProviderIds.includes(providerId);
  }, [favoriteProviderIds]);

  const handleToggleFavoriteProvider = useCallback((providerId: string) => {
      dispatch({ type: 'TOGGLE_FAVORITE', payload: providerId });
  }, [dispatch]);

    const onFindServicesClick = useCallback(() => {
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'aiAssistant' } });
    }, [dispatch]);

    const onSelectLocation = useCallback((location: Location) => {
        dispatch({ type: 'SET_LOCATION', payload: location });
    }, [dispatch]);

  const renderView = () => {
    switch (view) {
      case AppView.SEARCH:
        return <SearchResults />;
      case AppView.MY_BOOKINGS:
        if (!currentUser) return <HomePage onFindServicesClick={onFindServicesClick} onFindNearMeClick={handleFindNearMe} onSelectCategory={handleSelectCategory} onSelectLocation={onSelectLocation} selectedLocation={selectedLocation} featuredProviders={featuredProviders} onBookProvider={handleBookProvider} onViewProviderDetails={handleViewProviderDetails} isProviderFavorite={isProviderFavorite} onToggleFavoriteProvider={handleToggleFavoriteProvider} userCoordinates={userCoordinates} />;
        return <MyBookingsPage
          bookings={bookings}
          currentUser={currentUser}
          onLeaveReview={(booking) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'review', props: { booking } } })}
          onOpenChat={(booking) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'chat', props: { booking } } })}
          onViewQuotation={(booking) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'quotation', props: { booking, mode: 'view' } } })}
          onConfirmAndPay={(booking) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { booking, provider: booking.provider, user: booking.customer, type: 'quote' } } })}
          onPayInvoice={(booking) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'invoice', props: { booking } } })}
          onCancelBooking={handleCancelBooking}
        />;
      case AppView.PROFILE:
        return <ProfilePage />;
      case AppView.PROVIDER_DASHBOARD:
        const providerProfile = providers.find(p => p.ownerId === currentUser?.id);
        if (!currentUser || currentUser.role !== UserRole.PROVIDER) {
            // Redirect to home if not logged in or not a provider
            return <HomePage onFindServicesClick={onFindServicesClick} onFindNearMeClick={handleFindNearMe} onSelectCategory={handleSelectCategory} onSelectLocation={onSelectLocation} selectedLocation={selectedLocation} featuredProviders={featuredProviders} onBookProvider={handleBookProvider} onViewProviderDetails={handleViewProviderDetails} isProviderFavorite={isProviderFavorite} onToggleFavoriteProvider={handleToggleFavoriteProvider} userCoordinates={userCoordinates} />;
        }
        return <ProviderDashboard 
          user={currentUser}
          provider={providerProfile || null}
          bookings={bookings.filter(b => providerProfile && b.provider.ownerId === providerProfile.ownerId)}
          onUpdateBookingStatus={(booking, response) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerAcceptance', props: { booking, response } } })}
          onOpenChat={(booking) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'chat', props: { booking } } })}
          onOpenQuotation={(booking) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'quotation', props: { booking, mode: 'edit' } } })}
          onCompleteJob={handleCompleteJob}
          onCancelBooking={handleCancelBooking}
        />;
      case AppView.LOCAL_HUB:
        return <LocalHub />;
      case AppView.HOME:
      default:
        return <HomePage onFindServicesClick={onFindServicesClick} onFindNearMeClick={handleFindNearMe} onSelectCategory={handleSelectCategory} onSelectLocation={onSelectLocation} selectedLocation={selectedLocation} featuredProviders={featuredProviders} onBookProvider={handleBookProvider} onViewProviderDetails={handleViewProviderDetails} isProviderFavorite={isProviderFavorite} onToggleFavoriteProvider={handleToggleFavoriteProvider} userCoordinates={userCoordinates} />;
    }
  };
  
  const renderModal = () => {
    if (!modal) return null;
    switch (modal.type) {
      case 'auth':
        return <AuthModal onAuthSuccess={handleAuthSuccess} onProviderRegister={handleProviderRegister} onShowTerms={handleShowLegalDoc} {...modal.props} />;
      case 'forgotPassword':
        return <ForgotPasswordModal />;
      case 'aiAssistant':
        return <AiAssistant onSearch={handleAiSearch} isLoading={isAiSearchLoading} error={aiSearchError} />;
      case 'providerDetail':
        return <ProviderDetailModal {...modal.props} />;
      case 'locationSelector':
        return <LocationSelectorModal onSelectLocation={(l) => { dispatch({ type: 'SET_LOCATION', payload: l }); dispatch({ type: 'CLOSE_MODAL' }); }} />;
      case 'booking':
        if (!currentUser) { 
          toast.error("Please log in to make a booking.");
          dispatch({type: 'CLOSE_MODAL' }); 
          dispatch({type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: "You need to be logged in to book a service." } } });
          return null; 
        }
        return <BookingModal {...modal.props} user={currentUser} onSendRequest={handleSendBookingRequest} onCustomerPaymentSuccess={handleCustomerPaymentSuccess} />;
      case 'chatbot':
        if (!currentUser) { 
            toast.error("Please log in to use the AI Assistant.");
            dispatch({ type: 'CLOSE_MODAL' });
            dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: 'Please log in to use the AI Assistant.' } } });
            return null;
        }
        return <ChatbotModal userId={currentUser.id} {...modal.props} />;
      case 'kyc':
        if (!currentUser) { dispatch({type: 'CLOSE_MODAL' }); return null; }
        return <KycModal user={currentUser} onKycSuccess={handleKycSuccess} />;
      case 'providerRegistration':
        return <ProviderRegistrationModal onComplete={handleProviderRegistrationComplete} onShowTerms={handleShowLegalDoc} {...modal.props} />;
      case 'editProviderDetails':
        const providerToEdit = providers.find(p => p.ownerId === currentUser?.id);
        if (!providerToEdit) return null;
        return <ProviderRegistrationModal isEditMode initialData={providerToEdit} onComplete={handleProviderRegistrationComplete} onShowTerms={handleShowLegalDoc} />;
      case 'review':
        if (!currentUser) { dispatch({type: 'CLOSE_MODAL' }); return null; }
        return <ReviewModal {...modal.props} user={currentUser} onSubmit={handleLeaveReview} />;
      case 'otp':
        return <OtpModal {...modal.props} onVerified={() => handleOtpVerified(modal.props.booking.id)} />;
      case 'chat':
        if (!currentUser) { dispatch({type: 'CLOSE_MODAL' }); return null; }
        return <ChatModal {...modal.props} currentUser={currentUser} onSendMessage={handleSendMessage} />;
      case 'quotation':
        if (!currentUser) { dispatch({type: 'CLOSE_MODAL' }); return null; }
        return <QuotationModal {...modal.props} currentUser={currentUser} onSendQuotation={handleSendQuotation} onRespondToQuotation={handleRespondToQuotation} />;
      case 'providerAcceptance':
        return <ProviderAcceptanceModal {...modal.props} onConfirm={handleUpdateBookingStatus} />;
      case 'confirmation':
        return <ConfirmationModal {...modal.props} />;
      case 'disclaimer':
        return <DisclaimerModal {...modal.props} />;
      case 'invoice':
          return <InvoiceModal {...modal.props} onPayInvoiceSuccess={handlePayInvoiceSuccess} />;
      default:
        return null;
    }
  };

  if (isInitializing) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      <Suspense fallback={<div className="h-[68px] bg-white shadow-md"></div>}>
        <Header />
      </Suspense>
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
            {renderView()}
        </Suspense>
      </main>
      <Suspense fallback={<div></div>}>
        <Footer onGoHome={onGoHome} onSelectLocation={onSelectLocation} onShowTerms={handleShowLegalDoc} />
      </Suspense>
      <Suspense fallback={null}>
        {renderModal()}
      </Suspense>
      <ChatbotButton onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'chatbot' } })} />
      <BackToTopButton />
    </div>
  );
};

export default App;