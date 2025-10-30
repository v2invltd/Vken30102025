

import React from 'react';
import { SparklesIcon, LocationIcon } from './IconComponents';
import { Location } from '../types';
import { HERO_IMAGES } from '../constants';

interface HeroSectionProps {
  onFindServicesClick: () => void;
  onFindNearMeClick: () => void;
  selectedLocation: Location | null;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onFindServicesClick, onFindNearMeClick, selectedLocation }) => {
  const heroImage = selectedLocation ? HERO_IMAGES[selectedLocation] : HERO_IMAGES[Location.NAIROBI];
  const locationName = selectedLocation || 'Kenya';

  return (
    <div className="bg-cover bg-center" style={{ backgroundImage: `url('${heroImage}')` }}>
      <div className="bg-black bg-opacity-50">
        <div className="container mx-auto px-6 py-24 md:py-32 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            The Best Local Services in <span className="text-primary-light">{locationName}</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            From plumbing and cleaning to IT support and wildlife tours, find trusted professionals for any job.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onFindServicesClick}
              className="bg-primary text-white font-bold py-4 px-8 rounded-lg text-lg hover:bg-green-800 transition-transform transform hover:scale-105 inline-flex items-center space-x-2"
            >
              <SparklesIcon className="w-6 h-6" />
              <span>Find Services with AI</span>
            </button>
            <button
              onClick={onFindNearMeClick}
              disabled={!selectedLocation}
              title={!selectedLocation ? "Please select a city to enable this feature." : "Find services using your device's location"}
              className="bg-white text-primary font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 inline-flex items-center space-x-2 border-2 border-primary disabled:bg-gray-300 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500 hover:disabled:scale-100"
            >
              <LocationIcon className="w-6 h-6" />
              <span>Find Near Me</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HeroSection);