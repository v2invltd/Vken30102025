
import React, { useState, useMemo, useEffect } from 'react';
import { ServiceProvider } from '../types';
import ServiceCard from './ServiceCard';
import ServiceCardSkeleton from './ServiceCardSkeleton';
import { useAppContext } from '../contexts/AppContext';
import { LocationIcon, MapIcon, ListIcon, StarIcon, SparklesIcon } from './IconComponents';
import MapView from './MapView';
import * as api from '../frontend/services/api';

type ViewMode = 'list' | 'map';
type SortByType = 'relevance' | 'distance' | 'rating';

const GroundingSources: React.FC<{ sources: any[] }> = ({ sources }) => {
    const mapSources = sources.filter(s => s.maps);
    if (mapSources.length === 0) return null;

    return (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Relevant Places Found</h3>
            <div className="flex flex-wrap gap-3">
                {mapSources.map((source, index) => (
                    <a 
                        key={index}
                        href={source.maps.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-white border border-blue-300 rounded-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors"
                    >
                        <LocationIcon className="w-4 h-4 mr-2" />
                        {source.maps.title}
                    </a>
                ))}
            </div>
        </div>
    )
}

const getDistance = (coords1: { lat: number; lon: number }, coords2: { lat: number; lon: number }): number => {
    if (!coords1 || !coords2) return Infinity;
    const R = 6371; // Radius of the earth in km
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.lon - coords1.lon) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

const SearchResults: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { searchResults: providers, favoriteProviderIds, activeSearchCategory, searchGroundingSources, isSearchResultsLoading: isLoading, userCoordinates } = state;

  const [nameFilter, setNameFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [instantBookFilter, setInstantBookFilter] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortByType>('relevance');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
        if (providers.length > 0 && activeSearchCategory && !isLoading) {
            setIsLoadingSuggestions(true);
            setAiSuggestions([]); // Clear old suggestions
            try {
                // Pass a slimmed down version of providers to reduce payload size
                const providerContext = providers.map(p => ({
                    expertise: p.expertise,
                    detailedServices: p.detailedServices?.map(s => ({ name: s.name }))
                })) as ServiceProvider[];
                const suggestions = await api.generateSearchSuggestions(activeSearchCategory, providerContext);
                setAiSuggestions(suggestions);
            } catch (error) {
                console.error("Failed to fetch AI suggestions:", error);
                // Fail silently, don't show an error to the user
            } finally {
                setIsLoadingSuggestions(false);
            }
        } else {
            setAiSuggestions([]); // Clear suggestions if no results or loading
        }
    };

    fetchSuggestions();
  }, [providers, activeSearchCategory, isLoading]);

  const onBook = (provider: ServiceProvider, type: 'instant' | 'quote') => {
    if (!state.currentUser) {
        dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: () => onBook(provider, type) });
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: 'Please log in or register to book a service.' } } });
        return;
    }
    dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { provider, type } } });
  };
  const onToggleFavorite = (providerId: string) => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: providerId });
  };
  const onViewDetails = (provider: ServiceProvider) => {
    dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerDetail', props: { provider } } });
  };

  const sortedAndFilteredProviders = useMemo(() => {
    const providersWithDistance = providers.map(provider => ({
        ...provider,
        distance: userCoordinates && provider.coordinates
            ? getDistance(userCoordinates, provider.coordinates)
            : undefined,
    }));

    let filtered = providersWithDistance.filter(p => {
        const nameMatch = nameFilter ? (
            p.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
            p.expertise?.some(e => e.toLowerCase().includes(nameFilter.toLowerCase())) ||
            p.detailedServices?.some(s => s.name.toLowerCase().includes(nameFilter.toLowerCase()))
        ) : true;
        const ratingMatch = ratingFilter > 0 ? p.rating >= ratingFilter : true;
        const instantBookMatch = instantBookFilter ? p.allowsInstantBooking === true : true;
        return nameMatch && ratingMatch && instantBookMatch;
    });

    if (sortBy === 'distance' && userCoordinates) {
        return filtered.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    if (sortBy === 'rating') {
        return filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered; // Default 'relevance' order
  }, [providers, nameFilter, ratingFilter, instantBookFilter, sortBy, userCoordinates]);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {activeSearchCategory ? `Providers for ${activeSearchCategory}` : 'Available Service Providers'}
          </h2>
      </div>
      
      {/* Filter and View Toggle */}
      {!isLoading && (providers.length > 0 || nameFilter) && (
        <div className="space-y-4 mb-8 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                    <input 
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Filter by name or specialty (e.g., 'Leak Repair')"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
                 <div>
                    <select 
                        value={ratingFilter} 
                        onChange={(e) => setRatingFilter(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                        aria-label="Filter by rating"
                    >
                        <option value={0}>All Ratings</option>
                        <option value={4}>4 Stars & Up</option>
                        <option value={3}>3 Stars & Up</option>
                        <option value={2}>2 Stars & Up</option>
                    </select>
                </div>
                <div className="flex items-center justify-center bg-white px-4 py-2 border border-gray-300 rounded-lg shadow-sm">
                    <label htmlFor="instantBook" className="flex items-center cursor-pointer text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            id="instantBook"
                            checked={instantBookFilter}
                            onChange={(e) => setInstantBookFilter(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                        />
                        Instant Book Only
                    </label>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value as SortByType)}
                            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                            aria-label="Sort providers by"
                        >
                            <option value="relevance">Sort by Relevance</option>
                            <option value="rating">Sort by Rating</option>
                            {userCoordinates && <option value="distance">Sort by Distance</option>}
                        </select>
                    </div>
                </div>
                <div className="flex items-center bg-gray-200 rounded-full p-1">
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600'}`} aria-label="List View">
                    <ListIcon className="w-5 h-5"/>
                  </button>
                  <button onClick={() => setViewMode('map')} className={`p-2 rounded-full transition-colors ${viewMode === 'map' ? 'bg-white shadow' : 'text-gray-600'}`} aria-label="Map View">
                    <MapIcon className="w-5 h-5"/>
                  </button>
                </div>
            </div>
             {(isLoadingSuggestions || aiSuggestions.length > 0) && (
                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                        <SparklesIcon className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-gray-700 text-sm">Refine your search:</h4>
                    </div>
                    {isLoadingSuggestions ? (
                        <div className="flex gap-2">
                            <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
                            <div className="h-8 w-28 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {aiSuggestions.map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => setNameFilter(suggestion)}
                                    className="bg-primary-light/60 text-primary font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-primary-light transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      )}

      {searchGroundingSources && <GroundingSources sources={searchGroundingSources} />}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => <ServiceCardSkeleton key={index} />)}
        </div>
      ) : sortedAndFilteredProviders.length > 0 ? (
        <>
            {viewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
                {sortedAndFilteredProviders.map((provider) => (
                    <ServiceCard 
                    key={provider.id} 
                    provider={provider} 
                    onBook={onBook}
                    isFavorite={favoriteProviderIds.includes(provider.id)}
                    onToggleFavorite={onToggleFavorite}
                    onViewDetails={onViewDetails}
                    distance={provider.distance}
                    />
                ))}
                </div>
            ) : (
                <MapView 
                    providers={sortedAndFilteredProviders}
                    onViewDetails={onViewDetails}
                    isFavorite={(id) => favoriteProviderIds.includes(id)}
                    onToggleFavorite={onToggleFavorite}
                    userCoordinates={userCoordinates}
                />
            )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-gray-600">No providers found matching your criteria.</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or using our AI assistant for help.</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;