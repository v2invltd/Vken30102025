import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = 'h-10' }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <svg 
      viewBox="0 0 100 120" 
      xmlns="http://www.w3.org/2000/svg" 
      className="h-full w-auto" 
      aria-labelledby="logoTitle logoDesc"
      role="img"
    >
      <title id="logoTitle">V-Ken Serve Logo</title>
      <desc id="logoDesc">A modern shield logo with the colors of the Kenyan flag (black, red, green) and a stylized bold, green 'V' with a white outline in the center.</desc>
      
      <defs>
        <path id="shieldPath" d="M50 0 L100 25 V80 C100 100 50 120 50 120 C50 120 0 100 0 80 V25 L50 0 Z" />
        <clipPath id="shieldClip">
            <use href="#shieldPath" />
        </clipPath>
      </defs>

      <g clipPath="url(#shieldClip)">
          <rect x="0" y="0" width="100" height="40" fill="#000000" />
          <rect x="0" y="40" width="100" height="40" fill="#BB2525" />
          <rect x="0" y="80" width="100" height="40" fill="#007A33" />
          <rect x="0" y="38" width="100" height="4" fill="#FFFFFF" />
          <rect x="0" y="78" width="100" height="4" fill="#FFFFFF" />
      </g>
      
      <g>
          <path d="M25 20 L50 80 L75 20" fill="none" stroke="white" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M25 20 L50 80 L75 20" fill="none" stroke="#007A33" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      
      <use href="#shieldPath" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />

    </svg>
    <span className="text-2xl font-bold text-primary">
      V-Ken <span className="font-medium text-secondary">Serve</span>
    </span>
  </div>
);