

import React from 'react';
import { ServiceCategory } from '../types';

export const LocationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const StarIcon: React.FC<{ className?: string, filled?: boolean }> = ({ className, filled = true }) => {
    if (filled) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        )
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.31h5.418c.504 0 .709.658.336 1.003l-4.38 3.185a.563.563 0 00-.223.57l1.624 5.33c.184.604-.478 1.097-1.01.74l-4.83-3.513a.563.563 0 00-.626 0l-4.83 3.513c-.533.357-1.194-.136-1.01-.74l1.624-5.33a.563.563 0 00-.223-.57l-4.38-3.185c-.373-.345-.168-1.003.336-1.003h5.418a.563.563 0 00.475-.31L11.48 3.5z" />
        </svg>
    )
};

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l-1.293 1.293a1 1 0 01-1.414 0L8 10.707l-2.293 2.293a1 1 0 01-1.414 0L2 10.707M16 5l2.293-2.293a1 1 0 011.414 0L22 5" />
    </svg>
);

export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

export const MpesaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
        <path d="M128 25.6c-56.32 0-102.4 46.08-102.4 102.4s46.08 102.4 102.4 102.4 102.4-46.08 102.4-102.4S184.32 25.6 128 25.6zm0 194.56c-51.2 0-92.16-40.96-92.16-92.16S76.8 35.84 128 35.84s92.16 40.96 92.16 92.16-40.96 92.16-92.16 92.16z" fill="#4c4c4c"></path><path d="M123.392 73.728h18.432v108.544h-18.432z" fill="#4c4c4c"></path><path d="M96.256 182.272l-11.264-11.776 60.416-60.416 11.264 11.264z" fill="#4c4c4c"></path><path d="M169.472 170.496l11.264-11.264-60.416-60.416-11.264 11.264z" fill="#4c4c4c"></path>
    </svg>
);

export const AirtelMoneyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.5 4.80078L6 8.80078V16.8008L18.5 20.8008V4.80078Z" fill="#E41E26"></path>
        <path d="M5.5 16.8008V8.80078L18 4.80078V12.8008L5.5 16.8008Z" fill="#DA1C24"></path>
        <path d="M18.5 4.80078L6 8.80078V16.8008L18.5 20.8008V4.80078Z" stroke="white" strokeWidth="1.2"></path>
    </svg>
);

export const CardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export const PaystackIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.333 16.5V7.5H8.833V16.5H6.333ZM11.167 16.5V7.5H13.667V16.5H11.167ZM12.5 2C7.258 2 3 6.258 3 11.5C3 16.742 7.258 21 12.5 21C17.742 21 22 16.742 22 11.5C22 6.258 17.742 2 12.5 2ZM16 16.5V7.5H18.5V16.5H16Z" fill="#011B33"/>
    </svg>
);

export const FlutterwaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.333 12.002L12 22.668L22.666 12.002L12 1.335L1.333 12.002Z" fill="#F5A623"/>
        <path d="M1.333 12.002L12 22.668L14.666 20.002L6.666 12.002L1.333 12.002Z" fill="#F8B64C"/>
        <path d="M12 1.335L22.666 12.002L17.333 17.335L12 12.002L12 1.335Z" fill="#F5A623"/>
        <path d="M12 12.002L6.666 12.002L12 17.335L17.333 12.002H12Z" fill="#333333"/>
    </svg>
);

export const BankIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375a.375.375 0 01.375.375v1.5a.375.375 0 01-.375.375H9a.375.375 0 01-.375-.375v-1.5A.375.375 0 019 6.75zM9 12.75h6.375a.375.375 0 01.375.375v1.5a.375.375 0 01-.375.375H9a.375.375 0 01-.375-.375v-1.5A.375.375 0 019 12.75z" />
    </svg>
);

export const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

export const HeartIcon: React.FC<{ className?: string; filled?: boolean }> = ({ className, filled }) => {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );
};

export const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

export const MessageBubbleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
  </svg>
);

export const SuccessIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2-2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


export const ArrowUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
  </svg>
);

export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

export const MapIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 10V7m0 10l-6-3" />
  </svg>
);

export const ListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export const GlobeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.8 3.8A9 9 0 1 0 20.2 20.2A9 9 0 0 0 3.8 3.8Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 0 0 9-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 0 1 9-9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a15 15 0 0 1 5.2 10 15 15 0 0 1-10.4 0A15 15 0 0 1 12 2Z" />
    </svg>
);

export const LocalHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="45" />
    <path d="M20 70 A 30 30 0 0 1 80 70" />
    <path d="M25 40 A 25 25 0 0 1 75 40" />
  </svg>
);


// New Service Category Icon component
export const ServiceCategoryIcon: React.FC<{ category: ServiceCategory; className?: string }> = ({ category, className }) => {
    const renderIcon = () => {
        const props: React.SVGProps<SVGSVGElement> = {
            className: className,
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        };
        switch (category) {
            // Home Services
            case ServiceCategory.PLUMBING: return <svg {...props}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-2.5-4-2.5-6.5A4.5 4.5 0 0 0 12 3a4.5 4.5 0 0 0-1.5 8.5c0 2.5-1 4-2.5 5.5S5 13 5 15a7 7 0 0 0 7 7z" /></svg>;
            case ServiceCategory.CLEANING: return <svg {...props}><path d="M19 11.7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3" /><path d="m14.4 12.6 1.3 2.6 2.6 1.3-1.3-2.6-2.6-1.3" /><path d="m21.6 8.4-1.3-2.6-2.6-1.3 1.3 2.6 2.6 1.3" /><path d="M21 12.3v3.4c0 1.2-1.3 2-2.8 1.6l-2.9-.8c-.4-.1-.8-.4-1-.8l-2-2.3c-.2-.3-.2-.6 0-.9l.6-.8c.2-.3.5-.4.8-.4l3.1.2c.3 0 .6.2.8.5l1.9 2.1c.2.2.5.3.8.3H21Z" /></svg>;
            case ServiceCategory.HOUSE_KEEPING: return <svg {...props}><path d="M2 22a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2" /><path d="M20 16v-1a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1" /><path d="M20 12.5V8a2 2 0 0 0-2-2h-3.3a2 2 0 0 0-1.6.8L12 8l-1.1-1.2a2 2 0 0 0-1.6-.8H6a2 2 0 0 0-2 2v4.5" /></svg>;
            case ServiceCategory.PAINTING: return <svg {...props}><rect x="16" y="3" width="4" height="4" rx="2" /><rect x="8" y="3" width="4" height="4" rx="2" /><rect x="4" y="21" width="16" height="0" /><path d="M12 11v10" /><path d="M6 11h12" /><path d="M18 11a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h4z" /></svg>;
            case ServiceCategory.SPA: return <svg {...props}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-2.5-4-2.5-6.5A4.5 4.5 0 0 0 12 3a4.5 4.5 0 0 0-1.5 8.5c0 2.5-1 4-2.5 5.5S5 13 5 15a7 7 0 0 0 7 7z" /><path d="M16.2 7.8c.4.4.7.9.9 1.4" /><path d="M12 12a7.7 7.7 0 0 0-3.3-2.2" /><path d="M12 12a7.7 7.7 0 0 1 3.3-2.2" /><path d="M12 12v10" /><path d="M7.8 16.2c-.4-.4-.7-.9-.9-1.4" /></svg>;
            case ServiceCategory.APPLIANCE_REPAIR: return <svg {...props}><path d="M22 13h-4.32a1 1 0 1 0 0 2H22v-2Z" /><path d="M20 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11.32a1 1 0 1 0 0-2H4V7h16v2.17a1 1 0 1 0 2 0V7a2 2 0 0 0-2-2Z" /><path d="m16.5 10.5-2-2" /><path d="m19.5 7.5-2-2" /></svg>;
            case ServiceCategory.GARDENING_LANDSCAPING: return <svg {...props}><path d="M3 22v-4.172a2 2 0 0 1 .586-1.414L12 8l8.414 8.414A2 2 0 0 1 21 17.828V22" /><path d="M10 9a2 2 0 1 1-4 0" /><path d="M16 13a2 2 0 1 1-4 0" /></svg>;
            case ServiceCategory.ELECTRICIAN: return <svg {...props}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
            case ServiceCategory.PEST_CONTROL: return <svg {...props}><path d="M10 20v-5" /><path d="M14 20v-5" /><path d="M12 15a5 5 0 0 0-5-5h10a5 5 0 0 0-5 5z" /><path d="M18 10V8" /><path d="M6 10V8" /><path d="M12 10V4" /><path d="m16 4-2 2" /><path d="m8 4 2 2" /></svg>;
            case ServiceCategory.CARPENTRY: return <svg {...props}><path d="M12 22 2 12 12 2l10 10-10 10z" /><path d="m14 10-4 4" /><path d="m10 10 4 4" /><path d="M18 14 12 8" /></svg>;
            case ServiceCategory.INTERIOR_DESIGN: return <svg {...props}><path d="m2 16 2.31 3.11a2.2 2.2 0 0 0 3.38 0L10 16" /><path d="m22 16-2.31 3.11a2.2 2.2 0 0 1-3.38 0L14 16" /><path d="M10 2v14" /><path d="M14 2v14" /><path d="M12 2v20" /></svg>;
            case ServiceCategory.TUTORING_EDUCATION: return <svg {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
            case ServiceCategory.MOBILE_GARAGE: return <svg {...props}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9L2 12v5c0 .6.4 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>;
            
            // Corporate Services
            case ServiceCategory.FINANCIAL_SERVICES: return <svg {...props}><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>;
            case ServiceCategory.IT_SOLUTIONS: return <svg {...props}><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
            case ServiceCategory.LOGISTICS: return <svg {...props}><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" /><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
            case ServiceCategory.PROFESSIONAL_SERVICES: return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
            case ServiceCategory.EVENT_PLANNING: return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m12 14-1.5 1.5 1.5 1.5 1.5-1.5-1.5-1.5z" /></svg>;
            case ServiceCategory.PHOTOGRAPHY: return <svg {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
            case ServiceCategory.CATERING: return <svg {...props}><path d="M22 17H2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1c1 0 1-1 1-1h14s1 1 1 1h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2ZM11 2a1 1 0 1 1 2 0v5h-2V2Z" /></svg>;


            // Kenya Tours
            case ServiceCategory.WILDLIFE: return <svg {...props}><path d="M12 21c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8Z" /><path d="M12 21c4.4 0 8-3.6 8-8s-3.6-8-8-8-8 3.6-8 8 3.6 8 8 8Z" /><path d="M12 3a9 9 0 0 1 9 9" /><path d="M12 3a9 9 0 0 0-9 9" /><path d="M12 21a9 9 0 0 0 9-9" /><path d="M12 21a9 9 0 0 1-9-9" /><path d="M3 12h18" /><path d="M12 3v18" /></svg>;
            case ServiceCategory.BEACH_HOLIDAYS: return <svg {...props}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-2.5-4-2.5-6.5A4.5 4.5 0 0 0 12 3a4.5 4.5 0 0 0-1.5 8.5c0 2.5-1 4-2.5 5.5S5 13 5 15a7 7 0 0 0 7 7z" /><path d="M12 4.5v17.5" /><path d="M16 10c-4.5 4.5-8 8-10 10" /><path d="M20 14c-4.5-4.5-8-8-10-10" /></svg>;
            case ServiceCategory.MOUNTAIN_CLIMBING: return <svg {...props}><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>;
            case ServiceCategory.SAFARI_ADVENTURES: return <svg {...props}><circle cx="8" cy="12" r="3" /><circle cx="16" cy="12" r="3" /><path d="m18 12 4-4" /><path d="m6 12-4-4" /><path d="m11 6 2-2" /></svg>;
            case ServiceCategory.CULTURAL_TOURS: return <svg {...props}><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4 6h8a4 4 0 0 1-8 0z" /><path d="M10 14h4" /></svg>;
            case ServiceCategory.CITY_DAY_TRIPS: return <svg {...props}><path d="M2 22h20" /><path d="M4 14h2v6H4z" /><path d="M8 8h2v12H8z" /><path d="M12 12h2v8h-2z" /><path d="M16 4h2v16h-2z" /><path d="M20 18h2v2h-2z" /></svg>;


            default: return <svg {...props}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; // Default Info Icon
        }
    };

    return renderIcon();
};