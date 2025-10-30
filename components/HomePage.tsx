
import React, { useState } from 'react';
import HeroSection from './HeroSection';
import LocationsSection from './LocationsSection';
import { Location, ServiceCategory, ServiceProvider } from '../types';
import { HOME_SERVICES, CORPORATE_SERVICES, SERVICE_CATEGORY_DETAILS, LOCATION_SPECIFIC_TOUR_DETAILS, LOCATIONS } from '../constants';
import { CheckIcon, ServiceCategoryIcon, StarIcon } from './IconComponents';
import ServiceCard from './ServiceCard';
import CurrentLocationIndicator from './CurrentLocationIndicator';

interface FeaturedProvidersProps {
  providers: ServiceProvider[];
  onBook: (provider: ServiceProvider, type: 'instant' | 'quote') => void;
  onViewDetails: (provider: ServiceProvider) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}

const FeaturedProvidersSection: React.FC<FeaturedProvidersProps> = React.memo(({ providers, onBook, onViewDetails, isFavorite, onToggleFavorite }) => {
  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Featured Professionals</h2>
        <p className="text-center text-gray-600 mb-10">Top-rated service providers, ready to help.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {providers.map(provider => (
            <ServiceCard
              key={provider.id}
              provider={provider}
              onBook={onBook}
              onViewDetails={onViewDetails}
              isFavorite={isFavorite(provider.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </div>
  );
});


interface HomePageProps {
  onFindServicesClick: () => void;
  onFindNearMeClick: () => void;
  onSelectCategory: (category: ServiceCategory) => void;
  onSelectLocation: (location: Location) => void;
  selectedLocation: Location | null;
  featuredProviders: ServiceProvider[];
  onBookProvider: (provider: ServiceProvider, type: 'instant' | 'quote') => void;
  onViewProviderDetails: (provider: ServiceProvider) => void;
  isProviderFavorite: (id: string) => boolean;
  onToggleFavoriteProvider: (id: string) => void;
  userCoordinates: { lat: number; lon: number; } | null;
}

type Tab = 'Home' | 'Corporate' | 'Tours';

const HomePage: React.FC<HomePageProps> = ({ 
  onFindServicesClick,
  onFindNearMeClick,
  onSelectCategory, 
  onSelectLocation, 
  selectedLocation,
  featuredProviders,
  onBookProvider,
  onViewProviderDetails,
  isProviderFavorite,
  onToggleFavoriteProvider,
  userCoordinates
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [clickedCategory, setClickedCategory] = useState<ServiceCategory | null>(null);

  const handleCategoryClick = (category: ServiceCategory) => {
    setClickedCategory(category);
    onSelectCategory(category);
  };

  const renderCategories = (categories: ServiceCategory[]) => (
    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {categories.map(category => {
        const details = SERVICE_CATEGORY_DETAILS[category];
        if (!details) return null;
        const isClicked = clickedCategory === category;
        return (
          <div
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1.5 border hover:border-primary transition-all duration-300 cursor-pointer flex flex-col relative ${isClicked ? 'ring-2 ring-primary border-primary' : 'border-gray-200'}`}
          >
            <div className="flex items-center mb-3">
              <ServiceCategoryIcon category={category} className="w-8 h-8 text-primary mr-3" />
              <h3 className="text-xl font-bold text-gray-800">{details.title}</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4 flex-grow">{details.description}</p>
            <ul className="space-y-2 text-sm text-gray-700">
                {details.services.slice(0, 3).map(service => (
                    <li key={service} className="flex items-center">
                        <CheckIcon className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                        <span>{service}</span>
                    </li>
                ))}
            </ul>
            {isClicked && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  );

  const renderTourCategories = () => {
    if (!selectedLocation) {
        return (
            <div className="text-center py-10 animate-fade-in">
                <p className="text-xl text-gray-600">Please select a city to see available tour packages.</p>
                <p className="text-gray-500 mt-2">Our tours are tailored to each unique location.</p>
            </div>
        );
    }

    const locationTours = LOCATION_SPECIFIC_TOUR_DETAILS[selectedLocation] || {};
    const availableTourCategories = Object.keys(locationTours) as ServiceCategory[];

    if (availableTourCategories.length === 0) {
        return (
            <div className="text-center py-10 animate-fade-in">
                <p className="text-xl text-gray-600">No specific tour packages are listed for {selectedLocation} yet.</p>
                <p className="text-gray-500 mt-2">Check back soon or use our AI finder for more options!</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {availableTourCategories.map(category => {
                const details = locationTours[category]!;
                const isClicked = clickedCategory === category;
                return (
                     <div
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={`bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1.5 border hover:border-primary transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden ${isClicked ? 'ring-2 ring-primary border-primary' : 'border-gray-200'}`}
                    >
                        <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-md">
                            <StarIcon className="w-3 h-3"/>
                            Local Special
                        </div>
                        <div className="flex items-center mb-3">
                           <ServiceCategoryIcon category={category} className="w-8 h-8 text-primary mr-3" />
                           <h3 className="text-xl font-bold text-gray-800">{details.title}</h3>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 flex-grow">{details.description}</p>
                        <ul className="space-y-2 text-sm text-gray-700">
                            {details.services.slice(0, 3).map(service => (
                                <li key={service} className="flex items-center">
                                    <CheckIcon className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                                    <span>{service}</span>
                                </li>
                            ))}
                        </ul>
                         {isClicked && (
                            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    );
  };

  return (
    <>
      <HeroSection onFindServicesClick={onFindServicesClick} onFindNearMeClick={onFindNearMeClick} selectedLocation={selectedLocation} />
      
      <div className="bg-white -mt-8 relative z-10 rounded-t-2xl shadow-lg">
        <CurrentLocationIndicator coordinates={userCoordinates} />

        <div className="container mx-auto px-6 py-12">
          <div className="mb-10 border-b border-gray-200">
            <nav className="-mb-px flex justify-center space-x-2 sm:space-x-4 md:space-x-8" role="tablist" aria-label="Service categories">
              <button
                id="tab-home"
                role="tab"
                aria-selected={activeTab === 'Home'}
                aria-controls="tabpanel-home"
                onClick={() => setActiveTab('Home')}
                className={`py-3 px-2 sm:px-4 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 ${
                  activeTab === 'Home'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Home Services
              </button>
              <button
                id="tab-corporate"
                role="tab"
                aria-selected={activeTab === 'Corporate'}
                aria-controls="tabpanel-corporate"
                onClick={() => setActiveTab('Corporate')}
                className={`py-3 px-2 sm:px-4 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 ${
                  activeTab === 'Corporate'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Corporate Services
              </button>
              <button
                id="tab-tours"
                role="tab"
                aria-selected={activeTab === 'Tours'}
                aria-controls="tabpanel-tours"
                onClick={() => setActiveTab('Tours')}
                className={`py-3 px-2 sm:px-4 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 ${
                  activeTab === 'Tours'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Kenya Tours
              </button>
            </nav>
          </div>

          <div>
            {activeTab === 'Home' && (
              <div id="tabpanel-home" role="tabpanel" aria-labelledby="tab-home">
                {renderCategories(HOME_SERVICES)}
              </div>
            )}
            {activeTab === 'Corporate' && (
              <div id="tabpanel-corporate" role="tabpanel" aria-labelledby="tab-corporate">
                {renderCategories(CORPORATE_SERVICES)}
              </div>
            )}
            {activeTab === 'Tours' && (
              <div id="tabpanel-tours" role="tabpanel" aria-labelledby="tab-tours">
                {renderTourCategories()}
              </div>
            )}
          </div>
        </div>
      </div>
      <FeaturedProvidersSection
        providers={featuredProviders}
        onBook={onBookProvider}
        onViewDetails={onViewProviderDetails}
        isFavorite={isProviderFavorite}
        onToggleFavorite={onToggleFavoriteProvider}
      />
      <LocationsSection locations={LOCATIONS} onSelectLocation={onSelectLocation} />
    </>
  );
};

export default React.memo(HomePage);