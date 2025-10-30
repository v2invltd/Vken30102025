import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { GlobeIcon, LocationIcon } from './IconComponents';
import * as api from '../frontend/services/api';
import { LocalHubData } from '../frontend/services/api';

const CardSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
    </div>
);

const LocalHub: React.FC = () => {
    const { state } = useAppContext();
    const { selectedLocation } = state;
    const [hubData, setHubData] = useState<LocalHubData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedLocation) {
            const fetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await api.fetchLocalHubData(selectedLocation);
                    setHubData(data);
                } catch (err) {
                    setError("Failed to load local information. Please try again later.");
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        } else {
            setError("Please select a location to see local information.");
            setIsLoading(false);
        }
    }, [selectedLocation]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            );
        }

        if (error || !hubData) {
            return <p className="text-center text-red-500">{error}</p>;
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weather Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Weather</h2>
                    <div className="flex items-center flex-grow">
                        <span className="text-5xl mr-4">{hubData.weather.icon}</span>
                        <div>
                            <p className="text-lg font-medium text-gray-700">{hubData.weather.description}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 text-right">Data by OpenWeatherMap</p>
                </div>

                {/* Did You Know? Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Did You Know?</h2>
                    <p className="text-gray-700 italic">"{hubData.historyFact}"</p>
                </div>

                {/* Local News Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Local Headlines</h2>
                    <div className="space-y-3">
                        {hubData.news.length > 0 ? hubData.news.map((item, index) => (
                            <a href={item.url} key={index} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-gray-50 transition-colors">
                                <p className="font-semibold text-primary">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.source.name}</p>
                            </a>
                        )) : <p className="text-gray-500">No news found.</p>}
                    </div>
                </div>

                {/* Local Events Card */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
                     <div className="space-y-3">
                        {hubData.events.length > 0 ? hubData.events.map((item, index) => (
                            <a href={item.url} key={index} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-md hover:bg-gray-50 transition-colors">
                                <p className="font-semibold text-primary">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.date}</p>
                            </a>
                        )) : <p className="text-gray-500">No events found.</p>}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 py-12 animate-fade-in">
            <div className="container mx-auto px-6">
                <div className="text-center mb-10">
                    <GlobeIcon className="w-16 h-16 text-primary mx-auto mb-2" />
                    <h1 className="text-4xl font-bold text-gray-800">Local Hub</h1>
                    {selectedLocation && (
                        <p className="text-xl text-gray-600 mt-2">
                            Your guide to what's happening in <span className="font-semibold text-primary">{selectedLocation}</span>
                        </p>
                    )}
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default LocalHub;