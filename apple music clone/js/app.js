// ========== APP INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('Apple Music Clone initialized');
    initApp();
});

// ========== GLOBAL STATE ==========
const app = {
    audio: new Audio(),
    state: {
        currentTrackIndex: 0,
        isPlaying: false,
        isShuffled: false,
        isLooping: false,
        isLoopOnce: false,
        queue: [],
        volume: 1.0,
        currentRadioStation: null
    },
    navigation: {
        currentPage: 'home',
        menuOpen: false
    }
};

// ========== NAVIGATION ==========
function navigate(page) {
    const fullNav = document.getElementById('fullNav');
    const menuBtn = document.getElementById('menuBtn');
    
    fullNav?.classList.remove('open');
    if (menuBtn) menuBtn.innerHTML = '<i class="bi bi-list"></i>';
    
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll(`[id^="nav-${page}"], [id^="side-${page}"]`).forEach(el => el.classList.add('active'));
    
    app.navigation.currentPage = page;
    
    const mainView = document.getElementById('mainView');
    if (!mainView) return;
    
    const pageRenderers = {
        'home': renderHomePage,
        'new': renderNewPage,
        'radio': renderRadioPage,
        'search': openSearchView
    };
    
    pageRenderers[page] ? pageRenderers[page]() : mainView.innerHTML = `<div class="p-5"><h1 class="fw-bold">${page.toUpperCase()}</h1></div>`;
}

function initNavigation() {
    const menuBtn = document.getElementById('menuBtn');
    const fullNav = document.getElementById('fullNav');
    
    if (menuBtn && fullNav) {
        menuBtn.addEventListener('click', () => {
            app.navigation.menuOpen = !app.navigation.menuOpen;
            fullNav.classList.toggle('open');
            menuBtn.innerHTML = app.navigation.menuOpen ? '<i class="bi bi-x"></i>' : '<i class="bi bi-list"></i>';
        });
    }
    
    // Sidebar navigation
    ['side-home', 'side-new', 'side-radio', 'sideSearchBtn', 'nav-home', 'nav-new', 'nav-radio', 'nav-search'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => navigate(id.replace('side-', '').replace('nav-', '').replace('SearchBtn', 'search')));
    });
}

// ========== PAGES ==========
function renderHomePage() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;
    mainView.innerHTML = `<div class="promo-banner"><div class="promo-logo"><i class="bi bi-apple"></i></div><h2>Get over 100 million songs free for 1 month.</h2><p>Plus your entire music library on all your devices. 1 month free, then $10.99/month.</p></div>`;
}

function renderNewPage() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;
    
    mainView.innerHTML = `<div class="container-fluid p-4 p-md-5"><h1 class="fw-bold mb-4 display-5">New</h1><div id="categories-container"></div></div>`;
    
    const sections = [
        { label: "Trending Globally", term: "Top Hits 2024", type: "billboard" }, 
        { label: "Latest Chart Toppers", term: "Billboard Hot 100", type: "list-item" },  
        { label: "New Pop Releases", term: "Pop 2024", type: "large-card" },
        { label: "Hip-Hop & Rap", term: "Hip Hop Hits", type: "large-card" },
        { label: "Chill & Acoustic", term: "Acoustic Hits", type: "large-card" }
    ];

    const container = document.getElementById('categories-container');
    if (!container) return;

    sections.forEach(sec => {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = sec.type === 'billboard' ? "mb-5" : "mb-5 px-4";
        sectionDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-link text-white p-0 text-decoration-none h4 fw-bold mb-0 view-category-btn" 
                        data-term="${sec.term}" data-label="${sec.label}">
                    ${sec.label} <i class="bi bi-chevron-right small text-secondary"></i>
                </button>
            </div>
            <div class="horizontal-scroll-wrapper">
                <div class="row flex-nowrap gx-3" id="row-${sec.term.replace(/\s/g, '')}">
                    <div class="col-12 text-secondary">Loading...</div>
                </div>
            </div>
        `;
        container.appendChild(sectionDiv);
        fetchCategoryData(sec.term, `row-${sec.term.replace(/\s/g, '')}`, sec.type);
    });
    
    setTimeout(() => {
        document.querySelectorAll('.view-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const term = e.currentTarget.dataset.term;
                const label = e.currentTarget.dataset.label;
                viewCategory(label, term);
            });
        });
    }, 100);
}

// ========== API FUNCTIONS ==========
async function fetchCategoryData(term, containerId, type) {
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=15`);
        const data = await response.json();
        const container = document.getElementById(containerId);
        
        if (!container || !data.results || data.results.length === 0) {
            if (container) container.innerHTML = '<div class="col-12 text-secondary">No results found</div>';
            return;
        }
        
        container.innerHTML = data.results.map(track => {
            const highResArt = track.artworkUrl100.replace('100x100', '600x600');
            
            if (type === 'billboard') {
                return `
                    <div class="col-11 col-md-8 col-lg-6 song-result" 
                         data-url="${track.previewUrl}" data-title="${track.trackName}" 
                         data-artist="${track.artistName}" data-art="${highResArt}">
                        <div class="billboard-card position-relative overflow-hidden rounded-4 shadow-lg">
                            <img src="${highResArt}" class="w-100 h-100 object-fit-cover">
                            <div class="billboard-overlay p-4 d-flex flex-column justify-content-end">
                                <h2 class="text-white fw-bold mb-0">${track.trackName}</h2>
                                <p class="text-white-50 mb-0">${track.artistName}</p>
                            </div>
                        </div>
                    </div>`;
            }
            
            return `
                <div class="col-8 col-sm-6 col-md-4 col-lg-3 col-xl-2 song-result" 
                     data-url="${track.previewUrl}" data-title="${track.trackName}" 
                     data-artist="${track.artistName}" data-art="${highResArt}">
                    <div class="card bg-transparent border-0">
                        <div class="card-art-wrap position-relative">
                            <img src="${highResArt}" class="card-img-top rounded-3 shadow" alt="${track.trackName}">
                            <div class="play-overlay"><i class="bi bi-play-fill text-white fs-2"></i></div>
                        </div>
                        <div class="card-body px-0 pt-2">
                            <h6 class="text-white text-truncate mb-0 small">${track.trackName}</h6>
                            <p class="text-secondary text-truncate x-small">${track.artistName}</p>
                        </div>
                    </div>
                </div>`;
        }).join('');
        
        setupSongClicks();
    } catch (e) { console.error('Error fetching category data:', e); }
}

async function viewCategory(label, term) {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;
    
    mainView.innerHTML = `
        <div class="container-fluid p-4 p-md-5">
            <div class="d-flex align-items-center mb-4">
                <button class="btn text-danger p-0 me-3" id="backToNewBtn"><i class="bi bi-chevron-left fs-4"></i></button>
                <h1 class="fw-bold mb-0">${label}</h1>
            </div>
            <div id="category-list-results" class="row g-3"><div class="col-12 text-secondary">Loading...</div></div>
        </div>
    `;
    
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=50`);
        const data = await response.json();
        const listContainer = document.getElementById('category-list-results');
        
        if (listContainer) {
            listContainer.innerHTML = data.results.map((track, index) => `
                <div class="col-12 song-result" 
                     data-url="${track.previewUrl}" data-title="${track.trackName}" 
                     data-artist="${track.artistName}" data-art="${track.artworkUrl100.replace('100x100', '600x600')}">
                    <div class="d-flex align-items-center p-2 border-bottom border-secondary border-opacity-25 item-hover">
                        <span class="text-secondary me-3" style="width: 20px;">${index + 1}</span>
                        <img src="${track.artworkUrl100}" class="rounded-2 me-3" style="width:45px; height:45px;">
                        <div class="flex-grow-1 overflow-hidden">
                            <div class="text-white text-truncate fw-medium">${track.trackName}</div>
                            <div class="text-secondary text-truncate small">${track.artistName}</div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            const backBtn = document.getElementById('backToNewBtn');
            if (backBtn) backBtn.addEventListener('click', () => navigate('new'));
            
            setupSongClicks();
        }
    } catch (e) { console.error('Error viewing category:', e); }
}

// ========== SEARCH ==========
function openSearchView() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;
    
    mainView.innerHTML = `
        <div class="search-page-content p-md-5">
            <div class="search-header-row">
                <div class="search-bar-inner"><i class="bi bi-search text-secondary"></i>
                    <input type="text" id="apiSearchInput" placeholder="Search artists, songs, albums">
                </div>
                <button class="d-md-none" id="cancelSearchBtn" style="background:none; border:none; color:var(--apple-red); font-size:17px; font-weight:500;">Cancel</button>
            </div>
            <h5 class="fw-bold mt-2" style="font-size: 22px;">Quick Links</h5>
            <div class="quick-links-grid">
                <div class="category-card" style="background-color: #4facfe;" data-query="Road to Halftime"><span>Road to Halftime</span></div>
                <div class="category-card" style="background-color: #6a11cb;" data-query="Billboard Charts"><span>Charts</span></div>
                <div class="category-card" style="background-color: #ff0844;" data-query="Apple Music Radio"><span>Apple Music Radio</span></div>
                <div class="category-card" style="background-color: #30cfd0;" data-query="Hip Hop"><span>Hip-Hop</span></div>
                <div class="category-card" style="background-color: #f093fb;" data-query="Pop Music"><span>Pop</span></div>
                <div class="category-card" style="background-color: #5ee7df;" data-query="Chill Music"><span>Chill</span></div>
            </div>
        </div>
    `;
    
    setupSearchEvents();
}

function setupSearchEvents() {
    const searchInput = document.getElementById('apiSearchInput');
    const cancelBtn = document.getElementById('cancelSearchBtn');
    const quickLinks = document.querySelectorAll('.category-card');
    
    if (searchInput) searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());
    if (cancelBtn) cancelBtn.addEventListener('click', () => navigate('home'));
    quickLinks.forEach(link => link.addEventListener('click', (e) => {
        const query = e.currentTarget.dataset.query;
        if (searchInput) searchInput.value = query;
        performSearch();
    }));
}

async function performSearch() {
    const searchInput = document.getElementById('apiSearchInput');
    const mainView = document.getElementById('mainView');
    if (!searchInput || !mainView) return;
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=30`);
        const data = await response.json();
        
        mainView.innerHTML = `
            <div class="search-page-content p-md-5">
                <div class="search-header-row">
                    <div class="search-bar-inner"><i class="bi bi-search text-secondary"></i>
                        <input type="text" id="apiSearchInput" placeholder="Search artists, songs, albums" value="${query}">
                    </div>
                    <button class="d-md-none" id="backToSearchBtn" style="background:none; border:none; color:var(--apple-red); font-size:17px; font-weight:500;">Cancel</button>
                </div>
                <h5 class="fw-bold mt-4 mb-3" style="font-size: 20px;">Search Results for "${query}"</h5>
                <div class="row g-2" id="searchResults">
                    ${data.results.map(track => `
                        <div class="col-12 song-result" data-url="${track.previewUrl}" data-title="${track.trackName}" 
                             data-artist="${track.artistName}" data-art="${track.artworkUrl100.replace('100x100','600x600')}">
                            <div class="d-flex align-items-center p-3 border-bottom border-secondary border-opacity-25 item-hover">
                                <img src="${track.artworkUrl100}" class="rounded-2 me-3" style="width:50px; height:50px;">
                                <div class="flex-grow-1 overflow-hidden">
                                    <div class="text-white text-truncate fw-medium">${track.trackName}</div>
                                    <div class="text-secondary text-truncate">${track.artistName}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const newSearchInput = document.getElementById('apiSearchInput');
        const backBtn = document.getElementById('backToSearchBtn');
        if (newSearchInput) newSearchInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());
        if (backBtn) backBtn.addEventListener('click', openSearchView);
        
        setupSongClicks();
    } catch (e) { console.error('Search error:', e); }
}

// ========== SONG CLICKS ==========
function setupSongClicks() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;
    
    mainView.addEventListener('click', function(e) {
        const songCard = e.target.closest('.song-result');
        if (songCard) {
            e.preventDefault();
            e.stopPropagation();
            
            const data = {
                url: songCard.dataset.url,
                title: songCard.dataset.title,
                artist: songCard.dataset.artist,
                art: songCard.dataset.art
            };
            
            const rowContainer = songCard.closest('[id^="row-"]') || 
                               songCard.closest('#searchResults') || 
                               songCard.closest('#category-list-results');
            
            if (rowContainer) {
                const allSongs = rowContainer.querySelectorAll('.song-result');
                app.state.queue = Array.from(allSongs).map(card => ({
                    title: card.dataset.title,
                    artist: card.dataset.artist,
                    art: card.dataset.art,
                    url: card.dataset.url,
                    duration: 180
                }));
                
                const clickedIndex = Array.from(allSongs).findIndex(card => card.dataset.url === data.url);
                if (clickedIndex !== -1) {
                    app.state.currentTrackIndex = clickedIndex;
                    loadAndPlaySong(app.state.queue[clickedIndex]);
                    updateQueueDisplay();
                }
            }
        }
    });
}

// ========== QUEUE ==========
function toggleQueue() {
    const queueSidebar = document.getElementById('queueSidebar');
    if (!queueSidebar) return;
    queueSidebar.classList.toggle('active');
    if (queueSidebar.classList.contains('active')) updateQueueDisplay();
}

function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    if (!queueList) return;
    
    if (app.state.queue.length > 0) {
        queueList.innerHTML = app.state.queue.map((track, index) => `
            <div class="queue-item ${index === app.state.currentTrackIndex ? 'active' : ''}" 
                 onclick="playTrackFromQueue(${index})">
                <img src="${track.art}" class="queue-item-img">
                <div class="queue-item-info">
                    <div class="queue-item-title">${track.title}</div>
                    <div class="queue-item-artist">${track.artist}</div>
                </div>
                <div class="queue-item-duration">${formatDuration(track.duration || 180)}</div>
            </div>
        `).join('');
    } else {
        queueList.innerHTML = '<div class="text-center text-secondary py-5">Queue is empty</div>';
    }
}

function playTrackFromQueue(index) {
    if (index >= 0 && index < app.state.queue.length) {
        app.state.currentTrackIndex = index;
        loadAndPlaySong(app.state.queue[index]);
        updateQueueDisplay();
    }
}

function clearQueue() {
    app.state.queue = [];
    app.state.currentTrackIndex = 0;
    updateQueueDisplay();
}

// ========== FULL PLAYER ==========
async function toggleFullPlayer(show) {
    const overlay = document.getElementById('fullPlayerOverlay');
    if (!overlay) return;
    
    if (show) {
        await openFullPlayer();
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
        setTimeout(() => overlay.innerHTML = '', 300);
    }
}

async function openFullPlayer() {
    const overlay = document.getElementById('fullPlayerOverlay');
    if (!overlay) return;
    
    if (app.state.queue.length === 0 || app.state.currentTrackIndex >= app.state.queue.length) {
        overlay.innerHTML = `
            <div class="full-player-wrapper" id="playerWrapper">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <button class="btn text-white p-0" id="closeFullPlayerBtn" style="font-size: 2rem;"><i class="bi bi-chevron-down"></i></button>
                    <button class="btn text-white p-0" id="queueFromFullPlayerBtn"><i class="bi bi-list-ul"></i></button>
                </div>
                <div class="text-center py-5"><h2>No song playing</h2><p class="text-secondary">Play a song to see lyrics</p></div>
            </div>
        `;
        
        setTimeout(() => {
            const closeBtn = document.getElementById('closeFullPlayerBtn');
            const queueBtn = document.getElementById('queueFromFullPlayerBtn');
            if (closeBtn) closeBtn.addEventListener('click', () => toggleFullPlayer(false));
            if (queueBtn) queueBtn.addEventListener('click', toggleQueue);
        }, 100);
        return;
    }
    
    const currentTrack = app.state.queue[app.state.currentTrackIndex];
    overlay.innerHTML = `
        <div class="full-player-wrapper" id="playerWrapper">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn text-white p-0" id="closeFullPlayerBtn" style="font-size: 2rem;"><i class="bi bi-chevron-down"></i></button>
                <button class="btn text-white p-0" id="queueFromFullPlayerBtn"><i class="bi bi-list-ul"></i></button>
            </div>
            <div class="player-main-content">
                <img src="${currentTrack.art}" id="full-player-art" class="shadow-lg">
                <div id="lyrics-box">Loading lyrics...</div>
            </div>
            <div class="player-ui-controls text-center mt-4">
                <h2 class="fw-bold mb-0" id="full-player-title">${currentTrack.title}</h2>
                <p class="text-secondary fs-4" id="full-player-artist">${currentTrack.artist}</p>
                <div class="d-flex justify-content-center align-items-center gap-5 my-4">
                    <button class="btn text-white fs-2" id="fullShuffleBtn"><i class="bi bi-shuffle ${app.state.isShuffled ? 'active-apple' : ''}"></i></button>
                    <button class="btn text-white display-4" id="fullPrevBtn"><i class="bi bi-skip-start-fill"></i></button>
                    <button class="btn text-white display-1" id="fullPlayBtn"><i class="bi ${app.state.isPlaying ? 'bi-pause-circle-fill' : 'bi-play-circle-fill'}"></i></button>
                    <button class="btn text-white display-4" id="fullNextBtn"><i class="bi bi-skip-end-fill"></i></button>
                    <button class="btn text-white fs-2" id="lyricsToggleBtn"><i class="bi bi-quote"></i></button>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        const closeBtn = document.getElementById('closeFullPlayerBtn');
        const queueBtn = document.getElementById('queueFromFullPlayerBtn');
        const shuffleBtn = document.getElementById('fullShuffleBtn');
        const prevBtn = document.getElementById('fullPrevBtn');
        const playBtn = document.getElementById('fullPlayBtn');
        const nextBtn = document.getElementById('fullNextBtn');
        const lyricsBtn = document.getElementById('lyricsToggleBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', () => toggleFullPlayer(false));
        if (queueBtn) queueBtn.addEventListener('click', toggleQueue);
        if (shuffleBtn) shuffleBtn.addEventListener('click', handleShuffle);
        if (prevBtn) prevBtn.addEventListener('click', handlePrev);
        if (playBtn) playBtn.addEventListener('click', handlePlay);
        if (nextBtn) nextBtn.addEventListener('click', handleNext);
        if (lyricsBtn) lyricsBtn.addEventListener('click', toggleLyricView);
    }, 100);
    
    await fetchLyrics(currentTrack.artist, currentTrack.title);
}

async function fetchLyrics(artist, title) {
    const lyricsBox = document.getElementById('lyrics-box');
    if (!lyricsBox) return;
    
    try {
        const response = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
        const data = await response.json();
        lyricsBox.innerHTML = data.plainLyrics ? data.plainLyrics.replace(/\n/g, '<br>') : "Lyrics not available.";
    } catch (error) {
        console.error("Lyrics fetch error:", error);
        lyricsBox.innerText = "Couldn't load lyrics.";
    }
}

function toggleLyricView() {
    const wrapper = document.getElementById('playerWrapper');
    const lyricsBtn = document.getElementById('lyricsToggleBtn');
    if (wrapper) wrapper.classList.toggle('lyrics-active');
    if (lyricsBtn) lyricsBtn.classList.toggle('active-apple');
}

// ========== RADIO ==========
const radioData = {
    liveStations: [
        { id: 1, name: "Chill", description: "Music Radio", color: "#4A90E2", icon: "🎵", 
          nowPlaying: { title: "Midnight City", artist: "M83", art: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop" }},
        { id: 2, name: "HITS HITS HITS", description: "Top 40 Radio", color: "#FF6B6B", icon: "🔥", 
          nowPlaying: { title: "Flowers", artist: "Miley Cyrus", art: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop" }},
        { id: 3, name: "COUNTRY", description: "Country Radio", color: "#4CD964", icon: "🤠", 
          nowPlaying: { title: "Tennessee Whiskey", artist: "Chris Stapleton", art: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop" }},
        { id: 4, name: "MÚSICA UNO", description: "Latin Radio", color: "#FF9500", icon: "💃", 
          nowPlaying: { title: "Taki Taki", artist: "DJ Snake", art: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop" }},
        { id: 5, name: "Club", description: "Dance Radio", color: "#AF52DE", icon: "🕺", 
          nowPlaying: { title: "Titanium", artist: "David Guetta", art: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop" }},
        { id: 6, name: "Rock", description: "Rock Radio", color: "#FF3B30", icon: "🎸", 
          nowPlaying: { title: "Bohemian Rhapsody", artist: "Queen", art: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop" }}
    ],
    shows: [
        { id: 1, title: "THE ZANE LOWE SHOW", subtitle: "Eli, Skye Newman, and more", description: "Zane reveals day one of his 26 For '26 list.", host: "Zane Lowe", episodes: 26, image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop" },
        { id: 2, title: "SOULECTION", subtitle: "Episode 716", description: "Joe tests out sounds for the 15-year anniversary special mix.", host: "Joe Kay", episodes: 716, image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop" },
        { id: 3, title: "NEW MUSIC DAILY", subtitle: "Harry Styles Special", description: "The pop megastar returns with 'Aperture'.", host: "Various Hosts", episodes: 450, image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop" }
    ],
    interviews: [
        { id: 1, title: "Louis Tomlinson Interview", participants: "Louis Tomlinson, Zane Lowe", duration: "24:15", videoId: "x7x0qg" },
        { id: 2, title: "A$AP Rocky: The Ebro Show", participants: "A$AP Rocky, Ebro Darden", duration: "38:42", videoId: "x7wwck" },
        { id: 3, title: "The Kid LAROI Interview", participants: "The Kid LAROI, Zane Lowe", duration: "19:30", videoId: "x7wwcl" }
    ]
};

function renderRadioPage() {
    const mainView = document.getElementById('mainView');
    if (!mainView) return;
    
    mainView.innerHTML = `
        <div class="container-fluid p-4 p-md-5">
            <div class="radio-hero"><div class="radio-hero-overlay"><div><div class="radio-hero-badge">LIVE NOW</div>
                <h1 class="radio-hero-title">Apple Music Radio</h1><p class="radio-hero-subtitle">Exclusive shows, live stations, and interviews.</p></div></div></div>
            <div class="mb-5"><div class="section-header"><h2 class="section-title">On Air Now</h2><a href="#" class="see-all-link">See All</a></div>
                <div class="live-now-grid">${radioData.liveStations.map(station => `
                    <div class="radio-station-card" data-id="${station.id}"><div class="radio-station-icon" style="background: ${station.color}">${station.icon}</div>
                        <div class="radio-station-name">${station.name}</div><div class="radio-station-desc">${station.description}</div>
                        <div class="radio-station-playing">${station.nowPlaying.title}</div></div>`).join('')}</div></div>
            <div class="mb-5"><div class="section-header"><h2 class="section-title">Subscribe to Play Episodes</h2><a href="#" class="see-all-link">See All</a></div>
                <div class="shows-grid">${radioData.shows.map(show => `
                    <div class="show-card"><img src="${show.image}" alt="${show.title}" class="show-card-image">
                        <div class="show-card-content"><div class="show-card-title">${show.title}</div><div class="show-card-subtitle">${show.subtitle}</div>
                        <div class="show-card-description">${show.description}</div><div class="show-card-meta"><span>${show.host}</span><span>${show.episodes} episodes</span></div></div></div>`).join('')}</div></div>
            <div class="mb-5"><div class="section-header"><h2 class="section-title">Watch Interviews for Free</h2><a href="#" class="see-all-link">See All</a></div>
                <div class="interviews-grid">${radioData.interviews.map(interview => `
                    <div class="interview-card" data-id="${interview.id}"><img src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=225&fit=crop" alt="${interview.title}" class="interview-card-image">
                        <div class="interview-card-play" data-id="${interview.id}"><i class="bi bi-play-btn-fill"></i></div><div class="interview-card-content">
                        <div class="interview-card-title">${interview.title}</div><div class="interview-card-participants">${interview.participants}</div>
                        <div class="show-card-meta"><span>${interview.duration}</span><span>Video</span></div></div></div>`).join('')}</div></div>
        </div>
    `;
    
    setupRadioEvents();
}

function setupRadioEvents() {
    document.querySelectorAll('.radio-station-card').forEach(card => card.addEventListener('click', function() {
        const stationId = parseInt(this.dataset.id);
        const station = radioData.liveStations.find(s => s.id === stationId);
        if (station) {
            app.state.queue = [{ url: `https://stream.example.com/radio/${station.id}`, title: station.nowPlaying.title, 
                                 artist: station.nowPlaying.artist, art: station.nowPlaying.art, duration: 180 }];
            app.state.currentTrackIndex = 0;
            loadAndPlaySong(app.state.queue[0]);
            updateQueueDisplay();
        }
    }));
    
    document.querySelectorAll('.interview-card-play').forEach(btn => btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const interviewId = parseInt(this.dataset.id);
        const interview = radioData.interviews.find(i => i.id === interviewId);
        if (!interview) return;
        
        const modal = document.getElementById('videoModal');
        const title = document.getElementById('videoModalTitle');
        const player = document.getElementById('dailymotionPlayer');
        
        if (title) title.textContent = interview.title;
        if (player) player.src = `https://www.dailymotion.com/embed/video/${interview.videoId}?autoplay=1&controls=1`;
        if (modal) modal.classList.add('active');
    }));
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('dailymotionPlayer');
    if (modal) modal.classList.remove('active');
    if (player) player.src = '';
}

// ========== UTILITIES ==========
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========== INITIALIZATION ==========
function initApp() {
    initNavigation();
    initPlayer();
    setTimeout(setupSongClicks, 1000);
    navigate('home');
    
    // Video modal close
    const videoModalCloseBtn = document.querySelector('.video-modal-close');
    const videoModal = document.getElementById('videoModal');
    if (videoModalCloseBtn) videoModalCloseBtn.addEventListener('click', closeVideoModal);
    if (videoModal) videoModal.addEventListener('click', (e) => e.target === videoModal && closeVideoModal());
    
    // Queue events
    const queueToggleBtn = document.getElementById('queueToggleBtn');
    const queueCloseBtn = document.getElementById('queueCloseBtn');
    const clearQueueBtn = document.getElementById('clearQueueBtn');
    if (queueToggleBtn) queueToggleBtn.addEventListener('click', toggleQueue);
    if (queueCloseBtn) queueCloseBtn.addEventListener('click', toggleQueue);
    if (clearQueueBtn) clearQueueBtn.addEventListener('click', clearQueue);
}

function initPlayer() {
    ['btn-play', 'btn-shuffle', 'btn-repeat', 'btn-next', 'btn-prev'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', window[id.replace('btn-', 'handle')]);
    });
    
    const progressFill = document.getElementById('api-progress-fill');
    if (progressFill) {
        progressFill.addEventListener('input', (e) => app.audio.currentTime = e.target.value);
        app.audio.ontimeupdate = () => progressFill.value = app.audio.currentTime;
    }
    
    const volumeControl = document.getElementById('api-volume');
    if (volumeControl) {
        volumeControl.value = app.state.volume * 100;
        volumeControl.addEventListener('input', (e) => {
            app.state.volume = e.target.value / 100;
            app.audio.volume = app.state.volume;
        });
    }
    
    app.audio.onended = () => {
        if (app.state.isLoopOnce && app.state.queue[app.state.currentTrackIndex]) {
            loadAndPlaySong(app.state.queue[app.state.currentTrackIndex]);
        } else if (app.state.isLooping || app.state.currentTrackIndex < app.state.queue.length - 1) {
            handleNext();
        } else {
            const playIcon = document.getElementById('btn-play')?.querySelector('i');
            if (playIcon) playIcon.className = 'bi bi-play-fill';
            app.state.isPlaying = false;
        }
    };
    
    const playerInfo = document.getElementById('clickable-info');
    if (playerInfo) playerInfo.addEventListener('click', () => app.state.queue.length > 0 && toggleFullPlayer(true));
}

// ========== EXPORT TO WINDOW ==========
window.navigate = navigate;
window.fetchCategoryData = fetchCategoryData;
window.viewCategory = viewCategory;
window.openSearchView = openSearchView;
window.performSearch = performSearch;
window.handlePlay = handlePlay;
window.handleShuffle = handleShuffle;
window.handleRepeat = handleRepeat;
window.handleNext = handleNext;
window.handlePrev = handlePrev;
window.toggleQueue = toggleQueue;
window.updateQueueDisplay = updateQueueDisplay;
window.playTrackFromQueue = playTrackFromQueue;
window.clearQueue = clearQueue;
window.toggleFullPlayer = toggleFullPlayer;
window.toggleLyricView = toggleLyricView;
window.renderRadioPage = renderRadioPage;
window.closeVideoModal = closeVideoModal;
window.formatDuration = formatDuration;
window.app = app;