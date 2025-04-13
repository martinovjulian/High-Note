// src/components/HouseButton.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/solid';

const HomeButton = () => {
  const location = useLocation();

  // Do not display on landing and login pages
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }

  return (
    <div className="fixed top-5 left-5 z-50">
      <Link
        to="/app"
        className="flex items-center justify-center p-2 border-2 border-white rounded-md text-white hover:bg-white hover:text-black transition-colors"
      >
        <HomeIcon className="h-6 w-6" aria-hidden="true" />
      </Link>
    </div>
  );
};

export default HomeButton;
