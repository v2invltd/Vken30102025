import React from 'react';

const ServiceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <div className="relative">
        <div className="w-full h-40 bg-gray-200 animate-pulse"></div>
        <div className="w-20 h-20 rounded-full bg-gray-200 border-4 border-white absolute -bottom-10 left-6 animate-pulse"></div>
      </div>
      <div className="p-6 pt-12 flex-grow flex flex-col">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-3 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-6 animate-pulse"></div>
        
        <div className="flex-grow"></div>
        
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center w-1/2">
            <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded w-1/4 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCardSkeleton;