// player.js - Audio player functionality

// Initialize audio
const audio = new Audio();

// Player state
const playerState = {
    currentTrackIndex: 0,
    isPlaying: false,
    isShuffled: false,
    isLooping: false,
    isLoopOnce: false,
    queue: [],
    volume: 1.0
};

// Set to window for global access
window.audio = audio;
window.playerState = playerState;

// ========== CORE PLAYER FUNCTIONS ==========
function loadAndPlaySong(data) {
    if (!data || !data.url) return;
    
    audio.src = data.url;
    audio.play().then(() => {
        playerState.isPlaying = true;
        updateGlobalPlayer(data);
        updatePlayButton(true);
        
        // Update full player if open
        if (window.updateFullPlayer) {
            window.updateFullPlayer(data);
        }
    }).catch(error => {
        console.error('Playback failed:', error);
        updatePlayButton(false);
        playerState.isPlaying = false;
    });
}

function updateGlobalPlayer(data) {
    const trackTitle = document.getElementById('api-track-title');
    const artistName = document.getElementById('api-artist-name');
    const miniArt = document.getElementById('api-mini-art');
    
    if (trackTitle) trackTitle.innerText = data.title || 'Not Playing';
    if (artistName) artistName.innerText = data.artist || 'Apple Music';
    if (miniArt) {
        miniArt.src = data.art || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop';
        miniArt.style.display = 'block';
    }
}

function updatePlayButton(playing) {
    const playIcon = document.getElementById('btn-play')?.querySelector('i');
    const fullPlayIcon = document.getElementById('fullPlayBtn')?.querySelector('i');
    
    if (playIcon) {
        playIcon.className = playing ? 'bi bi-pause-fill' : 'bi bi-play-fill';
    }
    
    if (fullPlayIcon) {
        fullPlayIcon.className = playing ? 'bi bi-pause-circle-fill' : 'bi bi-play-circle-fill';
    }
}

// ========== PLAYER CONTROLS ==========
function handlePlay() {
    if (audio.paused) {
        audio.play().catch(e => console.log("Playback error:", e));
        playerState.isPlaying = true;
        updatePlayButton(true);
    } else {
        audio.pause();
        playerState.isPlaying = false;
        updatePlayButton(false);
    }
}

function handleShuffle() {
    const shuffleBtn = document.getElementById('btn-shuffle');
    const fullShuffleBtn = document.getElementById('fullShuffleBtn');
    
    playerState.isShuffled = !playerState.isShuffled;
    
    if (shuffleBtn) shuffleBtn.classList.toggle('active-apple');
    if (fullShuffleBtn) fullShuffleBtn.classList.toggle('active-apple');
    
    if (playerState.isShuffled && playerState.queue.length > 1) {
        const currentTrack = playerState.queue[playerState.currentTrackIndex];
        const tracksToShuffle = playerState.queue.filter((_, i) => i !== playerState.currentTrackIndex);
        for (let i = tracksToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracksToShuffle[i], tracksToShuffle[j]] = [tracksToShuffle[j], tracksToShuffle[i]];
        }
        playerState.queue = [currentTrack, ...tracksToShuffle];
        playerState.currentTrackIndex = 0;
        if (window.updateQueueDisplay) window.updateQueueDisplay();
    }
}

function handleRepeat() {
    const repeatBtn = document.getElementById('btn-repeat');
    
    if (!playerState.isLooping && !playerState.isLoopOnce) {
        playerState.isLoopOnce = true;
        if (repeatBtn) repeatBtn.classList.add('active-apple', 'loop-once');
    } else if (playerState.isLoopOnce) {
        playerState.isLoopOnce = false;
        playerState.isLooping = true;
        if (repeatBtn) {
            repeatBtn.classList.add('active-apple');
            repeatBtn.classList.remove('loop-once');
        }
    } else {
        playerState.isLooping = false;
        if (repeatBtn) repeatBtn.classList.remove('active-apple', 'loop-once');
    }
}

function handleNext() {
    if (playerState.queue.length === 0) return;
    
    if (playerState.isShuffled) {
        const availableIndices = playerState.queue.map((_, i) => i).filter(idx => idx !== playerState.currentTrackIndex);
        if (availableIndices.length > 0) {
            playerState.currentTrackIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
        }
    } else if (playerState.currentTrackIndex < playerState.queue.length - 1) {
        playerState.currentTrackIndex++;
        loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
    } else if (playerState.isLooping) {
        playerState.currentTrackIndex = 0;
        loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
    }
    if (window.updateQueueDisplay) window.updateQueueDisplay();
}

function handlePrev() {
    if (playerState.queue.length === 0) return;
    
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else if (playerState.currentTrackIndex > 0) {
        playerState.currentTrackIndex--;
        loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
        if (window.updateQueueDisplay) window.updateQueueDisplay();
    }
}

// ========== FULL PLAYER FUNCTIONS ==========
async function openFullPlayer() {
    const overlay = document.getElementById('fullPlayerOverlay');
    if (!overlay) return;
    
    if (playerState.queue.length === 0) {
        overlay.innerHTML = `
            <div class="full-player-wrapper" id="playerWrapper">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <button class="btn text-white p-0" id="closeFullPlayerBtn" style="font-size: 2rem;">
                        <i class="bi bi-chevron-down"></i>
                    </button>
                </div>
                <div class="text-center py-5">
                    <h2>No song playing</h2>
                    <p class="text-secondary">Play a song to see lyrics</p>
                </div>
            </div>
        `;
        
        document.getElementById('closeFullPlayerBtn')?.addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 400);
        });
        return;
    }
    
    const currentTrack = playerState.queue[playerState.currentTrackIndex];
    
    // Load full player HTML
    try {
        const response = await fetch('components/full-player.html');
        const html = await response.text();
        overlay.innerHTML = html;
        
        // Set track info
        document.getElementById('full-player-title').textContent = currentTrack.title;
        document.getElementById('full-player-artist').textContent = currentTrack.artist;
        document.getElementById('full-player-art').src = currentTrack.art;
        
        // Set button states
        const fullPlayIcon = document.getElementById('fullPlayBtn')?.querySelector('i');
        if (fullPlayIcon) {
            fullPlayIcon.className = playerState.isPlaying ? 'bi bi-pause-circle-fill' : 'bi bi-play-circle-fill';
        }
        
        const fullShuffleBtn = document.getElementById('fullShuffleBtn');
        if (fullShuffleBtn && playerState.isShuffled) {
            fullShuffleBtn.classList.add('active-apple');
        }
        
        // Add event listeners
        setupFullPlayerEvents();
        
        // Fetch lyrics
        fetchLyrics(currentTrack.artist, currentTrack.title);
        
        // Show overlay
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('active'), 10);
        
    } catch (error) {
        console.error('Error loading full player:', error);
    }
}

function setupFullPlayerEvents() {
    const closeBtn = document.getElementById('closeFullPlayerBtn');
    const queueBtn = document.getElementById('queueFromFullPlayerBtn');
    const fullPlayBtn = document.getElementById('fullPlayBtn');
    const fullPrevBtn = document.getElementById('fullPrevBtn');
    const fullNextBtn = document.getElementById('fullNextBtn');
    const fullShuffleBtn = document.getElementById('fullShuffleBtn');
    const lyricsBtn = document.getElementById('lyricsToggleBtn');
    
    if (closeBtn) closeBtn.addEventListener('click', closeFullPlayer);
    if (queueBtn) queueBtn.addEventListener('click', () => window.toggleQueue?.());
    if (fullPlayBtn) fullPlayBtn.addEventListener('click', handlePlay);
    if (fullPrevBtn) fullPrevBtn.addEventListener('click', handlePrev);
    if (fullNextBtn) fullNextBtn.addEventListener('click', handleNext);
    if (fullShuffleBtn) fullShuffleBtn.addEventListener('click', handleShuffle);
    if (lyricsBtn) lyricsBtn.addEventListener('click', toggleLyricView);
}

function closeFullPlayer() {
    const overlay = document.getElementById('fullPlayerOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
    }, 400);
}

function toggleFullPlayer() {
    const overlay = document.getElementById('fullPlayerOverlay');
    if (!overlay) return;
    
    if (overlay.classList.contains('active') || overlay.style.display === 'block') {
        closeFullPlayer();
    } else {
        openFullPlayer();
    }
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

function updateFullPlayer(data) {
    const title = document.getElementById('full-player-title');
    const artist = document.getElementById('full-player-artist');
    const art = document.getElementById('full-player-art');
    
    if (title) title.textContent = data.title;
    if (artist) artist.textContent = data.artist;
    if (art) art.src = data.art;
}

// ========== PLAYER INITIALIZATION ==========
function initPlayer() {
    // Add event listeners to player buttons
    document.getElementById('btn-play')?.addEventListener('click', handlePlay);
    document.getElementById('btn-shuffle')?.addEventListener('click', handleShuffle);
    document.getElementById('btn-repeat')?.addEventListener('click', handleRepeat);
    document.getElementById('btn-next')?.addEventListener('click', handleNext);
    document.getElementById('btn-prev')?.addEventListener('click', handlePrev);
    
    // Progress bar
    const progressFill = document.getElementById('api-progress-fill');
    if (progressFill) {
        progressFill.addEventListener('input', (e) => {
            audio.currentTime = e.target.value;
        });
        audio.ontimeupdate = () => {
            if (audio.duration) {
                progressFill.value = audio.currentTime;
                progressFill.max = audio.duration;
            }
        };
    }
    
    // Volume control
    const volumeControl = document.getElementById('api-volume');
    if (volumeControl) {
        volumeControl.value = playerState.volume * 100;
        volumeControl.addEventListener('input', (e) => {
            playerState.volume = e.target.value / 100;
            audio.volume = playerState.volume;
        });
    }
    
    // Clickable player info (opens full player)
    document.getElementById('clickable-info')?.addEventListener('click', () => {
        if (playerState.queue.length > 0) {
            openFullPlayer();
        }
    });
    
    // Audio ended event
    audio.onended = () => {
        if (playerState.isLoopOnce && playerState.queue[playerState.currentTrackIndex]) {
            loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
        } else if (playerState.isLooping || playerState.currentTrackIndex < playerState.queue.length - 1) {
            handleNext();
        } else {
            updatePlayButton(false);
            playerState.isPlaying = false;
        }
    };
}

// ========== QUEUE FUNCTIONS ==========
function toggleQueue() {
    const queueSidebar = document.getElementById('queueSidebar');
    if (!queueSidebar) return;
    queueSidebar.classList.toggle('active');
    updateQueueDisplay();
}

function updateQueueDisplay() {
    const queueList = document.getElementById('queueList');
    if (!queueList) return;
    
    if (playerState.queue.length > 0) {
        queueList.innerHTML = playerState.queue.map((track, index) => `
            <div class="queue-item ${index === playerState.currentTrackIndex ? 'active' : ''}" 
                 onclick="playTrackFromQueue(${index})">
                <img src="${track.art}" class="queue-item-img">
                <div class="queue-item-info">
                    <div class="queue-item-title">${track.title}</div>
                    <div class="queue-item-artist">${track.artist}</div>
                </div>
                <div class="queue-item-duration">${window.formatDuration?.(track.duration || 180) || '3:00'}</div>
            </div>
        `).join('');
    } else {
        queueList.innerHTML = '<div class="text-center text-secondary py-5">Queue is empty</div>';
    }
}

function playTrackFromQueue(index) {
    if (index >= 0 && index < playerState.queue.length) {
        playerState.currentTrackIndex = index;
        loadAndPlaySong(playerState.queue[index]);
        updateQueueDisplay();
    }
}

function clearQueue() {
    playerState.queue = [];
    playerState.currentTrackIndex = 0;
    updateQueueDisplay();
}

// ========== EXPORT TO WINDOW ==========
window.loadAndPlaySong = loadAndPlaySong;
window.handlePlay = handlePlay;
window.handleShuffle = handleShuffle;
window.handleRepeat = handleRepeat;
window.handleNext = handleNext;
window.handlePrev = handlePrev;
window.openFullPlayer = openFullPlayer;
window.closeFullPlayer = closeFullPlayer;
window.toggleFullPlayer = toggleFullPlayer;
window.toggleLyricView = toggleLyricView;
window.fetchLyrics = fetchLyrics;
window.updateFullPlayer = updateFullPlayer;
window.initPlayer = initPlayer;
window.toggleQueue = toggleQueue;
window.updateQueueDisplay = updateQueueDisplay;
window.playTrackFromQueue = playTrackFromQueue;
window.clearQueue = clearQueue;
window.audio = audio;
window.playerState = playerState;


console.log('Player.js loaded');

