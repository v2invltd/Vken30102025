// This file is the JavaScript equivalent of the `types.ts` file in the root directory.
// It's used by the Node.js backend to ensure data consistency.

const Location = {
  NAIROBI: "Nairobi",
  MOMBASA: "Mombasa",
  NAKURU: "Nakuru",
  MACHAKOS: "Machakos",
  ELDORET: "Eldoret",
  KISUMU: "Kisumu",
  THIKA: "Thika",
  KIAMBU: "Kiambu",
  NYERI: "Nyeri",
  MERU: "Meru",
};

const ServiceCategory = {
  PLUMBING: "Plumbing",
  CLEANING: "Cleaning",
  HOUSE_KEEPING: "House-Keeping",
  PAINTING: "Painting",
  SPA: "SPA",
  APPLIANCE_REPAIR: "Appliance Repair",
  GARDENING_LANDSCAPING: "Gardening & Landscaping",
  ELECTRICIAN: "Electrician",
  PEST_CONTROL: "Pest Control",
  CARPENTRY: "Carpentry",
  INTERIOR_DESIGN: "Interior Design",
  TUTORING_EDUCATION: "Tutoring & Education",
  MOBILE_GARAGE: "Mobile Garage",
  FINANCIAL_SERVICES: "Financial Services",
  IT_SOLUTIONS: "IT Solutions",
  LOGISTICS: "Logistics",
  PROFESSIONAL_SERVICES: "Professional Services",
  WILDLIFE: "Wildlife Tours",
  BEACH_HOLIDAYS: "Beach Holidays",
  MOUNTAIN_CLIMBING: "Mountain Climbing",
};

const UserRole = {
    CUSTOMER: "Customer",
    PROVIDER: "Provider",
};

// Backend Prisma Enum keys (UPPERCASE_SNAKE_CASE) mapped to Frontend string values
const BookingStatus = {
    PENDING_PROVIDER_CONFIRMATION: 'Pending Provider Confirmation',
    PENDING_CUSTOMER_CONFIRMATION: 'Pending Customer Confirmation',
    CONFIRMED: 'Confirmed',
    INPROGRESS: 'InProgress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};

const QuotationStatus = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    ACCEPTED: 'Accepted',
    DECLINED: 'Declined'
};


const BookingType = {
    QUOTE: 'quote',
    INSTANT: 'instant'
};

module.exports = {
  Location,
  ServiceCategory,
  UserRole,
  BookingStatus,
  QuotationStatus,
  BookingType,
  LOCATIONS: Object.values(Location),
  SERVICE_CATEGORIES: Object.values(ServiceCategory),
};