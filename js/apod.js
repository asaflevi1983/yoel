// ===== NASA APOD (Astronomy Picture of the Day) =====
(function () {
    'use strict';

    const API_URL = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
    const CACHE_KEY = 'apod_cache';

    const els = {
        loading: document.getElementById('apod-loading'),
        content: document.getElementById('apod-content'),
        error: document.getElementById('apod-error'),
        image: document.getElementById('apod-image'),
        video: document.getElementById('apod-video'),
        title: document.getElementById('apod-title'),
        explanation: document.getElementById('apod-explanation'),
        copyright: document.getElementById('apod-copyright'),
        dateDisplay: document.getElementById('apod-date'),
        prevBtn: document.getElementById('prev-day'),
        nextBtn: document.getElementById('next-day'),
        retryBtn: document.getElementById('retry-btn'),
    };

    let currentDate = new Date();
    let requestToken = 0;

    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function formatDisplayDate(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('he-IL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    function getCache() {
        try {
            return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        } catch {
            return {};
        }
    }

    function setCache(date, data) {
        try {
            const cache = getCache();
            cache[date] = data;
            // Keep only last 30 entries
            const keys = Object.keys(cache);
            if (keys.length > 30) {
                keys.sort();
                for (let i = 0; i < keys.length - 30; i++) {
                    delete cache[keys[i]];
                }
            }
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch {
            // Storage full or unavailable
        }
    }

    function showState(state) {
        els.loading.style.display = state === 'loading' ? 'flex' : 'none';
        els.content.style.display = state === 'content' ? 'block' : 'none';
        els.error.style.display = state === 'error' ? 'block' : 'none';
    }

    function updateNavButtons() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const curr = new Date(currentDate);
        curr.setHours(0, 0, 0, 0);
        els.nextBtn.disabled = curr >= today;
    }

    async function fetchAPOD(dateStr) {
        const token = ++requestToken;
        showState('loading');
        els.dateDisplay.textContent = formatDisplayDate(dateStr);
        updateNavButtons();

        // Check cache
        const cache = getCache();
        if (cache[dateStr]) {
            if (token === requestToken) displayAPOD(cache[dateStr]);
            return;
        }

        try {
            const response = await fetch(`${API_URL}&date=${dateStr}`);
            if (token !== requestToken) return; // stale response
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            if (token !== requestToken) return; // stale response
            if (data.error) {
                throw new Error(data.error.message || 'API error');
            }
            setCache(dateStr, data);
            displayAPOD(data);
        } catch (err) {
            if (token !== requestToken) return;
            console.error('APOD fetch error:', err);
            showState('error');
        }
    }

    function displayAPOD(data) {
        els.title.textContent = data.title;
        els.explanation.textContent = data.explanation;
        els.copyright.textContent = data.copyright ? `© ${data.copyright}` : '';

        if (data.media_type === 'video') {
            els.image.style.display = 'none';
            els.video.style.display = 'block';
            els.video.src = data.url;
        } else {
            els.video.style.display = 'none';
            els.image.style.display = 'block';
            els.image.src = data.hdurl || data.url;
            els.image.alt = data.title;
        }

        showState('content');
    }

    // Zoom image on click
    els.image.addEventListener('click', () => {
        els.image.classList.toggle('zoomed');
    });

    // Navigation
    els.prevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        fetchAPOD(formatDate(currentDate));
    });

    els.nextBtn.addEventListener('click', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const curr = new Date(currentDate);
        curr.setHours(0, 0, 0, 0);
        if (curr < today) {
            currentDate.setDate(currentDate.getDate() + 1);
            fetchAPOD(formatDate(currentDate));
        }
    });

    els.retryBtn.addEventListener('click', () => {
        fetchAPOD(formatDate(currentDate));
    });

    // Keyboard shortcuts for navigation
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('apod-section').classList.contains('active')) {
            if (e.key === 'ArrowRight') {
                els.prevBtn.click();
            } else if (e.key === 'ArrowLeft' && !els.nextBtn.disabled) {
                els.nextBtn.click();
            }
        }
    });

    // Load today's image
    fetchAPOD(formatDate(currentDate));
})();
