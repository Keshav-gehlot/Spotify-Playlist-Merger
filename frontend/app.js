/**
 * Checks if the user has an active session with the backend.
 */
async function checkStatus() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) return false;
        const data = await response.json();
        return data.logged_in;
    } catch (e) {
        console.error("Status check failed", e);
        return false;
    }
}

/**
 * Fetches playlists from the backend API and renders them.
 */
async function fetchPlaylists() {
    const grid = document.getElementById('playlists-grid');
    const loading = document.getElementById('loading');
    const countLabel = document.getElementById('playlist-count');
    
    try {
        const response = await fetch('/api/playlists');
        
        if (response.status === 401) {
            // Session invalid, force logout
            window.location.href = '/api/logout';
            return;
        }

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        const playlists = await response.json();
        
        // Update UI
        loading.classList.add('hidden');
        grid.classList.remove('hidden');
        countLabel.textContent = `${playlists.length} PLAYLISTS`;
        
        // Render Cards
        if (playlists.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">No playlists found.</div>`;
        } else {
            grid.innerHTML = playlists.map(playlist => {
                // Handle missing images
                const imageHtml = playlist.image 
                    ? `<img src="${playlist.image}" alt="${playlist.name}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />`
                    : `<div class="w-full h-full flex items-center justify-center bg-[#282828] text-gray-600">
                         <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
                       </div>`;

                return `
                    <div class="bg-spotify-card p-4 rounded-lg hover:bg-spotify-hover transition-colors duration-200 group cursor-default shadow-lg border border-transparent hover:border-[#282828]">
                        <div class="relative aspect-square mb-4 bg-[#282828] rounded-md overflow-hidden shadow-md">
                            ${imageHtml}
                        </div>
                        <h3 class="text-white font-bold truncate mb-1" title="${playlist.name}">${playlist.name}</h3>
                        <p class="text-[#b3b3b3] text-sm truncate">By ${playlist.owner}</p>
                        <div class="mt-2 flex items-center text-xs text-gray-500 font-medium uppercase tracking-wider">
                            <span>${playlist.total_tracks} Tracks</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
    } catch (e) {
        console.error(e);
        loading.innerHTML = `
            <div class="text-center">
                <p class="text-red-500 font-bold mb-2">Failed to load playlists.</p>
                <p class="text-gray-500 text-sm">${e.message}</p>
                <button onclick="location.reload()" class="mt-4 bg-[#282828] px-4 py-2 rounded text-sm hover:text-white">Retry</button>
            </div>
        `;
    }
}

/**
 * Initialize application state
 */
async function init() {
    const isLoggedIn = await checkStatus();
    
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const authControls = document.getElementById('auth-controls');

    if (isLoggedIn) {
        // Logged In State
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        
        authControls.innerHTML = `
            <div class="flex items-center gap-4">
                <button onclick="window.location.href='/api/logout'" 
                        class="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                    Log out
                </button>
            </div>
        `;
        
        // Trigger data fetch
        fetchPlaylists();
    } else {
        // Logged Out State
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        authControls.innerHTML = ``;
    }
}

// Start app
init();
