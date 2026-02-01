// app.js - Main app logic and navigation

// ========== GLOBAL STATE ==========
window.app = {
    audio: window.audio || new Audio(),
    state: window.playerState || {
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
        menuOpen: false,
        currentCategory: null,
        searchQuery: null
    }
};

// ========== NAVIGATION ==========




/// intna



// ========== PAGE SPECIFIC LOADERS ==========
async function loadNewPage() {
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
    
    // Add event listeners for category buttons
    setTimeout(() => {
        document.querySelectorAll('.view-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const term = e.currentTarget.dataset.term;
                const label = e.currentTarget.dataset.label;
                navigate('category', { label, term });
            });
        });
    }, 100);
}

function setupSearchPage() {
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

async function loadCategoryPage(label, term) {
    const title = document.getElementById('categoryTitle');
    const backBtn = document.getElementById('backToNewBtn');
    
    if (title) title.textContent = label;
    if (backBtn) backBtn.addEventListener('click', () => navigate('new'));
    
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
            
            window.setupSongClicks();
        }
    } catch (e) { console.error('Error viewing category:', e); }
}

function performSearch() {
    const searchInput = document.getElementById('apiSearchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (!query) return;
    
    navigate('search-results', { query });
}

async function loadSearchResults(query) {
    const searchInput = document.getElementById('apiSearchInput');
    const backBtn = document.getElementById('backToSearchBtn');
    const title = document.getElementById('searchResultsTitle');
    
    if (searchInput) searchInput.value = query;
    if (title) title.textContent = `Search Results for "${query}"`;
    if (backBtn) backBtn.addEventListener('click', () => navigate('search'));
    
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=30`);
        const data = await response.json();
        
        const resultsContainer = document.getElementById('searchResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = data.results.map(track => `
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
            `).join('');
            
            if (searchInput) searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());
            window.setupSongClicks();
        }
    } catch (e) { console.error('Search error:', e); }
}

// ========== RADIO PAGE ==========
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

async function loadRadioPage() {
    const stationsGrid = document.getElementById('radioStationsGrid');
    const showsGrid = document.getElementById('showsGrid');
    const interviewsGrid = document.getElementById('interviewsGrid');
    
    if (stationsGrid) {
        stationsGrid.innerHTML = radioData.liveStations.map(station => `
            <div class="radio-station-card" data-id="${station.id}">
                <div class="radio-station-icon" style="background: ${station.color}">${station.icon}</div>
                <div class="radio-station-name">${station.name}</div>
                <div class="radio-station-desc">${station.description}</div>
                <div class="radio-station-playing">${station.nowPlaying.title}</div>
            </div>
        `).join('');
        
        stationsGrid.querySelectorAll('.radio-station-card').forEach(card => {
            card.addEventListener('click', function() {
                const stationId = parseInt(this.dataset.id);
                const station = radioData.liveStations.find(s => s.id === stationId);
                if (station) {
                    window.playerState.queue = [{ 
                        url: `https://stream.example.com/radio/${station.id}`, 
                        title: station.nowPlaying.title, 
                        artist: station.nowPlaying.artist, 
                        art: station.nowPlaying.art, 
                        duration: 180 
                    }];
                    window.playerState.currentTrackIndex = 0;
                    window.loadAndPlaySong(window.playerState.queue[0]);
                    window.updateQueueDisplay();
                }
            });
        });
    }
    
    if (showsGrid) {
        showsGrid.innerHTML = radioData.shows.map(show => `
            <div class="show-card">
                <img src="${show.image}" alt="${show.title}" class="show-card-image">
                <div class="show-card-content">
                    <div class="show-card-title">${show.title}</div>
                    <div class="show-card-subtitle">${show.subtitle}</div>
                    <div class="show-card-description">${show.description}</div>
                    <div class="show-card-meta">
                        <span>${show.host}</span>
                        <span>${show.episodes} episodes</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    if (interviewsGrid) {
        interviewsGrid.innerHTML = radioData.interviews.map(interview => `
            <div class="interview-card" data-id="${interview.id}">
                <img src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=225&fit=crop" alt="${interview.title}" class="interview-card-image">
                <div class="interview-card-play" data-id="${interview.id}">
                    <i class="bi bi-play-btn-fill"></i>
                </div>
                <div class="interview-card-content">
                    <div class="interview-card-title">${interview.title}</div>
                    <div class="interview-card-participants">${interview.participants}</div>
                    <div class="show-card-meta">
                        <span>${interview.duration}</span>
                        <span>Video</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        interviewsGrid.querySelectorAll('.interview-card-play').forEach(btn => {
            btn.addEventListener('click', function(e) {
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
            });
        });
    }
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
        
        window.setupSongClicks();
    } catch (e) { console.error('Error fetching category data:', e); }
}

// ========== INITIALIZATION ==========
function initApp() {
    initNavigation();
    window.initPlayer();
    
    // Initialize video modal
    const videoModalCloseBtn = document.querySelector('.video-modal-close');
    const videoModal = document.getElementById('videoModal');
    if (videoModalCloseBtn) videoModalCloseBtn.addEventListener('click', window.closeVideoModal);
    if (videoModal) videoModal.addEventListener('click', (e) => e.target === videoModal && window.closeVideoModal());
    
    // Initialize queue
    const queueToggleBtn = document.getElementById('queueToggleBtn');
    const queueCloseBtn = document.getElementById('queueCloseBtn');
    const clearQueueBtn = document.getElementById('clearQueueBtn');
    if (queueToggleBtn) queueToggleBtn.addEventListener('click', window.toggleQueue);
    if (queueCloseBtn) queueCloseBtn.addEventListener('click', window.toggleQueue);
    if (clearQueueBtn) clearQueueBtn.addEventListener('click', window.clearQueue);
    
    // Load initial page
    navigate('home');
}

// ========== EXPORT TO WINDOW ==========
window.navigate = navigate;
window.performSearch = performSearch;
window.fetchCategoryData = fetchCategoryData;
window.loadNewPage = loadNewPage;
window.setupSearchPage = setupSearchPage;
window.loadCategoryPage = loadCategoryPage;
window.loadSearchResults = loadSearchResults;
window.loadRadioPage = loadRadioPage;
window.initApp = initApp;
window.radioData = radioData;

// Initialize when DOM is ready

document.addEventListener('DOMContentLoaded', initApp);

