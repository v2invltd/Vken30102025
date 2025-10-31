import React, { useState } from 'react';
import { CloseIcon } from './IconComponents';
import { Booking } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface OtpModalProps {
  booking: Booking;
  onVerified: () => void;
}

const OtpModal: React.FC<OtpModalProps> = ({ booking, onVerified }) => {
  const { dispatch } = useAppContext();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === booking.otp) {
      setError('');
      onVerified();
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };
  
  const hasAcceptedQuote = booking.quotationStatus === 'Accepted' && booking.totalAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 id="otp-title" className="text-2xl font-bold text-center text-gray-800 mb-2">
            Confirm Service Start
          </h2>
          <p className="text-center text-gray-600 mb-4">Enter the OTP from the customer to begin the service.</p>
          
          {hasAcceptedQuote && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-center mb-4">
                <p className="text-sm">By starting this job, the customer agrees to the quoted amount:</p>
                <p className="font-bold text-xl">KES {booking.totalAmount?.toLocaleString()}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
              maxLength={4}
              required
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors">
              Verify & Start Service
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;