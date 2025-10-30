import React from 'react';

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };
  
  const iconSizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
  };

  return (
    <div 
      className={`inline-flex items-center gap-1 bg-green-100 text-primary font-semibold rounded-full ${sizeClasses[size]} ${className}`}
      title="This provider has completed the verification process."
    >
      <CheckCircleIcon className={iconSizeClasses[size]} />
      <span>Verified</span>
    </div>
  );
};

export default VerifiedBadge;
