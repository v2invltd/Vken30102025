import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ServiceCategory, Location, DetailedService, LegalDocType, NewProviderData, ServiceProvider } from '../types';
import { CloseIcon, CheckIcon, WarningIcon, SparklesIcon, TrashIcon, CameraIcon } from './IconComponents';
import { LOCATIONS, PROVIDER_REGISTRABLE_CATEGORIES, TOUR_SERVICES, LOCATION_COORDINATES } from '../constants';
import { verifyKraPin } from '../services/kraPinService'; // Still using mock for KRA PIN
import * as api from '../frontend/services/api'; // Use the new API service
import { useToast } from './Toast';
import { useAppContext } from '../contexts/AppContext';

interface ProviderRegistrationModalProps {
  onComplete: (data: Partial<ServiceProvider & NewProviderData>, pendingUser?: { name: string, email: string, phone: string }) => void;
  pendingUser?: { name: string, email: string, phone: string };
  initialData?: Partial<NewProviderData & ServiceProvider>;
  isEditMode?: boolean;
  onShowTerms: (type: LegalDocType) => void;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const FileInput: React.FC<{ label: string; selectedFileName: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required: boolean; accept: string }> = ({ label, selectedFileName, onChange, required, accept }) => {
    const inputId = `file-input-${label.replace(/\s+/g, '-')}`;
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center">
                <label htmlFor={inputId} className="cursor-pointer bg-primary-light text-primary font-semibold py-2 px-4 rounded-l-md hover:bg-primary-light/80 whitespace-nowrap transition-colors">
                    Choose File
                </label>
                <input id={inputId} type="file" onChange={onChange} className="sr-only" required={required} accept={accept} />
                <div className="flex-grow p-2 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-500 truncate">
                    {selectedFileName || 'No file chosen'}
                </div>
            </div>
        </div>
    );
};

const ServicesManagementTab: React.FC<{ provider: Partial<ServiceProvider>; onSave: (services: DetailedService[]) => void }> = ({ provider, onSave }) => {
    const [services, setServices] = useState<DetailedService[]>(
        provider.detailedServices && provider.detailedServices.length > 0
            ? provider.detailedServices.map((s, i) => ({ ...s, id: s.id || `ds-${Date.now()}-${i}`}))
            : [{ id: `ds-${Date.now()}`, name: '', description: '', price: '' }]
    );
    const [isSuggesting, setIsSuggesting] = useState(false);
    const toast = useToast();

    const handleServiceChange = (id: string, field: keyof DetailedService, value: string) => {
        const newServices = services.map(service => service.id === id ? { ...service, [field]: value } : service);
        setServices(newServices);
        onSave(newServices);
    };

    const addService = () => {
        const newServices = [...services, { id: `ds-${Date.now()}`, name: '', description: '', price: '' }];
        setServices(newServices);
        onSave(newServices);
    };

    const removeService = (id: string) => {
        if (services.length > 1) {
            const newServices = services.filter(service => service.id !== id);
            setServices(newServices);
            onSave(newServices);
        } else {
            toast.error("You must have at least one service.");
        }
    };

    const handleAiSuggest = async () => {
        if (!provider.category || !provider.description) {
            toast.error("Please provide a category and description first for better suggestions.");
            return;
        }
        setIsSuggesting(true);
        try {
            const suggestions = await api.generateDetailedServices(provider.category, provider.description);
            const suggestionsWithIds = suggestions.map((s, i) => ({ ...s, id: s.id || `ai-ds-${Date.now()}-${i}`}));
            setServices(suggestionsWithIds);
            onSave(suggestionsWithIds); // Update parent state
            toast.success("AI has suggested some services for you!");
        } catch (error) {
            console.error("AI service suggestions error:", error);
            toast.error("Failed to get AI suggestions. Please try again.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-inner border space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">Your Service Menu</h3>
                <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isSuggesting}
                    className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary-light/40 hover:bg-primary-light/70 px-3 py-2 rounded-lg disabled:opacity-60"
                >
                    {isSuggesting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div> : <SparklesIcon className="w-4 h-4"/>}
                    AI Suggest Services
                </button>
            </div>
            <div className="space-y-3 border border-gray-200 p-3 rounded-lg max-h-60 overflow-y-auto">
                {services.map((service) => (
                    <div key={service.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded-lg">
                        <div className="col-span-12 sm:col-span-4"><input type="text" value={service.name} onChange={(e) => handleServiceChange(service.id!, 'name', e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md" placeholder="Service Name"/></div>
                        <div className="col-span-12 sm:col-span-5"><textarea value={service.description} onChange={(e) => handleServiceChange(service.id!, 'description', e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md" placeholder="Service Description" rows={1}/></div>
                        <div className="col-span-10 sm:col-span-2"><input type="text" value={service.price || ''} onChange={(e) => handleServiceChange(service.id!, 'price', e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md" placeholder="e.g., KES 2,500"/></div>
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-center h-full"><button type="button" onClick={() => removeService(service.id!)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-5 h-5"/></button></div>
                    </div>
                ))}
                 <button type="button" onClick={addService} className="text-sm font-semibold text-primary hover:text-green-800 mt-2">+ Add Service Manually</button>
            </div>
        </div>
    );
};


const ProviderRegistrationModal: React.FC<ProviderRegistrationModalProps> = ({ onComplete, pendingUser, initialData, isEditMode = false, onShowTerms }) => {
    const { dispatch } = useAppContext();
    const onClose = () => dispatch({ type: 'CLOSE_MODAL' });
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<Partial<NewProviderData & ServiceProvider>>({
        businessName: '', businessRegNo: '', category: undefined,
        locations: [], hourlyRate: 0, description: '', expertise: [],
        logoUrl: '', coverImageUrl: '', detailedServices: [],
        latitude: 0, longitude: 0, // Default coordinates for AI generation purposes
    });
    const [expertiseInput, setExpertiseInput] = useState('');
    const [logoDescription, setLogoDescription] = useState('');
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
    
    const [locationsDropdownOpen, setLocationsDropdownOpen] = useState(false);
    const locationsRef = useRef<HTMLDivElement>(null);

    const [kraPinCertificate, setKraPinCertificate] = useState<string | null>(null);
    const [kraPinCertificateName, setKraPinCertificateName] = useState('');
    const [policeClearanceCertificate, setPoliceClearanceCertificate] = useState<string | null>(null);
    const [policeClearanceCertificateName, setPoliceClearanceCertificateName] = useState('');
    
    const [isTourProvider, setIsTourProvider] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    
    const [kraPin, setKraPin] = useState('');
    const [kraPinStatus, setKraPinStatus] = useState<'idle' | 'verifying' | 'verified' | 'error'>(isEditMode ? 'verified' : 'idle');
    const [kraPinMessage, setKraPinMessage] = useState('');
    const [verifiedTaxpayerName, setVerifiedTaxpayerName] = useState('');
    const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    useEffect(() => {
        if (isEditMode && initialData) {
            setData({
                ...initialData,
                businessName: initialData.name, // Map name to businessName for edit form consistency
                detailedServices: initialData.detailedServices && initialData.detailedServices.length > 0 ? initialData.detailedServices.map((s,i) => ({ ...s, id: s.id || `ds-init-${Date.now()}-${i}` })) : [{ id: `ds-${Date.now()}`, name: '', description: '', price: ''}],
                // Ensure coordinates are set for existing providers if editing
                latitude: initialData.coordinates?.lat || LOCATION_COORDINATES[initialData.locations?.[0] || Location.NAIROBI].lat,
                longitude: initialData.coordinates?.lon || LOCATION_COORDINATES[initialData.locations?.[0] || Location.NAIROBI].lon,
            });
            setKraPin(initialData.kraPin || '');
            if (initialData.expertise) setExpertiseInput(initialData.expertise.join(', '));
            // In a real app, you'd fetch document status, not the files directly
            // For demo: assume they are "on file" if editing
            setKraPinCertificateName("kra_certificate.pdf"); 
            setPoliceClearanceCertificateName("police_clearance.pdf");
            setAgreedToTerms(true);
            if (initialData.kraPin) { // If KRA PIN exists, mark as verified
                setKraPinStatus('verified');
                setVerifiedTaxpayerName("Verified Taxpayer"); // Placeholder
                setKraPinMessage("PIN Verified Successfully.");
            }
        } else {
            // Set initial coordinates to selected location for new providers
            const defaultLoc = LOCATIONS[0];
            setData(prev => ({ 
                ...prev, 
                latitude: LOCATION_COORDINATES[defaultLoc].lat, 
                longitude: LOCATION_COORDINATES[defaultLoc].lon,
                detailedServices: [{ id: `ds-${Date.now()}`, name: '', description: '', price: '' }],
            }));
        }
    }, [isEditMode, initialData]);

    useEffect(() => {
        setIsTourProvider(TOUR_SERVICES.includes(data.category as ServiceCategory));
        // Update coordinates if category changes to a location-specific tour
        if (data.category && data.locations && data.locations.length > 0) {
            const firstLocation = data.locations[0];
            const coords = LOCATION_COORDINATES[firstLocation];
            setData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }));
        }
    }, [data.category, data.locations]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (locationsRef.current && !locationsRef.current.contains(event.target as Node)) {
                setLocationsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationToggle = (location: Location) => {
        setData(prev => {
            const currentLocations = prev.locations || [];
            const newLocations = currentLocations.includes(location)
                ? currentLocations.filter(l => l !== location)
                : [...currentLocations, location];
            // When locations change, update the first coordinate as a representative for the AI
            if (newLocations.length > 0) {
                const newCoords = LOCATION_COORDINATES[newLocations[0]];
                return { ...prev, locations: newLocations, latitude: newCoords.lat, longitude: newCoords.lon };
            }
            return { ...prev, locations: newLocations };
        });
    };
    
    const handleVerifyPin = async () => {
        if (!kraPin) return;
        setKraPinStatus('verifying'); setKraPinMessage('');
        const result = await verifyKraPin(kraPin); // Uses mock KRA service
        if (result.success) {
            setKraPinStatus('verified');
            setVerifiedTaxpayerName(result.details?.taxpayerName || '');
            setKraPinMessage(result.message);
            // KRA PIN will be passed to `onComplete`
        } else {
            setKraPinStatus('error');
            setKraPinMessage(result.message);
        }
    };

    const handleKraFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const dataUrl = await fileToDataUrl(file);
                setKraPinCertificate(dataUrl);
                setKraPinCertificateName(file.name);
            } catch (error) {
                toast.error("Failed to read KRA certificate file.");
            }
        }
    };

    const handlePoliceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const dataUrl = await fileToDataUrl(file);
                setPoliceClearanceCertificate(dataUrl);
                setPoliceClearanceCertificateName(file.name);
            } catch (error) {
                toast.error("Failed to read police clearance file.");
            }
        }
    };

    const handleAiGenerateProfile = async () => {
        if (!data.businessName || !data.category) {
            toast.error("Please enter a business name and select a category first.");
            return;
        }
        setIsGeneratingProfile(true);
        try {
            const result = await api.generateProviderProfile(data.businessName, data.category);
            setData(prev => ({ ...prev, description: result.description, coverImageUrl: result.coverImageUrl }));
            setExpertiseInput(result.expertise.join(', '));
            toast.success("AI has generated your profile details & cover image!");
        } catch (error) {
            console.error("AI profile generation error:", error);
            toast.error("Could not generate details. Please try again.");
        } finally {
            setIsGeneratingProfile(false);
        }
    }
    
    const handleAiGenerateLogo = async () => {
        if (!logoDescription) {
            toast.error("Please describe the logo you want.");
            return;
        }
        setIsGeneratingLogo(true);
        try {
            const imageUrl = await api.generateLogoImage(logoDescription);
            setData(prev => ({ ...prev, logoUrl: imageUrl }));
            toast.success("Your AI-powered logo has been generated!");
        } catch (error) {
            console.error("AI logo generation error:", error);
            toast.error("Could not generate logo. Please try a different description.");
        } finally {
            setIsGeneratingLogo(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const expertiseArray = expertiseInput.split(',').map(s => s.trim()).filter(Boolean);
            const finalData: Partial<ServiceProvider & NewProviderData> = { 
                ...data, 
                kraPin: kraPin, 
                expertise: expertiseArray,
                detailedServices: (data.detailedServices || []).filter(ds => ds.name && ds.description),
                coverImageUrl: data.coverImageUrl || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&h=400&fit=crop', // Default fallback
                logoUrl: data.logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.businessName || 'Provider')}&background=007A33&color=fff&size=128`,
                businessName: data.businessName || data.name,
            };

            if (!isEditMode) {
                 if (!kraPinCertificate || !policeClearanceCertificate) {
                    toast.error("Please upload all required documents.");
                    setIsLoading(false);
                    return;
                }
                finalData.kraPinCertificate = kraPinCertificate;
                finalData.policeClearanceCertificate = policeClearanceCertificate;
            }

            await onComplete(finalData as (NewProviderData & Partial<ServiceProvider>), pendingUser);
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Failed to save provider details. Please ensure all required fields are filled.");
        } finally {
            setIsLoading(false);
        }
    };

    const totalSteps = 2;
    // Step 1 validation
    const isStep1Valid = !!(data.businessName && (isEditMode || (kraPinCertificate && policeClearanceCertificate)) && kraPinStatus === 'verified');
    // Step 2 validation
    const isStep2Valid = !!(data.category && data.locations && data.locations.length > 0 && data.description && data.hourlyRate && data.hourlyRate > 0 && data.logoUrl);

    const ProgressBar = () => {
        const steps = ["Business Info", "Service Details"];
        return (
             <nav aria-label="Progress">
                <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
                    {steps.map((name, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = step > stepNumber;
                        const isCurrent = step === stepNumber;
                        return (
                            <li key={name} className="md:flex-1">
                                <div className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pl-0 md:pt-4 md:pb-0 ${
                                    isCompleted ? 'border-primary' : isCurrent ? 'border-primary' : 'border-gray-200'
                                }`}>
                                    <span className={`text-sm font-semibold uppercase ${isCompleted || isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                                        Step {stepNumber}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">{name}</span>
                                </div>
                            </li>
                        )
                    })}
                </ol>
            </nav>
        )
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="provider-reg-title">
                <div className="p-6 relative flex-shrink-0">
                    <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}><CloseIcon className="w-6 h-6" /></button>
                    <h2 id="provider-reg-title" className="text-2xl font-bold text-center text-gray-800 mb-2">{isEditMode ? 'Edit Your Provider Profile' : 'Become a V-Ken Serve Provider'}</h2>
                    <p className="text-center text-gray-600 mb-6">{isEditMode ? 'Update your service details below.' : 'Complete the steps below to list your services.'}</p>
                    {!isEditMode && <ProgressBar />}
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto px-6 pb-6">
                    {/* Step 1: Business & Legal */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label><input type="text" name="businessName" value={data.businessName || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., Nairobi Best Plumbers" required /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
                                <div className="flex items-center space-x-2">
                                    <input type="text" value={kraPin} onChange={(e) => { setKraPin(e.target.value.toUpperCase()); setKraPinStatus('idle'); }} className="w-full p-2 border border-gray-300 rounded-md font-mono" placeholder="A000000000B" required disabled={kraPinStatus === 'verified'}/>
                                    <button type="button" onClick={handleVerifyPin} disabled={kraPinStatus === 'verifying' || kraPinStatus === 'verified'} className="px-4 py-2 border border-primary text-primary text-sm font-semibold rounded-md hover:bg-primary hover:text-white disabled:opacity-50 flex-shrink-0">
                                        {kraPinStatus === 'verifying' ? 'Verifying...' : (kraPinStatus === 'verified' ? <CheckIcon className="w-5 h-5" /> : 'Verify')}
                                    </button>
                                </div>
                                {kraPinStatus === 'verified' && <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded-md flex items-center"><CheckIcon className="w-5 h-5 mr-2"/><div><strong>{verifiedTaxpayerName}</strong> - {kraPinMessage}</div></div>}
                                {kraPinStatus === 'error' && <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md flex items-center"><WarningIcon className="w-5 h-5 mr-2"/>{kraPinMessage}</div>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <FileInput 
                                    label="KRA PIN Certificate"
                                    selectedFileName={kraPinCertificateName}
                                    onChange={handleKraFileChange}
                                    required={!isEditMode}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <FileInput 
                                    label="Police Clearance Certificate"
                                    selectedFileName={policeClearanceCertificateName}
                                    onChange={handlePoliceFileChange}
                                    required={!isEditMode}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Service Details */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-end">
                                <button type="button" onClick={handleAiGenerateProfile} disabled={isGeneratingProfile} className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary-light/40 hover:bg-primary-light/70 px-3 py-2 rounded-lg disabled:opacity-60">
                                    {isGeneratingProfile ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div> : <SparklesIcon className="w-4 h-4"/>}
                                    Generate Profile with AI
                                </button>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Category</label><select name="category" value={data.category || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" required><option value="" disabled>Select a category</option>{PROVIDER_REGISTRABLE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                <div ref={locationsRef} className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Locations</label>
                                    <button type="button" onClick={() => setLocationsDropdownOpen(!locationsDropdownOpen)} className="w-full p-2 border border-gray-300 rounded-md text-left flex justify-between items-center"><span className="truncate">{data.locations?.join(', ') || 'Select locations'}</span><span>▼</span></button>
                                    {locationsDropdownOpen && <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">{LOCATIONS.map(loc => <div key={loc} onClick={() => handleLocationToggle(loc)} className={`p-2 cursor-pointer hover:bg-gray-100 flex items-center ${data.locations?.includes(loc) ? 'font-semibold text-primary' : ''}`}>{data.locations?.includes(loc) && <CheckIcon className="w-4 h-4 mr-2"/>}{loc}</div>)}</div>}
                                </div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label><textarea name="description" value={data.description || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" rows={3} placeholder="Describe your services, experience, and what makes you unique." required /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (KES)</label><input type="number" name="hourlyRate" value={data.hourlyRate || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., 1500" required /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Expertise (comma-separated)</label><input type="text" value={expertiseInput} onChange={(e) => setExpertiseInput(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="e.g., Leak repair, Drain unblocking" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
                                    <div className="relative w-28 h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                        {data.logoUrl ? <img src={data.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg"/> : <CameraIcon className="w-10 h-10 text-gray-400"/>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={logoDescription} onChange={(e) => setLogoDescription(e.target.value)} className="w-full p-2 text-sm border border-gray-300 rounded-md" placeholder="Describe a logo..."/>
                                        <button type="button" onClick={handleAiGenerateLogo} disabled={isGeneratingLogo} className="p-2 bg-primary text-white rounded-md disabled:bg-gray-400">
                                            {isGeneratingLogo ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SparklesIcon className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                                    <div className="relative w-full h-28 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                        {data.coverImageUrl ? <img src={data.coverImageUrl} alt="Cover" className="w-full h-full object-cover rounded-lg"/> : <CameraIcon className="w-10 h-10 text-gray-400"/>}
                                    </div>
                                </div>
                            </div>
                            <ServicesManagementTab 
                                provider={data} 
                                onSave={(services) => setData(prev => ({...prev, detailedServices: services}))}
                            />
                        </div>
                    )}

                    {!isEditMode && step === totalSteps && (
                        <div className="mt-6 flex items-start">
                            <input id="terms" name="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1" />
                            <div className="ml-2 text-sm"><label htmlFor="terms" className="text-gray-600">I have read and agree to the <a href="#" onClick={(e) => { e.preventDefault(); onShowTerms('provider'); }} className="font-medium text-primary hover:underline">Provider Agreement</a> and <a href="#" onClick={(e) => { e.preventDefault(); onShowTerms('privacy'); }} className="font-medium text-primary hover:underline">Privacy Policy</a>.</label></div>
                        </div>
                    )}
                </form>
                <div className="p-6 flex-shrink-0 flex justify-between items-center bg-gray-50 border-t mt-6">
                    {step > 1 ? (<button type="button" onClick={handleBack} disabled={isLoading} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">Back</button>) : <div></div>}
                    {step < totalSteps ? (<button type="button" onClick={handleNext} disabled={!isStep1Valid || isLoading} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800 disabled:bg-gray-400">Next</button>) : (<button type="submit" onClick={handleSubmit} disabled={!isStep2Valid || !agreedToTerms || isLoading} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800 disabled:bg-gray-400 flex items-center">
                        {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>}
                        {isEditMode ? 'Save Changes' : 'Complete Registration'}
                    </button>)}
                </div>
            </div>
        </div>
    );
};

export default ProviderRegistrationModal;