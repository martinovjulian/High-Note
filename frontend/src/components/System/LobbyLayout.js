// components/LobbyLayout.js
import React from 'react';

export default function LobbyLayout({ children }) {
  return (
    <div className="lobby-layout">
      <div className="lobby-content">
        {children}
      </div>
    </div>
  );
}
