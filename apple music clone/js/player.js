// player.js - COMPLETE FIXED VERSION

// Global audio instance
const audio = new Audio();

// Player state - SINGLE SOURCE OF TRUTH
const playerState = {
    currentTrackIndex: 0,
    isPlaying: false,
    isShuffled: false,
    isLooping: false,
    isLoopOnce: false,
    queue: [],
    volume: 1.0,
    currentRadioStation: null,
    currentSectionData: []
};

// Initialize if not exists in window
if (!window.playerState) {
    window.playerState = playerState;
}

if (!window.audio) {
    window.audio = audio;
}

// ========== PLAYER CONTROL FUNCTIONS ==========

function handlePlay(e) {
    if (e) e.stopPropagation();
    console.log('Play button clicked');
    
    const icon = document.getElementById('btn-play')?.querySelector('i');
    if (!icon) {
        console.error('Play button icon not found');
        return;
    }
    
    if (audio.paused) {
        audio.play().catch(e => console.log("Playback error:", e));
        icon.className = 'bi bi-pause-fill';
        playerState.isPlaying = true;
        console.log('Now playing');
    } else {
        audio.pause();
        icon.className = 'bi bi-play-fill';
        playerState.isPlaying = false;
        console.log('Now paused');
    }
}

function handleShuffle(e) {
    if (e) e.stopPropagation();
    console.log('Shuffle button clicked');
    
    const shuffleBtn = document.getElementById('btn-shuffle');
    playerState.isShuffled = !playerState.isShuffled;
    
    if (shuffleBtn) {
        shuffleBtn.classList.toggle('active-apple');
        console.log('Shuffle is now:', playerState.isShuffled);
    }
    
    if (playerState.isShuffled && playerState.queue.length > 1) {
        // Save current playing track
        const currentTrack = playerState.queue[playerState.currentTrackIndex];
        
        // Create new shuffled array excluding current track
        const tracksToShuffle = playerState.queue.filter((_, index) => index !== playerState.currentTrackIndex);
        
        // Shuffle remaining tracks
        for (let i = tracksToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracksToShuffle[i], tracksToShuffle[j]] = [tracksToShuffle[j], tracksToShuffle[i]];
        }
        
        // Rebuild queue with current track first, then shuffled tracks
        playerState.queue = [currentTrack, ...tracksToShuffle];
        playerState.currentTrackIndex = 0;
        
        console.log('Queue shuffled:', playerState.queue);
        
        if (typeof window.updateQueueDisplay === 'function') {
            window.updateQueueDisplay();
        }
    }
}

function handleRepeat(e) {
    if (e) e.stopPropagation();
    console.log('Repeat button clicked');
    
    const repeatBtn = document.getElementById('btn-repeat');
    
    if (!playerState.isLooping && !playerState.isLoopOnce) {
        // First click: loop once
        playerState.isLoopOnce = true;
        playerState.isLooping = false;
        console.log('Loop once enabled');
        if (repeatBtn) {
            repeatBtn.classList.add('active-apple');
            repeatBtn.classList.add('loop-once');
        }
    } else if (playerState.isLoopOnce) {
        // Second click: loop all
        playerState.isLoopOnce = false;
        playerState.isLooping = true;
        console.log('Loop all enabled');
        if (repeatBtn) {
            repeatBtn.classList.add('active-apple');
            repeatBtn.classList.remove('loop-once');
        }
    } else {
        // Third click: no loop
        playerState.isLooping = false;
        playerState.isLoopOnce = false;
        console.log('Loop disabled');
        if (repeatBtn) {
            repeatBtn.classList.remove('active-apple');
            repeatBtn.classList.remove('loop-once');
        }
    }
}

function handleNext(e) {
    if (e) e.stopPropagation();
    console.log('Next button clicked');
    
    if (playerState.queue.length === 0) {
        console.log("Queue is empty");
        return;
    }
    
    if (playerState.isShuffled) {
        const availableIndices = playerState.queue
            .map((_, index) => index)
            .filter(idx => idx !== playerState.currentTrackIndex);
        
        if (availableIndices.length > 0) {
            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            playerState.currentTrackIndex = randomIndex;
            loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
            console.log('Playing shuffled track:', randomIndex);
        }
    } else if (playerState.currentTrackIndex < playerState.queue.length - 1) {
        playerState.currentTrackIndex++;
        loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
        console.log('Playing next track:', playerState.currentTrackIndex);
    } else if (playerState.isLooping) {
        playerState.currentTrackIndex = 0;
        loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
        console.log('Looping to start');
    }
    
    if (typeof window.updateQueueDisplay === 'function') {
        window.updateQueueDisplay();
    }
}

function handlePrev(e) {
    if (e) e.stopPropagation();
    console.log('Previous button clicked');
    
    if (playerState.queue.length === 0) {
        console.log("Queue is empty");
        return;
    }
    
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        console.log('Restarting current track');
    } else if (playerState.currentTrackIndex > 0) {
        playerState.currentTrackIndex--;
        loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
        console.log('Playing previous track:', playerState.currentTrackIndex);
        if (typeof window.updateQueueDisplay === 'function') {
            window.updateQueueDisplay();
        }
    }
}

function loadAndPlaySong(data) {
    if (!data || !data.url) {
        console.error('No valid track data provided');
        return;
    }
    
    console.log('Loading song:', data.title);
    
    // Set audio source
    audio.src = data.url;
    
    // Try to play
    audio.play().then(() => {
        console.log('Playback started successfully');
        playerState.isPlaying = true;
        updateGlobalPlayer(data);
        
        const playIcon = document.getElementById('btn-play')?.querySelector('i');
        if (playIcon) playIcon.className = 'bi bi-pause-fill';
    }).catch(error => {
        console.error('Playback failed:', error);
        
        // Reset player UI
        const playIcon = document.getElementById('btn-play')?.querySelector('i');
        if (playIcon) playIcon.className = 'bi bi-play-fill';
        playerState.isPlaying = false;
    });
}

function updateGlobalPlayer(data) {
    const trackTitle = document.getElementById('api-track-title');
    const artistName = document.getElementById('api-artist-name');
    const miniArt = document.getElementById('api-mini-art');
    
    if (trackTitle) {
        trackTitle.innerText = data.title || 'Not Playing';
        console.log('Updated track title:', data.title);
    }
    
    if (artistName) {
        artistName.innerText = data.artist || 'Apple Music';
        console.log('Updated artist:', data.artist);
    }
    
    if (miniArt) {
        miniArt.src = data.art || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop';
        console.log('Updated album art');
    }
}

function updateProgressBar() {
    const progress = document.getElementById('api-progress-fill');
    if (progress && audio.duration) {
        progress.max = audio.duration;
        progress.value = audio.currentTime;
    }
}

function handleTrackEnd() {
    console.log('Track ended');
    
    if (playerState.isLoopOnce && playerState.queue[playerState.currentTrackIndex]) {
        loadAndPlaySong(playerState.queue[playerState.currentTrackIndex]);
        console.log('Looping same track');
    } else if (playerState.isLooping || playerState.currentTrackIndex < playerState.queue.length - 1) {
        handleNext();
    } else {
        const playIcon = document.getElementById('btn-play')?.querySelector('i');
        if (playIcon) playIcon.className = 'bi bi-play-fill';
        playerState.isPlaying = false;
        console.log('Playback stopped');
    }
}

// ========== PLAYER INITIALIZATION ==========

function initPlayer() {
    console.log('Initializing player...');
    
    // Check if buttons exist
    const playBtn = document.getElementById('btn-play');
    const shuffleBtn = document.getElementById('btn-shuffle');
    const repeatBtn = document.getElementById('btn-repeat');
    const nextBtn = document.getElementById('btn-next');
    const prevBtn = document.getElementById('btn-prev');
    
    console.log('Play button found:', !!playBtn);
    console.log('Shuffle button found:', !!shuffleBtn);
    console.log('Repeat button found:', !!repeatBtn);
    console.log('Next button found:', !!nextBtn);
    console.log('Previous button found:', !!prevBtn);
    
    // Add event listeners
    if (playBtn) {
        playBtn.addEventListener('click', handlePlay);
        console.log('Play button listener added');
    }
    
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', handleShuffle);
        console.log('Shuffle button listener added');
    }
    
    if (repeatBtn) {
        repeatBtn.addEventListener('click', handleRepeat);
        console.log('Repeat button listener added');
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', handleNext);
        console.log('Next button listener added');
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', handlePrev);
        console.log('Previous button listener added');
    }
    
    // Progress bar
    const progressFill = document.getElementById('api-progress-fill');
    if (progressFill) {
        progressFill.addEventListener('input', (e) => {
            audio.currentTime = e.target.value;
        });
        console.log('Progress bar listener added');
    }
    
    // Volume control
    const volumeControl = document.getElementById('api-volume');
    if (volumeControl) {
        volumeControl.value = playerState.volume * 100;
        volumeControl.addEventListener('input', (e) => {
            playerState.volume = e.target.value / 100;
            audio.volume = playerState.volume;
        });
        console.log('Volume control listener added');
    }
    
    // Audio events
    audio.ontimeupdate = updateProgressBar;
    audio.onended = handleTrackEnd;
    
    // Clickable player info
    const playerInfo = document.getElementById('clickable-info');
    if (playerInfo) {
        playerInfo.addEventListener('click', () => {
            if (playerState.queue.length > 0) {
                if (typeof window.toggleFullPlayer === 'function') {
                    window.toggleFullPlayer(true);
                }
            }
        });
        console.log('Player info click listener added');
    }
    
    console.log('Player initialization complete');
}

// ========== SONG CLICK HANDLER ==========

function setupSongClicks() {
    console.log('Setting up song click handlers...');
    
    const mainView = document.getElementById('mainView');
    if (!mainView) {
        console.error('Main view not found');
        return;
    }
    
    mainView.addEventListener('click', function(e) {
        const songCard = e.target.closest('.song-result');
        if (songCard) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Song card clicked:', songCard.dataset.title);
            
            const data = {
                url: songCard.dataset.url,
                title: songCard.dataset.title,
                artist: songCard.dataset.artist,
                art: songCard.dataset.art
            };
            
            // Get all songs in section
            const rowContainer = songCard.closest('[id^="row-"]') || 
                               songCard.closest('#searchResults') || 
                               songCard.closest('#category-list-results');
            
            if (rowContainer) {
                const allSongs = rowContainer.querySelectorAll('.song-result');
                console.log('Found', allSongs.length, 'songs in section');
                
                // Clear queue and add all songs
                playerState.queue = [];
                allSongs.forEach(card => {
                    playerState.queue.push({
                        title: card.dataset.title,
                        artist: card.dataset.artist,
                        art: card.dataset.art,
                        url: card.dataset.url,
                        duration: 180
                    });
                });
                
                // Find and play clicked song
                const clickedIndex = Array.from(allSongs).findIndex(
                    card => card.dataset.url === data.url
                );
                
                if (clickedIndex !== -1) {
                    playerState.currentTrackIndex = clickedIndex;
                    loadAndPlaySong(playerState.queue[clickedIndex]);
                    console.log('Playing song index:', clickedIndex);
                    
                    if (typeof window.updateQueueDisplay === 'function') {
                        window.updateQueueDisplay();
                    }
                }
            }
        }
        
        // Handle radio station clicks
        const radioCard = e.target.closest('.radio-station-card');
        if (radioCard) {
            const stationId = parseInt(radioCard.dataset.id);
            console.log('Radio station clicked:', stationId);
            
            // Make sure radioData is available
            if (window.radioData && window.radioData.liveStations) {
                const station = window.radioData.liveStations.find(s => s.id === stationId);
                if (station) {
                    playerState.queue = [{
                        url: `https://stream.example.com/radio/${station.id}`,
                        title: station.nowPlaying.title,
                        artist: station.nowPlaying.artist,
                        art: station.nowPlaying.art,
                        duration: 180
                    }];
                    
                    playerState.currentTrackIndex = 0;
                    loadAndPlaySong(playerState.queue[0]);
                    console.log('Playing radio station:', station.name);
                    
                    if (typeof window.updateQueueDisplay === 'function') {
                        window.updateQueueDisplay();
                    }
                }
            }
        }
    });
    
    console.log('Song click handlers setup complete');
}

// ========== GLOBAL EVENT DELEGATION (FALLBACK) ==========

function setupGlobalEventDelegation() {
    console.log('Setting up global event delegation...');
    
    document.addEventListener('click', function(e) {
        // Check for shuffle button
        if (e.target.closest('#btn-shuffle') || e.target.id === 'btn-shuffle') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Shuffle clicked via global delegation');
            handleShuffle(e);
        }
        
        // Check for repeat button
        if (e.target.closest('#btn-repeat') || e.target.id === 'btn-repeat') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Repeat clicked via global delegation');
            handleRepeat(e);
        }
        
        // Check for play button
        if (e.target.closest('#btn-play') || e.target.id === 'btn-play') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Play clicked via global delegation');
            handlePlay(e);
        }
        
        // Check for next button
        if (e.target.closest('#btn-next') || e.target.id === 'btn-next') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Next clicked via global delegation');
            handleNext(e);
        }
        
        // Check for previous button
        if (e.target.closest('#btn-prev') || e.target.id === 'btn-prev') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Previous clicked via global delegation');
            handlePrev(e);
        }
    });
    
    console.log('Global event delegation setup complete');
}

// ========== INITIALIZE ON LOAD ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing player...');
    
    // Initialize player controls
    initPlayer();
    
    // Setup song click handlers after a delay
    setTimeout(setupSongClicks, 1000);
    
    // Setup global event delegation as fallback
    setTimeout(setupGlobalEventDelegation, 1500);
    
    console.log('Player initialization scheduled');
});

// ========== PLAYER CONTROLS ==========
function handlePlay() {
    const icon = document.getElementById('btn-play')?.querySelector('i');
    if (!icon) return;
    
    if (app.audio.paused) {
        app.audio.play().catch(e => console.log("Playback error:", e));
        icon.className = 'bi bi-pause-fill';
        app.state.isPlaying = true;
    } else {
        app.audio.pause();
        icon.className = 'bi bi-play-fill';
        app.state.isPlaying = false;
    }
}

function handleShuffle() {
    const shuffleBtn = document.getElementById('btn-shuffle');
    app.state.isShuffled = !app.state.isShuffled;
    if (shuffleBtn) shuffleBtn.classList.toggle('active-apple');
    
    if (app.state.isShuffled && app.state.queue.length > 1) {
        const currentTrack = app.state.queue[app.state.currentTrackIndex];
        const tracksToShuffle = app.state.queue.filter((_, i) => i !== app.state.currentTrackIndex);
        for (let i = tracksToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tracksToShuffle[i], tracksToShuffle[j]] = [tracksToShuffle[j], tracksToShuffle[i]];
        }
        app.state.queue = [currentTrack, ...tracksToShuffle];
        app.state.currentTrackIndex = 0;
        updateQueueDisplay();
    }
}

function handleRepeat() {
    const repeatBtn = document.getElementById('btn-repeat');
    
    if (!app.state.isLooping && !app.state.isLoopOnce) {
        app.state.isLoopOnce = true;
        if (repeatBtn) repeatBtn.classList.add('active-apple', 'loop-once');
    } else if (app.state.isLoopOnce) {
        app.state.isLoopOnce = false;
        app.state.isLooping = true;
        if (repeatBtn) repeatBtn.classList.add('active-apple');
        if (repeatBtn) repeatBtn.classList.remove('loop-once');
    } else {
        app.state.isLooping = false;
        if (repeatBtn) repeatBtn.classList.remove('active-apple', 'loop-once');
    }
}

function handleNext() {
    if (app.state.queue.length === 0) return;
    
    if (app.state.isShuffled) {
        const availableIndices = app.state.queue.map((_, i) => i).filter(idx => idx !== app.state.currentTrackIndex);
        if (availableIndices.length > 0) {
            app.state.currentTrackIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            loadAndPlaySong(app.state.queue[app.state.currentTrackIndex]);
        }
    } else if (app.state.currentTrackIndex < app.state.queue.length - 1) {
        app.state.currentTrackIndex++;
        loadAndPlaySong(app.state.queue[app.state.currentTrackIndex]);
    } else if (app.state.isLooping) {
        app.state.currentTrackIndex = 0;
        loadAndPlaySong(app.state.queue[app.state.currentTrackIndex]);
    }
    updateQueueDisplay();
}

function handlePrev() {
    if (app.state.queue.length === 0) return;
    
    if (app.audio.currentTime > 3) {
        app.audio.currentTime = 0;
    } else if (app.state.currentTrackIndex > 0) {
        app.state.currentTrackIndex--;
        loadAndPlaySong(app.state.queue[app.state.currentTrackIndex]);
        updateQueueDisplay();
    }
}

function loadAndPlaySong(data) {
    if (!data || !data.url) return;
    
    app.audio.src = data.url;
    app.audio.play().then(() => {
        app.state.isPlaying = true;
        updateGlobalPlayer(data);
        const playIcon = document.getElementById('btn-play')?.querySelector('i');
        if (playIcon) playIcon.className = 'bi bi-pause-fill';
    }).catch(error => {
        console.error('Playback failed:', error);
        const playIcon = document.getElementById('btn-play')?.querySelector('i');
        if (playIcon) playIcon.className = 'bi bi-play-fill';
        app.state.isPlaying = false;
    });
}

function updateGlobalPlayer(data) {
    const trackTitle = document.getElementById('api-track-title');
    const artistName = document.getElementById('api-artist-name');
    const miniArt = document.getElementById('api-mini-art');
    
    if (trackTitle) trackTitle.innerText = data.title || 'Not Playing';
    if (artistName) artistName.innerText = data.artist || 'Apple Music';
    if (miniArt) miniArt.src = data.art || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop';
}


// ========== EXPORT TO GLOBAL SCOPE ==========

window.handlePlay = handlePlay;
window.handleShuffle = handleShuffle;
window.handleRepeat = handleRepeat;
window.handleNext = handleNext;
window.handlePrev = handlePrev;
window.loadAndPlaySong = loadAndPlaySong;
window.updateGlobalPlayer = updateGlobalPlayer;
window.playerState = playerState;
window.audio = audio;
window.setupSongClicks = setupSongClicks;
window.initPlayer = initPlayer;

console.log('Player.js loaded and functions exported to window');