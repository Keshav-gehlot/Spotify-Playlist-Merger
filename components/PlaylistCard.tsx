import React from 'react';
import { SpotifyPlaylist } from '../types';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, isSelected, onToggle }) => {
  const hasImage = playlist.images && playlist.images.length > 0;
  const imageUrl = hasImage ? playlist.images[0].url : '';

  return (
    <div 
      onClick={() => onToggle(playlist.id)}
      className={`
        group relative p-4 rounded-md transition-all duration-200 cursor-pointer
        hover:bg-spotify-hover
        ${isSelected ? 'bg-spotify-card ring-2 ring-spotify-base ring-offset-2 ring-offset-[#121212]' : 'bg-spotify-card'}
      `}
    >
      <div className="relative aspect-square mb-4 shadow-lg rounded-md overflow-hidden bg-[#282828] flex items-center justify-center">
         {hasImage ? (
             <img 
                src={imageUrl} 
                alt={playlist.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
         ) : (
             <div className="w-full h-full flex items-center justify-center bg-[#282828] group-hover:bg-[#333] transition-colors">
                <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
             </div>
         )}
          
          {isSelected && (
            <div className="absolute top-2 right-2 bg-spotify-base rounded-full p-1 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
      </div>
      <h3 className="text-white font-bold truncate mb-1" title={playlist.name}>{playlist.name}</h3>
      <p className="text-[#a7a7a7] text-sm truncate">
        By {playlist.owner.display_name} • {playlist.tracks.total} tracks
      </p>
    </div>
  );
};

export default React.memo(PlaylistCard);