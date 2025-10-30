import React, { useState, useRef, useEffect } from 'react';

const COUNTRIES = [
  { name: 'Kenya', code: '254', flag: '🇰🇪' },
  { name: 'United States', code: '1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '44', flag: '🇬🇧' },
  { name: 'Canada', code: '1', flag: '🇨🇦' },
  { name: 'Tanzania', code: '255', flag: '🇹🇿' },
  { name: 'Uganda', code: '256', flag: '🇺🇬' },
];

interface PhoneNumberInputProps {
  fullPhoneNumber: string;
  onPhoneNumberChange: (newNumber: string) => void;
  disabled?: boolean;
  allowedCountries?: string[];
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ fullPhoneNumber, onPhoneNumberChange, disabled, allowedCountries }) => {
  const displayCountries = allowedCountries ? COUNTRIES.filter(c => allowedCountries.includes(c.code)) : COUNTRIES;
  const isSingleCountry = displayCountries.length === 1;
  
  const [countryCode, setCountryCode] = useState(() => {
    if (isSingleCountry) {
        return displayCountries[0].code;
    }
    if (fullPhoneNumber) {
        for (const country of COUNTRIES) {
            if (fullPhoneNumber.startsWith(`+${country.code}`)) {
                return country.code;
            }
        }
    }
    return '254';
  });

  const [nationalNumber, setNationalNumber] = useState(() => {
     if (fullPhoneNumber && fullPhoneNumber.startsWith(`+${countryCode}`)) {
        return fullPhoneNumber.substring(countryCode.length + 1);
     }
     return '';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleNationalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNationalNumber = e.target.value.replace(/\D/g, ''); // Allow only digits
    setNationalNumber(newNationalNumber);
    onPhoneNumberChange(`+${countryCode}${newNationalNumber}`);
  };
  
  const handleCountryChange = (code: string) => {
    setCountryCode(code);
    setIsDropdownOpen(false);
    onPhoneNumberChange(`+${code}${nationalNumber}`);
  };

  return (
    <div className="flex">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled || isSingleCountry}
          className="inline-flex items-center px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-200"
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
        >
          <span>{selectedCountry.flag}</span>
          <span className="ml-2 font-semibold text-gray-700">+{selectedCountry.code}</span>
          {!isSingleCountry && (
            <svg className="-mr-1 ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        {isDropdownOpen && !isSingleCountry && (
          <ul
            className="absolute z-10 mt-1 w-56 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
            tabIndex={-1}
            role="listbox"
          >
            {displayCountries.map(country => (
              <li
                key={country.name}
                onClick={() => handleCountryChange(country.code)}
                className="text-gray-900 relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-gray-100"
                role="option"
                aria-selected={country.code === countryCode}
              >
                <div className="flex items-center">
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-normal ml-3 block truncate">{country.name} (+{country.code})</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        type="tel"
        placeholder={selectedCountry.code === '254' ? '712 345 678' : 'National number'}
        value={nationalNumber}
        onChange={handleNationalNumberChange}
        disabled={disabled}
        className="w-full p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary focus:z-10 focus:outline-none"
        required
      />
    </div>
  );
};

export default PhoneNumberInput;