// src/components/Layout/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import HomeButton from '../HomeButton';
import LogoutButton from '../LogoutButton';

const MainLayout = () => {
  return (
    <div style={{ backgroundColor: 'inherit', minHeight: '100vh' }}>
      <HomeButton />
      <LogoutButton />
      <Outlet />
    </div>
  );
};

export default MainLayout;
