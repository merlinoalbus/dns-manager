import React from 'react';
import DNSManager from './components/DNSManager';
import './styles/app.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DNSManager />
      </div>
    </div>
  );
}

export default App;