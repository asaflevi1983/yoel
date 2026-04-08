// ===== NASA APOD (Astronomy Picture of the Day) =====
(function () {
    'use strict';

    const API_URL = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
    const CACHE_KEY = 'apod_cache';

    // Fallback images from Wikimedia Commons (public domain)
    const FALLBACK_IMAGES = [
        {
            title: 'Pillars of Creation',
            explanation: 'The iconic Pillars of Creation in the Eagle Nebula, captured by the Hubble Space Telescope. These towering columns of gas and dust are the birthplace of new stars.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg/1280px-Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Pillars_of_creation_2014_HST_WFC3-UVIS_full-res_denoised.jpg',
            media_type: 'image',
            desc_he: 'עמודי הבריאה בערפילית הנשר - מקום הולדתם של כוכבים חדשים',
        },
        {
            title: 'Saturn and its Rings',
            explanation: 'A stunning view of Saturn captured by the Cassini spacecraft, showing the planet\'s magnificent ring system in exquisite detail.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/1280px-Saturn_during_Equinox.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
            media_type: 'image',
            desc_he: 'שבתאי וטבעותיו המרהיבות - צולם על ידי החללית קאסיני',
        },
        {
            title: 'The Crab Nebula',
            explanation: 'The Crab Nebula is a supernova remnant in the constellation of Taurus. It was first observed in 1054 AD by Chinese and Arab astronomers.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Crab_Nebula.jpg/1280px-Crab_Nebula.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Crab_Nebula.jpg',
            media_type: 'image',
            desc_he: 'ערפילית הסרטן - שריד של סופרנובה שנצפתה לראשונה בשנת 1054',
        },
        {
            title: 'Andromeda Galaxy',
            explanation: 'The Andromeda Galaxy is the nearest large galaxy to the Milky Way. It is expected to collide with our galaxy in about 4.5 billion years.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg/1280px-Andromeda_Galaxy_%28with_h-alpha%29.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Andromeda_Galaxy_%28with_h-alpha%29.jpg',
            media_type: 'image',
            desc_he: 'גלקסיית אנדרומדה - השכנה הגדולה הקרובה ביותר לשביל החלב',
        },
        {
            title: 'Earth from Apollo 17',
            explanation: 'The famous Blue Marble photograph of Earth, taken by the crew of Apollo 17 on December 7, 1972.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1024px-The_Earth_seen_from_Apollo_17.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg',
            media_type: 'image',
            desc_he: 'כדור הארץ כפי שצולם מאפולו 17 - "הגולה הכחולה"',
        },
        {
            title: 'Orion Nebula',
            explanation: 'The Orion Nebula is one of the brightest nebulae visible to the naked eye. It is located about 1,344 light-years from Earth.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg/1280px-Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Orion_Nebula_-_Hubble_2006_mosaic_18000.jpg',
            media_type: 'image',
            desc_he: 'ערפילית אוריון - אחת הערפיליות הבהירות ביותר הנראות בעין בלתי מזוינת',
        },
        {
            title: 'Mars Surface - Curiosity Rover',
            explanation: 'A panoramic view of the surface of Mars captured by NASA\'s Curiosity rover, showing the rocky Martian terrain.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Curiosity_Self-Portrait_at_%27Big_Sky%27_Drilling_Site.jpg/1280px-Curiosity_Self-Portrait_at_%27Big_Sky%27_Drilling_Site.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Curiosity_Self-Portrait_at_%27Big_Sky%27_Drilling_Site.jpg',
            media_type: 'image',
            desc_he: 'פני השטח של מאדים - צולם על ידי הרובר קיוריוסיטי של נאס"א',
        },
        {
            title: 'Hubble Deep Field',
            explanation: 'The Hubble Ultra Deep Field contains an estimated 10,000 galaxies. It is the deepest image of the universe ever taken.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Hubble_ultra_deep_field.jpg/1024px-Hubble_ultra_deep_field.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Hubble_ultra_deep_field.jpg',
            media_type: 'image',
            desc_he: 'השדה העמוק של האבל - כ-10,000 גלקסיות בתמונה אחת!',
        },
        {
            title: 'International Space Station',
            explanation: 'The International Space Station orbiting Earth at an altitude of about 408 kilometers, traveling at 27,600 km/h.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/International_Space_Station_after_undocking_of_STS-132.jpg/1280px-International_Space_Station_after_undocking_of_STS-132.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/International_Space_Station_after_undocking_of_STS-132.jpg',
            media_type: 'image',
            desc_he: 'תחנת החלל הבינלאומית - מקיפה את כדור הארץ בגובה 408 ק"מ',
        },
        {
            title: 'Solar Flare',
            explanation: 'A massive solar flare erupting from the surface of the Sun, captured by NASA\'s Solar Dynamics Observatory.',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Magnificent_CME_Erupts_on_the_Sun_-_August_31_%288104523068%29.jpg/1280px-Magnificent_CME_Erupts_on_the_Sun_-_August_31_%288104523068%29.jpg',
            hdurl: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Magnificent_CME_Erupts_on_the_Sun_-_August_31_%288104523068%29.jpg',
            media_type: 'image',
            desc_he: 'התפרצות שמש עצומה - צולמה על ידי מצפה השמש של נאס"א',
        },
    ];
    let fallbackIndex = 0;

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
        nasaNote: document.getElementById('apod-nasa-note'),
        fallbackNote: document.getElementById('apod-fallback-note'),
    };

    let currentDate = new Date();
    let requestToken = 0;
    let showingFallback = false;

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

    function showFallback() {
        showingFallback = true;
        const img = FALLBACK_IMAGES[fallbackIndex % FALLBACK_IMAGES.length];
        fallbackIndex++;

        els.nasaNote.style.display = 'none';
        els.fallbackNote.style.display = 'block';
        els.fallbackNote.textContent = 'נאס"א לא זמין כרגע, הנה תמונה מדהימה מהחלל!';

        els.video.style.display = 'none';
        els.image.style.display = 'block';
        els.image.src = img.url;
        els.image.alt = img.title;
        els.title.textContent = img.title;
        els.explanation.textContent = img.desc_he;
        els.copyright.textContent = '';
        els.dateDisplay.textContent = 'תמונה מהארכיון';

        showState('content');
    }

    async function fetchAPOD(dateStr) {
        const token = ++requestToken;
        showState('loading');
        els.dateDisplay.textContent = formatDisplayDate(dateStr);
        updateNavButtons();
        showingFallback = false;

        // Check cache
        const cache = getCache();
        if (cache[dateStr]) {
            if (token === requestToken) displayAPOD(cache[dateStr]);
            return;
        }

        try {
            const response = await fetch(`${API_URL}&date=${dateStr}`);
            if (token !== requestToken) return;
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            if (token !== requestToken) return;
            if (data.error) {
                throw new Error(data.error.message || 'API error');
            }
            setCache(dateStr, data);
            displayAPOD(data);
        } catch (err) {
            if (token !== requestToken) return;
            console.error('APOD fetch error:', err);
            showFallback();
        }
    }

    function displayAPOD(data) {
        els.nasaNote.style.display = 'block';
        els.fallbackNote.style.display = 'none';

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

    // Navigation - always retry real API
    els.prevBtn.addEventListener('click', () => {
        if (showingFallback) {
            // When showing fallback, prev shows another fallback
            showFallback();
        } else {
            currentDate.setDate(currentDate.getDate() - 1);
            fetchAPOD(formatDate(currentDate));
        }
    });

    els.nextBtn.addEventListener('click', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const curr = new Date(currentDate);
        curr.setHours(0, 0, 0, 0);
        if (showingFallback) {
            // Retry the real API when navigating forward
            fetchAPOD(formatDate(currentDate));
        } else if (curr < today) {
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
