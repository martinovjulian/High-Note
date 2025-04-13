// src/components/Layout/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import HomeButton from '../HomeButton';

const MainLayout = () => {
  return (
    <div style={{ backgroundColor: 'inherit', minHeight: '100vh' }}>
      <HomeButton />
      <Outlet />
    </div>
  );
};

export default MainLayout;
