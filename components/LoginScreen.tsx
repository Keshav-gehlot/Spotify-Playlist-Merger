import React, { useState, useEffect } from 'react';
import { CLIENT_ID_STORAGE_KEY, getRedirectUri, SCOPES, SPOTIFY_AUTH_ENDPOINT } from '../constants';

const LoginScreen: React.FC = () => {
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (stored) setClientId(stored);
    setRedirectUri(getRedirectUri());
  }, []);

  const handleLogin = () => {
    if (!clientId) {
      alert('Please enter a Client ID');
      return;
    }
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: SCOPES.join(' '),
      response_type: 'token',
      show_dialog: 'true',
    });

    window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1e1e1e] to-black text-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center mb-6">
           {/* Simple Spotify Icon SVG */}
           <svg className="w-20 h-20 text-spotify-base" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S16.6 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
           </svg>
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight">Spotify Playlist Merger</h1>
        <p className="text-gray-400 text-lg">
          Merge your favorite playlists, remove duplicates, and organize your library.
        </p>

        <div className="bg-[#181818] p-6 rounded-lg shadow-xl border border-[#282828] text-left space-y-4">
          <h2 className="text-xl font-semibold mb-2">Configuration</h2>
          <p className="text-sm text-gray-400 mb-4">
            To use this app, you need a Spotify Client ID. <a href="https://developer.spotify.com/dashboard/applications" target="_blank" rel="noreferrer" className="text-spotify-base underline hover:text-green-400">Create one here</a>.
          </p>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Client ID
            </label>
            <input 
              type="text" 
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g., 3489...239"
              className="w-full bg-[#121212] border border-[#333] text-white rounded p-3 focus:outline-none focus:border-spotify-base transition-colors"
            />
          </div>
          
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Redirect URI (Set this in Spotify Dashboard)
            </label>
             <div className="bg-[#121212] border border-[#333] text-gray-300 rounded p-3 text-sm break-all font-mono">
                {redirectUri}
             </div>
          </div>

          <button 
            onClick={handleLogin}
            className="w-full bg-spotify-base hover:bg-spotify-dark text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center space-x-2 mt-4"
          >
            <span>Log in with Spotify</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;