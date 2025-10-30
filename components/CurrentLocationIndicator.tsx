import React, { useState, useEffect } from 'react';
import * as api from '../frontend/services/api'; // Use the new API service
import { LocationIcon } from './IconComponents';

interface CurrentLocationIndicatorProps {
  coordinates: { lat: number; lon: number } | null;
}

const CurrentLocationIndicator: React.FC<CurrentLocationIndicatorProps> = ({ coordinates }) => {
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLocationName = async () => {
      if (coordinates) {
        setIsLoading(true);
        try {
            const name = await api.getReadableLocation(coordinates.lat, coordinates.lon);
            setLocationName(name);
        } catch (error) {
            console.error("Error fetching readable location:", error);
            setLocationName(null);
        } finally {
            setIsLoading(false);
        }
      } else {
          setLocationName(null);
      }
    };

    fetchLocationName();
  }, [coordinates]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
          <span>Determining your precise location...</span>
        </>
      );
    }

    if (locationName) {
      return (
        <>
          <LocationIcon className="w-5 h-5 mr-2 text-primary" />
          <span>Your current location is near: <span className="font-semibold">{locationName}</span></span>
        </>
      );
    }
    
    if (coordinates) {
        return (
            <>
                <LocationIcon className="w-5 h-5 mr-2 text-primary" />
                <span>Location services are active.</span>
            </>
        );
    }

    return (
      <>
        <LocationIcon className="w-5 h-5 mr-2 text-gray-400" />
        <span>Getting your location...</span>
      </>
    );
  };

  return (
    <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-center bg-gray-100 text-gray-700 text-sm p-3 rounded-lg border border-gray-200">
            {renderContent()}
        </div>
    </div>
  );
};

export default CurrentLocationIndicator;