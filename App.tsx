
import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
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

    // Effect to handle Push Notification subscription
    useEffect(() => {
        if (currentUser && 'serviceWorker' in navigator && 'PushManager' in window) {
            const subscribeToPush = async () => {
                try {
                    const swRegistration = await navigator.serviceWorker.register('/service-worker.js');
                    let subscription = await swRegistration.pushManager.getSubscription();

                    if (subscription === null) {
                        const permission = await window.Notification.requestPermission();
                        if (permission !== 'granted') {
                            console.warn('Push notification permission not granted.');
                            toast.info('Enable notifications in your browser settings to get real-time updates!');
                            return;
                        }

                        const { publicKey: vapidPublicKey } = await api.getVapidPublicKey();
                        if (!vapidPublicKey) {
                            throw new Error('VAPID public key not found on server.');
                        }

                        subscription = await swRegistration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: vapidPublicKey,
                        });
                    }

                    await api.savePushSubscription(subscription);
                    console.log('User is subscribed to push notifications.');

                } catch (error) {
                    console.error('Failed to subscribe to push notifications:', error);
                    toast.error('Could not set up push notifications.');
                }
            };
            // Delay subscription to ensure app is stable and avoid excessive requests on hot-reload
            const timer = setTimeout(subscribeToPush, 3000);
            return () => clearTimeout(timer);
        }
    }, [currentUser, toast]);


  // Effect to open location selector *after* initialization is complete
  useEffect(() => {
    // Only run this check if the app is NOT initializing and no location has been set.
    if (!isInitializing && !selectedLocation && !modal) {
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'locationSelector' } });
    }
  }, [isInitializing, selectedLocation, modal, dispatch]);

  // Define callbacks using useCallback for memoization
  const onSelectCategory = useCallback((category: ServiceCategory) => {
      if (!currentUser) {
          dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: () => onSelectCategory(category) });
          dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: 'Please log in or register to view service providers.' } } });
          return;
      }
      dispatch({ type: 'SET_VIEW', payload: AppView.SEARCH });
      dispatch({ type: 'SET_ACTIVE_SEARCH_CATEGORY', payload: category });
  }, [currentUser, dispatch]);

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
      onSelectCategory(result.serviceCategory);

    } catch (error) {
      setAiSearchError("An error occurred while searching. Please try again.");
      console.error("AI Search Error:", error);
    } finally {
      setIsAiSearchLoading(false);
    }
  };

    const onShowTerms = (type: LegalDocType) => {
      let title = '';
      let content = '';
      switch (type) {
          case 'customer':
              title = 'Customer Terms of Service';
              content = CUSTOMER_TERMS;
              break;
          case 'provider':
              title = 'Provider Agreement';
              content = PROVIDER_TERMS;
              break;
          case 'privacy':
              title = 'Privacy Policy';
              content = PRIVACY_POLICY;
              break;
      }
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'disclaimer', props: { title, content } } });
  };
  
  const featuredProviders = useMemo(() => {
    if (!providers) return [];
    // Simple logic: filter by KYC verified and high rating, then shuffle and take a few
    return providers
        .filter(p => p.kycVerified && p.rating >= 4.5)
        .sort(() => 0.5 - Math.random()) // Pseudo-shuffle
        .slice(0, 3);
  }, [providers]);
  
  const onBookProvider = useCallback((provider: ServiceProvider, type: 'instant' | 'quote') => {
      if (!currentUser) {
          dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: () => onBookProvider(provider, type) });
          dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: 'Please log in or register to book a service.' } } });
          return;
      }
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { provider, type } } });
  }, [currentUser, dispatch]);
  
  const onViewProviderDetails = useCallback((provider: ServiceProvider) => {
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerDetail', props: { provider } } });
  }, [dispatch]);

  const isProviderFavorite = useCallback((id: string) => favoriteProviderIds.includes(id), [favoriteProviderIds]);
  const onToggleFavoriteProvider = useCallback((id: string) => dispatch({ type: 'TOGGLE_FAVORITE', payload: id }), [dispatch]);
  
  const onAuthSuccess = useCallback(async (user: User, isNewUser: boolean, token?: string) => {
      if (token) {
          localStorage.setItem('jwtToken', token);
      }
      dispatch({ type: 'LOGIN', payload: user });
      dispatch({ type: 'CLOSE_MODAL' });

       // Re-fetch data that depends on the user
      try {
        const [myBookings, myNotifications, myJobAlerts] = await Promise.all([
            api.fetchMyBookings(),
            api.fetchMyNotifications(),
            api.fetchMyJobAlerts()
        ]);
        dispatch({ type: 'SET_BOOKINGS', payload: myBookings });
        dispatch({ type: 'SET_NOTIFICATIONS', payload: myNotifications });
        dispatch({ type: 'SET_JOB_ALERTS', payload: myJobAlerts });
      } catch (error) {
          console.error("Failed to fetch user data after login:", error);
          toast.error("Could not load your data. Please try refreshing.");
      }

      if (isNewUser && !user.kycVerified) {
          dispatch({ type: 'OPEN_MODAL', payload: { type: 'kyc' } });
      } else if (state.postLoginAction) {
          state.postLoginAction();
          dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: null });
      }
  }, [dispatch, state.postLoginAction, toast]);
  
  const onProviderRegister = useCallback((user: { name: string, email: string, phone: string }) => {
      dispatch({ type: 'CLOSE_MODAL' });
      dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerRegistration', props: { pendingUser: user } } });
  }, [dispatch]);
  
  const handleKycSuccess = useCallback(async (updatedUserData: Partial<User>) => {
      try {
          const { user: updatedUser } = await api.updateCurrentUser(updatedUserData);
          dispatch({ type: 'UPDATE_USER', payload: updatedUser });
          dispatch({ type: 'CLOSE_MODAL' });
          toast.success("Profile details updated successfully!");
          if (updatedUser.role === UserRole.PROVIDER && !providers.some(p => p.ownerId === updatedUser.id)) {
              dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerRegistration' } });
          }
      } catch (error) {
          toast.error("Failed to update profile.");
          console.error(error);
      }
  }, [dispatch, toast, providers]);
  
  const handleProviderRegistrationComplete = useCallback(async (data: Partial<ServiceProvider & NewProviderData>, pendingUser?: { name: string, email: string, phone: string }) => {
      const isEditMode = !!modal?.props?.isEditMode;
      try {
          if (isEditMode) {
              const providerId = modal.props.initialData.id;
              const { provider } = await api.updateProvider(providerId, { ...data, name: data.businessName });
              dispatch({ type: 'UPDATE_PROVIDER', payload: { providerId, updates: provider } });
              toast.success("Provider profile updated successfully!");
          } else {
              const { provider } = await api.createProvider({ ...data as any, ownerId: currentUser!.id });
              dispatch({ type: 'ADD_PROVIDER', payload: provider });
              toast.success("Provider profile created successfully! You are now live.");
          }
          dispatch({ type: 'CLOSE_MODAL' });
          dispatch({ type: 'SET_VIEW', payload: AppView.PROVIDER_DASHBOARD });
      } catch (error: any) {
          toast.error(error.message || "An error occurred during registration.");
      }
  }, [dispatch, currentUser, modal, toast]);

  const handleSendBookingRequest = useCallback(async (provider: ServiceProvider, serviceDate: Date, requestDetails: string, type: 'instant' | 'quote'): Promise<Booking> => {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const bookingData = {
            providerId: provider.id,
            serviceDate: serviceDate.toISOString(),
            requestDetails,
            bookingType: type,
            status: type === 'instant' ? 'Pending Customer Confirmation' : 'Pending Provider Confirmation',
            otp: type === 'instant' ? otp : '',
        };
        const { booking } = await api.createBooking(bookingData as any);

        const fullBookingDetails: Booking = {
            ...booking,
            provider, // Eagerly add provider details for immediate UI update
            customer: currentUser!, // Eagerly add customer details
        };
        
        dispatch({ type: 'ADD_BOOKING', payload: fullBookingDetails });
        
        await api.createNotification({ userId: provider.ownerId, message: `New booking request from ${currentUser!.name} for ${provider.category}.`, bookingId: booking.id });
        toast.success("Booking request sent successfully!");
        return fullBookingDetails;
    }, [dispatch, currentUser, toast]);

    const handleUpdateBookingStatus = useCallback(async (booking: Booking, response: 'accept' | 'decline' | 'cancel') => {
        let newStatus: Booking['status'];
        let notificationMessage = '';
        const isProvider = currentUser?.role === UserRole.PROVIDER;

        switch (response) {
            case 'accept':
                newStatus = 'Confirmed';
                notificationMessage = `Your booking with ${booking.provider.name} has been confirmed!`;
                break;
            case 'decline':
                newStatus = 'Cancelled';
                notificationMessage = `${booking.provider.name} declined your booking request.`;
                break;
            case 'cancel':
                newStatus = 'Cancelled';
                notificationMessage = isProvider 
                    ? `${booking.provider.name} has cancelled your upcoming service.`
                    : `${booking.customer.name} has cancelled your upcoming service.`;
                break;
        }

        try {
            const { booking: updatedBooking } = await api.updateBooking(booking.id, { status: newStatus });
            dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking });
            
            const recipientId = isProvider ? booking.customer.id : booking.provider.ownerId;
            await api.createNotification({ userId: recipientId, message: notificationMessage, bookingId: booking.id });

            toast.success(`Booking ${response === 'accept' ? 'accepted' : 'cancelled'}.`);
            dispatch({ type: 'CLOSE_MODAL' });
        } catch(error) {
            toast.error("Failed to update booking status.");
        }
    }, [dispatch, currentUser, toast]);

    const handleCompleteJob = useCallback(async (booking: Booking) => {
        try {
            const { booking: updatedBooking } = await api.updateBooking(booking.id, { status: 'Completed' });
            dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking });
            await api.createNotification({
                userId: booking.customer.id,
                message: `Your service with ${booking.provider.name} is complete. Please pay the final amount and leave a review.`,
                bookingId: booking.id
            });
            toast.success("Job marked as complete!");
            dispatch({ type: 'CLOSE_MODAL' });
        } catch (error) {
            toast.error("Failed to complete job.");
        }
    }, [dispatch, toast]);

    const handleSendQuotation = useCallback(async (bookingId: string, items: QuotationItem[], total: number) => {
        try {
            const { booking: updatedBooking } = await api.updateBooking(bookingId, { quotationItems: items, totalAmount: total, quotationStatus: 'Sent' });
            dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking });
            await api.createNotification({
                userId: updatedBooking.customer.id,
                message: `You've received a quotation from ${updatedBooking.provider.name}.`,
                bookingId
            });
            toast.success("Quotation sent to customer.");
            dispatch({ type: 'CLOSE_MODAL' });
        } catch (error) {
            toast.error("Failed to send quotation.");
        }
    }, [dispatch, toast]);

    const handleRespondToQuotation = useCallback(async (bookingId: string, response: 'Accepted' | 'Declined') => {
        try {
            const { booking: updatedBooking } = await api.updateBooking(bookingId, { quotationStatus: response });
            dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking });
            await api.createNotification({
                userId: updatedBooking.provider.ownerId,
                message: `${updatedBooking.customer.name} has ${response.toLowerCase()} your quotation.`,
                bookingId
            });
            toast.success(`Quotation ${response.toLowerCase()}.`);
            dispatch({ type: 'CLOSE_MODAL' });
        } catch (error) {
            toast.error("Failed to respond to quotation.");
        }
    }, [dispatch, toast]);
    
  const renderView = () => {
    switch (view) {
      case AppView.SEARCH:
        return <SearchResults />;
      case AppView.MY_BOOKINGS:
        return currentUser ? <MyBookingsPage bookings={bookings} currentUser={currentUser} onLeaveReview={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'review', props: { booking: b } }})} onOpenChat={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'chat', props: { booking: b } }})} onViewQuotation={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'quotation', props: { booking: b, mode: 'view' } }})} onConfirmAndPay={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { provider: b.provider, booking: b, type: 'instant' } }})} onPayInvoice={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'invoice', props: { booking: b } }})} onCancelBooking={(b) => dispatch({type: 'OPEN_MODAL', payload: { type: 'confirmation', props: { title: 'Cancel Booking', message: 'Are you sure you want to cancel this booking?', onConfirm: () => handleUpdateBookingStatus(b, 'cancel') } }})} /> : <HomePage onFindServicesClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'aiAssistant' } })} onFindNearMeClick={() => {}} onSelectCategory={onSelectCategory} onSelectLocation={(loc) => dispatch({ type: 'SET_LOCATION', payload: loc })} selectedLocation={selectedLocation} featuredProviders={featuredProviders} onBookProvider={onBookProvider} onViewProviderDetails={onViewProviderDetails} isProviderFavorite={isProviderFavorite} onToggleFavoriteProvider={onToggleFavoriteProvider} userCoordinates={userCoordinates}/>;
      case AppView.PROFILE:
        return currentUser ? <ProfilePage /> : <HomePage onFindServicesClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'aiAssistant' } })} onFindNearMeClick={() => {}} onSelectCategory={onSelectCategory} onSelectLocation={(loc) => dispatch({ type: 'SET_LOCATION', payload: loc })} selectedLocation={selectedLocation} featuredProviders={featuredProviders} onBookProvider={onBookProvider} onViewProviderDetails={onViewProviderDetails} isProviderFavorite={isProviderFavorite} onToggleFavoriteProvider={onToggleFavoriteProvider} userCoordinates={userCoordinates}/>;
      case AppView.PROVIDER_DASHBOARD:
        const providerProfile = providers.find(p => p.ownerId === currentUser?.id);
        return currentUser && currentUser.role === UserRole.PROVIDER ? <ProviderDashboard user={currentUser} provider={providerProfile || null} bookings={bookings} onUpdateBookingStatus={(b, resp) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerAcceptance', props: { booking: b, response: resp } }})} onOpenChat={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'chat', props: { booking: b } }})} onOpenQuotation={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'quotation', props: { booking: b, mode: 'edit' } }})} onCompleteJob={handleCompleteJob} onCancelBooking={(b) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerAcceptance', props: { booking: b, response: 'cancel' } }})}/> : <HomePage onFindServicesClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'aiAssistant' } })} onFindNearMeClick={() => {}} onSelectCategory={onSelectCategory} onSelectLocation={(loc) => dispatch({ type: 'SET_LOCATION', payload: loc })} selectedLocation={selectedLocation} featuredProviders={featuredProviders} onBookProvider={onBookProvider} onViewProviderDetails={onViewProviderDetails} isProviderFavorite={isProviderFavorite} onToggleFavoriteProvider={onToggleFavoriteProvider} userCoordinates={userCoordinates}/>;
      case AppView.LOCAL_HUB:
        return <LocalHub />;
      case AppView.HOME:
      default:
        return <HomePage onFindServicesClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'aiAssistant' } })} onFindNearMeClick={() => {}} onSelectCategory={onSelectCategory} onSelectLocation={(loc) => dispatch({ type: 'SET_LOCATION', payload: loc })} selectedLocation={selectedLocation} featuredProviders={featuredProviders} onBookProvider={onBookProvider} onViewProviderDetails={onViewProviderDetails} isProviderFavorite={isProviderFavorite} onToggleFavoriteProvider={onToggleFavoriteProvider} userCoordinates={userCoordinates}/>;
    }
  };

  const renderModal = () => {
    if (!modal) return null;
    switch (modal.type) {
        case 'auth': return <AuthModal onAuthSuccess={onAuthSuccess} onProviderRegister={onProviderRegister} onShowTerms={onShowTerms} {...modal.props} />;
        case 'aiAssistant': return <AiAssistant onSearch={handleAiSearch} isLoading={isAiSearchLoading} error={aiSearchError} />;
        case 'locationSelector': return <LocationSelectorModal onSelectLocation={(loc) => { dispatch({ type: 'SET_LOCATION', payload: loc }); dispatch({ type: 'CLOSE_MODAL' }); }} />;
        case 'providerDetail': return <ProviderDetailModal onBook={onBookProvider} {...modal.props} />;
        case 'booking': return currentUser && <BookingModal user={currentUser} onSendRequest={handleSendBookingRequest} onCustomerPaymentSuccess={()=>{}} {...modal.props} />;
        case 'chatbot': return currentUser && <ChatbotModal userId={currentUser.id} {...modal.props}/>;
        case 'kyc': return currentUser && <KycModal user={currentUser} onKycSuccess={handleKycSuccess} {...modal.props} />;
        case 'providerRegistration': return currentUser && <ProviderRegistrationModal onComplete={handleProviderRegistrationComplete} onShowTerms={onShowTerms} {...modal.props} />;
        case 'editProviderDetails': const providerToEdit = providers.find(p => p.ownerId === currentUser?.id); return providerToEdit && <ProviderRegistrationModal onComplete={handleProviderRegistrationComplete} initialData={providerToEdit} isEditMode={true} onShowTerms={onShowTerms} {...modal.props} />;
        case 'review': return currentUser && <ReviewModal user={currentUser} onSubmit={()=>{}} {...modal.props} />;
        case 'otp': return <OtpModal onVerified={()=>{}} {...modal.props} />;
        case 'chat': return currentUser && <ChatModal currentUser={currentUser} onSendMessage={()=>{}} {...modal.props} />;
        case 'quotation': return currentUser && <QuotationModal currentUser={currentUser} onSendQuotation={handleSendQuotation} onRespondToQuotation={handleRespondToQuotation} {...modal.props} />;
        case 'providerAcceptance': return <ProviderAcceptanceModal onConfirm={handleUpdateBookingStatus} {...modal.props} />;
        case 'confirmation': return <ConfirmationModal {...modal.props} />;
        case 'disclaimer': return <DisclaimerModal {...modal.props} />;
        case 'invoice': return <InvoiceModal onPayInvoiceSuccess={()=>{}} {...modal.props} />;
        case 'forgotPassword': return <ForgotPasswordModal />;
        default: return null;
    }
  };

    if (isInitializing) {
        return <LoadingSpinner />;
    }

  return (
    <Suspense fallback={<LoadingSpinner />}>
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {renderView()}
            </main>
            <Footer onSelectLocation={(loc) => dispatch({ type: 'SET_LOCATION', payload: loc })} onShowTerms={onShowTerms} onGoHome={() => dispatch({ type: 'SET_VIEW', payload: AppView.HOME })} />
            {renderModal()}
            {currentUser && <ChatbotButton onClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'chatbot', props: { userId: currentUser.id } } })} />}
            <BackToTopButton />
        </div>
    </Suspense>
  );
};

export default App;
