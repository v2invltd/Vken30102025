

import { ServiceProvider, Location, ServiceCategory, DetailedService } from './types';

export const LOCATIONS: Location[] = Object.values(Location);
export const SERVICE_CATEGORIES: ServiceCategory[] = Object.values(ServiceCategory);

export const LOCATION_IMAGES: { [key in Location]: string } = {
    [Location.NAIROBI]: 'https://images.pexels.com/photos/3976537/pexels-photo-3976537.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.MOMBASA]: 'https://images.pexels.com/photos/1078981/pexels-photo-1078981.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.KISUMU]: 'https://images.pexels.com/photos/8640755/pexels-photo-8640755.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1&fit=crop',
    [Location.NAKURU]: 'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.ELDORET]: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.MACHAKOS]: 'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.THIKA]: 'https://images.pexels.com/photos/450441/pexels-photo-450441.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.KIAMBU]: 'https://images.pexels.com/photos/931007/pexels-photo-931007.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1&fit=crop',
    [Location.NYERI]: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.MERU]: 'https://images.pexels.com/photos/326900/pexels-photo-326900.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
};

export const LOCATION_COORDINATES: { [key in Location]: { lat: number; lon: number } } = {
    [Location.NAIROBI]: { lat: -1.2921, lon: 36.8219 },
    [Location.MOMBASA]: { lat: -4.0435, lon: 39.6682 },
    [Location.KISUMU]: { lat: -0.0917, lon: 34.7680 },
    [Location.NAKURU]: { lat: -0.3031, lon: 36.0800 },
    [Location.ELDORET]: { lat: 0.5143, lon: 35.2698 },
    [Location.MACHAKOS]: { lat: -1.5182, lon: 37.2642 },
    [Location.THIKA]: { lat: -1.0478, lon: 37.0725 },
    [Location.KIAMBU]: { lat: -1.1714, lon: 36.8322 },
    [Location.NYERI]: { lat: -0.4223, lon: 36.9492 },
    [Location.MERU]: { lat: 0.0471, lon: 37.6498 },
};

export const KENYA_BOUNDS = {
    minLat: -5.0,
    maxLat: 5.0,
    minLon: 34.0,
    maxLon: 42.0
};


export const HERO_IMAGES: { [key in Location]: string } = {
    [Location.NAIROBI]: 'https://images.pexels.com/photos/169976/pexels-photo-169976.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.MOMBASA]: 'https://images.pexels.com/photos/1174732/pexels-photo-1174732.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.KISUMU]: 'https://images.pexels.com/photos/13687353/pexels-photo-13687353.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1&fit=crop',
    [Location.NAKURU]: 'https://images.pexels.com/photos/247348/pexels-photo-247348.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.ELDORET]: 'https://images.pexels.com/photos/2104152/pexels-photo-2104152.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.MACHAKOS]: 'https://images.pexels.com/photos/589808/pexels-photo-589808.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.THIKA]: 'https://images.pexels.com/photos/1612461/pexels-photo-1612461.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.KIAMBU]: 'https://images.pexels.com/photos/2085739/pexels-photo-2085739.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1&fit=crop',
    [Location.NYERI]: 'https://images.pexels.com/photos/2440024/pexels-photo-2440024.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.MERU]: 'https://images.pexels.com/photos/53961/elephant-africanelephant-animal-young-53961.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
};

export const HOME_SERVICES: ServiceCategory[] = [
    ServiceCategory.PLUMBING,
    ServiceCategory.CLEANING,
    ServiceCategory.HOUSE_KEEPING,
    ServiceCategory.PAINTING,
    ServiceCategory.SPA,
    ServiceCategory.APPLIANCE_REPAIR,
    ServiceCategory.GARDENING_LANDSCAPING,
    ServiceCategory.ELECTRICIAN,
    ServiceCategory.PEST_CONTROL,
    ServiceCategory.CARPENTRY,
    ServiceCategory.INTERIOR_DESIGN,
    ServiceCategory.TUTORING_EDUCATION,
    ServiceCategory.MOBILE_GARAGE
];

export const CORPORATE_SERVICES: ServiceCategory[] = [
    ServiceCategory.FINANCIAL_SERVICES,
    ServiceCategory.IT_SOLUTIONS,
    ServiceCategory.LOGISTICS,
    ServiceCategory.PROFESSIONAL_SERVICES,
    ServiceCategory.EVENT_PLANNING,
    ServiceCategory.PHOTOGRAPHY,
    ServiceCategory.CATERING,
];

export const TOUR_SERVICES: ServiceCategory[] = [
    ServiceCategory.WILDLIFE,
    ServiceCategory.BEACH_HOLIDAYS,
    ServiceCategory.MOUNTAIN_CLIMBING,
    ServiceCategory.SAFARI_ADVENTURES,
    ServiceCategory.CULTURAL_TOURS,
    ServiceCategory.CITY_DAY_TRIPS,
];

export const PROVIDER_REGISTRABLE_CATEGORIES = [...HOME_SERVICES, ...CORPORATE_SERVICES, ...TOUR_SERVICES];

export const SERVICE_CATEGORY_DETAILS: { [key in ServiceCategory]?: { title: string; description: string; services: string[] } } = {
    // Home Services
    [ServiceCategory.PLUMBING]: { title: 'Plumbing', description: 'Expert solutions for leaks, blockages, and installations.', services: ['Leak Repair', 'Drain Unblocking', 'Geyser Installation'] },
    [ServiceCategory.CLEANING]: { title: 'Cleaning', description: 'Professional home and office cleaning services.', services: ['Deep Cleaning', 'Office Cleaning', 'Post-Construction'] },
    [ServiceCategory.HOUSE_KEEPING]: { title: 'House-Keeping', description: 'Reliable staff for daily chores and home management.', services: ['Daily Tidying', 'Laundry Services', 'Meal Preparation'] },
    [ServiceCategory.PAINTING]: { title: 'Painting', description: 'Quality interior and exterior painting for any property.', services: ['Interior Walls', 'Exterior Facades', 'Special Finishes'] },
    [ServiceCategory.SPA]: { title: 'SPA & Wellness', description: 'Relaxing spa and wellness treatments at your home.', services: ['Massages', 'Manicures/Pedicures', 'Facials', 'Waxing'] },
    [ServiceCategory.APPLIANCE_REPAIR]: { title: 'Appliance Repair', description: 'Fixing all major home appliances quickly and efficiently.', services: ['Washing Machines', 'Refrigerators', 'Cookers & Ovens'] },
    [ServiceCategory.GARDENING_LANDSCAPING]: { title: 'Gardening & Landscaping', description: 'Create and maintain your perfect garden.', services: ['Lawn Mowing', 'Garden Design', 'Tree Trimming'] },
    [ServiceCategory.ELECTRICIAN]: { title: 'Electrician', description: 'Certified electricians for wiring, fixtures, and repairs.', services: ['Wiring & Rewiring', 'Fixture Installation', 'Fault Diagnosis'] },
    [ServiceCategory.PEST_CONTROL]: { title: 'Pest Control', description: 'Effective and safe solutions for all pest problems.', services: ['Fumigation', 'Rodent Control', 'Termite Treatment'] },
    [ServiceCategory.CARPENTRY]: { title: 'Carpentry', description: 'Custom furniture, repairs, and installations.', services: ['Custom Cabinets', 'Door & Window Frames', 'Furniture Repair'] },
    [ServiceCategory.INTERIOR_DESIGN]: { title: 'Interior Design', description: 'Transform your space with professional design services.', services: ['Space Planning', 'Color Consultation', 'Furniture Sourcing'] },
    [ServiceCategory.TUTORING_EDUCATION]: { title: 'Tutoring & Education', description: 'Personalized tutoring for all subjects and levels.', services: ['Math & Sciences', 'Languages', 'Test Preparation'] },
    [ServiceCategory.MOBILE_GARAGE]: { title: 'Mobile Garage', description: 'Convenient car repair and maintenance at your location.', services: ['Minor Service', 'Brake Repair', 'Battery Replacement'] },

    // Corporate Services
    [ServiceCategory.FINANCIAL_SERVICES]: { title: 'Financial Services', description: 'Expert financial advice and services for businesses.', services: ['Bookkeeping', 'Tax Consultation', 'Business Audits'] },
    [ServiceCategory.IT_SOLUTIONS]: { title: 'IT Solutions', description: 'Comprehensive IT support, networking, and security.', services: ['Network Setup', 'Cybersecurity', 'Cloud Services', 'Hardware Solutions'] },
    [ServiceCategory.LOGISTICS]: { title: 'Logistics', description: 'Efficient moving, delivery, and supply chain solutions.', services: ['Office Relocation', 'Package Delivery', 'Warehousing'] },
    [ServiceCategory.PROFESSIONAL_SERVICES]: { title: 'Professional Services', description: 'Legal, HR, and consulting services for your company.', services: ['Legal Advisory', 'HR Outsourcing', 'Business Consulting'] },
    [ServiceCategory.EVENT_PLANNING]: { title: 'Event Planning', description: 'Professional planning for corporate events, conferences, and parties.', services: ['Venue Sourcing', 'Logistics Management', 'Budget Planning'] },
    [ServiceCategory.PHOTOGRAPHY]: { title: 'Photography', description: 'Corporate, event, and product photography services.', services: ['Event Coverage', 'Product Shoots', 'Headshots'] },
    [ServiceCategory.CATERING]: { title: 'Catering', description: 'Delicious and reliable catering for any corporate occasion.', services: ['Buffet Services', 'Office Lunches', 'Event Catering'] },

    // Kenya Tours (Generic details)
    [ServiceCategory.WILDLIFE]: { title: 'Wildlife Tours', description: 'Witness Kenya\'s iconic wildlife in their natural habitats.', services: ['Game Drives', 'Bird Watching', 'Nature Walks'] },
    [ServiceCategory.BEACH_HOLIDAYS]: { title: 'Beach Holidays', description: 'Relax and unwind on the stunning beaches of the Kenyan coast.', services: ['Sunbathing & Swimming', 'Water Sports', 'Coastal Cuisine'] },
    [ServiceCategory.MOUNTAIN_CLIMBING]: { title: 'Mountain Climbing', description: 'Challenge yourself with treks up Kenya\'s majestic mountains.', services: ['Mt. Kenya Treks', 'Mt. Longonot Hikes', 'Aberdare Ranges'] },
    [ServiceCategory.SAFARI_ADVENTURES]: { title: 'Safari Adventures', description: 'Book incredible safari trips to Kenya\'s famous national parks.', services: ['Maasai Mara', 'Amboseli', 'Tsavo East/West'] },
    [ServiceCategory.CULTURAL_TOURS]: { title: 'Cultural Tours', description: 'Experience the rich culture and traditions of Kenyan communities.', services: ['Village Visits', 'Cultural Festivals', 'Historical Sites'] },
    [ServiceCategory.CITY_DAY_TRIPS]: { title: 'City Day Trips', description: 'Explore the highlights of Kenya\'s major cities with a local guide.', services: ['Nairobi City Tour', 'Mombasa Old Town', 'Kisumu Lakeside'] },
};

// Location-specific tour details
export const LOCATION_SPECIFIC_TOUR_DETAILS: { [key in Location]?: Partial<typeof SERVICE_CATEGORY_DETAILS> } = {
    [Location.NAIROBI]: {
        [ServiceCategory.WILDLIFE]: { title: 'Nairobi Park Safari', description: 'Explore wildlife right at the city\'s doorstep.', services: ['Nairobi National Park', 'Giraffe Centre', 'Sheldrick Trust'] },
        [ServiceCategory.CITY_DAY_TRIPS]: { title: 'Nairobi City Trips', description: 'Explore the highlights of Kenya\'s capital city.', services: ['City Market Tour', 'National Museum Visit', 'Karen Blixen Museum'] },
    },
    [Location.MOMBASA]: {
        [ServiceCategory.BEACH_HOLIDAYS]: { title: 'Coastal Escapes', description: 'Relax on pristine beaches and explore marine life.', services: ['Diani Beach Day Trip', 'Wasini Island Snorkeling', 'Old Town Tour'] },
    },
    [Location.NAKURU]: {
        [ServiceCategory.WILDLIFE]: { title: 'Rift Valley Wonders', description: 'Witness flamingos and rhinos in their natural habitat.', services: ['Lake Nakuru Park Drive', 'Hell\'s Gate Biking', 'Lake Naivasha Boat Ride'] },
    },
    [Location.NYERI]: {
        [ServiceCategory.MOUNTAIN_CLIMBING]: { title: 'Aberdare & Mt. Kenya', description: 'Hike through scenic highlands and dense forests.', services: ['Aberdare Ranges Trek', 'Mt. Kenya Day Hike', 'Treetops Lodge Visit'] },
    },
    [Location.MERU]: {
        [ServiceCategory.WILDLIFE]: { title: 'Meru Park Exploration', description: 'Discover the diverse landscapes and wildlife of Meru.', services: ['Full Day Game Drive', 'Rhino Sanctuary Visit', 'Adamson\'s Falls Trip'] },
    },
};