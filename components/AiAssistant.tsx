

import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, CloseIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';
import * as api from '../frontend/services/api'; // Use the new API service

interface AiAssistantProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  error: string | null;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onSearch, isLoading, error }) => {
  const { dispatch } = useAppContext();
  const [query, setQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query);
    }
  };

  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  // Accessibility: Focus trap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Tab') {
        if (!modalRef.current) return;
        
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    textareaRef.current?.focus();
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="ai-assistant-title"
      >
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <span className="sr-only">Close</span>
            <CloseIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center mb-4">
            <SparklesIcon className="w-8 h-8 text-primary mr-3" />
            <h2 id="ai-assistant-title" className="text-2xl font-bold text-gray-800">AI Service Finder</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Describe the service you need, and our AI will find the best professionals for you. For example: "I need someone to fix a leaky pipe in Nairobi" or "Find a tour guide for a safari".
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tell us what you need..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
              rows={3}
              disabled={isLoading}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full mt-4 bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-green-800 transition-colors flex items-center justify-center disabled:bg-gray-400"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing request...</span>
                </div>
              ) : (
                'Find Providers'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;