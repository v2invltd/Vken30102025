import React from 'react';
import { Booking } from '../types';
import { CheckIcon } from './IconComponents';

interface BookingConfirmationProps {
  booking: Booking;
  onDone: () => void;
}

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};


const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ booking, onDone }) => {
    const isInstant = booking.bookingType === 'instant';
    const isConfirmed = booking.status === 'Confirmed';

    let title = "Request Sent!";
    let message = "Your request has been sent to the provider. You will be notified once they accept.";

    if (isConfirmed) {
        title = "Booking Confirmed!";
        message = "Your booking is confirmed and scheduled. You can view it under 'My Bookings'.";
    } else if (isInstant) {
        title = "Booking Paid & Sent!";
        message = `Your booking fee is paid. The request has been sent to ${booking.provider.name}. You'll be notified once they confirm the appointment.`;
    }


    return (
        <div className="text-center animate-fade-in p-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-10 h-10 text-primary" />
            </div>
            <h2 id="booking-title" className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <span className="text-sm text-gray-600">Provider:</span>
                        <p className="font-semibold text-gray-800">{booking.provider.name}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Service:</span>
                        <p className="font-semibold text-gray-800">{booking.provider.category}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Date:</span>
                        <p className="font-semibold text-gray-800">
                            {formatDate(new Date(booking.serviceDate))}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Time:</span>
                        <p className="font-semibold text-gray-800">{formatTime(new Date(booking.serviceDate))}</p>
                    </div>
                </div>

                {booking.requestDetails && (
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">Your Request Details:</p>
                        <p className="text-sm font-medium text-gray-800 mt-1 italic">"{booking.requestDetails}"</p>
                    </div>
                )}
                
                {booking.otp && (
                    <div className="pt-3 border-t border-gray-200 text-center">
                        <p className="text-sm text-gray-600">Your Service OTP Code:</p>
                        <p className="text-2xl font-bold text-primary tracking-widest bg-white inline-block px-4 py-2 rounded-lg mt-1 shadow-inner">
                            {booking.otp}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Share this with the provider to start the job.</p>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onDone}
                className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors"
            >
                Done
            </button>
        </div>
    );
};

export default BookingConfirmation;