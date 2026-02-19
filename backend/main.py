import os
import urllib.parse
from typing import Optional, Dict, Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from spotipy.oauth2 import SpotifyOAuth

# --- Configuration ---
# Ensure these are set in your environment
CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
# The backend callback URL (must match Spotify Dashboard)
REDIRECT_URI = os.environ.get("SPOTIFY_REDIRECT_URI", "http://localhost:8000/callback")
# Where to send the user back to after login (The React App URL)
# In local dev with Vite, this is usually http://localhost:5173
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_spotify_oauth():
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Server misconfiguration: Missing Spotify Credentials")
        
    return SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        # Scopes required for the Merger App
        scope="playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-private user-read-email",
        show_dialog=True
    )

@app.get("/login")
def login():
    """Redirects user to Spotify Authorization page."""
    try:
        sp_oauth = get_spotify_oauth()
        auth_url = sp_oauth.get_authorize_url()
        return RedirectResponse(auth_url)
    except Exception as e:
         return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/callback")
def callback(code: str):
    """Handles OAuth callback, exchanges code for token, and redirects to Frontend with token."""
    try:
        sp_oauth = get_spotify_oauth()
        token_info = sp_oauth.get_access_token(code)
        access_token = token_info.get("access_token")
        
        # Redirect back to the React App with the token in the URL fragment
        # This allows the client-side app to extract it without sending it to the server again immediately
        redirect_url = f"{FRONTEND_URL}/#access_token={access_token}"
        return RedirectResponse(redirect_url)
    except Exception as e:
        return JSONResponse({"error": f"Authentication failed: {str(e)}"}, status_code=400)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Spotify Merger Backend"}
