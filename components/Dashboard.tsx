import React, { useEffect, useState, useMemo } from 'react';
import { SpotifyUser, SpotifyPlaylist, MergeState, MergeStatus } from '../types';
import { SpotifyService } from '../services/spotifyService';
import PlaylistCard from './PlaylistCard';
import MergeStatusModal from './MergeStatusModal';

interface DashboardProps {
  accessToken: string;
  onLogout: () => void;
}

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'TRACKS_ASC' | 'TRACKS_DESC';

const Dashboard: React.FC<DashboardProps> = ({ accessToken, onLogout }) => {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  const [mergeState, setMergeState] = useState<MergeState>({
    status: MergeStatus.IDLE,
    progress: 0,
    message: '',
  });

  const spotifyService = useMemo(() => new SpotifyService(accessToken), [accessToken]);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await spotifyService.getCurrentUser();
        setUser(userData);
        const userPlaylists = await spotifyService.getUserPlaylists(userData.id);
        setPlaylists(userPlaylists);
      } catch (err: any) {
        console.error("Failed to load data", err);
        if (err.message === 'UNAUTHORIZED') {
            onLogout();
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [spotifyService, onLogout]);

  const sortedPlaylists = useMemo(() => {
    return [...playlists].sort((a, b) => {
      switch (sortOption) {
        case 'NAME_ASC':
          return a.name.localeCompare(b.name);
        case 'NAME_DESC':
          return b.name.localeCompare(a.name);
        case 'TRACKS_DESC':
          return b.tracks.total - a.tracks.total;
        case 'TRACKS_ASC':
          return a.tracks.total - b.tracks.total;
        default:
          return 0;
      }
    });
  }, [playlists, sortOption]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMerge = async () => {
    if (!user || selectedIds.size === 0) return;

    setMergeState({
      status: MergeStatus.FETCHING_TRACKS,
      progress: 5,
      message: 'Initializing merge...',
    });

    try {
      // 1. Fetch tracks
      // Using concurrency to fetch multiple playlists at once to speed up the process
      const selectedPlaylists = playlists.filter(p => selectedIds.has(p.id));
      
      // We use a set to track composite keys (Name + Artist + Album) to avoid duplicates
      const seenTracks = new Set<string>();
      const urisToAdd: string[] = [];
      
      let processedCount = 0;
      
      const CONCURRENCY_LIMIT = 3;
      
      // Process playlists in chunks
      for (let i = 0; i < selectedPlaylists.length; i += CONCURRENCY_LIMIT) {
          const chunk = selectedPlaylists.slice(i, i + CONCURRENCY_LIMIT);
          
          setMergeState({
            status: MergeStatus.FETCHING_TRACKS,
            progress: 10 + Math.floor((processedCount / selectedPlaylists.length) * 50),
            message: `Fetching tracks from ${chunk.map(p => `"${p.name}"`).join(', ')}...`
          });

          await Promise.all(chunk.map(async (playlist) => {
              const tracks = await spotifyService.getPlaylistTracks(playlist.id);
              tracks.forEach(t => {
                  if (t.track && t.track.uri) {
                      const trackName = t.track.name.trim().toLowerCase();
                      const artistName = t.track.artists.length > 0 
                          ? t.track.artists[0].name.trim().toLowerCase() 
                          : 'unknown';
                      // Consider album name to differentiate versions (e.g. Live vs Studio, or different compilations)
                      const albumName = t.track.album && t.track.album.name 
                          ? t.track.album.name.trim().toLowerCase() 
                          : 'unknown';
                      
                      // Composite key: name|artist|album
                      const compositeKey = `${trackName}|${artistName}|${albumName}`;
                      
                      if (!seenTracks.has(compositeKey)) {
                          seenTracks.add(compositeKey);
                          urisToAdd.push(t.track.uri);
                      }
                  }
              });
          }));
          
          processedCount += chunk.length;
      }

      if (urisToAdd.length === 0) {
          throw new Error("No valid tracks found in selected playlists.");
      }

      // 2. Create Playlist
      setMergeState({
        status: MergeStatus.CREATING_PLAYLIST,
        progress: 70,
        message: 'Creating new playlist "Merged Playlist"...',
      });
      
      const newPlaylist = await spotifyService.createPlaylist(
          user.id, 
          `Merged Playlist - ${new Date().toLocaleDateString()}`, 
          `Merged from ${selectedIds.size} playlists.`
      );

      // 3. Add Tracks
      setMergeState({
        status: MergeStatus.ADDING_TRACKS,
        progress: 85,
        message: `Adding ${urisToAdd.length} unique tracks...`,
      });

      await spotifyService.addTracksToPlaylist(newPlaylist.id, urisToAdd);

      setMergeState({
        status: MergeStatus.SUCCESS,
        progress: 100,
        message: `Successfully merged ${urisToAdd.length} tracks into "${newPlaylist.name}"`,
        resultUrl: newPlaylist.uri.replace('spotify:playlist:', 'https://open.spotify.com/playlist/')
      });

      // Optional: Deselect all after success
      setSelectedIds(new Set());

    } catch (error: any) {
        console.error(error);
        if (error.message === 'UNAUTHORIZED') {
            onLogout();
            return;
        }
        setMergeState({
            status: MergeStatus.ERROR,
            progress: 0,
            message: error.message || "An unexpected error occurred."
        });
    }
  };

  const handleSelectAll = () => {
      if (selectedIds.size === playlists.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(playlists.map(p => p.id)));
      }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-base mb-4"></div>
        <p className="text-gray-400 animate-pulse">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-sm border-b border-[#282828] px-6 py-4 flex items-center justify-between">
         <div className="flex items-center space-x-3">
             <div className="w-8 h-8 bg-spotify-base rounded-full flex items-center justify-center">
                 <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
             </div>
             <h1 className="text-xl font-bold">Playlist Merger</h1>
         </div>
         <div className="flex items-center space-x-4">
             {user && (
                 <div className="flex items-center space-x-2 text-sm">
                     {user.images?.[0] ? (
                         <img src={user.images[0].url} alt={user.display_name} className="w-8 h-8 rounded-full border border-[#282828]" />
                     ) : (
                         <div className="w-8 h-8 rounded-full bg-[#535353] flex items-center justify-center text-xs font-bold">{user.display_name.charAt(0)}</div>
                     )}
                     <span className="hidden md:inline font-medium">{user.display_name}</span>
                 </div>
             )}
             <button onClick={onLogout} className="text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                 Logout
             </button>
         </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
         <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
             <div>
                <h2 className="text-2xl font-bold mb-1">Select Playlists</h2>
                <p className="text-gray-400 text-sm">Choose the playlists you want to combine. Duplicates are removed automatically.</p>
             </div>
             
             <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                 <div className="relative">
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as SortOption)}
                        className="appearance-none bg-[#282828] text-white text-sm font-bold rounded-full pl-4 pr-10 py-2 border border-[#535353] hover:border-white focus:outline-none focus:border-spotify-base transition-colors cursor-pointer w-full sm:w-auto"
                    >
                        <option value="NAME_ASC">Name (A-Z)</option>
                        <option value="NAME_DESC">Name (Z-A)</option>
                        <option value="TRACKS_DESC">Tracks (Most)</option>
                        <option value="TRACKS_ASC">Tracks (Least)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                 </div>

                 <div className="flex space-x-3">
                     <button 
                        onClick={handleSelectAll}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-full border border-[#535353] text-sm font-bold hover:border-white transition-colors"
                     >
                        {selectedIds.size === playlists.length && playlists.length > 0 ? 'Deselect All' : 'Select All'}
                     </button>
                     <div className="bg-[#282828] px-4 py-2 rounded-full text-sm font-bold text-gray-300 border border-transparent whitespace-nowrap">
                         {selectedIds.size} selected
                     </div>
                 </div>
             </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
             {sortedPlaylists.map(playlist => (
                 <PlaylistCard 
                    key={playlist.id} 
                    playlist={playlist} 
                    isSelected={selectedIds.has(playlist.id)} 
                    onToggle={toggleSelection} 
                 />
             ))}
         </div>
      </main>

      {/* Floating Action Button / Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] p-4 transition-transform duration-300 transform ${selectedIds.size > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-sm">
                  <span className="text-spotify-base font-bold">{selectedIds.size} playlists</span> ready to merge
              </div>
              <button 
                onClick={handleMerge}
                disabled={selectedIds.size < 2}
                className={`
                    px-8 py-3 rounded-full font-bold text-black uppercase tracking-widest text-sm transition-all
                    ${selectedIds.size >= 2 ? 'bg-spotify-base hover:bg-spotify-dark transform hover:scale-105 shadow-lg' : 'bg-gray-600 cursor-not-allowed'}
                `}
              >
                  Merge Playlists
              </button>
          </div>
      </div>

      <MergeStatusModal state={mergeState} onClose={() => setMergeState(s => ({...s, status: MergeStatus.IDLE}))} />
    </div>
  );
};

export default Dashboard;