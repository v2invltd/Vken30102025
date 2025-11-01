
import React, { useEffect, useCallback, useState } from 'react';
import { useAppContext, AppView } from './contexts/AppContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import BackToTopButton from './components/BackToTopButton';

// Pages/Views
import HomePage from './components/HomePage';
import SearchResults from './components/SearchResults';
import MyBookingsPage from './components/MyServicesPage';
import ProfilePage from './components/ProfilePage';
import ProviderDashboard from './components/ProviderDashboard';
import LocalHub from './components/LocalHub';

// Modals
import AuthModal from './components/AuthModal';
import LocationSelectorModal from './components/LocationSelectorModal';
import AiAssistant from './components/AiAssistant';
import ProviderDetailModal from './components/ProviderDetailModal';
import BookingModal from './components/BookingModal';
import KycModal from './components/KycModal';
import ProviderRegistrationModal from './components/ProviderRegistrationModal';
import OtpModal from './components/OtpModal';
import ReviewModal from './components/ReviewModal';
import ChatbotModal from './components/ChatbotModal';
import ChatModal from './components/ChatModal';
import QuotationModal from './components/QuotationModal';
import ProviderAcceptanceModal from './components/ProviderAcceptanceModal';
import ConfirmationModal from './components/ConfirmationModal';
import DisclaimerModal from './components/DisclaimerModal';
import InvoiceModal from './components/InvoiceModal';
import VerificationOtpModal from './components/VerificationOtpModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';

// API
import * as api from './frontend/services/api';

// Types
import { LegalDocType, Location, ServiceCategory, ServiceProvider, User, Booking, Review, NewProviderData, QuotationItem, PendingRegistrationData } from './types';
import { useToast } from './components/Toast';
import { CUSTOMER_TERMS, PROVIDER_TERMS, PRIVACY_POLICY } from './legal';

interface PendingKycUser {
    user: User;
    token: string;
}

const App: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { 
        view, modal, currentUser, selectedLocation, providers, bookings, 
        favoriteProviderIds, userCoordinates, isInitializing, isAutoDetectingLocation
    } = state;
    const toast = useToast();

    const [pendingRegistrationData, setPendingRegistrationData] = useState<PendingRegistrationData | null>(null);
    const [aiSearchIsLoading, setAiSearchIsLoading] = useState(false);
    const [aiSearchError, setAiSearchError] = useState<string | null>(null);


    // Initialization effect
    useEffect(() => {
        const initializeApp = async () => {
            const token = localStorage.getItem('jwtToken');
            if (token) {
                try {
                    const user = await api.fetchCurrentUser();
                    dispatch({ type: 'LOGIN', payload: user });
                    const [bookings, notifications, alerts] = await Promise.all([
                        api.fetchMyBookings(),
                        api.fetchMyNotifications(),
                        api.fetchMyJobAlerts(),
                    ]);
                    dispatch({ type: 'SET_BOOKINGS', payload: bookings });
                    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
                    dispatch({ type: 'SET_JOB_ALERTS', payload: alerts });

                    if (!user.kycVerified) {
                        dispatch({ type: 'OPEN_MODAL', payload: { type: 'kyc' } });
                    }
                } catch (error) {
                    console.error("Session expired or invalid:", error);
                    localStorage.removeItem('jwtToken');
                    dispatch({ type: 'LOGOUT' });
                }
            }

            try {
                const providers = await api.fetchAllProviders();
                dispatch({ type: 'SET_PROVIDERS', payload: providers });
                dispatch({ type: 'SET_INITIAL_PROVIDERS_LOADED', payload: true });
            } catch (error) {
                toast.error("Could not load service providers. Please refresh the page.");
                console.error(error);
            }

            dispatch({ type: 'SET_INITIALIZING', payload: false });
        };
        initializeApp();
    }, [dispatch, toast]);

    // Geolocation effect
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    dispatch({ type: 'SET_USER_COORDINATES', payload: { lat: latitude, lon: longitude } });
                    if (!selectedLocation) {
                        api.getCityFromCoordinates(latitude, longitude)
                          .then(city => {
                            if (city) {
                                dispatch({ type: 'SET_LOCATION', payload: city });
                            }
                            // Set auto-detect to false *after* attempting to set location
                            dispatch({ type: 'SET_AUTO_DETECTING_LOCATION', payload: false });
                          })
                          .catch(err => {
                            console.warn("Could not determine city from coordinates:", err);
                            // Also set to false on error
                            dispatch({ type: 'SET_AUTO_DETECTING_LOCATION', payload: false });
                          });
                    } else {
                         dispatch({ type: 'SET_AUTO_DETECTING_LOCATION', payload: false });
                    }
                },
                (error) => { 
                    console.warn(`Geolocation error: ${error.message}`); 
                    dispatch({ type: 'SET_AUTO_DETECTING_LOCATION', payload: false });
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
            );
        } else {
             console.warn("Geolocation is not supported by this browser.");
             dispatch({ type: 'SET_AUTO_DETECTING_LOCATION', payload: false });
        }
    }, [dispatch, selectedLocation]);

    // HANDLERS
    const handleLoginSuccess = useCallback((user: User, isNewUser: boolean, token?: string) => {
        dispatch({ type: 'LOGIN', payload: user });
        if (token) localStorage.setItem('jwtToken', token);
        dispatch({ type: 'CLOSE_MODAL' });

        if (isNewUser) {
            toast.success(`Welcome, ${user.name}! Let's complete your profile.`);
            dispatch({ type: 'OPEN_MODAL', payload: { type: 'kyc' } });
        }
        
        if (state.postLoginAction) {
            state.postLoginAction();
            dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: null });
        }
    }, [dispatch, toast, state.postLoginAction]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('jwtToken');
        dispatch({ type: 'LOGOUT' });
        toast.info("You have been logged out.");
    }, [dispatch, toast]);

    const handleSelectLocation = useCallback((location: Location) => {
        dispatch({ type: 'SET_LOCATION', payload: location });
        dispatch({ type: 'CLOSE_MODAL' });
    }, [dispatch]);
    
    const handleSelectCategory = useCallback((category: ServiceCategory) => {
        if (!currentUser) {
            dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: () => handleSelectCategory(category) });
            dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: 'Please log in or register to view service providers.' } } });
            return;
        }
        if (!selectedLocation) {
            toast.error("Please select a location first.");
            return;
        }
        dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: true });
        dispatch({ type: 'SET_VIEW', payload: AppView.SEARCH });
        dispatch({ type: 'SET_ACTIVE_SEARCH_CATEGORY', payload: category });
        api.searchProviders(category, selectedLocation)
            .then(results => dispatch({ type: 'SET_SEARCH_RESULTS', payload: results }))
            .catch(err => {
                toast.error("Failed to fetch service providers.");
                console.error(err);
            })
            .finally(() => dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: false }));
    }, [currentUser, selectedLocation, dispatch, toast]);
    
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

    const handleFindNearMe = useCallback(async () => {
        if (!selectedLocation) {
            toast.error("Please select a city to find nearby services.");
            return;
        }
        if (!userCoordinates) {
            toast.info("Determining your location... Please try again in a moment.");
            // Optionally, re-trigger geolocation here if needed
            return;
        }
        dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: true });
        dispatch({ type: 'SET_VIEW', payload: AppView.SEARCH });
        dispatch({ type: 'SET_ACTIVE_SEARCH_CATEGORY', payload: null }); // For nearby search
        try {
            const allProviders = await api.fetchAllProviders();
            const providersWithDistance = allProviders
                .filter(p => p.locations.includes(selectedLocation) && p.coordinates && !p.isBlacklisted)
                .map(p => ({
                    ...p,
                    distance: getDistance(userCoordinates, p.coordinates!)
                }))
                .sort((a, b) => a.distance - b.distance);

            dispatch({ type: 'SET_SEARCH_RESULTS', payload: providersWithDistance });
        } catch (error) {
            toast.error("Failed to find nearby providers.");
        } finally {
            dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: false });
        }
    }, [selectedLocation, userCoordinates, dispatch, toast]);


    const handleAiSearch = useCallback(async (query: string, image: string | null) => {
        if (!selectedLocation) {
            toast.error("Please select a location before using the AI assistant.");
            return;
        }
        setAiSearchIsLoading(true);
        setAiSearchError(null);
        try {
            const result = await api.parseServiceRequest(query, userCoordinates, image);
            if (result.error || !result.serviceCategory || !result.location) {
                setAiSearchError(result.error || "Could not understand your request. Please be more specific.");
                return;
            }
            dispatch({ type: 'CLOSE_MODAL' });
            dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: true });
            dispatch({ type: 'SET_VIEW', payload: AppView.SEARCH });
            dispatch({ type: 'SET_ACTIVE_SEARCH_CATEGORY', payload: result.serviceCategory });
            dispatch({ type: 'SET_SEARCH_GROUNDING_SOURCES', payload: result.groundingChunks || null });
            
            const providers = await api.searchProviders(result.serviceCategory, result.location);
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: providers });
        } catch (error: any) {
            setAiSearchError(error.message);
        } finally {
            setAiSearchIsLoading(false);
            dispatch({ type: 'SET_SEARCH_LOADING_STATUS', payload: false });
        }
    }, [selectedLocation, userCoordinates, dispatch, toast]);

    const handleBookingRequest = useCallback(async (provider: ServiceProvider, serviceDate: Date, requestDetails: string, type: 'instant' | 'quote') => {
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const { booking } = await api.createBooking({ 
            providerId: provider.id, 
            serviceDate, 
            requestDetails, 
            bookingType: type,
            status: type === 'instant' ? 'Pending Customer Confirmation' : 'Pending Provider Confirmation',
            otp
        });
        dispatch({ type: 'ADD_BOOKING', payload: booking });
        toast.success("Booking request sent!");
        return booking;
    }, [dispatch, toast]);
    
    const handleKycSuccess = useCallback(async (updates: Partial<User>) => {
        await api.updateCurrentUser(updates);
        dispatch({ type: 'UPDATE_USER', payload: updates });
        dispatch({ type: 'CLOSE_MODAL' });
        toast.success("Profile updated successfully!");
    }, [dispatch, toast]);

    const handleProviderRegistrationComplete = useCallback(async (data: Partial<ServiceProvider & NewProviderData>, pendingUser?: { name: string, email: string, phone: string }) => {
        try {
            const { provider } = await api.createProvider(data as any);
            dispatch({ type: 'ADD_PROVIDER', payload: provider });
            if (pendingUser) {
                dispatch({ type: 'UPDATE_USER', payload: { businessName: provider.name } });
            }
            dispatch({ type: 'CLOSE_MODAL' });
            toast.success("Registration complete! Your profile is now live.");
        } catch (error: any) {
            toast.error(error.message || "Registration failed.");
        }
    }, [dispatch, toast]);

    const handleShowTerms = (type: LegalDocType) => {
        const content = type === 'customer' ? CUSTOMER_TERMS : type === 'provider' ? PROVIDER_TERMS : PRIVACY_POLICY;
        const title = type === 'customer' ? 'Terms of Service' : type === 'provider' ? 'Provider Agreement' : 'Privacy Policy';
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'disclaimer', props: { title, content } } });
    };
    
    const handleUpdateBooking = useCallback(async (booking: Booking, updates: Partial<Booking>) => {
        try {
            const { booking: updatedBooking } = await api.updateBooking(booking.id, updates);
            dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking });
            return updatedBooking;
        } catch (error: any) {
            toast.error(error.message || "Failed to update booking.");
            throw error;
        }
    }, [dispatch, toast]);

    // RENDER FUNCTIONS
    const renderView = () => {
        if (isInitializing) {
             return <div className="flex-grow flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div>;
        }
        switch (view) {
            case AppView.SEARCH: return <SearchResults />;
            case AppView.MY_BOOKINGS: return <MyBookingsPage bookings={bookings} currentUser={currentUser!} onLeaveReview={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'review', props: {booking: b}}})} onOpenChat={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'chat', props: {booking: b}}})} onViewQuotation={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'quotation', props: {booking: b, mode: 'view'}}})} onConfirmAndPay={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'booking', props: {provider: b.provider, booking: b, type: 'instant'}}})} onPayInvoice={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'invoice', props: {booking: b}}})} onCancelBooking={(b) => handleUpdateBooking(b, {status: 'Cancelled'})} />;
            case AppView.PROFILE: return <ProfilePage />;
            case AppView.PROVIDER_DASHBOARD: return <ProviderDashboard user={currentUser!} provider={providers.find(p => p.ownerId === currentUser!.id) || null} bookings={bookings} onUpdateBookingStatus={(b, r) => { handleUpdateBooking(b, {status: r === 'accept' ? 'Confirmed' : 'Cancelled'}); dispatch({type: 'CLOSE_MODAL'}); }} onOpenChat={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'chat', props: {booking: b}}})} onOpenQuotation={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'quotation', props: {booking: b, mode: 'edit'}}})} onCompleteJob={(b) => dispatch({type: 'OPEN_MODAL', payload: {type: 'otp', props: {booking: b}}})} onCancelBooking={(b) => handleUpdateBooking(b, {status: 'Cancelled'})}/>;
            case AppView.LOCAL_HUB: return <LocalHub />;
            case AppView.HOME:
            default:
                return <HomePage 
                    onFindServicesClick={() => dispatch({ type: 'OPEN_MODAL', payload: { type: 'aiAssistant' } })}
                    onFindNearMeClick={handleFindNearMe}
                    onSelectCategory={handleSelectCategory}
                    onSelectLocation={handleSelectLocation}
                    selectedLocation={selectedLocation}
                    featuredProviders={providers.filter(p => !p.isBlacklisted).slice(0,3)}
                    onBookProvider={(p, type) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { provider: p, type } } })}
                    onViewProviderDetails={(p) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerDetail', props: { provider: p } } })}
                    isProviderFavorite={(id) => favoriteProviderIds.includes(id)}
                    onToggleFavoriteProvider={(id) => dispatch({ type: 'TOGGLE_FAVORITE', payload: id })}
                    userCoordinates={userCoordinates}
                />;
        }
    };
    
    const renderModal = () => {
        // Updated condition to prevent flicker. Modal only shows if initialization and auto-detection are complete.
        if (!selectedLocation && !modal && !isInitializing && !isAutoDetectingLocation) {
            return <LocationSelectorModal onSelectLocation={handleSelectLocation} />;
        }
        if (!modal) return null;

        switch (modal.type) {
            case 'auth': return <AuthModal onLoginSuccess={handleLoginSuccess} onVerificationNeeded={(data) => { setPendingRegistrationData(data); dispatch({type: 'OPEN_MODAL', payload: { type: 'verificationOtp', props: { verificationType: 'WhatsApp', identifier: data.phone } }})}} onShowTerms={handleShowTerms} {...modal.props} />;
            case 'verificationOtp': return <VerificationOtpModal {...modal.props} onVerified={async () => {
                if (pendingRegistrationData) {
                    try {
                        const { token, user } = await api.registerUser(pendingRegistrationData);
                        handleLoginSuccess(user, true, token);
                        setPendingRegistrationData(null);
                    } catch (error: any) {
                        console.error("Registration failed after OTP:", error);
                        // This error is re-thrown so the modal can catch it and display a message.
                        throw error;
                    }
                } else {
                    // This case should ideally not happen if the flow is correct.
                    throw new Error("Registration data was lost. Please start over.");
                }
            }} />;
            case 'locationSelector': return <LocationSelectorModal onSelectLocation={handleSelectLocation} />;
            case 'aiAssistant': return <AiAssistant onSearch={handleAiSearch} isLoading={aiSearchIsLoading} error={aiSearchError} />;
            case 'providerDetail': return <ProviderDetailModal {...modal.props} onBook={(p, type) => dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { provider: p, type } } })} />;
            case 'booking': return <BookingModal user={currentUser!} onSendRequest={handleBookingRequest} onCustomerPaymentSuccess={(bookingId) => handleUpdateBooking({id: bookingId} as Booking, { status: 'Confirmed', paymentDate: new Date() })} {...modal.props} />;
            case 'kyc': return <KycModal user={currentUser!} onKycSuccess={handleKycSuccess} {...modal.props} />;
            case 'providerRegistration': return <ProviderRegistrationModal onComplete={handleProviderRegistrationComplete} onShowTerms={handleShowTerms} {...modal.props} />;
            case 'editProviderDetails': return <ProviderRegistrationModal onComplete={async (data) => { const {provider} = await api.updateProvider(data.id!, data); dispatch({ type: 'UPDATE_PROVIDER', payload: {providerId: data.id!, updates: provider}}); dispatch({type: 'CLOSE_MODAL'}); toast.success("Profile updated!"); }} onShowTerms={handleShowTerms} isEditMode={true} initialData={providers.find(p => p.ownerId === currentUser!.id)} {...modal.props} />;
            case 'otp': return <OtpModal onVerified={() => handleUpdateBooking(modal.props.booking, { status: 'InProgress' })} {...modal.props} />;
            case 'review': return <ReviewModal user={currentUser!} onSubmit={(bookingId, review) => handleUpdateBooking({id: bookingId} as Booking, {review})} {...modal.props} />;
            case 'chatbot': return <ChatbotModal userId={currentUser!.id} {...modal.props} />;
            case 'chat': return <ChatModal currentUser={currentUser!} onSendMessage={async (bookingId, text) => { const {booking} = await api.sendMessage(bookingId, text); dispatch({type: 'UPDATE_BOOKING', payload: booking}); }} {...modal.props} />;
            case 'quotation': return <QuotationModal currentUser={currentUser!} onSendQuotation={(id, items, total) => handleUpdateBooking({id} as Booking, {quotationItems: items, totalAmount: total, quotationStatus: 'Sent'})} onRespondToQuotation={(id, res) => handleUpdateBooking({id} as Booking, {quotationStatus: res})} {...modal.props} />;
            case 'providerAcceptance': return <ProviderAcceptanceModal onConfirm={(b, r) => { handleUpdateBooking(b, { status: r === 'accept' ? 'Confirmed' : 'Cancelled' }); dispatch({ type: 'CLOSE_MODAL' }); }} {...modal.props} />;
            case 'confirmation': return <ConfirmationModal {...modal.props} />;
            case 'disclaimer': return <DisclaimerModal {...modal.props} />;
            case 'invoice': return <InvoiceModal onPayInvoiceSuccess={(id) => handleUpdateBooking({id} as Booking, {paymentDate: new Date()})} {...modal.props} />;
            case 'forgotPassword': return <ForgotPasswordModal />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow">
                {renderView()}
            </main>
            {renderModal()}
            <Footer 
              onSelectLocation={handleSelectLocation} 
              onShowTerms={handleShowTerms} 
              onGoHome={() => dispatch({ type: 'SET_VIEW', payload: AppView.HOME })}
            />
            <BackToTopButton />
        </div>
    );
};

export default App;
