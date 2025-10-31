import React, { useState } from 'react';
import { Booking, Review, User } from '../types';
import { CloseIcon, StarIcon } from './IconComponents';
import { useToast } from './Toast';
import { useAppContext } from '../contexts/AppContext';

interface ReviewModalProps {
  booking: Booking;
  user: User;
  onSubmit: (bookingId: string, review: Review) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ booking, user, onSubmit }) => {
  const { dispatch } = useAppContext();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const toast = useToast();
  
  const onClose = () => dispatch({ type: 'CLOSE_MODAL' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    const newReview: Review = {
      rating,
      reviewText,
      author: user.name,
      date: new Date().toISOString(),
    };
    onSubmit(booking.id, newReview);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <form onSubmit={handleSubmit} className="p-6 relative">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <CloseIcon className="w-6 h-6" />
          </button>
          <h2 id="review-title" className="text-2xl font-bold text-center text-gray-800 mb-2">
            Leave a Review
          </h2>
          <p className="text-center text-gray-600 mb-6">
            How was your experience with <span className="font-semibold">{booking.provider.name}</span>?
          </p>
          
          <div className="mb-6">
            <p className="text-center font-semibold text-gray-700 mb-3">Your Rating</p>
            <div className="flex justify-center items-center space-x-2" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="focus:outline-none"
                    >
                        <StarIcon 
                            className={`w-10 h-10 transition-colors duration-200 ${
                                (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            filled={(hoverRating || rating) >= star}
                        />
                    </button>
                ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-1">Your Review (Optional)</label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={`Share details of your own experience with this provider...`}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
              rows={4}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full mt-6 bg-primary text-white font-bold py-3 rounded-lg hover:bg-green-800 transition-colors disabled:bg-gray-400"
            disabled={rating === 0}
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
