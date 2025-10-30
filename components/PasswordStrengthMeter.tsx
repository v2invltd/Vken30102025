
import React from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;

    // Award points for different criteria
    if (pass.length > 5) score++;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    return score;
  };

  const score = calculateStrength(password);
  
  const getStrengthLabel = () => {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Medium';
      case 4:
        return 'Strong';
      case 5:
        return 'Very Strong';
      default:
        return '';
    }
  };
  
  const getBarColor = (index: number) => {
    if (score > index) {
      switch (score) {
        case 0:
        case 1:
        case 2:
          return 'bg-red-500';
        case 3:
          return 'bg-yellow-500';
        case 4:
        case 5:
          return 'bg-green-500';
        default:
          return 'bg-gray-200';
      }
    }
    return 'bg-gray-200';
  };

  if (!password) {
    return null; // Don't show the meter if there's no password
  }

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex justify-between items-center mb-1">
        <p className={`text-xs font-semibold ${
          score <= 2 ? 'text-red-600' : (score === 3 ? 'text-yellow-600' : 'text-green-600')
        }`}>
          {getStrengthLabel()}
        </p>
      </div>
      <div className="flex space-x-1">
        {Array.from(Array(5).keys()).map(index => (
          <div key={index} className="h-1 flex-1 rounded-full transition-colors duration-300">
            <div className={`h-full rounded-full ${getBarColor(index)}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
