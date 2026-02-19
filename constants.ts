export const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
export const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
  "user-read-email"
];

export const CLIENT_ID_STORAGE_KEY = "spotify_merger_client_id";

// Helper to determine if we are in a hash route or not for redirect
export const getRedirectUri = () => {
    // 1. Get base URL without hash
    let url = window.location.href.split('#')[0].split('?')[0];
    
    // 2. Remove trailing slash if it exists (unless it's just the protocol)
    if (url.endsWith('/') && url.length > 8) {
        url = url.slice(0, -1);
    }
    
    return url;
};
export const REDIRECT_URI = getRedirectUri();