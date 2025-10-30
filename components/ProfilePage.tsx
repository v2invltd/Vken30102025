

import React, { useState } from 'react';
import { UserRole, ServiceProvider, JobAlert, ServiceCategory, Location } from '../types';
import { CheckIcon, ServiceCategoryIcon, HeartIcon, BellIcon, TrashIcon } from './IconComponents';
import ServiceCard from './ServiceCard';
import { useAppContext, AppView } from '../contexts/AppContext';
import VerifiedBadge from './VerifiedBadge';
import { PROVIDER_REGISTRABLE_CATEGORIES, LOCATIONS } from '../constants';
import * as api from '../frontend/services/api';
import { useToast } from './Toast';


// A reusable component for info cards
const InfoCard: React.FC<{ title: string; children: React.ReactNode; actionButton?: React.ReactNode; className?: string }> = ({ title, children, actionButton, className }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
            {actionButton}
        </div>
        {children}
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-md text-gray-900">{value || <span className="italic text-gray-400">Not provided</span>}</p>
    </div>
);


const ProfilePage: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { currentUser: user, providers, favoriteProviderIds, jobAlerts } = state;
    const toast = useToast();

    const [newAlertCategory, setNewAlertCategory] = useState<ServiceCategory | ''>('');
    const [newAlertLocation, setNewAlertLocation] = useState<Location | ''>('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlertCategory || !newAlertLocation) {
            toast.error("Please select both a category and a location.");
            return;
        }

        const exists = jobAlerts.some(
            alert => alert.serviceCategory === newAlertCategory && alert.location === newAlertLocation
        );
        if (exists) {
            toast.info("You already have an alert for this category and location.");
            return;
        }

        setIsAdding(true);
        try {
            const result = await api.createJobAlert({ serviceCategory: newAlertCategory, location: newAlertLocation });
            dispatch({ type: 'ADD_JOB_ALERT', payload: result.alert });
            toast.success("Job alert created!");
            setNewAlertCategory('');
            setNewAlertLocation('');
        } catch (error) {
            console.error(error);
            toast.error("Failed to create job alert.");
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeleteAlert = async (alertId: string) => {
        try {
            await api.deleteJobAlert(alertId);
            dispatch({ type: 'DELETE_JOB_ALERT', payload: alertId });
            toast.success("Job alert removed.");
        } catch (error) {
            console.error(error);
            toast.error("Failed to remove job alert.");
        }
    };


    if (!user) return null;

    const onEditProviderDetails = () => dispatch({ type: 'OPEN_MODAL', payload: { type: 'editProviderDetails' } });
    const onCompleteKyc = () => dispatch({ type: 'OPEN_MODAL', payload: { type: 'kyc' } });
    const onToggleFavorite = (providerId: string) => dispatch({ type: 'TOGGLE_FAVORITE', payload: providerId });

    const onBook = (provider: ServiceProvider, type: 'instant' | 'quote') => {
        // This component guarantees user is logged in, so no need for !user check
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'booking', props: { provider, type } } });
    };

    const onViewDetails = (provider: ServiceProvider) => {
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'providerDetail', props: { provider } } });
    };

    const favoriteProviders = providers.filter(p => favoriteProviderIds.includes(p.id));

    const providerProfile = user.role === UserRole.PROVIDER
        ? providers.find(p => p.ownerId === user.id)
        : null;

    return (
        <div className="bg-gray-50 py-12 animate-fade-in">
            <div className="container mx-auto px-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">My Profile</h1>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-1 space-y-8">
                        <InfoCard
                            title="Account Details"
                            actionButton={<button onClick={onCompleteKyc} className="text-sm text-primary font-semibold hover:underline">Edit</button>}
                        >
                            <div className="space-y-4">
                                <DetailItem label="Full Name" value={user.name} />
                                <DetailItem label="Email Address" value={user.email} />
                                <DetailItem label="Phone Number" value={user.phone} />
                                <DetailItem label="Account Type" value={user.role} />
                            </div>
                        </InfoCard>

                        <InfoCard title="Verification & Documents">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-2">KYC Status</p>
                                    {user.kycVerified ? (
                                        <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg">
                                            <CheckIcon className="w-6 h-6 mr-2" />
                                            <p className="text-md font-semibold">Verified</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-start bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                                            <p className="text-yellow-800 text-sm mb-2">Your account is not yet verified.</p>
                                            <button onClick={onCompleteKyc} className="bg-yellow-500 text-white text-sm font-bold py-1.5 px-3 rounded-md hover:bg-yellow-600 transition-colors">
                                                Complete KYC
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <DetailItem
                                    label="National ID / Passport"
                                    value={user.nationalId ? 'On File' : 'Not Uploaded'}
                                />
                                {user.role === UserRole.PROVIDER && (
                                     <DetailItem
                                        label="KRA PIN Certificate"
                                        value={user.kraPinCertificate ? 'On File' : 'Not Uploaded'}
                                    />
                                )}
                            </div>
                        </InfoCard>

                        <InfoCard title="Job Alerts">
                            <p className="text-sm text-gray-600 mb-4">Get notified when new providers join in your preferred categories and locations.</p>
                            
                            <form onSubmit={handleAddAlert} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-lg border">
                                <select 
                                    value={newAlertCategory} 
                                    onChange={e => setNewAlertCategory(e.target.value as ServiceCategory)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    aria-label="Select service category for alert"
                                >
                                    <option value="" disabled>Select Category</option>
                                    {PROVIDER_REGISTRABLE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <select 
                                    value={newAlertLocation} 
                                    onChange={e => setNewAlertLocation(e.target.value as Location)}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    aria-label="Select location for alert"
                                >
                                    <option value="" disabled>Select Location</option>
                                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                </select>
                                <button type="submit" disabled={isAdding} className="w-full bg-primary text-white text-sm font-semibold rounded-md hover:bg-green-800 disabled:bg-gray-400 flex items-center justify-center">
                                    {isAdding ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : 'Add Alert'}
                                </button>
                            </form>

                            <div className="space-y-3">
                                <h3 className="text-md font-semibold text-gray-700">Your Active Alerts</h3>
                                {jobAlerts && jobAlerts.length > 0 ? (
                                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {jobAlerts.map(alert => (
                                            <li key={alert.id} className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
                                                <div className="flex items-center gap-3">
                                                    <BellIcon className="w-5 h-5 text-primary" />
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{alert.serviceCategory}</p>
                                                        <p className="text-xs text-gray-500">{alert.location}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteAlert(alert.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full" aria-label={`Delete alert for ${alert.serviceCategory} in ${alert.location}`}>
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">You have no active job alerts.</p>
                                )}
                            </div>
                        </InfoCard>

                    </div>

                    {/* Right Column / Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Provider Profile Card */}
                        {user.role === UserRole.PROVIDER && providerProfile && (
                            <InfoCard
                                title="My Public Profile"
                                actionButton={<button onClick={onEditProviderDetails} className="text-sm text-primary font-semibold hover:underline">Edit Profile</button>}
                            >
                                <div className="flex items-center space-x-4">
                                    <img src={providerProfile.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(providerProfile.name)}&background=007A33&color=fff&size=128`} alt={`${providerProfile.name} logo`} className="w-20 h-20 rounded-full object-cover bg-gray-200" />
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-bold text-gray-800">{providerProfile.name}</h3>
                                            {providerProfile.kycVerified && <VerifiedBadge size="md" />}
                                        </div>
                                        <div className="flex items-center text-gray-500 mt-1">
                                            <ServiceCategoryIcon category={providerProfile.category} className="w-5 h-5 mr-2 text-primary" />
                                            <p className="text-md">{providerProfile.category} in {providerProfile.locations.join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-md text-gray-700 mt-4 bg-gray-50 p-3 rounded-md">{providerProfile.description}</p>
                            </InfoCard>
                        )}

                        {/* Favorite Providers Section */}
                        <InfoCard title="My Favorite Providers">
                            {favoriteProviders.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {favoriteProviders.map(provider => (
                                        <ServiceCard
                                            key={provider.id}
                                            provider={provider}
                                            onBook={onBook}
                                            isFavorite={true}
                                            onToggleFavorite={onToggleFavorite}
                                            onViewDetails={onViewDetails}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <HeartIcon className="w-12 h-12 text-gray-300 mx-auto" />
                                    <p className="mt-4 text-lg text-gray-600">You haven't added any favorites yet.</p>
                                    <p className="text-gray-500 mt-1">Click the heart icon on a provider to save them here.</p>
                                </div>
                            )}
                        </InfoCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;