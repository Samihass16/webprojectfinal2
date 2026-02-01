// utils.js - Utility functions

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function setupSongClicks() {
    console.log('Setting up song click handlers...');
    
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
                window.app.state.queue = Array.from(allSongs).map(card => ({
                    title: card.dataset.title,
                    artist: card.dataset.artist,
                    art: card.dataset.art,
                    url: card.dataset.url,
                    duration: 180
                }));
                
                const clickedIndex = Array.from(allSongs).findIndex(card => card.dataset.url === data.url);
                if (clickedIndex !== -1) {
                    window.app.state.currentTrackIndex = clickedIndex;
                    window.loadAndPlaySong(window.app.state.queue[clickedIndex]);
                    window.updateQueueDisplay();
                }
            }
        }
    });
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('dailymotionPlayer');
    if (modal) modal.classList.remove('active');
    if (player) player.src = '';
}

// Export to window
window.formatDuration = formatDuration;
window.setupSongClicks = setupSongClicks;
window.closeVideoModal = closeVideoModal;