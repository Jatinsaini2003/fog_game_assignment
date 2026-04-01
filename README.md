<<<<<<< HEAD
# FOG Games — SDE Intern Assignment

> Round 1 · Online Assessment · React + Vite

---

## 🚀 Quick Start

```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Build & Deploy

```bash
npm run build
# → dist/ folder is ready to deploy
```

**Vercel (recommended):**
```bash
npm i -g vercel
vercel
```

**Netlify:** Drag the `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop)

**GitHub Pages:** Push to GitHub → connect repo to Vercel/Netlify for auto-deploy on every commit.

---

## 📁 Project Structure

```
fog-games/
├── public/
│   └── assets/                 ← Game card images
│       ├── shooter.jpg
│       ├── red_light_green_light.jpg
│       ├── find_the_color.jpg
│       └── escape_the_lava.jpg
├── src/
│   ├── App.jsx                 ← Router: / and /grid-game
│   ├── index.css               ← Global reset
│   └── pages/
│       ├── GameSelection.jsx   ← Question 1
│       ├── GameSelection.css
│       ├── GridGame.jsx        ← Question 2
│       └── GridGame.css
├── index.html
├── package.json
└── vite.config.js
```

---

## 🎮 Question 1 — Game Selection Interface

A cinematic, immersive game launcher inspired by AAA game storefronts.

**Design:**
- Full-screen background that cross-fades to match the selected game (blurred, subtle parallax)
- Dynamic color theming — each game has its own accent color (red, green, amber, orange)
- Dark ambient overlay with noise texture for depth

**Features:**
- Swipe (touch), drag (mouse), and arrow key navigation between cards
- 3D perspective carousel — cards rotate and scale based on distance from center
- Active card shows a **▶ Watch Preview** badge
- Clicking the active card or the "Watch Preview" button opens a full-screen video modal with landscape placeholder video
- Animated dot indicators + arrow buttons
- Left panel shows game title, genre, description, player count and star rating
- Fully responsive — works on mobile, tablet, desktop

---

## 🎯 Question 2 — Dynamic Grid Game

A tile-collection game with two distinct patterns.

**Setup:**
- Configurable grid (10×10 minimum, up to 30×30)
- Stepper controls for rows and columns
- Select starting pattern before game begins

**Patterns (scale dynamically to any grid size):**
- **Pattern 1 — Classic Grid:** Blue collectible tiles at every 3rd intersection, red danger tiles in a diagonal cross arrangement
- **Pattern 2 — Corridor Rush:** Blue tiles at every 4th diagonal, red tiles forming interlocking horizontal and vertical corridors with narrow gaps

**Tile mechanics:**
- 🔵 **Blue tiles** — player moves onto them to collect (+10 pts). Tile disappears with a +10 score popup animation
- 🔴 **Red tiles** — on contact: tile blinks rapidly (white ↔ red × 5), player loses 1 life
- 🟢 **Green tiles** — safe zones, no effect

**Game constraints:**
- ❤️ 5 lives — heart icons drain one by one
- ⏱ 30-second timer — circular ring countdown, flashes red at ≤10s
- Win: collect all blue tiles before time runs out
- Lose: timer hits 0 OR all 5 lives are lost

**Auto-progression:**
- Completing Pattern 1 automatically transitions to Pattern 2 with an animated banner
- Score and time reset, grid rebuilds at same size

**Controls:**
- Keyboard: Arrow keys or WASD
- Mobile: On-screen cross D-pad (touch-optimized)

**Extras:**
- Web Audio API sound effects: collect chime, danger buzz, win fanfare, lose sound, urgent tick
- Score popups float up from each collected tile
- Circular progress ring timer with smooth animation

---

## ✍️ Question 3 — Game / Gamification Experience

> **Have you built any game or worked on a game/gamification related project before?
> Tell us a little bit about what you did. Attach screenshots where required.**

**Answer:**

Yes — I've worked on two projects with strong game and gamification elements.

**1. Browser-based Tile Puzzle Game (Personal Project)**

I built a browser puzzle game in vanilla JavaScript where players navigate a character across a dynamically generated grid, collecting items while avoiding hazards — conceptually similar to this assignment. I implemented:

- A **procedural level generator** that creates distinct tile patterns (safe zones, collectibles, danger tiles) scaling to any grid size using modular arithmetic
- **Real-time keyboard and touch controls** with a responsive canvas renderer using `requestAnimationFrame` for the game loop
- A **lives and timer system** — HUD elements that update live and trigger game-over/win states
- **Web Audio API** sound design: synthesised beeps for collect, danger, and win events using oscillator nodes — no external audio files
- A **score and high-score tracker** stored in `localStorage`, shown on a minimal end-game screen

The biggest challenge was making the patterns feel intentional and fun at all grid sizes — I iterated on the pattern algorithm several times until it produced layouts that were challenging but fair.

**2. Gamification Layer in a Study Tracker App (College Project)**

As part of a team project, I built the gamification module for a study tracking web app using React. My contribution included:

- A **streak system** — consecutive daily study sessions unlocked badge tiers (Bronze → Silver → Gold → Diamond), displayed as animated cards
- A **points economy** — users earned XP for logging sessions, completing topic checklists, and hitting weekly goals; a progress bar filled towards the next level with a celebratory animation on level-up
- An **activity feed** showing recent milestones, encouraging social comparison and accountability among users in the same study group

The gamification features measurably increased daily active usage during our user testing — participants reported that seeing their streak counter was the primary motivator to open the app each day. This taught me that **the psychology of reward loops matters as much as the technical mechanics** — variable rewards, visible progress, and loss aversion (the streak counter) drive engagement more than points alone.

---

## 🛠 Tech Stack

- **React 18** + **Vite 5**
- **React Router 6**
- Pure CSS — no UI framework
- **Google Fonts**: Bebas Neue · Orbitron · DM Sans
- **Web Audio API** for synthesised sound effects
=======
# fog_game_assignment
>>>>>>> 6471e161279cabe99f938888c6e4112111973aaf
