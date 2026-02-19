import os
import uuid
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import spotipy
from spotipy.oauth2 import SpotifyOAuth

# --- Configuration ---
# Ensure these are set in your environment
CLIENT_ID = os.environ.get("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.environ.get("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.environ.get("SPOTIFY_REDIRECT_URI", "http://localhost:8000/callback")

# --- Session Storage ---
# For this demo, we store tokens in memory to avoid cookie size limits.
# In production, use a database (Redis/SQL).
session_store: Dict[str, Any] = {}

app = FastAPI()

# Security: Session Middleware for tracking user state
app.add_middleware(SessionMiddleware, secret_key=os.urandom(32))

# Allow CORS (useful if developing frontend separately, though we serve static here)
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
        scope="playlist-read-private playlist-read-collaborative",
        cache_handler=None, # We handle token persistence manually via session_store
        show_dialog=True
    )

# --- Endpoints ---

@app.get("/login")
def login(request: Request):
    """Redirects user to Spotify Authorization page."""
    sp_oauth = get_spotify_oauth()
    auth_url = sp_oauth.get_authorize_url()
    return RedirectResponse(auth_url)

@app.get("/callback")
def callback(request: Request, code: str):
    """Handles OAuth callback, exchanges code for token, and establishes session."""
    sp_oauth = get_spotify_oauth()
    try:
        token_info = sp_oauth.get_access_token(code)
    except Exception as e:
        return JSONResponse({"error": f"Authentication failed: {str(e)}"}, status_code=400)
    
    # Generate a secure session ID
    session_id = str(uuid.uuid4())
    
    # Store token server-side
    session_store[session_id] = token_info
    
    # Set session cookie
    request.session["session_id"] = session_id
    
    # Redirect to the main app
    return RedirectResponse("/")

@app.get("/api/status")
def status(request: Request):
    """Check authentication status."""
    session_id = request.session.get("session_id")
    is_logged_in = session_id is not None and session_id in session_store
    return {"logged_in": is_logged_in}

@app.get("/api/playlists")
def get_playlists(request: Request):
    """Fetches ALL user playlists handling pagination."""
    session_id = request.session.get("session_id")
    
    if not session_id or session_id not in session_store:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token_info = session_store[session_id]
    sp_oauth = get_spotify_oauth()

    # Auto-refresh token if expired
    if sp_oauth.is_token_expired(token_info):
        try:
            token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])
            session_store[session_id] = token_info
        except Exception:
            # If refresh fails, clear session
            del session_store[session_id]
            request.session.clear()
            raise HTTPException(status_code=401, detail="Session expired")

    sp = spotipy.Spotify(auth=token_info["access_token"])
    
    all_playlists = []
    
    try:
        # Initial fetch
        results = sp.current_user_playlists(limit=50)
        all_playlists.extend(results["items"])
        
        # Pagination loop
        while results["next"]:
            results = sp.next(results)
            all_playlists.extend(results["items"])
            
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Spotify API Error: {str(e)}")
         
    # Transform data for frontend
    data = []
    for pl in all_playlists:
        if pl: # Filter out nulls
            image_url = pl["images"][0]["url"] if pl["images"] and len(pl["images"]) > 0 else None
            data.append({
                "id": pl["id"],
                "name": pl["name"],
                "total_tracks": pl["tracks"]["total"],
                "image": image_url,
                "owner": pl["owner"]["display_name"]
            })
            
    return data

@app.get("/api/logout")
def logout(request: Request):
    """Clears session and logs user out."""
    session_id = request.session.get("session_id")
    if session_id and session_id in session_store:
        del session_store[session_id]
    request.session.clear()
    return RedirectResponse("/")

# --- Serve Frontend ---
# Mounts the frontend directory to serve index.html and app.js
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
