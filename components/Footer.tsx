

import React from 'react';
import { Location } from '../types';
import { LOCATIONS } from '../constants';
import { LegalDocType } from '../types';
import { Logo } from './Logo';

interface FooterProps {
  onSelectLocation: (location: Location) => void;
  onShowTerms: (type: LegalDocType) => void;
  onGoHome: () => void;
}

const Footer: React.FC<FooterProps> = ({ onSelectLocation, onShowTerms, onGoHome }) => {
  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onGoHome();
              }}
              className="inline-block mb-4"
              aria-label="V-Ken Serve Home"
            >
              <Logo className="h-9" />
            </a>
            <p className="text-gray-400">Connecting you with the best local service providers across Kenya.</p>
             <div className="mt-4">
              <h4 className="font-semibold mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">About Us</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" onClick={(e) => { e.preventDefault(); onShowTerms('customer'); }} className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onShowTerms('provider'); }} className="hover:text-white">Provider Agreement</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onShowTerms('privacy'); }} className="hover:text-white">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Home Services</a></li>
              <li><a href="#" className="hover:text-white">Corporate Services</a></li>
              <li><a href="#" className="hover:text-white">Kenya Tours</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Locations</h4>
            <ul className="space-y-2 text-gray-400">
              {LOCATIONS.map(location => (
                  <li key={location}>
                      <a 
                          href="#" 
                          className="hover:text-white"
                          onClick={(e) => {
                              e.preventDefault();
                              onSelectLocation(location);
                              window.scrollTo(0, 0);
                          }}
                      >
                          {location}
                      </a>
                  </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500">
          &copy; {new Date().getFullYear()} V-Ken Serve. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);