export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  images: SpotifyImage[];
  email?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  owner: {
    display_name: string;
    id: string;
  };
  tracks: {
    total: number;
    href: string;
  };
  uri: string;
  external_urls?: {
    spotify: string;
  };
}

export interface SpotifyTrack {
  track: {
    id: string;
    name: string;
    uri: string;
    artists: { name: string }[];
    album: { name: string; images: SpotifyImage[] };
    duration_ms: number;
  };
  is_local: boolean;
}

export interface SpotifyPaginatedResponse<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

export enum MergeStatus {
  IDLE = 'IDLE',
  FETCHING_PLAYLISTS = 'FETCHING_PLAYLISTS',
  FETCHING_TRACKS = 'FETCHING_TRACKS',
  DEDUPLICATING = 'DEDUPLICATING',
  CREATING_PLAYLIST = 'CREATING_PLAYLIST',
  ADDING_TRACKS = 'ADDING_TRACKS',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface MergeState {
  status: MergeStatus;
  progress: number; // 0 to 100
  message: string;
  error?: string;
  resultUrl?: string;
  resultPlaylist?: SpotifyPlaylist;
}
