import os
import urllib.parse
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from spotipy.oauth2 import SpotifyOAuth

# --- Configuration ---
CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
# Spotify requires explicit IP for loopback addresses (no localhost)
REDIRECT_URI = os.environ.get("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8000/callback")
# Default frontend URL for local development override
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://127.0.0.1:5173")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_spotify_oauth():
    if not CLIENT_ID or not CLIENT_SECRET:
        print("CRITICAL ERROR: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not found.")
        raise HTTPException(
            status_code=500, 
            detail="Server misconfiguration: Missing Spotify Credentials. Please ensure a .env file exists in the root directory with SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET defined."
        )
        
    return SpotifyOAuth(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
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
def callback(request: Request, code: str):
    """Handles OAuth callback, exchanges code for token, and redirects to Frontend."""
    try:
        sp_oauth = get_spotify_oauth()
        token_info = sp_oauth.get_access_token(code)
        access_token = token_info.get("access_token")
        
        # Smart Redirect Logic
        host = request.headers.get("host", "")
        
        # Check if running locally (port 8000)
        if "localhost:8000" in host or "127.0.0.1:8000" in host:
            # Local Dev: Redirect to the configured frontend URL (default 127.0.0.1:5173)
            redirect_url = f"{FRONTEND_URL}/#access_token={access_token}"
        else:
            # Production: API and Frontend are on the same domain
            redirect_url = f"/#access_token={access_token}"

        return RedirectResponse(redirect_url)
    except Exception as e:
        return JSONResponse({"error": f"Authentication failed: {str(e)}"}, status_code=400)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Spotify Merger Backend"}
