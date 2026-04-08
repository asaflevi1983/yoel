# Copilot Instructions — Space Explorer for Yoel

## Project Overview
**Space Explorer** — A space-themed web app for an 8-year-old boy named Yoel Weiss (יואל וייס).

## Features

### 1. Daily Space Image (NASA APOD)
- Fetch the **Astronomy Picture of the Day** from NASA's APOD API (`https://api.nasa.gov/planetary/apod`)
- Use the DEMO_KEY or `api_key=DEMO_KEY` (no API key needed)
- Show the image full-screen with title and explanation in Hebrew-friendly layout
- "Next image" / "Previous image" buttons to browse past days
- Auto-loads today's image on startup
- Cache viewed images in localStorage

### 2. Space Shooter Game
- HTML5 Canvas game with a spaceship that the player controls
- Arrow keys / touch to move, Space / tap to shoot
- Enemies come from the top, player shoots them
- Score tracking, lives, levels that get progressively harder
- Cool space-themed visuals (stars background, explosions)
- Sound effects (optional, can be toggled)
- High score saved in localStorage

### 3. UI/UX Requirements
- **Theme**: Deep space — dark background with stars, purple/blue gradients
- **Target user**: 8-year-old boy (Yoel) — big buttons, fun animations, easy to use
- **Language**: Hebrew (RTL)
- **Navigation**: Simple tab/button navigation between "תמונת היום" and "משחק חלל"
- **Personalized**: Welcome message "!שלום יואל" or "!ברוכים הבאים ליואל"
- **Responsive**: Works on desktop and tablet/phone
- **Fun**: Stars twinkling animation, rocket emoji, playful fonts

## Tech Stack
- **Pure HTML/CSS/JavaScript** — NO frameworks, NO build tools
- Single `index.html` or simple multi-file structure
- Must work as static files on GitHub Pages
- Modern CSS (gradients, animations, grid/flexbox)
- HTML5 Canvas for the game

## Deployment
- GitHub Pages from the `master` branch root (or `/docs` folder)
- No server needed — everything runs client-side
- NASA APOD API is free and CORS-friendly with DEMO_KEY

## File Structure
```
/
├── index.html          # Main page with navigation
├── css/
│   └── style.css       # Space theme styles
├── js/
│   ├── apod.js         # NASA APOD image fetcher
│   ├── game.js         # Space shooter game
│   └── app.js          # Main app logic, navigation
├── assets/
│   └── (any local assets)
└── README.md
```
