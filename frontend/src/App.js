import React from 'react';
import NoteSubmitter from './components/NoteSubmitter'; // Adjust path if needed
import './App.css'; // Or your main CSS file

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My Notes App</h1>
      </header>
      <main>
        <NoteSubmitter />
        {/* You can add other components here */}
      </main>
    </div>
  );
}

export default App;