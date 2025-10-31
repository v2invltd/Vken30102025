import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { SuccessIcon, ErrorIcon, InfoIcon, CloseIcon } from './IconComponents';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<{ message: ToastMessage; onRemove: (id: number) => void }> = ({ message, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(message.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [message.id, onRemove]);

  const ICONS: Record<ToastType, React.ReactNode> = {
    success: <SuccessIcon className="w-6 h-6 text-green-500" />,
    error: <ErrorIcon className="w-6 h-6 text-red-500" />,
    info: <InfoIcon className="w-6 h-6 text-blue-500" />,
  };

  const BORDER_COLORS: Record<ToastType, string> = {
    success: 'border-green-500',
    error: 'border-red-500',
    info: 'border-blue-500',
  };

  return (
    <div 
        role="status"
        aria-live="polite"
        className={`w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${BORDER_COLORS[message.type]} animate-slide-in-up`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{ICONS[message.type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">{message.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button onClick={() => onRemove(message.id)} className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <span className="sr-only">Close</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[]; removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  const portalRoot = document.getElementById('toast-container');
  if (!portalRoot) return null;

  return ReactDOM.createPortal(
    <div aria-live="polite" aria-atomic="true" className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-end z-[100] space-y-4">
        {toasts.map((toast) => (
            <Toast key={toast.id} message={toast} onRemove={removeToast} />
        ))}
    </div>,
    portalRoot
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  }, []);

  const toastMethods = {
    toast: addToast,
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  }

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};