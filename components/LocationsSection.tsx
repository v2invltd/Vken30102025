import React from 'react';
import { Location } from '../types';
import { LOCATION_IMAGES } from '../constants';

interface LocationsSectionProps {
    locations: Location[];
    onSelectLocation: (location: Location) => void;
}

const LocationsSection: React.FC<LocationsSectionProps> = ({ locations, onSelectLocation }) => {
    return (
        <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Explore by Location</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {locations.map(location => (
                        <div 
                            key={location} 
                            onClick={() => onSelectLocation(location)}
                            className="relative rounded-lg overflow-hidden shadow-lg cursor-pointer group h-40"
                        >
                            <img src={LOCATION_IMAGES[location]} alt={location} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 group-hover:bg-opacity-20">
                                <h3 className="text-white text-xl font-bold text-center px-2">{location}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default React.memo(LocationsSection);