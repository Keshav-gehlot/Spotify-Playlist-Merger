import React from 'react';
import { SpotifyPlaylist } from '../types';

interface SuccessScreenProps {
  playlist: SpotifyPlaylist;
  trackCount: number;
  onReset: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ playlist, trackCount, onReset }) => {
  const openUrl = playlist.external_urls?.spotify || playlist.uri.replace('spotify:playlist:', 'https://open.spotify.com/playlist/');

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="max-w-lg w-full text-center space-y-8">
            <div className="flex justify-center">
                <div className="w-24 h-24 bg-spotify-base rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(29,185,84,0.4)]">
                    <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            <h1 className="text-4xl font-bold text-white tracking-tight">Merge Successful!</h1>
            
            <p className="text-gray-400 text-lg">
                Your new playlist <span className="text-white font-semibold">"{playlist.name}"</span> is ready. 
                We added <span className="text-white font-semibold">{trackCount} unique tracks</span>.
            </p>

            <div className="bg-[#181818] p-6 rounded-xl border border-[#282828] shadow-2xl flex flex-col items-center">
                 <div className="w-48 h-48 bg-[#282828] rounded-md shadow-lg mb-4 flex items-center justify-center overflow-hidden">
                     {/* Spotify might not return the image immediately after creation, show placeholder or generic */}
                     <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                     </svg>
                 </div>
                 <h2 className="text-xl font-bold mb-1">{playlist.name}</h2>
                 <p className="text-sm text-gray-500 mb-6">Just now</p>

                 <a 
                    href={openUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-spotify-base hover:bg-spotify-dark text-black font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 mb-3 flex items-center justify-center gap-2"
                 >
                    <span>Open in Spotify</span>
                 </a>
            </div>

            <button 
                onClick={onReset}
                className="text-gray-400 hover:text-white font-semibold transition-colors text-sm"
            >
                Merge more playlists
            </button>
        </div>
    </div>
  );
};

export default SuccessScreen;
