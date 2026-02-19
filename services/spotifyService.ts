import { SpotifyPaginatedResponse, SpotifyPlaylist, SpotifyTrack, SpotifyUser } from '../types';

export class SpotifyService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    // Handle Rate Limiting (429)
    if (response.status === 429 && retries > 0) {
        const retryAfterSecs = parseInt(response.headers.get('Retry-After') || '1', 10);
        // Wait retryAfter + 1 second buffer
        await this.wait((retryAfterSecs + 1) * 1000);
        return this.fetchWithAuth(url, options, retries - 1);
    }

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
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
    // Use 'me/playlists' to ensure we get all playlists (owned + followed)
    // We start with the max limit of 50 per page
    let nextUrl: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50';

    while (nextUrl) {
      try {
        const response = await this.fetchWithAuth(nextUrl);
        const data: SpotifyPaginatedResponse<SpotifyPlaylist> = await response.json();
        
        // Filter out null items which can occasionally appear in the API response
        if (data.items) {
          playlists = [...playlists, ...data.items.filter(p => p !== null)];
        }
        
        nextUrl = data.next;
      } catch (error) {
        console.error("Error fetching playlists page:", error);
        // If one page fails, we stop but return what we have so far
        break;
      }
    }

    return playlists;
  }

  async getPlaylistTracks(playlistId: string, onProgress?: (count: number) => void): Promise<SpotifyTrack[]> {
    let tracks: SpotifyTrack[] = [];
    // Removed specific 'fields' filter to ensure we get full objects and avoid missing nested data like images
    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

    while (nextUrl) {
      const response = await this.fetchWithAuth(nextUrl);
      const data: SpotifyPaginatedResponse<SpotifyTrack> = await response.json();
      
      // Filter out null tracks or local files which might not have URIs accessible globally
      // Note: check for item.track because sometimes the track object itself is null (e.g. episodes/removed content)
      const validTracks = data.items.filter(item => item && item.track && item.track.uri && !item.is_local);
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
        public: false // Creating private playlist by default
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