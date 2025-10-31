import React from 'react';
import { ServiceProvider } from '../types';
import { LocationIcon, StarIcon, ServiceCategoryIcon, HeartIcon } from './IconComponents';
import VerifiedBadge from './VerifiedBadge';

interface ServiceCardProps {
  provider: ServiceProvider;
  onBook: (provider: ServiceProvider, type: 'instant' | 'quote') => void;
  isFavorite: boolean;
  onToggleFavorite: (providerId: string) => void;
  onViewDetails: (provider: ServiceProvider) => void;
  distance?: number;
  isImmediatelyAvailable?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ provider, onBook, isFavorite, onToggleFavorite, onViewDetails, distance, isImmediatelyAvailable }) => {

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when favoriting
    onToggleFavorite(provider.id);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBook(provider, provider.allowsInstantBooking ? 'instant' : 'quote');
  }

  return (
    <div onClick={() => onViewDetails(provider)} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col cursor-pointer">
      <div className="relative">
        <img className="w-full h-40 object-cover" src={provider.coverImageUrl || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400&h=300&fit=crop'} alt={`${provider.name} cover`} />
        
        {isImmediatelyAvailable && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1.5 shadow-md">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
             </span>
             Available Now
          </div>
        )}

        <button 
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-2 hover:bg-opacity-100 transition-colors z-10"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <HeartIcon 
            className={`w-6 h-6 ${isFavorite ? 'text-red-500' : 'text-gray-700'}`} 
            filled={isFavorite} 
          />
        </button>

        <img className="w-20 h-20 rounded-full object-cover border-4 border-white absolute -bottom-10 left-6 bg-white" src={provider.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=007A33&color=fff&size=128`} alt={`${provider.name} logo`} />
      </div>
      <div className="p-6 pt-12 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{provider.name}</h3>
          {provider.kycVerified && <VerifiedBadge />}
        </div>
        <div className="flex items-center text-primary mb-3">
          <div title={provider.category}>
            <ServiceCategoryIcon category={provider.category} className="w-5 h-5 mr-2" />
          </div>
          <p className="text-sm font-semibold">{provider.category}</p>
        </div>
        <div className="flex items-center text-gray-600 mb-4">
          <LocationIcon className="w-5 h-5 mr-2" />
          <span className="truncate">{provider.locations[0]}{provider.locations.length > 1 ? ` & ${provider.locations.length - 1} more` : ''}</span>
          {distance !== undefined && (
              <span className="ml-2 font-bold text-primary text-sm whitespace-nowrap">~{distance.toFixed(1)} km</span>
          )}
        </div>
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{provider.description}</p>
        
        {provider.expertise && provider.expertise.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expertise</p>
            <div className="flex flex-wrap gap-2">
              {provider.expertise.slice(0, 3).map(skill => (
                <span key={skill} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-grow"></div> {/* Pushes content below to the bottom */}
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
            <span className="text-gray-800 font-bold">{provider.rating.toFixed(1)}</span>
            <span className="text-gray-600 text-sm ml-2">({provider.reviewsCount} reviews)</span>
          </div>
          <button
            onClick={handleBookClick}
            className={`text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors ${provider.allowsInstantBooking ? 'bg-accent hover:bg-red-700' : 'bg-primary hover:bg-green-800'}`}
          >
            {provider.allowsInstantBooking ? 'Book Now' : 'Request Quote'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ServiceCard);