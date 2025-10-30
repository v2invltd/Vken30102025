

import React, { useState, useEffect, useRef } from 'react';
import { Booking, User, UserRole } from '../types';
import { CloseIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';

interface ChatModalProps {
  booking: Booking;
  currentUser: User;
  onSendMessage: (bookingId: string, messageText: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ booking, currentUser, onSendMessage }) => {
  const { dispatch } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const otherParty = currentUser.role === UserRole.CUSTOMER ? booking.provider : booking.customer;
  const chatHistory = booking.chatHistory || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(booking.id, inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg h-[80vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="chat-title">
        {/* Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg flex justify-between items-center flex-shrink-0">
          <div>
            <h2 id="chat-title" className="text-lg font-bold text-gray-800">Chat with {otherParty.name}</h2>
            <p className="text-sm text-gray-500">Regarding: {booking.provider.category}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-100">
          {chatHistory.length > 0 ? (
            <div className="space-y-4">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${msg.senderId === currentUser.id ? 'bg-primary text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? 'text-gray-300' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Start the conversation.</p>
            </div>
          )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
          <form onSubmit={handleFormSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            <button
              type="submit"
              className="bg-primary text-white p-3 rounded-full hover:bg-green-800 transition-colors disabled:bg-gray-400"
              disabled={!inputValue.trim()}
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;