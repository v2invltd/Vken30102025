


export enum Location {
  NAIROBI = "Nairobi",
  MOMBASA = "Mombasa",
  NAKURU = "Nakuru",
  MACHAKOS = "Machakos",
  ELDORET = "Eldoret",
  KISUMU = "Kisumu",
}

export enum ServiceCategory {
  // Home Services
  PLUMBING = "Plumbing",
  CLEANING = "Cleaning",
  HOUSE_KEEPING = "House-Keeping",
  PAINTING = "Painting",
  SPA = "SPA",
  APPLIANCE_REPAIR = "Appliance Repair",
  GARDENING_LANDSCAPING = "Gardening & Landscaping",
  ELECTRICIAN = "Electrician",
  PEST_CONTROL = "Pest Control",
  CARPENTRY = "Carpentry",
  INTERIOR_DESIGN = "Interior Design",
  TUTORING_EDUCATION = "Tutoring & Education",
  MOBILE_GARAGE = "Mobile Garage",

  // Corporate Services (Grouped)
  FINANCIAL_SERVICES = "Financial Services",
  IT_SOLUTIONS = "IT Solutions",
  LOGISTICS = "Logistics",
  PROFESSIONAL_SERVICES = "Professional Services",

  // Kenya Tours
  WILDLIFE = "Wildlife Tours",
  BEACH_HOLIDAYS = "Beach Holidays",
  MOUNTAIN_CLIMBING = "Mountain Climbing",
}

export interface Review {
  rating: number;
  reviewText: string;
  author: string;
  date: string; // ISO 8601 format
}

export interface GalleryMedia {
    type: 'image' | 'video';
    url: string;
    thumbnailUrl: string;
    description?: string;
}

export interface DetailedService {
    id?: string; // Made optional as AI generation might not provide it
    name: string;
    description: string;
    price?: string; // e.g., "KES 5,000" or "Starting from KES 1,200"
}

export interface ServiceProvider {
  id: string;
  ownerId: string; // The ID of the User who owns this provider profile
  name: string;
  category: ServiceCategory;
  locations: Location[];
  rating: number;
  reviewsCount: number;
  description: string;
  hourlyRate: number;
  logoUrl?: string;
  coverImageUrl?: string;
  expertise?: string[];
  reviewsList?: Review[];
  gallery?: GalleryMedia[];
  detailedServices?: DetailedService[];
  availability?: Record<string, 'available' | 'unavailable' | 'booked'>; // Key is 'YYYY-MM-DD'
  aiAutoAcceptEnabled?: boolean;
  kycVerified: boolean;
  coordinates?: { lat: number; lon: number; };
  allowsInstantBooking?: boolean;
  // New fields for blacklisting policy
  isBlacklisted?: boolean;
  blacklistEndDate?: Date | string | null;
  rejectionHistory?: any[];
}

export enum UserRole {
    CUSTOMER = "Customer",
    PROVIDER = "Provider",
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    nationalId?: string;
    // Provider specific
    businessName?: string;
    businessRegNo?: string;
    idDocument?: File | null;
    kraPin?: string;
    kraPinCertificate?: File | null;
    policeClearanceCertificate?: File | null;
    kycVerified: boolean;
}

export interface Message {
  senderId: string;
  text: string;
  timestamp: Date | string;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Booking {
    id: string;
    provider: ServiceProvider;
    customer: User;
    bookingDate: Date | string;
    serviceDate: Date | string;
    dueDate?: Date | string;
    paymentDate?: Date | string;
    status: 'Pending Provider Confirmation' | 'Pending Customer Confirmation' | 'Confirmed' | 'InProgress' | 'Completed' | 'Cancelled';
    otp: string;
    review?: Review;
    chatHistory?: Message[];
    quotationItems?: QuotationItem[];
    quotationStatus?: 'Draft' | 'Sent' | 'Accepted' | 'Declined';
    totalAmount?: number;
    requestDetails?: string;
    bookingType: 'quote' | 'instant';
}

export interface Notification {
  id: string;
  userId: string; // The ID of the user who should see this notification
  message: string;
  timestamp: Date | string;
  read: boolean;
  bookingId?: string; // To link the notification to a specific booking, now optional
}

export interface JobAlert {
  id: string;
  userId: string;
  serviceCategory: ServiceCategory;
  location: Location;
  createdAt: Date | string;
}

// FIX: Moved NewProviderData here from App.tsx to resolve circular dependency
export interface NewProviderData {
  businessName: string;
  businessRegNo?: string;
  kraPin: string;
  kraPinCertificate: File;
  policeClearanceCertificate: File;
  category: ServiceCategory;
  locations: Location[];
  hourlyRate: number;
  description: string;
  expertise: string[];
  logoUrl: string;
  coverImageUrl: string;
  detailedServices?: DetailedService[];
  latitude: number;
  longitude: number;
}

export interface ParsedServiceRequest {
  serviceCategory: ServiceCategory | null;
  location: Location | null;
  error?: string;
  groundingChunks?: any[];
}

export type LegalDocType = 'customer' | 'provider' | 'privacy';