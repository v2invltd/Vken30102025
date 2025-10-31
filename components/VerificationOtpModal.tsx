import React, { useState, useEffect } from 'react';
import { CloseIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';

interface VerificationOtpModalProps {
  verificationType: 'WhatsApp';
  identifier: string;
  onVerified: () => void;
}

const VerificationOtpModal: React.FC<VerificationOtpModalProps> = ({ verificationType, identifier, onVerified }) => {
  const { dispatch } = useAppContext();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const correctOtp = '1234'; // Hardcoded for demo

  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);


  const handleResend = () => {
    console.log(`Resending OTP to ${identifier} via ${verificationType}`);
    setResendCooldown(60);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (otp.trim() === correctOtp) {
      setError('');
      setIsLoading(true);
      onVerified();
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };
  
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Only allow numbers and max 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
        setOtp(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}>
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Verify Your Number
          </h2>
          <p className="text-center text-gray-600 mb-6">
            An OTP has been sent to your {verificationType} at <span className="font-semibold">{identifier}</span>.
            <br />
            <span className="text-xs italic">(For this demo, please use <strong className="font-mono">1234</strong>)</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              placeholder="----"
              value={otp}
              onChange={handleOtpChange}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl tracking-[1.5em]"
              maxLength={4}
              required
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={isLoading}>
              {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Verify & Register'
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in {String(resendCooldown).padStart(2, '0')} seconds
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-primary font-semibold hover:underline focus:outline-none disabled:text-gray-500"
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