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
export const REDIRECT_URI = window.location.origin + window.location.pathname;

// Helper to determine if we are in a hash route or not for redirect
export const getRedirectUri = () => {
    // Remove any hash from the current window location to get clean base
    return window.location.href.split('#')[0];
};