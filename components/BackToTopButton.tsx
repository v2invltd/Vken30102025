

import React, { useState, useEffect } from 'react';
import { ArrowUpIcon } from './IconComponents';

const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-5 bg-secondary text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 active:scale-100 transition-transform z-30"
      aria-label="Go to top"
    >
      <ArrowUpIcon className="w-6 h-6" />
    </button>
  );
};

export default BackToTopButton;