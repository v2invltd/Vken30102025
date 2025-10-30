import React, { useState } from 'react';
import { Booking } from '../types';
import { MessageBubbleIcon } from './IconComponents';

interface CalendarViewProps {
  bookings: Booking[];
  onOpenChat: (booking: Booking) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onOpenChat }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null); // Adjust for Sunday being 0
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    return [...blanks, ...days];
  };

  const days = getDaysInMonth(currentMonth);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const goToPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const bookingsByDate = bookings.reduce((acc, booking) => {
    const dateKey = new Date(booking.serviceDate).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);


  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPrevMonth} className="p-2 rounded-full hover:bg-gray-100">&lt; Prev</button>
        <h3 className="text-xl font-semibold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100">Next &gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {dayNames.map(name => <div key={name} className="font-semibold text-gray-600">{name}</div>)}
        {days.map((day, index) => (
          <div
            key={index}
            className={`p-2 h-24 border rounded-md overflow-hidden ${day ? 'bg-gray-50' : 'bg-gray-100'}`}
          >
            {day && (
              <>
                <p className="font-semibold text-gray-800 mb-1">{day.getDate()}</p>
                <div className="text-xs space-y-1">
                  {bookingsByDate[day.toISOString().split('T')[0]]?.map(b => (
                    <div key={b.id} className="bg-primary text-white rounded-full px-2 py-1 truncate flex items-center justify-between">
                      <span className="truncate">{b.customer.name} ({new Date(b.serviceDate).getHours()}h)</span>
                      <button onClick={() => onOpenChat(b)} className="ml-1 text-white hover:text-gray-200">
                          <MessageBubbleIcon className="w-3 h-3"/>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;