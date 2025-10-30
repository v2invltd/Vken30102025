import React, { useState, useRef, useEffect } from 'react';
import { User, Location, ServiceCategory, UserRole } from '../types';
import { LOCATIONS, HOME_SERVICES, CORPORATE_SERVICES, LOCATION_SPECIFIC_TOUR_DETAILS } from '../constants';
import { LocationIcon, MenuIcon, CloseIcon, GlobeIcon } from './IconComponents';
import { Logo } from './Logo';
import { useAppContext, AppView } from '../contexts/AppContext';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {}

const UserDropdown: React.FC<{ user: User, onLogout: () => void, onMyBookings: () => void, onMyProfile: () => void, onDashboard: () => void, isMobile?: boolean }> = ({ user, onLogout, onMyBookings, onMyProfile, onDashboard, isMobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLinkClick = (action: () => void) => {
        action();
        setIsOpen(false);
    }
    
    if (isMobile) {
        return (
            <div className="text-left p-4">
                <p className="font-semibold text-gray-800">Welcome, {user.name}</p>
                <p className="text-sm text-gray-500 mb-3">{user.email}</p>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(onMyProfile); }} className="block py-2 text-gray-700 hover:text-primary">My Profile</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(onMyBookings); }} className="block py-2 text-gray-700 hover:text-primary">My Bookings</a>
                {user.role === UserRole.PROVIDER && <a href="#" onClick={(e) => {e.preventDefault(); handleLinkClick(onDashboard)}} className="block py-2 font-semibold text-primary hover:text-green-800">Provider Dashboard</a>}
                <div className="border-t border-gray-200 my-2"></div>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(onLogout); }} className="block py-2 text-red-600 hover:text-red-800">Logout</a>
            </div>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                <span>Welcome, {user.name.split(' ')[0]}</span>
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(onMyProfile); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Profile</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(onMyBookings); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Bookings</a>
                    {user.role === UserRole.PROVIDER && <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(onDashboard); }} className="block px-4 py-2 text-sm font-semibold text-primary hover:bg-gray-100">Provider Dashboard</a>}
                    <div className="border-t border-gray-100 my-1"></div>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(onLogout); }} className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</a>
                </div>
            )}
        </div>
    );
};


const MobileAccordion: React.FC<{ title: string; id: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }> = ({ title, id, isOpen, onToggle, children }) => {
    return (
        <div className="border-b border-gray-200">
            <button 
                onClick={onToggle} 
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`accordion-panel-${id}`}
            >
                <span>{title}</span>
                <svg className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div
                id={`accordion-panel-${id}`}
                role="region"
                aria-labelledby={`accordion-header-${id}`}
                hidden={!isOpen}
                className="pl-4 pr-2 py-2 bg-gray-50 animate-fade-in"
            >
                {children}
            </div>
        </div>
    )
}

const Header: React.FC<HeaderProps> = ({}) => {
  const { state, dispatch } = useAppContext();
  const { currentUser: user, selectedLocation } = state;
  const {
    onLoginClick,
    onLogoutClick,
    onSelectLocation,
    onSelectCategory,
    onMyBookingsClick,
    onMyProfileClick,
    onDashboardClick,
    onLocalHubClick,
  } = {
    onLoginClick: () => dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth' } }),
    onLogoutClick: () => dispatch({ type: 'LOGOUT' }),
    onSelectLocation: (location: Location) => dispatch({ type: 'SET_LOCATION', payload: location }),
    onSelectCategory: (category: ServiceCategory) => {
        if (!user) {
            dispatch({ type: 'SET_POST_LOGIN_ACTION', payload: () => onSelectCategory(category) });
            dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth', props: { promptMessage: 'Please log in or register to view service providers.' } } });
            return;
        }
        dispatch({ type: 'SET_VIEW', payload: AppView.SEARCH });
        dispatch({ type: 'SET_ACTIVE_SEARCH_CATEGORY', payload: category });
    },
    onMyBookingsClick: () => dispatch({ type: 'SET_VIEW', payload: AppView.MY_BOOKINGS }),
    onMyProfileClick: () => dispatch({ type: 'SET_VIEW', payload: AppView.PROFILE }),
    onDashboardClick: () => dispatch({ type: 'SET_VIEW', payload: AppView.PROVIDER_DASHBOARD }),
    onLocalHubClick: () => dispatch({ type: 'SET_VIEW', payload: AppView.LOCAL_HUB }),
  };


  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const [isHomeServicesOpen, setIsHomeServicesOpen] = useState(false);
  const [isCorporateServicesOpen, setIsCorporateServicesOpen] = useState(false);
  const [isTourServicesOpen, setIsTourServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileAccordion, setOpenMobileAccordion] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableTourServices = selectedLocation && LOCATION_SPECIFIC_TOUR_DETAILS[selectedLocation]
    ? Object.keys(LOCATION_SPECIFIC_TOUR_DETAILS[selectedLocation]) as ServiceCategory[]
    : [];
  
  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLocationsOpen(false);
        setIsHomeServicesOpen(false);
        setIsCorporateServicesOpen(false);
        setIsTourServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto' };
  }, [isMobileMenuOpen]);


  const handleCategoryClick = (category: ServiceCategory) => {
      onSelectCategory(category);
      setIsMobileMenuOpen(false);
  }

  const handleLocationSelect = (location: Location) => {
      onSelectLocation(location);
      setIsMobileMenuOpen(false);
  }
  
  const handleLoginClick = () => {
    onLoginClick();
    setIsMobileMenuOpen(false);
  }
  
  const handleLocalHubClick = () => {
    onLocalHubClick();
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      {/* Main Header Bar */}
      <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <a href="/" onClick={(e) => { e.preventDefault(); dispatch({ type: 'SET_VIEW', payload: AppView.HOME }); }} className="rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" aria-label="V-Ken Serve Home">
          <Logo />
        </a>
        
        {/* Desktop Navigation */}
        <div ref={dropdownRef} className="hidden md:flex items-center space-x-6">
          <nav className="flex items-center space-x-4">
            <div className="flex items-center text-gray-700">
              <LocationIcon className="w-5 h-5 mr-1 text-primary" />
              <span className="font-medium text-sm">{selectedLocation || 'Select City'}</span>
            </div>
            
            {/* Home Services Dropdown */}
            <div className="relative">
              <button onClick={() => setIsHomeServicesOpen(!isHomeServicesOpen)} className="text-gray-600 hover:text-primary transition-colors flex items-center text-sm">
                  Home Service
                  <svg className={`w-4 h-4 ml-1 transition-transform ${isHomeServicesOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {isHomeServicesOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      {HOME_SERVICES.map(category => (<a key={category} href="#" onClick={(e) => { e.preventDefault(); onSelectCategory(category); setIsHomeServicesOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{category}</a>))}
                  </div>
              )}
            </div>

            {/* Corporate Services Dropdown */}
            <div className="relative">
                <button onClick={() => setIsCorporateServicesOpen(!isCorporateServicesOpen)} className="text-gray-600 hover:text-primary transition-colors flex items-center text-sm">Corporate Service
                    <svg className={`w-4 h-4 ml-1 transition-transform ${isCorporateServicesOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {isCorporateServicesOpen && (<div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">{CORPORATE_SERVICES.map(category => (<a key={category} href="#" onClick={(e) => { e.preventDefault(); onSelectCategory(category); setIsCorporateServicesOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{category}</a>))}</div>)}
            </div>
            
            {/* Tourism Dropdown */}
            <div className="relative">
              <button onClick={() => setIsTourServicesOpen(!isTourServicesOpen)} className="text-gray-600 hover:text-primary transition-colors flex items-center text-sm disabled:text-gray-400 disabled:cursor-not-allowed" disabled={availableTourServices.length === 0}>Tourism
                  <svg className={`w-4 h-4 ml-1 transition-transform ${isTourServicesOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {isTourServicesOpen && (<div className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">{availableTourServices.length > 0 ? (availableTourServices.map(category => (<a key={category} href="#" onClick={(e) => { e.preventDefault(); onSelectCategory(category); setIsTourServicesOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{category}</a>))) : (<span className="block px-4 py-2 text-sm text-gray-500 italic">No tours for this city</span>)}</div>)}
            </div>
            
            {/* Locations Dropdown */}
            <div className="relative">
              <button onClick={() => setIsLocationsOpen(!isLocationsOpen)} className="text-gray-600 hover:text-primary transition-colors flex items-center text-sm">Locations
                  <svg className={`w-4 h-4 ml-1 transition-transform ${isLocationsOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {isLocationsOpen && (<div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">{LOCATIONS.map(location => (<a key={location} href="#" onClick={(e) => { e.preventDefault(); onSelectLocation(location); setIsLocationsOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{location}</a>))}</div>)}
            </div>
          </nav>
            <div className="flex items-center space-x-4">
                <button onClick={onLocalHubClick} className="p-2 text-gray-600 hover:text-primary rounded-full hover:bg-gray-100 transition-colors" title="Local Hub">
                    <GlobeIcon className="w-6 h-6" />
                </button>
                {user ? (
                    <>
                        <NotificationBell />
                        <UserDropdown user={user} onLogout={onLogoutClick} onMyBookings={onMyBookingsClick} onMyProfile={onMyProfileClick} onDashboard={onDashboardClick} />
                    </>
                ) : (
                    <button onClick={onLoginClick} className="bg-primary text-white px-3 py-2 text-sm rounded-md hover:bg-green-800 transition-colors">Login / Register</button>
                )}
            </div>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
            {user && <NotificationBell />}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-primary p-2 z-50 relative">
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel (Slide-out) */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex-grow overflow-y-auto">
          <div className="p-4 flex items-center bg-gray-50 border-b">
            <LocationIcon className="w-5 h-5 mr-2 text-primary" />
            <span className="font-semibold text-gray-800">Serving in: {selectedLocation || 'N/A'}</span>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLocalHubClick(); }} className="flex items-center p-4 font-semibold text-gray-700 hover:bg-gray-50 border-b">
            <GlobeIcon className="w-6 h-6 mr-3 text-primary" />
            Local Hub
          </a>
          <MobileAccordion title="Home Services" id="home" isOpen={openMobileAccordion === 'home'} onToggle={() => setOpenMobileAccordion(openMobileAccordion === 'home' ? null : 'home')}>
            {HOME_SERVICES.map(cat => <a key={cat} href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(cat); }} className="block p-2 text-sm text-gray-700 hover:bg-gray-100 rounded">{cat}</a>)}
          </MobileAccordion>
          <MobileAccordion title="Corporate Services" id="corp" isOpen={openMobileAccordion === 'corp'} onToggle={() => setOpenMobileAccordion(openMobileAccordion === 'corp' ? null : 'corp')}>
            {CORPORATE_SERVICES.map(cat => <a key={cat} href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(cat); }} className="block p-2 text-sm text-gray-700 hover:bg-gray-100 rounded">{cat}</a>)}
          </MobileAccordion>
          <MobileAccordion title="Tourism" id="tour" isOpen={openMobileAccordion === 'tour'} onToggle={() => setOpenMobileAccordion(openMobileAccordion === 'tour' ? null : 'tour')}>
            {availableTourServices.length > 0 ? availableTourServices.map(cat => <a key={cat} href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick(cat); }} className="block p-2 text-sm text-gray-700 hover:bg-gray-100 rounded">{cat}</a>) : <span className="p-2 text-sm text-gray-500 italic">No tours for this city</span>}
          </MobileAccordion>
           <MobileAccordion title="Change Location" id="loc" isOpen={openMobileAccordion === 'loc'} onToggle={() => setOpenMobileAccordion(openMobileAccordion === 'loc' ? null : 'loc')}>
            {LOCATIONS.map(loc => <a key={loc} href="#" onClick={(e) => { e.preventDefault(); handleLocationSelect(loc); }} className="block p-2 text-sm text-gray-700 hover:bg-gray-100 rounded">{loc}</a>)}
          </MobileAccordion>
        </div>
        <div className="border-t flex-shrink-0">
              {user ? (<UserDropdown user={user} onLogout={() => { onLogoutClick(); setIsMobileMenuOpen(false); }} onMyBookings={() => { onMyBookingsClick(); setIsMobileMenuOpen(false); }} onMyProfile={() => { onMyProfileClick(); setIsMobileMenuOpen(false); }} onDashboard={() => { onDashboardClick(); setIsMobileMenuOpen(false); }} isMobile={true} />) : (<div className="p-4"><button onClick={handleLoginClick} className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:bg-green-800 transition-colors">Login / Register</button></div>)}
        </div>
      </div>
    </header>
  );
};

export default Header;