import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-5 right-5 z-50">
      <button
        onClick={handleLogout}
        className="flex items-center justify-center p-2 border-2 border-white rounded-md text-white hover:bg-white hover:text-black transition-colors"
      >
        <ArrowLeftOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
};

export default LogoutButton; 