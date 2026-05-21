# Minigame Frontend (Chiec Non Ky Dieu)

React + TypeScript frontend for realtime multiplayer rooms.

## Tech

- React 19 + TypeScript
- Zustand for app state
- React Router for navigation
- SockJS + STOMP for realtime events
- TailwindCSS for UI

## Pages

- `/` and `/join/:roomCode`: join or create room
- `/room/:roomCode/waiting`: waiting room + host start
- `/room/:roomCode/game`: gameplay + event feed
- `/room/:roomCode/result`: final ranking

## Environment

Copy `.env.example` to `.env` and update values if needed:

- `VITE_API_BASE_URL` (default empty to use Vite proxy)
- `VITE_WS_URL` (default `/ws`)

## Run

```powershell
Set-Location "D:\FPT\SPRING_3W_2026\MLN131_3W\MiniGame\minigame_fe"
npm install
npm run dev
```

## Validate

```powershell
Set-Location "D:\FPT\SPRING_3W_2026\MLN131_3W\MiniGame\minigame_fe"
npm run typecheck
npm run test
npm run build
```

## Structure

- `src/pages`: route-level pages
- `src/components`: reusable UI blocks
- `src/store`: Zustand stores
- `src/services`: REST + WebSocket clients
- `src/hooks`: realtime and polling hooks
- `src/types`: API and event contracts
