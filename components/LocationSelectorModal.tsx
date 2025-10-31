import React from 'react';
import { Location } from '../types';
import { LOCATIONS, LOCATION_IMAGES } from '../constants';

interface LocationSelectorModalProps {
  onSelectLocation: (location: Location) => void;
}

const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({ onSelectLocation }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 p-4 animate-fade-in overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center py-8">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 text-center">
          Welcome to V-Ken Serve
        </h1>
        <h2 className="text-xl md:text-2xl text-gray-300 mb-10 text-center">
          First, please select your city
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl">
          {LOCATIONS.map(location => (
            <div
              key={location}
              onClick={() => onSelectLocation(location)}
              className="relative rounded-lg overflow-hidden shadow-lg cursor-pointer group h-32 md:h-48 transform hover:scale-105 transition-transform duration-300"
            >
              <img
                src={LOCATION_IMAGES[location]}
                alt={location}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 group-hover:bg-opacity-20">
                <h3 className="text-white text-lg md:text-2xl font-bold text-center px-2">
                  {location}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationSelectorModal;