import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import { User, Location, ServiceCategory, ServiceProvider, Booking, Message, Notification, JobAlert } from '../types';

// Define the different views of the application
export enum AppView {
    HOME,
    SEARCH,
    MY_BOOKINGS,
    PROFILE,
    PROVIDER_DASHBOARD,
    LOCAL_HUB,
}

// Define the shape of the modal state
export interface ModalState {
    type: 
      | 'auth' 
      | 'booking' 
      | 'providerDetail' 
      | 'aiAssistant' 
      | 'kyc'
      | 'otp'
      | 'review'
      | 'providerRegistration'
      | 'editProviderDetails'
      | 'chatbot'
      | 'chat'
      | 'quotation'
      | 'providerAcceptance'
      | 'confirmation'
      | 'disclaimer'
      | 'invoice'
      | 'locationSelector'
      | 'forgotPassword'; // Added for the new modal
    props?: any;
}

// Define the shape of the application's state
interface AppState {
    currentUser: User | null;
    selectedLocation: Location | null; // Changed to allow null initially
    providers: ServiceProvider[];
    bookings: Booking[];
    searchResults: ServiceProvider[];
    favoriteProviderIds: string[];
    activeSearchCategory: ServiceCategory | null;
    view: AppView;
    modal: ModalState | null;
    notifications: Notification[];
    jobAlerts: JobAlert[];
    postLoginAction: (() => void) | null;
    userCoordinates: { lat: number; lon: number } | null;
    searchGroundingSources: any[] | null;
    isSearchResultsLoading: boolean;
    isInitialProvidersLoaded: boolean;
    isInitializing: boolean;
}

// Define the actions that can be dispatched
type Action =
    | { type: 'LOGIN'; payload: User }
    | { type: 'LOGOUT' }
    | { type: 'UPDATE_USER'; payload: Partial<User> }
    | { type: 'SET_LOCATION'; payload: Location }
    | { type: 'SET_VIEW'; payload: AppView }
    | { type: 'SET_PROVIDERS'; payload: ServiceProvider[] }
    | { type: 'UPDATE_PROVIDER'; payload: { providerId: string, updates: Partial<ServiceProvider> } }
    | { type: 'ADD_PROVIDER'; payload: ServiceProvider }
    | { type: 'SET_SEARCH_RESULTS'; payload: ServiceProvider[] }
    | { type: 'SET_ACTIVE_SEARCH_CATEGORY'; payload: ServiceCategory | null }
    | { type: 'TOGGLE_FAVORITE'; payload: string }
    | { type: 'OPEN_MODAL'; payload: ModalState }
    | { type: 'CLOSE_MODAL' }
    | { type: 'SET_POST_LOGIN_ACTION'; payload: (() => void) | null }
    | { type: 'ADD_BOOKING'; payload: Booking }
    | { type: 'SET_BOOKINGS'; payload: Booking[] }
    | { type: 'UPDATE_BOOKING'; payload: Booking }
    | { type: 'ADD_MESSAGE_TO_CHAT'; payload: { bookingId: string, message: Message } }
    | { type: 'ADD_NOTIFICATION'; payload: Notification }
    | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
    | { type: 'MARK_ALL_NOTIFICATIONS_AS_READ'; payload: { userId: string } }
    | { type: 'SET_JOB_ALERTS'; payload: JobAlert[] }
    | { type: 'ADD_JOB_ALERT'; payload: JobAlert }
    | { type: 'DELETE_JOB_ALERT'; payload: string }
    | { type: 'SET_USER_COORDINATES'; payload: { lat: number; lon: number } }
    | { type: 'SET_SEARCH_GROUNDING_SOURCES'; payload: any[] | null }
    | { type: 'SET_SEARCH_LOADING_STATUS'; payload: boolean }
    | { type: 'SET_INITIAL_PROVIDERS_LOADED'; payload: boolean }
    | { type: 'SET_INITIALIZING'; payload: boolean };

// Initial state of the application
const initialState: AppState = {
    currentUser: null,
    selectedLocation: null, // Start with null location
    providers: [],
    bookings: [],
    searchResults: [],
    favoriteProviderIds: [],
    activeSearchCategory: null,
    view: AppView.HOME,
    modal: null,
    notifications: [],
    jobAlerts: [],
    postLoginAction: null,
    userCoordinates: null,
    searchGroundingSources: null,
    isSearchResultsLoading: false,
    isInitialProvidersLoaded: false,
    isInitializing: true,
};

// The reducer function to handle state updates
const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'LOGIN':
            return { ...state, currentUser: action.payload };
        case 'LOGOUT':
            // Reset parts of the state on logout for a clean slate
            return { 
                ...state, 
                currentUser: null, 
                view: AppView.HOME, 
                bookings: [], 
                favoriteProviderIds: [],
                notifications: [],
            };
        case 'UPDATE_USER':
            if (!state.currentUser) return state;
            return { ...state, currentUser: { ...state.currentUser, ...action.payload } };
        case 'SET_LOCATION':
            // When location is set, default back to home view unless staying in the hub
            const nextView = state.view === AppView.LOCAL_HUB ? AppView.LOCAL_HUB : AppView.HOME;
            return { ...state, selectedLocation: action.payload, view: nextView };
        case 'SET_VIEW':
            return { ...state, view: action.payload };
        case 'SET_PROVIDERS':
            return { ...state, providers: action.payload };
        case 'UPDATE_PROVIDER': {
            const updatedProviders = state.providers.map(p =>
                p.id === action.payload.providerId ? { ...p, ...action.payload.updates } : p
            );
            const updatedSearchResults = state.searchResults.map(p =>
                p.id === action.payload.providerId ? { ...p, ...action.payload.updates } : p
            );
            return { ...state, providers: updatedProviders, searchResults: updatedSearchResults };
        }
        case 'ADD_PROVIDER':
            return { ...state, providers: [...state.providers, action.payload] };
        case 'SET_SEARCH_RESULTS':
            return { ...state, searchResults: action.payload, searchGroundingSources: null };
        case 'SET_ACTIVE_SEARCH_CATEGORY':
            return { ...state, activeSearchCategory: action.payload };
        case 'TOGGLE_FAVORITE':
            const isFavorite = state.favoriteProviderIds.includes(action.payload);
            return {
                ...state,
                favoriteProviderIds: isFavorite
                    ? state.favoriteProviderIds.filter(id => id !== action.payload)
                    : [...state.favoriteProviderIds, action.payload],
            };
        case 'OPEN_MODAL':
            return { ...state, modal: action.payload };
        case 'CLOSE_MODAL':
            return { ...state, modal: null };
        case 'SET_POST_LOGIN_ACTION':
            return { ...state, postLoginAction: action.payload };
        case 'ADD_BOOKING':
            return { ...state, bookings: [...state.bookings, action.payload] };
        case 'SET_BOOKINGS':
            return { ...state, bookings: action.payload };
        case 'UPDATE_BOOKING':
            return {
                ...state,
                bookings: state.bookings.map(b => b.id === action.payload.id ? action.payload : b),
            };
        case 'ADD_MESSAGE_TO_CHAT':
            return {
                ...state,
                bookings: state.bookings.map(b =>
                    b.id === action.payload.bookingId
                        ? { ...b, chatHistory: [...(b.chatHistory || []), action.payload.message] }
                        : b
                ),
            };
        case 'ADD_NOTIFICATION':
            return { ...state, notifications: [action.payload, ...state.notifications] };
        case 'SET_NOTIFICATIONS':
            return { ...state, notifications: action.payload };
        case 'MARK_ALL_NOTIFICATIONS_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(n =>
                    n.userId === action.payload.userId ? { ...n, read: true } : n
                ),
            };
        case 'SET_JOB_ALERTS':
            return { ...state, jobAlerts: action.payload };
        case 'ADD_JOB_ALERT':
            return { ...state, jobAlerts: [action.payload, ...state.jobAlerts] };
        case 'DELETE_JOB_ALERT':
            return { ...state, jobAlerts: state.jobAlerts.filter(alert => alert.id !== action.payload) };
        case 'SET_USER_COORDINATES':
            return { ...state, userCoordinates: action.payload };
        case 'SET_SEARCH_GROUNDING_SOURCES':
            return { ...state, searchGroundingSources: action.payload };
        case 'SET_SEARCH_LOADING_STATUS':
            return { ...state, isSearchResultsLoading: action.payload };
        case 'SET_INITIAL_PROVIDERS_LOADED':
            return { ...state, isInitialProvidersLoaded: action.payload };
        case 'SET_INITIALIZING':
            return { ...state, isInitializing: action.payload };
        default:
            return state;
    }
};

// Create the context
const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined);

// Create the provider component
export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook to use the context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};