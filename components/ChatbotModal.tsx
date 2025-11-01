import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, SparklesIcon } from './IconComponents';
import { useAppContext } from '../contexts/AppContext';
import * as api from '../frontend/services/api'; // Use the new API service

interface ChatbotModalProps {
  initialMessage?: string;
  userId: string; // Pass userId to initialize session
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatbotModal: React.FC<ChatbotModalProps> = ({ initialMessage, userId }) => {
  const { dispatch } = useAppContext();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const onClose = () => {
    if (sessionId) {
        api.closeChatbotSession(sessionId).catch(console.error); // Attempt to close session on backend
    }
    dispatch({ type: 'CLOSE_MODAL' });
  };

  useEffect(() => {
    let isMounted = true;
    const initializeChatSession = async () => {
      try {
        const response = await api.initChatbotSession(userId);
        if (isMounted) {
            setSessionId(response.sessionId);
            const firstMessage = initialMessage || 'Hello! How can I help you today? Feel free to ask me anything about our services.';
            setMessages([{ role: 'model', text: firstMessage }]);
        }
      } catch (error) {
        console.error('Error initializing chatbot session:', error);
        if (isMounted) {
            setMessages([{ role: 'model', text: 'Sorry, I could not start the AI assistant. Please try again later.' }]);
        }
      }
    };
    initializeChatSession();

    // Cleanup on unmount
    return () => {
        isMounted = false;
        // The sessionId for cleanup is captured in the closure
        if (sessionId) {
            api.closeChatbotSession(sessionId).catch(console.error);
        }
    };
  }, [initialMessage, userId]); // sessionId is removed from dependencies to prevent re-initialization


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !sessionId || isLoading) return;

    const userMessage: Message = { role: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const reader = await api.sendChatbotMessageStream(sessionId, inputValue);
      const decoder = new TextDecoder();
      let botResponse = '';

      setMessages(prev => [...prev, { role: 'model', text: '' }]); // Add empty model message placeholder

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // EventSource compatible format: data: { ...json } \n\n
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6);
                try {
                    const parsedChunk = JSON.parse(jsonStr);
                    if (parsedChunk.error) {
                        throw new Error(parsedChunk.error);
                    }
                    botResponse += parsedChunk.text;
                    setMessages(prev => {
                        const lastMessage = prev[prev.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1] = { ...lastMessage, text: botResponse };
                            return newMessages;
                        }
                        return prev;
                    });
                } catch (jsonError) {
                    console.error("Failed to parse JSON from stream:", jsonError, "Raw chunk:", jsonStr);
                }
            }
        }
      }
    } catch (error) {
      console.error('Error sending message to AI chatbot:', error);
      setMessages(prev => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg h-[80vh] flex flex-col" role="dialog" aria-modal="true" aria-labelledby="chatbot-title">
        {/* Header */}
        <div className="p-4 bg-primary text-white rounded-t-lg flex justify-between items-center flex-shrink-0">
          <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2" />
            <h2 id="chatbot-title" className="text-lg font-bold">V-Ken AI Assistant</h2>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-primary text-white p-3 rounded-full hover:bg-green-800 transition-colors disabled:bg-gray-400"
              disabled={isLoading || !inputValue.trim()}
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

export default ChatbotModal;