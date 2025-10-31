
import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './IconComponents';
import { useToast } from './Toast';
import { useAppContext } from '../contexts/AppContext';
import * as api from '../frontend/services/api';

const ForgotPasswordModal: React.FC = () => {
    const { dispatch } = useAppContext();
    const toast = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const onClose = () => dispatch({ type: 'CLOSE_MODAL' });
    const openLoginModal = () => dispatch({ type: 'OPEN_MODAL', payload: { type: 'auth' } });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        inputRef.current?.focus();
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Please enter your email address.");
            return;
        }
        setIsLoading(true);
        try {
            await api.forgotPassword(email);
            setIsSubmitted(true);
        } catch (error: any) {
            toast.error(error.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div
                ref={modalRef}
                className="bg-white rounded-lg shadow-xl w-full max-w-md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="forgot-password-title"
            >
                <div className="p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" disabled={isLoading}>
                        <CloseIcon className="w-6 h-6" />
                    </button>
                    
                    <h2 id="forgot-password-title" className="text-2xl font-bold text-center text-gray-800 mb-4">
                        Reset Your Password
                    </h2>

                    {isSubmitted ? (
                        <div className="text-center">
                            <p className="text-gray-600 mb-6">
                                If an account with that email exists, we've sent instructions to reset your password. Please check your inbox (and spam folder).
                            </p>
                            <button
                                onClick={openLoginModal}
                                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-center text-gray-600 mb-6">
                                Enter the email address associated with your account, and we'll send you a link to reset your password.
                            </p>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    ref={inputRef}
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                             <div className="text-center mt-4">
                                <button onClick={openLoginModal} className="text-sm text-primary hover:underline font-medium">
                                    Back to Login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
