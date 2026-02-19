import React, { useState, useEffect } from 'react';

const LoginScreen: React.FC = () => {
  const [inIframe, setInIframe] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in an iframe
    setInIframe(window.self !== window.top);

    // Check backend health/config
    const checkConfig = async () => {
        try {
            // We use /login to test because /api/health might need proxy config adjustments depending on environment
            // Actually, let's try the dedicated health endpoint assuming proxy forwards /api
            const res = await fetch('/api/health');
            if (res.status === 503) {
                const data = await res.json();
                setConfigError(data.message);
            }
        } catch (e) {
            console.warn("Could not check backend health", e);
        }
    };
    checkConfig();
  }, []);

  const handleLogin = () => {
    if (configError) {
        alert("Cannot login: " + configError);
        return;
    }
    // Redirect to the Login Endpoint.
    window.location.href = '/login';
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

        <div className="bg-[#181818] p-8 rounded-xl shadow-xl border border-[#282828] text-center space-y-6">
          
          {configError && (
              <div className="bg-red-900/30 text-red-200 p-4 rounded text-sm border border-red-700/50 mb-4 text-left">
                  <div className="font-bold mb-1 flex items-center gap-2">
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                       Setup Required
                  </div>
                  <p>{configError}</p>
                  <p className="mt-2 text-xs opacity-75">Please update the <code>.env</code> file in the project root.</p>
              </div>
          )}

          {inIframe && (
              <div className="bg-yellow-900/30 text-yellow-200 p-3 rounded text-sm border border-yellow-700/50 mb-4 flex items-start space-x-2 text-left">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <strong>Preview Mode Detected</strong> <br/>
                    Please open this app in a new window to authenticate securely.
                  </div>
              </div>
          )}

          <p className="text-gray-300">
            Click below to authenticate securely via Spotify.
          </p>
          
          <button 
            onClick={handleLogin}
            disabled={!!configError}
            className={`
                w-full font-bold py-4 px-6 rounded-full transition-all transform flex items-center justify-center space-x-2
                ${configError 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-spotify-base hover:bg-spotify-dark text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(29,185,84,0.3)]'}
            `}
          >
            <span>Login with Spotify</span>
          </button>
        </div>
        
        <p className="text-xs text-gray-600">
            Powered by FastAPI & React
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;