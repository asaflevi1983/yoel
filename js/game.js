// ===== Space Shooter Game =====
var SpaceGame = (function () {
    'use strict';

    // ---- Constants ----
    const CANVAS_W = 600;
    const CANVAS_H = 800;
    const PLAYER_W = 48;
    const PLAYER_H = 48;
    const BULLET_W = 4;
    const BULLET_H = 14;
    const STAR_COUNT = 120;
    const SHOOT_COOLDOWN = 180; // ms
    const POWERUP_CHANCE = 0.08;
    const POWERUP_SIZE = 28;
    const POWERUP_DURATION = 8000; // ms

    // Enemy types
    const ENEMY_TYPES = {
        basic: { w: 36, h: 36, hp: 1, speed: 2, score: 10, color: '#ef4444', shape: 'triangle' },
        fast: { w: 30, h: 30, hp: 1, speed: 4.5, score: 20, color: '#f97316', shape: 'diamond' },
        tank: { w: 44, h: 44, hp: 3, speed: 1.2, score: 50, color: '#a855f7', shape: 'hexagon' },
        shooter: { w: 38, h: 38, hp: 2, speed: 1.5, score: 40, color: '#ec4899', shape: 'square' },
        boss: { w: 80, h: 60, hp: 20, speed: 0.8, score: 500, color: '#dc2626', shape: 'boss' },
    };

    // Power-up types
    const POWERUP_TYPES = ['rapid', 'spread', 'shield', 'life'];
    const POWERUP_COLORS = {
        rapid: '#facc15',
        spread: '#3b82f6',
        shield: '#22c55e',
        life: '#ef4444',
    };
    const POWERUP_ICONS = {
        rapid: '⚡',
        spread: '🔱',
        shield: '🛡️',
        life: '❤️',
    };

    // ---- Game Class ----
    class Game {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = CANVAS_W;
            this.canvas.height = CANVAS_H;

            this.overlay = document.getElementById('game-overlay');
            this.gameOverOverlay = document.getElementById('game-over-overlay');
            this.levelUpOverlay = document.getElementById('level-up-overlay');
            this.scoreEl = document.getElementById('score');
            this.levelEl = document.getElementById('level');
            this.livesEl = document.getElementById('lives');
            this.finalScoreEl = document.getElementById('final-score');
            this.bestScoreEl = document.getElementById('best-score');
            this.newHighScoreEl = document.getElementById('new-high-score');
            this.highScoreDisplay = document.getElementById('high-score-display');
            this.levelUpNum = document.getElementById('level-up-num');

            this.running = false;
            this.animId = null;
            this.keys = {};
            this.lastShot = 0;

            try {
                this.highScore = parseInt(localStorage.getItem('space_high_score') || '0', 10);
            } catch {
                this.highScore = 0;
            }
            this.updateHighScoreDisplay();

            this.stars = this.createStars();

            this.bindEvents();
            this.resizeCanvas();
            this.drawStars(); // Draw initial stars on canvas
        }

        // ---- Stars ----
        createStars() {
            const stars = [];
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({
                    x: Math.random() * CANVAS_W,
                    y: Math.random() * CANVAS_H,
                    size: Math.random() * 2.5 + 0.5,
                    speed: Math.random() * 1.5 + 0.5,
                    brightness: Math.random(),
                });
            }
            return stars;
        }

        drawStars() {
            const ctx = this.ctx;
            ctx.fillStyle = '#000011';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
            for (const s of this.stars) {
                const alpha = 0.4 + s.brightness * 0.6;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        updateStars() {
            for (const s of this.stars) {
                s.y += s.speed;
                if (s.y > CANVAS_H) {
                    s.y = -2;
                    s.x = Math.random() * CANVAS_W;
                }
                s.brightness = Math.sin(Date.now() * 0.003 + s.x) * 0.3 + 0.7;
            }
        }

        // ---- Init Game State ----
        initState() {
            this.player = {
                x: CANVAS_W / 2 - PLAYER_W / 2,
                y: CANVAS_H - PLAYER_H - 20,
                w: PLAYER_W,
                h: PLAYER_H,
                speed: 5,
                shield: false,
                shieldEnd: 0,
                rapidFire: false,
                rapidEnd: 0,
                spreadShot: false,
                spreadEnd: 0,
                invincible: false,
                invincibleEnd: 0,
            };
            this.bullets = [];
            this.enemyBullets = [];
            this.enemies = [];
            this.particles = [];
            this.powerups = [];
            this.score = 0;
            this.lives = 3;
            this.level = 1;
            this.enemiesKilled = 0;
            this.enemiesPerLevel = 10;
            this.spawnTimer = 0;
            this.spawnInterval = 60;
            this.bossActive = false;
            this.lastShot = 0;
            this.frameCount = 0;
            this.updateHUD();
        }

        // ---- Event Bindings ----
        bindEvents() {
            document.addEventListener('keydown', (e) => {
                this.keys[e.key] = true;
                if (e.key === ' ' && this.running) e.preventDefault();
            });
            document.addEventListener('keyup', (e) => {
                this.keys[e.key] = false;
            });

            document.getElementById('start-btn').addEventListener('click', () => this.start());
            document.getElementById('restart-btn').addEventListener('click', () => this.start());

            // Mobile D-pad
            const dpadBtns = document.querySelectorAll('.dpad-btn');
            dpadBtns.forEach(btn => {
                const dir = btn.dataset.dir;
                const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
                const key = keyMap[dir];
                btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
                btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
                btn.addEventListener('mousedown', () => { this.keys[key] = true; });
                btn.addEventListener('mouseup', () => { this.keys[key] = false; });
            });

            // Fire button
            const fireBtn = document.getElementById('fire-btn');
            fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[' '] = true; });
            fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[' '] = false; });
            fireBtn.addEventListener('mousedown', () => { this.keys[' '] = true; });
            fireBtn.addEventListener('mouseup', () => { this.keys[' '] = false; });

            // Touch on canvas
            let touchId = null;
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.running) return;
                const touch = e.changedTouches[0];
                touchId = touch.identifier;
                this.handleTouch(touch);
                this.keys[' '] = true;
            });
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (const touch of e.changedTouches) {
                    if (touch.identifier === touchId) {
                        this.handleTouch(touch);
                    }
                }
            });
            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                for (const touch of e.changedTouches) {
                    if (touch.identifier === touchId) {
                        touchId = null;
                        this.keys[' '] = false;
                    }
                }
            });

            window.addEventListener('resize', () => this.resizeCanvas());
        }

        handleTouch(touch) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = CANVAS_W / rect.width;
            const scaleY = CANVAS_H / rect.height;
            this.player.x = (touch.clientX - rect.left) * scaleX - PLAYER_W / 2;
            this.player.y = (touch.clientY - rect.top) * scaleY - PLAYER_H / 2;
            this.player.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, this.player.x));
            this.player.y = Math.max(0, Math.min(CANVAS_H - PLAYER_H, this.player.y));
        }

        resizeCanvas() {
            const container = this.canvas.parentElement;
            const maxW = Math.min(600, container.clientWidth);
            this.canvas.style.width = maxW + 'px';
            this.canvas.style.height = (maxW * (CANVAS_H / CANVAS_W)) + 'px';
        }

        // ---- Start / Game Over ----
        start() {
            this.initState();
            this.overlay.style.display = 'none';
            this.gameOverOverlay.style.display = 'none';
            this.levelUpOverlay.style.display = 'none';
            this.running = true;
            if (this.animId) cancelAnimationFrame(this.animId);
            this.gameLoop();
        }

        gameOver() {
            this.running = false;
            this.finalScoreEl.textContent = this.score;

            if (this.score > this.highScore) {
                this.highScore = this.score;
                try { localStorage.setItem('space_high_score', this.highScore.toString()); } catch { /* storage unavailable */ }
                this.newHighScoreEl.style.display = 'block';
            } else {
                this.newHighScoreEl.style.display = 'none';
            }
            this.bestScoreEl.textContent = this.highScore;
            this.updateHighScoreDisplay();
            this.gameOverOverlay.style.display = 'flex';
        }

        updateHighScoreDisplay() {
            if (this.highScore > 0) {
                this.highScoreDisplay.textContent = `🏆 שיא: ${this.highScore}`;
            }
        }

        // ---- Level Up ----
        levelUp() {
            this.level++;
            this.enemiesKilled = 0;
            this.enemiesPerLevel = 10 + this.level * 3;
            this.spawnInterval = Math.max(20, 60 - this.level * 4);

            this.levelUpNum.textContent = this.level;
            this.levelUpOverlay.style.display = 'flex';
            setTimeout(() => {
                this.levelUpOverlay.style.display = 'none';
            }, 2000);

            // Spawn boss every 5 levels
            if (this.level % 5 === 0) {
                this.spawnBoss();
            }

            this.updateHUD();
        }

        // ---- HUD ----
        updateHUD() {
            this.scoreEl.textContent = this.score;
            this.levelEl.textContent = this.level;
            this.livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));
        }

        // ---- Player Movement ----
        updatePlayer() {
            const p = this.player;
            const speed = p.speed;

            if (this.keys['ArrowLeft'] || this.keys['a']) p.x -= speed;
            if (this.keys['ArrowRight'] || this.keys['d']) p.x += speed;
            if (this.keys['ArrowUp'] || this.keys['w']) p.y -= speed;
            if (this.keys['ArrowDown'] || this.keys['s']) p.y += speed;

            p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));
            p.y = Math.max(0, Math.min(CANVAS_H - p.h, p.y));

            // Shooting
            const now = Date.now();
            const cooldown = p.rapidFire ? SHOOT_COOLDOWN / 3 : SHOOT_COOLDOWN;
            if (this.keys[' '] && now - this.lastShot > cooldown) {
                this.shoot();
                this.lastShot = now;
            }

            // Powerup timers
            if (p.shield && now > p.shieldEnd) p.shield = false;
            if (p.rapidFire && now > p.rapidEnd) p.rapidFire = false;
            if (p.spreadShot && now > p.spreadEnd) p.spreadShot = false;
            if (p.invincible && now > p.invincibleEnd) p.invincible = false;
        }

        shoot() {
            const p = this.player;
            const cx = p.x + p.w / 2;

            this.bullets.push({
                x: cx - BULLET_W / 2,
                y: p.y - BULLET_H,
                w: BULLET_W,
                h: BULLET_H,
                speed: 8,
            });

            if (p.spreadShot) {
                // Side bullets
                this.bullets.push({
                    x: cx - BULLET_W / 2 - 12,
                    y: p.y - BULLET_H + 4,
                    w: BULLET_W,
                    h: BULLET_H,
                    speed: 8,
                    dx: -1.5,
                });
                this.bullets.push({
                    x: cx - BULLET_W / 2 + 12,
                    y: p.y - BULLET_H + 4,
                    w: BULLET_W,
                    h: BULLET_H,
                    speed: 8,
                    dx: 1.5,
                });
            }
        }

        // ---- Enemies ----
        spawnEnemy() {
            let type;
            const r = Math.random();
            if (this.level < 3) {
                type = 'basic';
            } else if (this.level < 5) {
                type = r < 0.6 ? 'basic' : r < 0.85 ? 'fast' : 'tank';
            } else if (this.level < 8) {
                type = r < 0.35 ? 'basic' : r < 0.6 ? 'fast' : r < 0.85 ? 'tank' : 'shooter';
            } else {
                type = r < 0.2 ? 'basic' : r < 0.45 ? 'fast' : r < 0.7 ? 'tank' : 'shooter';
            }

            const def = ENEMY_TYPES[type];
            const speedMult = 1 + (this.level - 1) * 0.08;

            this.enemies.push({
                type,
                x: Math.random() * (CANVAS_W - def.w),
                y: -def.h,
                w: def.w,
                h: def.h,
                hp: def.hp,
                maxHp: def.hp,
                speed: def.speed * speedMult,
                score: def.score,
                color: def.color,
                shape: def.shape,
                shootTimer: type === 'shooter' ? Math.random() * 120 + 60 : 0,
                wobble: Math.random() * Math.PI * 2,
            });
        }

        spawnBoss() {
            const def = ENEMY_TYPES.boss;
            const bossHp = 20 + this.level * 5;
            this.enemies.push({
                type: 'boss',
                x: CANVAS_W / 2 - def.w / 2,
                y: -def.h,
                w: def.w,
                h: def.h,
                hp: bossHp,
                maxHp: bossHp,
                speed: def.speed,
                score: def.score + this.level * 50,
                color: def.color,
                shape: def.shape,
                shootTimer: 30,
                wobble: 0,
                isBoss: true,
            });
            this.bossActive = true;
        }

        updateEnemies() {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                e.y += e.speed;

                // Wobble for non-boss
                if (e.type === 'fast') {
                    e.wobble += 0.08;
                    e.x += Math.sin(e.wobble) * 2;
                }

                // Boss movement
                if (e.isBoss && e.y > 40) {
                    e.y = 40;
                    e.wobble += 0.02;
                    e.x = CANVAS_W / 2 - e.w / 2 + Math.sin(e.wobble) * 150;
                }

                // Shooter enemies fire
                if (e.type === 'shooter' || e.isBoss) {
                    e.shootTimer--;
                    if (e.shootTimer <= 0) {
                        const interval = e.isBoss ? 40 : 90;
                        e.shootTimer = interval;
                        this.enemyBullets.push({
                            x: e.x + e.w / 2 - 3,
                            y: e.y + e.h,
                            w: 6,
                            h: 10,
                            speed: e.isBoss ? 5 : 3.5,
                        });
                        if (e.isBoss) {
                            // Boss fires spread
                            this.enemyBullets.push({
                                x: e.x + e.w / 2 - 3 - 20,
                                y: e.y + e.h,
                                w: 6,
                                h: 10,
                                speed: 4.5,
                                dx: -1.5,
                            });
                            this.enemyBullets.push({
                                x: e.x + e.w / 2 - 3 + 20,
                                y: e.y + e.h,
                                w: 6,
                                h: 10,
                                speed: 4.5,
                                dx: 1.5,
                            });
                        }
                    }
                }

                // Remove if off-screen
                if (e.y > CANVAS_H + 20) {
                    this.enemies.splice(i, 1);
                    if (e.isBoss) this.bossActive = false;
                }
            }
        }

        // ---- Bullets ----
        updateBullets() {
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const b = this.bullets[i];
                b.y -= b.speed;
                if (b.dx) b.x += b.dx;
                if (b.y < -b.h || b.x < -20 || b.x > CANVAS_W + 20) {
                    this.bullets.splice(i, 1);
                }
            }
            for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                const b = this.enemyBullets[i];
                b.y += b.speed;
                if (b.dx) b.x += b.dx;
                if (b.y > CANVAS_H + 10) {
                    this.enemyBullets.splice(i, 1);
                }
            }
        }

        // ---- Power-ups ----
        spawnPowerup(x, y) {
            if (Math.random() > POWERUP_CHANCE) return;
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            this.powerups.push({
                type,
                x: x - POWERUP_SIZE / 2,
                y,
                w: POWERUP_SIZE,
                h: POWERUP_SIZE,
                speed: 1.5,
                pulse: Math.random() * Math.PI * 2,
            });
        }

        updatePowerups() {
            for (let i = this.powerups.length - 1; i >= 0; i--) {
                const pu = this.powerups[i];
                pu.y += pu.speed;
                pu.pulse += 0.1;
                if (pu.y > CANVAS_H + 10) {
                    this.powerups.splice(i, 1);
                    continue;
                }
                if (this.collides(this.player, pu)) {
                    this.applyPowerup(pu.type);
                    this.spawnCollectParticles(pu.x + pu.w / 2, pu.y + pu.h / 2, POWERUP_COLORS[pu.type]);
                    this.powerups.splice(i, 1);
                }
            }
        }

        applyPowerup(type) {
            const now = Date.now();
            switch (type) {
                case 'rapid':
                    this.player.rapidFire = true;
                    this.player.rapidEnd = now + POWERUP_DURATION;
                    break;
                case 'spread':
                    this.player.spreadShot = true;
                    this.player.spreadEnd = now + POWERUP_DURATION;
                    break;
                case 'shield':
                    this.player.shield = true;
                    this.player.shieldEnd = now + POWERUP_DURATION;
                    break;
                case 'life':
                    this.lives = Math.min(5, this.lives + 1);
                    break;
            }
            this.updateHUD();
        }

        // ---- Collisions ----
        collides(a, b) {
            return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        }

        checkCollisions() {
            // Bullets vs enemies
            for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
                for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
                    if (this.collides(this.bullets[bi], this.enemies[ei])) {
                        this.bullets.splice(bi, 1);
                        const e = this.enemies[ei];
                        e.hp--;
                        if (e.hp <= 0) {
                            this.score += e.score;
                            this.enemiesKilled++;
                            this.spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, e.isBoss ? 40 : 15);
                            this.spawnPowerup(e.x + e.w / 2, e.y + e.h / 2);
                            if (e.isBoss) this.bossActive = false;
                            this.enemies.splice(ei, 1);

                            if (this.enemiesKilled >= this.enemiesPerLevel) {
                                this.levelUp();
                            }
                            this.updateHUD();
                        } else {
                            this.spawnHitParticles(e.x + e.w / 2, e.y + e.h / 2);
                        }
                        break;
                    }
                }
            }

            // Enemy bullets vs player
            if (!this.player.invincible) {
                for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
                    if (this.collides(this.enemyBullets[i], this.player)) {
                        this.enemyBullets.splice(i, 1);
                        this.playerHit();
                        break;
                    }
                }
            }

            // Enemies vs player
            if (!this.player.invincible) {
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    if (this.collides(this.enemies[i], this.player)) {
                        const e = this.enemies[i];
                        if (!e.isBoss) {
                            this.spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color, 10);
                            this.enemies.splice(i, 1);
                        }
                        this.playerHit();
                        break;
                    }
                }
            }
        }

        playerHit() {
            if (this.player.shield) {
                this.player.shield = false;
                this.spawnExplosion(this.player.x + PLAYER_W / 2, this.player.y + PLAYER_H / 2, '#22c55e', 12);
                return;
            }
            this.lives--;
            this.updateHUD();
            this.spawnExplosion(this.player.x + PLAYER_W / 2, this.player.y + PLAYER_H / 2, '#3b82f6', 20);

            if (this.lives <= 0) {
                this.gameOver();
                return;
            }

            // Brief invincibility
            this.player.invincible = true;
            this.player.invincibleEnd = Date.now() + 2000;
        }

        // ---- Particles ----
        spawnExplosion(x, y, color, count) {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
                const speed = Math.random() * 4 + 2;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 4 + 2,
                    color,
                    life: 1.0,
                    decay: Math.random() * 0.03 + 0.02,
                });
            }
        }

        spawnHitParticles(x, y) {
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    size: Math.random() * 3 + 1,
                    color: '#fff',
                    life: 1.0,
                    decay: 0.05,
                });
            }
        }

        spawnCollectParticles(x, y, color) {
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                this.particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3,
                    size: 3,
                    color,
                    life: 1.0,
                    decay: 0.04,
                });
            }
        }

        updateParticles() {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                p.vx *= 0.97;
                p.vy *= 0.97;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        // ---- Spawning Logic ----
        handleSpawning() {
            if (this.bossActive) return;
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnEnemy();
            }
        }

        // ---- Drawing ----
        draw() {
            const ctx = this.ctx;

            // Background + stars
            this.drawStars();

            // Player
            this.drawPlayer(ctx);

            // Player bullets
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            for (const b of this.bullets) {
                ctx.fillRect(b.x, b.y, b.w, b.h);
            }
            ctx.shadowBlur = 0;

            // Enemy bullets
            ctx.fillStyle = '#f97316';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 6;
            for (const b of this.enemyBullets) {
                ctx.fillRect(b.x, b.y, b.w, b.h);
            }
            ctx.shadowBlur = 0;

            // Enemies
            for (const e of this.enemies) {
                this.drawEnemy(ctx, e);
            }

            // Power-ups
            for (const pu of this.powerups) {
                this.drawPowerup(ctx, pu);
            }

            // Particles
            for (const p of this.particles) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        drawPlayer(ctx) {
            const p = this.player;
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;

            // Invincibility blink
            if (p.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }

            // Engine glow
            ctx.fillStyle = '#f97316';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 15;
            const flicker = Math.sin(Date.now() * 0.02) * 4 + 8;
            ctx.beginPath();
            ctx.moveTo(cx - 8, p.y + p.h);
            ctx.lineTo(cx, p.y + p.h + flicker);
            ctx.lineTo(cx + 8, p.y + p.h);
            ctx.fill();

            // Ship body
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.moveTo(cx, p.y);
            ctx.lineTo(p.x + p.w, p.y + p.h * 0.8);
            ctx.lineTo(cx + 6, p.y + p.h);
            ctx.lineTo(cx - 6, p.y + p.h);
            ctx.lineTo(p.x, p.y + p.h * 0.8);
            ctx.closePath();
            ctx.fill();

            // Cockpit
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(cx, p.y + p.h * 0.4, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;

            // Shield visual
            if (p.shield) {
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#22c55e';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(cx, cy, p.w * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            ctx.globalAlpha = 1;
        }

        drawEnemy(ctx, e) {
            const cx = e.x + e.w / 2;
            const cy = e.y + e.h / 2;

            ctx.fillStyle = e.color;
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 8;

            switch (e.shape) {
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(cx, e.y + e.h);
                    ctx.lineTo(e.x, e.y);
                    ctx.lineTo(e.x + e.w, e.y);
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'diamond':
                    ctx.beginPath();
                    ctx.moveTo(cx, e.y);
                    ctx.lineTo(e.x + e.w, cy);
                    ctx.lineTo(cx, e.y + e.h);
                    ctx.lineTo(e.x, cy);
                    ctx.closePath();
                    ctx.fill();
                    break;

                case 'hexagon': {
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                        const hx = cx + Math.cos(angle) * e.w / 2;
                        const hy = cy + Math.sin(angle) * e.h / 2;
                        if (i === 0) ctx.moveTo(hx, hy);
                        else ctx.lineTo(hx, hy);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;
                }

                case 'square':
                    ctx.fillRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
                    // Eye
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'boss': {
                    // Boss body
                    ctx.beginPath();
                    ctx.moveTo(cx, e.y);
                    ctx.lineTo(e.x + e.w, e.y + e.h * 0.3);
                    ctx.lineTo(e.x + e.w - 10, e.y + e.h);
                    ctx.lineTo(e.x + 10, e.y + e.h);
                    ctx.lineTo(e.x, e.y + e.h * 0.3);
                    ctx.closePath();
                    ctx.fill();

                    // Boss eyes
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(cx - 15, cy, 6, 0, Math.PI * 2);
                    ctx.arc(cx + 15, cy, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(cx - 15, cy, 3, 0, Math.PI * 2);
                    ctx.arc(cx + 15, cy, 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
            }

            ctx.shadowBlur = 0;

            // HP bar for tanks and bosses
            if (e.maxHp > 1) {
                const barW = e.w;
                const barH = 4;
                const barY = e.y - 8;
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(e.x, barY, barW, barH);
                const hpRatio = e.hp / e.maxHp;
                ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#facc15' : '#ef4444';
                ctx.fillRect(e.x, barY, barW * hpRatio, barH);
            }
        }

        drawPowerup(ctx, pu) {
            const cx = pu.x + pu.w / 2;
            const cy = pu.y + pu.h / 2;
            const pulse = Math.sin(pu.pulse) * 3;
            const color = POWERUP_COLORS[pu.type];

            // Glow circle
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cx, cy, pu.w / 2 + pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.arc(cx, cy, pu.w / 2 - 2, 0, Math.PI * 2);
            ctx.fill();

            // Icon
            ctx.shadowBlur = 0;
            ctx.font = '16px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(POWERUP_ICONS[pu.type], cx, cy);
        }

        // ---- Game Loop ----
        gameLoop() {
            if (!this.running) return;

            this.frameCount++;
            this.updateStars();
            this.updatePlayer();
            this.handleSpawning();
            this.updateEnemies();
            this.updateBullets();
            this.updatePowerups();
            this.checkCollisions();
            this.updateParticles();
            this.draw();

            this.animId = requestAnimationFrame(() => this.gameLoop());
        }
    }

    // Expose for app.js
    const instance = new Game();
    return { instance };
})();
