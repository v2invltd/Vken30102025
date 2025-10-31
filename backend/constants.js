// This file is the JavaScript equivalent of the `constants.ts` file in the root directory.
// It's used by the Node.js backend.

const Location = {
  NAIROBI: "Nairobi",
  MOMBASA: "Mombasa",
  NAKURU: "Nakuru",
  MACHAKOS: "Machakos",
  ELDORET: "Eldoret",
  KISUMU: "Kisumu",
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

const LOCATIONS = Object.values(Location);
const SERVICE_CATEGORIES = Object.values(ServiceCategory);

module.exports = {
  Location,
  ServiceCategory,
  LOCATIONS,
  SERVICE_CATEGORIES,
};