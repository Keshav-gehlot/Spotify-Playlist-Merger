import React, { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for access token in URL hash
    const hash = window.location.hash;
    
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      
      if (token) {
        setAccessToken(token);
        // Clean URL without reloading
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
      }
    }
  }, []);

  const handleLogout = () => {
    setAccessToken(null);
    // Optional: Clear storage if we wanted to forget the Client ID, but better to keep it for UX.
    window.location.hash = '';
  };

  return (
    <div className="antialiased font-sans text-white bg-[#121212] min-h-screen">
      {!accessToken ? (
        <LoginScreen />
      ) : (
        <Dashboard accessToken={accessToken} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;