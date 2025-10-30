import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { CloseIcon, CheckIcon } from './IconComponents';
import VerificationOtpModal from './VerificationOtpModal';
import { useToast } from './Toast';
import { useAppContext } from '../contexts/AppContext';
import * as api from '../frontend/services/api'; // Import API service
import PhoneNumberInput from './PhoneNumberInput';

interface KycModalProps {
  user: User;
  onKycSuccess: (updatedUser: Partial<User>) => void;
}

const KycModal: React.FC<KycModalProps> = ({ user, onKycSuccess }) => {
  const { dispatch } = useAppContext();
  const toast = useToast();
  const [phone, setPhone] = useState(user.phone || '+254');
  const [nationalId, setNationalId] = useState(user.nationalId || '');
  const [businessName, setBusinessName] = useState(user.businessName || '');
  const [businessRegNo, setBusinessRegNo] = useState(user.businessRegNo || '');
  
  // New state for phone verification
  const [isPhoneVerified, setIsPhoneVerified] = useState(!!user.phone); // Assume verified if phone exists
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const handleSendOtp = async () => {
    try {
        await api.sendWhatsappOtp(phone);
        setIsVerificationModalOpen(true);
    } catch (error: any) {
        toast.error(error.message || "Could not send OTP. Please check the number.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneVerified) {
      toast.error("Please verify your phone number first.");
      return;
    }
    setIsLoading(true);
    try {
        const updatedUserData: Partial<User> = {
            phone: phone,
            nationalId,
            businessName: user.role === UserRole.PROVIDER ? businessName : undefined,
            businessRegNo: user.role === UserRole.PROVIDER ? businessRegNo : undefined,
            kycVerified: true, // Simulate immediate verification for demo
        };
        onKycSuccess(updatedUserData);
    } catch (error) {
        console.error("KYC submission error:", error);
        toast.error("Failed to submit KYC details. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };
  
  const commonPhoneInput = () => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {user.role === UserRole.PROVIDER ? 'Business Phone Number' : 'Phone Number'}
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
            <PhoneNumberInput
                fullPhoneNumber={phone}
                onPhoneNumberChange={(newNumber) => {
                    setPhone(newNumber);
                    setIsPhoneVerified(false);
                }}
                disabled={isPhoneVerified || isLoading}
                allowedCountries={user.role === UserRole.PROVIDER ? ['254'] : undefined}
            />
            {isPhoneVerified ? (
                <div className="flex items-center justify-center text-sm text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-lg whitespace-nowrap">
                    <CheckIcon className="w-5 h-5 mr-1" /> Verified
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!phone || phone.length < 10 || isLoading}
                    className="w-full sm:w-auto px-4 py-3 border border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors flex-shrink-0"
                >
                    Verify
                </button>
            )}
        </div>
    </div>
  );

  const renderCustomerForm = () => (
    <>
      {commonPhoneInput()}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">National ID Number</label>
        <input
            type="text"
            placeholder="National ID Number"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
            disabled={isLoading}
        />
      </div>
    </>
  );

  const renderProviderForm = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name (or Full Name)</label>
        <input
            type="text"
            placeholder="Business Name (or Full Name)"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
            disabled={isLoading}
        />
      </div>
      {commonPhoneInput()}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">National ID / Passport Number</label>
        <input
            type="text"
            placeholder="National ID / Passport Number"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
            disabled={isLoading}
        />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Business Registration No. (Optional)</label>
        <input
            type="text"
            placeholder="Business Registration No. (Optional)"
            value={businessRegNo}
            onChange={(e) => setBusinessRegNo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            disabled={isLoading}
        />
      </div>
    </>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="kyc-title">
          <div className="p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}>
              <CloseIcon className="w-6 h-6" />
            </button>
            <h2 id="kyc-title" className="text-2xl font-bold text-center text-gray-800 mb-2">
              Complete Your Profile (KYC)
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Please provide these details for verification.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {user.role === UserRole.PROVIDER ? renderProviderForm() : renderCustomerForm()}
              <button
                type="submit"
                className="w-full mt-6 bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!isPhoneVerified || isLoading}
              >
                {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                ) : null}
                Submit for Verification
              </button>
            </form>
          </div>
        </div>
      </div>
      {isVerificationModalOpen && (
        <VerificationOtpModal
          verificationType="WhatsApp"
          identifier={phone}
          onClose={() => setIsVerificationModalOpen(false)}
          onVerified={() => {
            setIsPhoneVerified(true);
            setIsVerificationModalOpen(false);
            toast.success("Phone number verified!");
          }}
        />
      )}
    </>
  );
};

export default KycModal;