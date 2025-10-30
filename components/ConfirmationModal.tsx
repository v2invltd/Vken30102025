

import React from 'react';
import { CloseIcon, InfoIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const { dispatch } = useAppContext();
  const onCancel = () => dispatch({ type: 'CLOSE_MODAL' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title">
        <div className="p-6 relative">
          <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-6 h-6" />
          </button>
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <InfoIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-bold text-gray-900" id="confirmation-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={() => {
                onConfirm();
                onCancel();
              }}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;