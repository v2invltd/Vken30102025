import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { CloseIcon } from './IconComponents';
import { LegalDocType } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from './Toast';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import PhoneNumberInput from './PhoneNumberInput';

interface AuthModalProps {
  onVerificationNeeded: (userData: Omit<User, 'id' | 'kycVerified'>) => void;
  onLoginSuccess: (user: User, isNewUser: boolean, token?: string) => void;
  onShowTerms: (type: LegalDocType) => void;
  promptMessage?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ onVerificationNeeded, onLoginSuccess, onShowTerms, promptMessage }) => {
  const { dispatch } = useAppContext();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+254');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });
  const openForgotPasswordModal = () => dispatch({ type: 'OPEN_MODAL', payload: { type: 'forgotPassword' } });

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === UserRole.PROVIDER) {
      setPhone('+254');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (activeTab === 'register') {
      if (!agreedToTerms) {
        setError("Please agree to the terms and conditions to continue.");
        setIsLoading(false);
        return;
      }
      try {
        // Instead of registering, trigger the OTP verification step
        onVerificationNeeded({ name, email, phone, password, role });
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Pre-registration error:", err);
      } finally {
        setIsLoading(false);
      }
    } else { // Login
      try {
        // This is a mock login. In a real app, this would be an API call.
        const mockUser: User = { id: 'user-123', name: 'Test User', email, role: UserRole.CUSTOMER, kycVerified: true };
        onLoginSuccess(mockUser, false, 'mock-jwt-token');
        toast.success("Logged in successfully!");
      } catch (err: any) {
        setError(err.message || "Login failed. Please check your credentials.");
        console.error("Login error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const renderRegisterForm = () => (
    <>
        <div className="mb-4 flex justify-center rounded-lg bg-gray-100 p-1">
            <button type="button" onClick={() => handleRoleChange(UserRole.CUSTOMER)} className={`w-1/2 rounded-md py-2 text-sm font-medium ${role === UserRole.CUSTOMER ? 'bg-white shadow' : 'text-gray-600'}`}>
                I'm a Customer
            </button>
            <button type="button" onClick={() => handleRoleChange(UserRole.PROVIDER)} className={`w-1/2 rounded-md py-2 text-sm font-medium ${role === UserRole.PROVIDER ? 'bg-white shadow' : 'text-gray-600'}`}>
                I'm a Provider
            </button>
        </div>
        <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
            disabled={isLoading}
        />
        <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
            disabled={isLoading}
        />
        <div>
            <label className="sr-only">Phone Number</label>
            <PhoneNumberInput
                fullPhoneNumber={phone}
                onPhoneNumberChange={setPhone}
                disabled={isLoading}
                allowedCountries={role === UserRole.PROVIDER ? ['254'] : undefined}
            />
        </div>
        <div>
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
                disabled={isLoading}
            />
            <PasswordStrengthMeter password={password} />
        </div>
        <div className="flex items-start">
            <input id="terms" name="terms" type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1" />
            <div className="ml-2 text-sm">
                <label htmlFor="terms" className="text-gray-600">
                    I agree to the 
                    <a href="#" onClick={(e) => { e.preventDefault(); onShowTerms('customer'); }} className="font-medium text-primary hover:underline"> Terms of Service </a> 
                    and 
                    <a href="#" onClick={(e) => { e.preventDefault(); onShowTerms('privacy'); }} className="font-medium text-primary hover:underline"> Privacy Policy</a>.
                </label>
            </div>
        </div>
    </>
  );

  const renderLoginForm = () => (
    <>
        <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
            disabled={isLoading}
        />
        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
            disabled={isLoading}
        />
        <div className="text-right">
            <button type="button" onClick={openForgotPasswordModal} className="text-sm text-primary hover:underline font-medium">
                Forgot Password?
            </button>
        </div>
    </>
  );


  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <div className="p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}>
              <CloseIcon className="w-6 h-6" />
            </button>
            
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex justify-center space-x-8" aria-label="Tabs">
                  <button type="button" onClick={() => setActiveTab('login')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} disabled={isLoading}>
                      Login
                  </button>
                  <button type="button" onClick={() => setActiveTab('register')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} disabled={isLoading}>
                      Register
                  </button>
              </nav>
            </div>

            <h2 id="auth-title" className="text-2xl font-bold text-center text-gray-800 mb-4">
              {activeTab === 'register' ? 'Create an Account' : 'Welcome Back'}
            </h2>
            
            {promptMessage && (
                <div className="text-center text-sm text-gray-700 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p>{promptMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' ? renderRegisterForm() : renderLoginForm()}
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button 
                type="submit" 
                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isLoading || (activeTab === 'register' && !agreedToTerms)}
              >
                {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                ) : null}
                {activeTab === 'register' ? 'Continue to Verification' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
