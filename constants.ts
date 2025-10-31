import { ServiceProvider, Location, ServiceCategory } from './types';

export const LOCATIONS: Location[] = Object.values(Location);
export const SERVICE_CATEGORIES: ServiceCategory[] = Object.values(ServiceCategory);

export const LOCATION_IMAGES: { [key in Location]: string } = {
    [Location.NAIROBI]: 'https://images.pexels.com/photos/3976537/pexels-photo-3976537.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.MOMBASA]: 'https://images.pexels.com/photos/1078981/pexels-photo-1078981.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.KISUMU]: 'https://images.pexels.com/photos/8640755/pexels-photo-8640755.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1&fit=crop',
    [Location.NAKURU]: 'https://images.pexels.com/photos/235648/pexels-photo-235648.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.ELDORET]: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.MACHAKOS]: 'https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.THIKA]: 'https://images.pexels.com/photos/450441/pexels-photo-450441.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.KIAMBU]: 'https://images.pexels.com/photos/266004/pexels-photo-266004.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.NYERI]: 'https://images.pexels.com/photos/1671325/pexels-photo-1671325.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.MERU]: 'https://images.pexels.com/photos/1049626/pexels-photo-1049626.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.WESTLANDS]: 'https://images.pexels.com/photos/169976/pexels-photo-169976.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.KILIMANI]: 'https://images.pexels.com/photos/731082/pexels-photo-731082.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    [Location.KAREN]: 'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
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
    [Location.WESTLANDS]: { lat: -1.2647, lon: 36.8020 },
    [Location.KILIMANI]: { lat: -1.2965, lon: 36.7849 },
    [Location.KAREN]: { lat: -1.3213, lon: 36.7067 },
};

export const KENYA_BOUNDS = {
    minLat: -5.0,
    maxLat: 5.0,
    minLon: 34.0,
    maxLon: 42.0
};


export const HERO_IMAGES: { [key in Location]: string } = {
    [Location.NAIROBI]: 'https://images.pexels.com/photos/169976/pexels-photo-169976.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.MOMBASA]: 'https://images.pexels.com/photos/10185960/pexels-photo-10185960.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.KISUMU]: 'https://images.pexels.com/photos/13598375/pexels-photo-13598375.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.NAKURU]: 'https://images.pexels.com/photos/1671324/pexels-photo-1671324.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.ELDORET]: 'https://images.pexels.com/photos/259963/pexels-photo-259963.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.MACHAKOS]: 'https://images.pexels.com/photos/3225528/pexels-photo-3225528.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    // New hero images
    [Location.THIKA]: 'https://images.pexels.com/photos/1388056/pexels-photo-1388056.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.KIAMBU]: 'https://images.pexels.com/photos/2440471/pexels-photo-2440471.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.NYERI]: 'https://images.pexels.com/photos/210307/pexels-photo-210307.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.MERU]: 'https://images.pexels.com/photos/709552/pexels-photo-709552.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.WESTLANDS]: 'https://images.pexels.com/photos/3585093/pexels-photo-3585093.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.KILIMANI]: 'https://images.pexels.com/photos/3935320/pexels-photo-3935320.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
    [Location.KAREN]: 'https://images.pexels.com/photos/189333/pexels-photo-189333.jpeg?auto=compress&cs=tinysrgb&w=1600&h=800&dpr=1',
};


export const HOME_SERVICES: ServiceCategory[] = [
    ServiceCategory.PLUMBING,
    ServiceCategory.CLEANING,
    ServiceCategory.HOUSE_KEEPING,
    ServiceCategory.PAINTING,
    ServiceCategory.APPLIANCE_REPAIR,
    ServiceCategory.ELECTRICIAN,
    ServiceCategory.GARDENING_LANDSCAPING,
    ServiceCategory.PEST_CONTROL,
    ServiceCategory.CARPENTRY,
    ServiceCategory.INTERIOR_DESIGN,
    ServiceCategory.LOGISTICS,
    ServiceCategory.SPA,
    ServiceCategory.TUTORING_EDUCATION,
    ServiceCategory.MOBILE_GARAGE,
];

export const CORPORATE_SERVICES: ServiceCategory[] = [
    ServiceCategory.FINANCIAL_SERVICES,
    ServiceCategory.IT_SOLUTIONS,
    ServiceCategory.PROFESSIONAL_SERVICES,
    ServiceCategory.LOGISTICS,
    ServiceCategory.MOBILE_GARAGE,
];

export const TOUR_SERVICES: ServiceCategory[] = [
    ServiceCategory.WILDLIFE,
    ServiceCategory.BEACH_HOLIDAYS,
    ServiceCategory.MOUNTAIN_CLIMBING,
];

// Combine all categories for the registration dropdown, ensuring no duplicates.
export const PROVIDER_REGISTRABLE_CATEGORIES: ServiceCategory[] = [...new Set([
    ...HOME_SERVICES,
    ...CORPORATE_SERVICES,
    ...TOUR_SERVICES
])];


type ServiceDetails = { title: string; description: string; services: string[] };

export const SERVICE_CATEGORY_DETAILS: Record<ServiceCategory, ServiceDetails | undefined> = {
    [ServiceCategory.PLUMBING]: {
        title: "Plumbing",
        description: "Expert solutions for all your plumbing needs, from minor leaks to major installations.",
        services: ["Leaky Faucet Repair", "Drain Cleaning", "Toilet Repair & Installation", "Water Heater Services"]
    },
    [ServiceCategory.CLEANING]: {
        title: "Cleaning",
        description: "Professional and thorough cleaning services for a spotless home or office.",
        services: ["Deep House Cleaning", "Office Cleaning", "Post-Construction Cleanup", "Move-in/Move-out Cleaning"]
    },
    [ServiceCategory.HOUSE_KEEPING]: {
        title: "House-Keeping",
        description: "Reliable and regular housekeeping to keep your home tidy and organized.",
        services: ["Regular Home Maintenance", "Laundry & Ironing", "Meal Preparation", "Organizing & Tidying"]
    },
    [ServiceCategory.PAINTING]: {
        title: "Painting",
        description: "Transform your space with our professional interior and exterior painting services.",
        services: ["Interior & Exterior Painting", "Decorative Finishes", "Wood Staining", "Color Consultation"]
    },
    [ServiceCategory.SPA]: {
        title: "SPA",
        description: "Indulge in a relaxing spa experience brought directly to your home.",
        services: ["At-Home Massage", "Manicures & Pedicures", "Facials & Skin Care", "Aromatherapy"]
    },
    [ServiceCategory.APPLIANCE_REPAIR]: {
        title: "Appliance Repair",
        description: "Fast and effective repair services for all your major household appliances.",
        services: ["Refrigerator Repair", "Washing Machine Service", "Oven & Cooktop Repair", "Microwave Fixes"]
    },
    [ServiceCategory.GARDENING_LANDSCAPING]: {
        title: "Gardening & Landscaping",
        description: "Create and maintain your perfect outdoor space with professional gardening services.",
        services: ["Lawn Mowing & Maintenance", "Garden Design", "Hedge Trimming", "Tree Planting"]
    },
    [ServiceCategory.ELECTRICIAN]: {
        title: "Electrician",
        description: "Safe and certified electrical services for installations, repairs, and safety checks.",
        services: ["Wiring & Rewiring", "Fixture Installation", "Circuit Breaker Repair", "Electrical Safety Audits"]
    },
    [ServiceCategory.PEST_CONTROL]: {
        title: "Pest Control",
        description: "Effective solutions to eliminate pests and prevent future infestations.",
        services: ["Rodent Control", "Insect Extermination", "Termite Treatment", "Fumigation Services"]
    },
    [ServiceCategory.CARPENTRY]: {
        title: "Carpentry",
        description: "Custom woodwork, furniture repair, and installation services by skilled carpenters.",
        services: ["Custom Shelving", "Furniture Assembly & Repair", "Door & Window Frames", "Cabinet Making"]
    },
    [ServiceCategory.INTERIOR_DESIGN]: {
        title: "Interior Design",
        description: "Personalized interior design services to bring your vision for your home to life.",
        services: ["Space Planning & Layout", "Color Consultation", "Furniture Sourcing", "Decor & Styling"]
    },
    [ServiceCategory.TUTORING_EDUCATION]: {
        title: "Tutoring & Education",
        description: "Professional online and in-person tutoring for various levels and professional certifications.",
        services: ["Primary & Secondary Tuition (up to Form 6)", "ACCA Exam Preparation", "CPA Exam Preparation", "Personalized Study Plans"]
    },
    [ServiceCategory.MOBILE_GARAGE]: {
        title: "Mobile Garage",
        description: "Convenient on-site vehicle maintenance and repair services at your home or office.",
        services: ["On-site Car Service", "Battery Replacement", "Tire Change & Repair", "Car Wash", "Emergency Breakdown Assistance"]
    },
    [ServiceCategory.FINANCIAL_SERVICES]: {
        title: "Financial Services",
        description: "Comprehensive financial solutions for your business, including bookkeeping, payroll, MIS reporting, financial statement preparation, and strategic modelling.",
        services: [
            "Bookkeeping & Accounting", 
            "Payroll Management", 
            "KRA Statutory Submissions", 
            "Financial Modeling", // Updated from "Financial Modelling & Analysis"
            "Budgeting", 
            "Tax Planning", 
            "Financial Advisory", 
            "Cash Flow Management and Projection", // Added
            "Compliances", // Added
            "Audit Support", // Added
            "MIS Reporting", // Kept
            "Financial Statement Preparation", // Kept
        ]
    },
    [ServiceCategory.IT_SOLUTIONS]: {
        title: "IT Solutions",
        description: "Power your business with our expert IT and web services, including support, web development, digital marketing, and domain management.",
        services: ["IT Support & Troubleshooting", "Web & App Development", "Digital Marketing & SEO", "Domain & Hosting Services"]
    },
    [ServiceCategory.LOGISTICS]: {
        title: "Logistics",
        description: "Reliable and efficient moving, packing, and delivery services for both personal and corporate needs.",
        services: ["Movers & Packers", "Local & Long-distance Moving", "Package Pick-up & & Delivery", "Corporate Courier Services"]
    },
    [ServiceCategory.PROFESSIONAL_SERVICES]: {
        title: "Professional Services",
        description: "Expert consulting to enhance your business operations, including HR, legal advice, and efficiency building.",
        services: ["HR Consulting & Recruitment", "Legal Advisory & Compliance", "Business Process Optimization", "Management Information Systems (MIS) Reporting"]
    },
    [ServiceCategory.WILDLIFE]: undefined,
    [ServiceCategory.BEACH_HOLIDAYS]: undefined,
    [ServiceCategory.MOUNTAIN_CLIMBING]: undefined,
};

export const LOCATION_SPECIFIC_TOUR_DETAILS: Partial<Record<Location, Partial<Record<ServiceCategory, ServiceDetails>>>> = {
    [Location.NAIROBI]: {
        [ServiceCategory.WILDLIFE]: {
            title: "Nairobi Wildlife Encounters",
            description: "Discover the unique wildlife experiences right at the city's doorstep.",
            services: ["Nairobi National Park Safari", "David Sheldrick Elephant Orphanage", "Giraffe Centre Visit"]
        },
        [ServiceCategory.MOUNTAIN_CLIMBING]: {
            title: "Nairobi Hiking & Day Treks",
            description: "Explore scenic trails and viewpoints just a short drive from the capital.",
            services: ["Ngong Hills Hiking Trail", "Mount Longonot Day Trip", "Karura Forest Nature Walks"]
        }
    },
    [Location.MOMBASA]: {
        [ServiceCategory.BEACH_HOLIDAYS]: {
            title: "Mombasa Coastal Bliss",
            description: "Relax on pristine white sands and explore the vibrant marine life of the Indian Ocean.",
            services: ["Diani Beach Relaxation", "Wasini Island Dolphin Tour", "Snorkeling in Kisite-Mpunguti"]
        },
        [ServiceCategory.WILDLIFE]: {
            title: "Coastal Wildlife Parks",
            description: "Experience the unique flora and fauna of Kenya's coastal region.",
            services: ["Shimba Hills National Reserve", "Haller Park Nature Trail", "Mombasa Marine National Park"]
        }
    },
    [Location.NAKURU]: {
        [ServiceCategory.WILDLIFE]: {
            title: "Rift Valley Wildlife Wonders",
            description: "Witness iconic birdlife and big game in the heart of the Great Rift Valley.",
            services: ["Lake Nakuru Flamingo & Rhino Sighting", "Hell's Gate National Park Biking", "Crescent Island Walking Safari"]
        },
        [ServiceCategory.MOUNTAIN_CLIMBING]: {
            title: "Volcanic Landscapes Treks",
            description: "Hike through dramatic craters and geothermal landscapes.",
            services: ["Menengai Crater Rim Hike", "Mount Longonot Day Trip", "Eburru Forest Exploration"]
        }
    },
    [Location.KISUMU]: {
        [ServiceCategory.WILDLIFE]: {
            title: "Lakeside Wildlife Sanctuaries",
            description: "See unique wildlife by the shores of Africa's largest lake.",
            services: ["Kisumu Impala Sanctuary", "Ruma National Park Day Trip", "Ndere Island National Park"]
        },
        [ServiceCategory.BEACH_HOLIDAYS]: {
            title: "Lake Victoria Retreats",
            description: "Experience the tranquil beaches and stunning sunsets of Lake Victoria.",
            services: ["Hippo Point Sunset Viewing", "Dunga Beach & Fishing Village", "Boat Rides on the Lake"]
        }
    },
    [Location.ELDORET]: {
        [ServiceCategory.WILDLIFE]: {
            title: "Highland Nature Reserves",
            description: "Explore the diverse ecosystems of the Kenyan highlands.",
            services: ["Rimoi National Reserve", "Kessup Falls Visit", "Sergoit Hill Rhino Sanctuary"]
        },
        [ServiceCategory.MOUNTAIN_CLIMBING]: {
            title: "High-Altitude Hiking",
            description: "Challenge yourself with treks through the scenic Cherangani Hills.",
            services: ["Cherangani Hills Treks", "Kerio Valley Escarpment Hike", "Torok Falls Expedition"]
        }
    },
    [Location.MACHAKOS]: {
        [ServiceCategory.MOUNTAIN_CLIMBING]: {
            title: "Scenic Hill Country Hikes",
            description: "Enjoy panoramic views and refreshing hikes in the hills surrounding Machakos.",
            services: ["Ol Donyo Sabuk National Park", "Iveti Hills Hike", "Mua Hills Exploration"]
        }
    },
    // New Tour details
    [Location.NYERI]: {
        [ServiceCategory.WILDLIFE]: {
            title: "Aberdares & Mt. Kenya Treks",
            description: "Explore the Aberdare Ranges and the foothills of Mount Kenya.",
            services: ["Aberdare National Park Safari", "Solio Game Reserve", "Mount Kenya Forest Hikes"]
        }
    },
    [Location.MERU]: {
        [ServiceCategory.WILDLIFE]: {
            title: "Meru National Park Adventure",
            description: "Discover the untamed wilderness of Meru, famed for Elsa the Lioness.",
            services: ["Meru National Park Safari", "Rhino Sanctuary Visit", "Kora National Park Expedition"]
        }
    }
};