import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext, AppView } from '../contexts/AppContext';
import { BellIcon, CloseIcon } from './IconComponents';
import * as api from '../frontend/services/api'; // Import the new API service

const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

export const NotificationBell: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { currentUser, notifications } = state; // Notifications now come from AppContext
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter notifications relevant to the current user
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => n.userId === currentUser.id);
  }, [notifications, currentUser]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    try {
      await api.markAllNotificationsAsRead();
      dispatch({ type: 'MARK_ALL_NOTIFICATIONS_AS_READ', payload: { userId: currentUser.id } });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  const handleToggle = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      if (newState && unreadCount > 0) {
          // Mark as read after a short delay to allow panel to open
          setTimeout(handleMarkAsRead, 1000);
      }
  }

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    setIsOpen(false);
    if (notification.bookingId) {
        // In this app structure, it means setting the view to MY_BOOKINGS
        dispatch({ type: 'SET_VIEW', payload: AppView.MY_BOOKINGS });
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleToggle} className="relative p-2 text-gray-600 hover:text-primary rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
        <span className="sr-only">View notifications</span>
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200 flex flex-col max-h-[400px]">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <CloseIcon className="w-5 h-5"/>
            </button>
          </div>
          <div className="overflow-y-auto">
            {userNotifications.length > 0 ? (
              userNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-sm text-gray-700">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{timeAgo(new Date(n.timestamp))}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 p-6">You have no notifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};