import { SpotifyPaginatedResponse, SpotifyPlaylist, SpotifyTrack, SpotifyUser } from '../types';

export class SpotifyService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Token expired
      window.location.hash = '';
      window.location.reload();
      throw new Error('Token expired');
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(`Spotify API Error: ${response.status} ${JSON.stringify(errorBody)}`);
    }

    return response;
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    const response = await this.fetchWithAuth('https://api.spotify.com/v1/me');
    return response.json();
  }

  async getUserPlaylists(userId: string): Promise<SpotifyPlaylist[]> {
    let playlists: SpotifyPlaylist[] = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/users/${userId}/playlists?limit=50`;

    while (nextUrl) {
      const response = await this.fetchWithAuth(nextUrl);
      const data: SpotifyPaginatedResponse<SpotifyPlaylist> = await response.json();
      playlists = [...playlists, ...data.items];
      nextUrl = data.next;
    }

    return playlists;
  }

  async getPlaylistTracks(playlistId: string, onProgress?: (count: number) => void): Promise<SpotifyTrack[]> {
    let tracks: SpotifyTrack[] = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,uri,artists,album,duration_ms),is_local),next,total`;

    while (nextUrl) {
      const response = await this.fetchWithAuth(nextUrl);
      const data: SpotifyPaginatedResponse<SpotifyTrack> = await response.json();
      
      // Filter out null tracks or local files which might not have URIs accessible globally
      const validTracks = data.items.filter(item => item.track && item.track.uri && !item.is_local);
      tracks = [...tracks, ...validTracks];
      
      if (onProgress) {
        onProgress(tracks.length);
      }
      
      nextUrl = data.next;
    }

    return tracks;
  }

  async createPlaylist(userId: string, name: string, description: string): Promise<SpotifyPlaylist> {
    const response = await this.fetchWithAuth(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        public: false
      })
    });
    return response.json();
  }

  async addTracksToPlaylist(playlistId: string, uris: string[]): Promise<void> {
    // Spotify API limit is 100 tracks per request
    const chunkSize = 100;
    for (let i = 0; i < uris.length; i += chunkSize) {
      const chunk = uris.slice(i, i + chunkSize);
      await this.fetchWithAuth(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
          uris: chunk
        })
      });
    }
  }
}