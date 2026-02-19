import React from 'react';
import { SpotifyPlaylist } from '../types';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, isSelected, onToggle }) => {
  const imageUrl = playlist.images && playlist.images.length > 0 ? playlist.images[0].url : 'https://picsum.photos/300/300';

  return (
    <div 
      onClick={() => onToggle(playlist.id)}
      className={`
        group relative p-4 rounded-md transition-all duration-200 cursor-pointer
        hover:bg-spotify-hover
        ${isSelected ? 'bg-spotify-card ring-2 ring-spotify-base ring-offset-2 ring-offset-[#121212]' : 'bg-spotify-card'}
      `}
    >
      <div className="relative aspect-square mb-4 shadow-lg rounded-md overflow-hidden bg-[#282828]">
         <img 
            src={imageUrl} 
            alt={playlist.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
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