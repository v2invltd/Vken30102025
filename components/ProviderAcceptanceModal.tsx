
import React from 'react';
import { Booking } from '../types';
import { CloseIcon, CheckIcon, WarningIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';

interface ProviderAcceptanceModalProps {
  booking: Booking;
  response: 'accept' | 'decline' | 'cancel';
  onConfirm: (booking: Booking, response: 'accept' | 'decline' | 'cancel') => void;
}

const ProviderAcceptanceModal: React.FC<ProviderAcceptanceModalProps> = ({ booking, response, onConfirm }) => {
  const { dispatch } = useAppContext();
  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const getModalConfig = () => {
    switch(response) {
      case 'accept':
        return {
          title: 'Accept Booking Request',
          message: `Are you sure you want to accept this service request from ${booking.customer.name}?`,
          confirmText: 'Yes, Accept',
          Icon: CheckIcon,
          iconColor: 'text-green-600',
          iconBgColor: 'bg-green-100',
          buttonColor: 'bg-primary hover:bg-green-800',
        };
      case 'decline':
        return {
          title: 'Decline Booking Request',
          message: `Are you sure you want to decline this service request from ${booking.customer.name}?`,
          confirmText: 'Yes, Decline',
          Icon: WarningIcon,
          iconColor: 'text-red-600',
          iconBgColor: 'bg-red-100',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        };
       case 'cancel':
        return {
          title: 'Cancel Confirmed Booking',
          message: `Are you sure you want to cancel this confirmed booking with ${booking.customer.name}? The customer will be notified.`,
          confirmText: 'Yes, Cancel Booking',
          Icon: WarningIcon,
          iconColor: 'text-red-600',
          iconBgColor: 'bg-red-100',
          buttonColor: 'bg-red-600 hover:bg-red-700',
        };
    }
  };
  
  const { title, message, confirmText, Icon, iconColor, iconBgColor, buttonColor } = getModalConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" role="alertdialog" aria-modal="true" aria-labelledby="acceptance-title">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-6 h-6" />
          </button>
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${iconBgColor} sm:mx-0 sm:h-10 sm:w-10`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-bold text-gray-900" id="acceptance-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600">{message}</p>
                <div className="mt-4 p-3 bg-gray-50 border rounded-md text-left">
                    <p className="text-sm font-semibold">{booking.provider.category}</p>
                    <p className="text-sm text-gray-500">{new Date(booking.serviceDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    {booking.requestDetails && <p className="text-sm text-gray-700 mt-2 italic">"{booking.requestDetails}"</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${buttonColor} sm:ml-3 sm:w-auto sm:text-sm`}
              onClick={() => onConfirm(booking, response)}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderAcceptanceModal;
