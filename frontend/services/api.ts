import { ServiceCategory, Location, QuotationItem, Booking, ServiceProvider, DetailedService, User, Notification, Message, ParsedServiceRequest, JobAlert } from "../../types";
// The original `frontend/services/geminiService.ts` file should now be empty or removed as all AI logic is proxied through the backend.

const API_BASE_URL = '/api'; // Ensure this matches your backend URL

// Define the shape of the data returned from the new local hub endpoint
export interface LocalHubData {
    weather: { description: string; icon: string };
    news: { title: string; url: string; source: { name: string } }[];
    events: { title: string; url: string; date: string }[];
    historyFact: string;
}

async function fetchData<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('jwtToken'); // Retrieve token
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }), // Add token if available
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    // Handle unauthorized/forbidden access, e.g., redirect to login
    console.error('Authentication failed. Please log in again.');
    localStorage.removeItem('jwtToken');
    // Optionally trigger a logout action in your app context
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `API request failed: ${response.statusText}`);
  }
  
  // Handle 204 No Content for cases like marking notifications read
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// --- Local Hub API ---
export async function fetchLocalHubData(location: Location): Promise<LocalHubData> {
    return fetchData(`/local-hub/${location}`);
}


// --- Authentication & User API ---
export async function registerUser(userData: any): Promise<{ token: string; user: User }> {
  return fetchData('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function loginUser(credentials: any): Promise<{ token: string; user: User }> {
  return fetchData('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
    return fetchData('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

// New function to simulate sending a WhatsApp OTP
export async function sendWhatsappOtp(phone: string): Promise<{ message: string }> {
    return fetchData('/auth/send-whatsapp-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
    });
}

export async function fetchCurrentUser(): Promise<User> {
    return fetchData('/users/me');
}

export async function updateCurrentUser(userData: Partial<User>): Promise<{ message: string; user: User }> {
    return fetchData('/users/me', {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
}


// --- Provider API ---
export async function fetchAllProviders(): Promise<ServiceProvider[]> {
    return fetchData('/providers');
}

export async function searchProviders(category: ServiceCategory, location: Location): Promise<ServiceProvider[]> {
    return fetchData(`/providers/search?category=${category}&location=${location}`);
}

export async function createProvider(providerData: Omit<ServiceProvider, 'id' | 'owner' | 'ownerId' | 'rating' | 'reviewsCount' | 'reviewsList' | 'gallery' | 'availability' | 'kycVerified'> & { ownerId?: string, kraPin: string }): Promise<{ message: string; provider: ServiceProvider }> {
    return fetchData('/providers', {
        method: 'POST',
        body: JSON.stringify(providerData),
    });
}

export async function updateProvider(providerId: string, updates: Partial<ServiceProvider>): Promise<{ message: string; provider: ServiceProvider }> {
    return fetchData(`/providers/${providerId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}


// --- Booking API ---
export async function createBooking(bookingData: Omit<Booking, 'id' | 'provider' | 'customer' | 'bookingDate' | 'chatHistory' | 'review'> & { providerId: string, customerId?: string }): Promise<{ message: string; booking: Booking }> {
    return fetchData('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
    });
}

export async function fetchMyBookings(): Promise<Booking[]> {
    return fetchData('/bookings/my');
}

export async function updateBooking(bookingId: string, updates: Partial<Booking>): Promise<{ message: string; booking: Booking }> {
    return fetchData(`/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}


// --- Notification API ---
export async function createNotification(notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<{ message: string; notification: Notification }> {
    return fetchData('/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
    });
}
export async function fetchMyNotifications(): Promise<Notification[]> {
    return fetchData('/notifications/my');
}

export async function markAllNotificationsAsRead(): Promise<{ message: string }> {
    return fetchData('/notifications/mark-read', { method: 'PUT' });
}

// --- Job Alerts API ---
export async function fetchMyJobAlerts(): Promise<JobAlert[]> {
    return fetchData('/alerts/my');
}

export async function createJobAlert(alertData: { serviceCategory: ServiceCategory, location: Location }): Promise<{ message: string, alert: JobAlert }> {
    return fetchData('/alerts', {
        method: 'POST',
        body: JSON.stringify(alertData),
    });
}

export async function deleteJobAlert(alertId: string): Promise<{ message: string }> {
    return fetchData(`/alerts/${alertId}`, { method: 'DELETE' });
}

// --- AI Service API ---
export async function parseServiceRequest(query: string, coordinates: { lat: number; lon: number } | null): Promise<ParsedServiceRequest> {
    return fetchData('/ai/parse-service-request', {
        method: 'POST',
        body: JSON.stringify({ query, coordinates }),
    });
}

export async function generateProviderProfile(businessName: string, category: ServiceCategory): Promise<{ description: string; expertise: string[]; coverImageUrl: string }> {
    return fetchData('/ai/generate-provider-profile', {
        method: 'POST',
        body: JSON.stringify({ businessName, category }),
    });
}

export async function generateLogoImage(prompt: string): Promise<string> {
    const response = await fetchData<{ logoUrl: string }>('/ai/generate-logo-image', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
    return response.logoUrl;
}

export async function generateDetailedServices(category: ServiceCategory, description: string): Promise<DetailedService[]> {
    return fetchData('/ai/generate-detailed-services', {
        method: 'POST',
        body: JSON.stringify({ category, description }),
    });
}

export async function generateSearchSuggestions(category: ServiceCategory, providers: ServiceProvider[]): Promise<string[]> {
    return fetchData('/ai/generate-search-suggestions', {
        method: 'POST',
        body: JSON.stringify({ category, providers }),
    });
}

export async function decideBookingAction(booking: Booking): Promise<{ action: 'accept' | 'decline', reason: string }> {
    return fetchData('/ai/decide-booking-action', {
        method: 'POST',
        body: JSON.stringify({ booking }),
    });
}

export async function getReadableLocation(lat: number, lon: number): Promise<string | null> {
    const response = await fetchData<{ locationName: string | null }>(`/ai/get-readable-location?lat=${lat}&lon=${lon}`);
    return response.locationName;
}

export async function getCityFromCoordinates(lat: number, lon: number): Promise<Location | null> {
    const response = await fetchData<{ city: Location | null }>(`/ai/get-city-from-coordinates?lat=${lat}&lon=${lon}`);
    return response.city;
}

export async function generateQuotationItems(provider: ServiceProvider, requestDetails: string): Promise<Omit<QuotationItem, 'id'>[]> {
    return fetchData('/ai/generate-quotation-items', {
        method: 'POST',
        body: JSON.stringify({ provider, requestDetails }),
    });
}

// --- Chatbot API ---
export async function initChatbotSession(userId: string, initialMessage?: string): Promise<{ sessionId: string }> {
    return fetchData('/ai/chatbot/init', {
        method: 'POST',
        body: JSON.stringify({ userId, initialMessage }),
    });
}

export async function sendChatbotMessageStream(sessionId: string, message: string): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const token = localStorage.getItem('jwtToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(`${API_BASE_URL}/ai/chatbot/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sessionId, message }),
    });

    if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ message: 'Streaming API request failed' }));
        throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }
  
    return response.body.getReader();
}

export async function closeChatbotSession(sessionId: string): Promise<{ message: string }> {
    return fetchData('/ai/chatbot/close', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
    });
}