

import React from 'react';
import { CloseIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';

interface DisclaimerModalProps {
  title: string;
  content: string;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ title, content }) => {
  const { dispatch } = useAppContext();
  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[80] p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 id="disclaimer-title" className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
            {content}
          </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-green-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;