import React, { useState } from 'react';
import { ServiceProvider } from '../types';
import { KENYA_BOUNDS } from '../constants';
import { StarIcon, HeartIcon, LocationIcon } from './IconComponents';

interface MapViewProps {
  providers: ServiceProvider[];
  onViewDetails: (provider: ServiceProvider) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  userCoordinates: { lat: number; lon: number } | null;
}

// Helper function to convert lat/lon to percentage-based top/left
const convertCoordsToPercent = (lat: number, lon: number) => {
  const { minLat, maxLat, minLon, maxLon } = KENYA_BOUNDS;
  const latRange = maxLat - minLat;
  const lonRange = maxLon - minLon;

  const top = 100 - ((lat - minLat) / latRange) * 100;
  const left = ((lon - minLon) / lonRange) * 100;

  const clampedTop = Math.max(0, Math.min(100, top));
  const clampedLeft = Math.max(0, Math.min(100, left));

  return { top: `${clampedTop}%`, left: `${clampedLeft}%` };
};


const InfoWindow: React.FC<{ provider: ServiceProvider, onClose: () => void, onViewDetails: (p: ServiceProvider) => void, onToggleFavorite: (id: string) => void, isFavorite: boolean }> = ({ provider, onClose, onViewDetails, onToggleFavorite, isFavorite }) => {
    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-white rounded-lg shadow-xl p-3 z-20 animate-fade-in border border-gray-200">
            <div className="flex items-start">
                <img src={provider.logoUrl} alt={provider.name} className="w-12 h-12 rounded-md object-cover mr-3"/>
                <div className="flex-grow">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{provider.name}</h3>
                    <div className="flex items-center mt-1">
                        <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="text-xs font-bold text-gray-700">{provider.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 ml-1">({provider.reviewsCount} reviews)</span>
                    </div>
                </div>
                 <button onClick={() => onToggleFavorite(provider.id)} className="p-1">
                    <HeartIcon className={`w-5 h-5 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`} filled={isFavorite} />
                </button>
            </div>
            <button onClick={() => onViewDetails(provider)} className="w-full mt-2 bg-primary text-white text-xs font-bold py-2 rounded-md hover:bg-green-800 transition-colors">
                View Details
            </button>
        </div>
    )
}

const MapView: React.FC<MapViewProps> = ({ providers, onViewDetails, isFavorite, onToggleFavorite, userCoordinates }) => {
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  
  const handleMarkerClick = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
  };
  
  const userPosition = userCoordinates ? convertCoordsToPercent(userCoordinates.lat, userCoordinates.lon) : null;
  
  return (
    <div 
        className="relative w-full h-[600px] bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg animate-fade-in"
        style={{ backgroundImage: `url('https://images.pexels.com/photos/3721644/pexels-photo-3721644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        onClick={() => setSelectedProvider(null)} // Click on map to close info window
    >
      {/* User's Location Marker */}
      {userPosition && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none"
            style={{ top: userPosition.top, left: userPosition.left }}
            title="Your Location"
          >
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-500 border-2 border-white"></span>
              </span>
          </div>
      )}

      {/* Provider Markers */}
      {providers.map(provider => {
        if (!provider.coordinates) return null;
        
        const { top, left } = convertCoordsToPercent(provider.coordinates.lat, provider.coordinates.lon);
        const isSelected = selectedProvider?.id === provider.id;

        return (
          <div
            key={provider.id}
            className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer z-10"
            style={{ top, left }}
            onClick={(e) => { e.stopPropagation(); handleMarkerClick(provider); }}
          >
            {isSelected && (
                <InfoWindow 
                    provider={provider} 
                    onClose={() => setSelectedProvider(null)} 
                    onViewDetails={onViewDetails}
                    isFavorite={isFavorite(provider.id)}
                    onToggleFavorite={onToggleFavorite}
                />
            )}
            <button
              className="focus:outline-none"
              aria-label={`View details for ${provider.name}`}
            >
              <LocationIcon className={`w-8 h-8 drop-shadow-lg transition-all duration-200 ${isSelected ? 'text-accent scale-125' : 'text-primary hover:text-red-600'}`} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default MapView;