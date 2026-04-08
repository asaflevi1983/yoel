// ===== App Navigation & Initialization =====
(function () {
    'use strict';

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId + '-section');
        });

        if (tabId === 'game' && typeof SpaceGame !== 'undefined' && SpaceGame.instance) {
            SpaceGame.instance.resizeCanvas();
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Show mobile controls on touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        const mc = document.getElementById('mobile-controls');
        if (mc) mc.style.display = 'flex';
    }
})();
