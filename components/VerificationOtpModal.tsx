import React, { useState, useEffect } from 'react';
import { CloseIcon } from './IconComponents';

interface VerificationOtpModalProps {
  verificationType: 'Phone' | 'Email' | 'WhatsApp';
  identifier: string;
  onClose: () => void;
  onVerified: () => void;
}

const VerificationOtpModal: React.FC<VerificationOtpModalProps> = ({ verificationType, identifier, onClose, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(300);
  const correctOtp = '1234'; // Hardcoded for demo

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [resendCooldown]);


  const handleResend = () => {
    // In a real app, trigger an API call to resend the OTP here
    console.log(`Resending OTP to ${identifier} via ${verificationType}`);
    setResendCooldown(300); // Reset the cooldown
    setError(''); // Clear any previous errors
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === correctOtp) {
      setError('');
      onVerified();
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  const getTitle = () => {
    switch (verificationType) {
        case 'WhatsApp': return 'Verify Your WhatsApp Number';
        case 'Email': return 'Verify Your Email';
        case 'Phone': return 'Verify Your Phone';
    }
  }

  const getMessage = () => {
    let method = verificationType === 'Phone' ? 'SMS' : verificationType;
     return `An OTP has been sent to your ${method} at`;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {getTitle()}
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {getMessage()} <span className="font-semibold">{identifier}</span>.
            <br />
            <span className="text-xs italic">(For this demo, please use <strong className="font-mono">1234</strong>)</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
              maxLength={4}
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors">
              Verify
            </button>
          </form>
          <div className="mt-6 text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in {String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:{String(resendCooldown % 60).padStart(2, '0')}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-primary font-semibold hover:underline focus:outline-none"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationOtpModal;
