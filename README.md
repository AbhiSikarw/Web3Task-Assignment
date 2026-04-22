# 🎨 Skribbl Clone

A full-stack, real-time multiplayer drawing and guessing game — a clone of [skribbl.io](https://skribbl.io).

## 🌐 Live Demo
> **https://your-skribbl-clone.onrender.com** ← Update after deploying

---

## 🗺️ What Is This Project?

Skribbl Clone is a real-time multiplayer Pictionary-style web game where:
- Players join a **room** (public or private) using a room code
- Each round, one player is the **drawer** — they pick a secret word and draw it on a shared canvas
- All other players **guess the word** by typing in chat
- **Correct guesses earn points** — faster guesses earn more points
- The drawer also earns points for each correct guesser
- After all players have drawn, the player with the **most points wins**

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+ installed
- Two terminal windows

### Step 1 — Clone / unzip the project
```bash
cd skribbl-clone
```

### Step 2 — Install all dependencies
```bash
# Install root dev dependencies
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

### Step 3 — Start the development servers

**Terminal 1 — Backend (port 3001):**
```bash
npm run dev:server
```

**Terminal 2 — Frontend (port 5173):**
```bash
npm run dev:client
```

Or start both simultaneously (requires concurrently):
```bash
npm run dev
```

### Step 4 — Open the game
Navigate to **http://localhost:5173** in your browser.

To test multiplayer, open the URL in **multiple browser tabs** or different devices on the same network.

---

## 📁 Project Structure

```
skribbl-clone/
├── server/                  # Node.js + Express + Socket.IO backend
│   ├── index.js             # Entry point, Express + Socket.IO setup
│   ├── MessageHandler.js    # All socket event handling (OOP)
│   ├── Room.js              # Room class — manages players, game state
│   ├── Game.js              # Game class — rounds, scoring, turn logic
│   ├── Player.js            # Player class — score, state per player
│   └── words.js             # Word lists by category + random selector
│
├── client/                  # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx     # Landing page: create/join/public rooms
│   │   │   ├── LobbyPage.tsx    # Pre-game lobby with player list
│   │   │   └── GamePage.tsx     # Main game screen
│   │   ├── components/
│   │   │   ├── DrawingCanvas.tsx # HTML5 Canvas + drawing tools
│   │   │   ├── ChatPanel.tsx    # Chat + guess input
│   │   │   ├── WordSelection.tsx # Word picker overlay for drawer
│   │   │   ├── RoundEnd.tsx     # Round summary overlay
│   │   │   ├── GameOver.tsx     # Final leaderboard + confetti
│   │   │   └── Avatar.tsx       # Player avatar component
│   │   ├── hooks/
│   │   │   └── useSocket.ts     # Socket.IO client singleton + hook
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── App.tsx              # Root with React Context (global state)
│   │   └── main.tsx             # React entry point
│   └── vite.config.ts           # Vite config with proxy to backend
│
└── package.json             # Root scripts for running both servers
```

---

## 🏗️ Architecture Overview

### WebSocket Events Flow

```
Client (Drawer)          Server                  Clients (Guessers)
      │                     │                          │
      │── create_room ──────►│                          │
      │◄── {roomId} ─────────│                          │
      │                     │                          │
      │── start_game ────────►│                          │
      │                     │── round_start ────────────►│
      │◄── round_start ──────│  (no wordOptions)         │
      │  (with wordOptions)  │                          │
      │                     │                          │
      │── word_chosen ───────►│                          │
      │                     │── game_state (drawing) ───►│
      │                     │── timer_tick (every 1s) ──►│
      │                     │                          │
      │── draw_start ────────►│                          │
      │── draw_move ─────────►│── draw_data ─────────────►│
      │── draw_end ──────────►│                          │
      │                     │                          │
      │                     │◄── guess ────────────────── │
      │                     │── guess_result ────────────►│
      │                     │── chat_message ────────────►│
      │                     │                          │
      │                     │── hint_update (timed) ────►│
      │                     │── round_end ──────────────►│
      │                     │── game_over ──────────────►│
```

### OOP Server Architecture

| Class | Responsibility |
|-------|---------------|
| `Room` | Manages player list, host, settings, leaderboard, delegates to Game |
| `Game` | Manages phase transitions, word selection, hint system, canvas strokes, scoring |
| `Player` | Stores per-player state: score, drawing/guessed flags, avatar |
| `MessageHandler` | Handles all socket events, orchestrates Room/Game/Player interactions |

### Real-Time Drawing Sync

Drawing strokes are captured using normalized coordinates (0–1 range relative to canvas size), so they render correctly across different screen sizes:

1. **Drawer**: Mouse/touch events on `<canvas>` → normalized `{x, y}` → `draw_start/move/end` socket events
2. **Server**: Receives events → stores stroke array in `Game.canvasStrokes` → broadcasts via `draw_data`  
3. **Guessers**: Receive `draw_data` → multiply by canvas pixel dimensions → draw on their local canvas

The stroke array enables **canvas replay** for players joining mid-game and **undo** functionality.

### Scoring System

- **Guessers**: `max(50, 300 + timeBonus - orderPenalty)` — first correct guess scores highest
  - `timeBonus = (timeLeft / totalTime) * 200` — speed reward
  - `orderPenalty = guessOrder * 20` — later guessers score slightly less
- **Drawer**: +50 points per player who guesses correctly

### Word Matching

Server-side word matching in `Game.checkGuess()`:
```js
guess.trim().toLowerCase() === word.toLowerCase()
```
- Case-insensitive
- Whitespace-trimmed
- Exact match required (partial matches show as "close" if within edit distance 2)

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + TypeScript + Vite | Fast dev, type safety, component model |
| Canvas | HTML5 Canvas API | Native, performant, no external dependency |
| Routing | React Router v6 | SPA navigation |
| Backend | Node.js + Express | Lightweight, JS ecosystem |
| WebSockets | Socket.IO 4 | Reliable WS with fallback to polling |
| Styling | CSS + Inline styles | No build-time CSS deps needed |
| Fonts | Google Fonts (Fredoka One + Nunito) | Fun, readable game aesthetic |

---

## 🌐 Deployment

### Option A — Render (Recommended)

**Backend:**
1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `node index.js`
6. Add env var: `CLIENT_URL=https://your-frontend.onrender.com`

**Frontend:**
1. Create a new **Static Site** on Render
2. Root Directory: `client`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add env var: `VITE_SERVER_URL=https://your-backend.onrender.com`

### Option B — Railway

1. Create project from GitHub repo
2. Add two services: one for `server/`, one for `client/`
3. Set environment variables as above

### Option C — Vercel (Frontend) + Render (Backend)

1. Deploy `client/` to Vercel (auto-detects Vite)
2. Deploy `server/` to Render as a Web Service
3. In Vercel: add env var `VITE_SERVER_URL=https://your-backend.onrender.com`

> **Important:** Socket.IO requires persistent WebSocket connections. Vercel serverless functions don't support this — always use Render/Railway for the backend.

---

## 🎮 Game Features

### Core (Must Have) ✅
- [x] Create room with configurable settings (players, rounds, draw time, words, hints, private/public)
- [x] Join room via link or code
- [x] Lobby with player list; host starts game
- [x] Turn-based rounds: one drawer, others guess
- [x] Real-time drawing sync (strokes visible to all)
- [x] Word selection for drawer (1–5 choices)
- [x] Guessing: type word, get points for correct guess
- [x] Scoring and leaderboard
- [x] Game end with winner + confetti

### Should Have ✅
- [x] Hints (reveal letters over time)
- [x] Chat (guesses + general chat)
- [x] Draw time countdown timer
- [x] Private rooms (invite link)

### Drawing Tools ✅
- [x] Brush / Pen with color selection (20 colors)
- [x] Brush sizes (5 sizes)
- [x] Eraser
- [x] Undo last stroke
- [x] Clear canvas

### Bonus ✅
- [x] OOP architecture (Room, Game, Player, MessageHandler classes)
- [x] Configurable room settings
- [x] Player avatars (10 unique emoji avatars)
- [x] "Close guess" detection and hint in chat
- [x] Auto word selection if drawer doesn't pick in time
- [x] Public room browser

---

## 🔑 Key Code Locations

| Feature | File |
|---------|------|
| WebSocket events | `server/MessageHandler.js` |
| Game logic / scoring | `server/Game.js` |
| Drawing capture | `client/src/components/DrawingCanvas.tsx` |
| Word matching | `server/Game.js → checkGuess()` |
| Room management | `server/Room.js` |
| Socket singleton | `client/src/hooks/useSocket.ts` |

---

## 📝 Notes

- Game state is **in-memory only** — rooms disappear if the server restarts (no database needed for MVP)
- Canvas uses **normalized coordinates** for cross-device consistency
- Socket.IO automatically falls back from WebSocket to HTTP long-polling if needed
