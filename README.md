# MindBloom

MindBloom is a front-end educational screening project designed to support early dyslexia risk identification through playful, game-based activities. The platform combines a landing page, login flow, parent dashboard, child profile management, Phaser-based game scenes, and a storytelling-style learning environment.

## Project Overview

The project is built as a React + Vite application with interactive Phaser scenes for the game experience. It is designed to help parents and educators understand how a child interacts with reading, sound, and visual learning tasks in a low-stress, game-like environment.

This project currently focuses on the interactive front-end experience and includes:

- landing page with information about the product
- login screen and navigation flow
- parent dashboard for managing child profiles
- add-child modal and local profile tracking
- character selection and lobby scene
- Phaser-based game and intro menu screens
- static assets for characters, backgrounds, and UI elements

## Tech Stack

- React 19
- Vite
- Phaser 4
- React Router DOM
- React Modal
- CSS-based styling for all views and dashboard components

## Project Structure

```text
mindbloomFinalYear/
├─ public/
│  └─ game-assests/
│     ├─ character/
│     ├─ intro/
│     └─ lobby/
├─ src/
│  ├─ App.jsx
│  ├─ Dashboard.jsx
│  ├─ components/
│  │  ├─ AddChildModal.jsx
│  │  ├─ ChooseCharacter.jsx
│  │  ├─ Game.jsx
│  │  └─ Lobby.jsx
│  ├─ game/
│  │  ├─ ChooseCharacterScene.js
│  │  ├─ LobbyScene.js
│  │  └─ MainMenu.js
│  ├─ pages/
│  │  ├─ LandingPage.jsx
│  │  └─ Login.jsx
│  ├─ assets/
│  ├─ App.css
│  ├─ Dashboard.css
│  ├─ index.css
│  └─ main.jsx
├─ package.json
├─ vite.config.js
├─ index.html
└─ README.md
```

## App Connectivity and Flow

The application uses React Router to connect all screens in the app.

### Main Route Structure

In `src/App.jsx`, the app is wrapped in `BrowserRouter` and routes are set as follows:

- `/` → Landing page
- `/login` → Login page
- `/dashboard` → Parent dashboard
- `/game` → Phaser game screen
- `/lobby` → Phaser lobby scene
- `/choosecharacter` → Character selection screen

### Component Connectivity

1. The user opens the app at `/` and sees the Marketing/Landing view.
2. From the landing page, the user enters the login flow (`/login`).
3. After login, the app navigates to the dashboard (`/dashboard`).
4. The dashboard stores child profiles in local React state.
5. When a child is added, `Dashboard.jsx` updates the `children` array and renders child cards.
6. Selecting a child and clicking Play navigates to `/game`.
7. The `Game.jsx` component creates a Phaser instance using `MainMenu` as the initial scene.
8. Inside `MainMenu.js`, the user can choose menu items such as Lobby, which calls `navigate("/lobby")`.
9. `Lobby.jsx` initializes the `LobbyScene` Phaser scene.
10. The lobby scene loads character assets and UI overlays for the interactive world.
11. The Choose Character flow uses `ChooseCharacter.jsx` and `ChooseCharacterScene.js` to render a character preview for the selected gender.

## End-to-End User Process

### 1. Landing Experience
The `LandingPage.jsx` component renders the hero section and product overview. It introduces the value of early screening and gives users the option to continue into the app.

### 2. Login
The login page acts as the user entry point into the dashboard. It serves as the access route before the parent sees the child management and analytics views.

### 3. Dashboard
The `Dashboard.jsx` page acts as the main parent console. It includes:

- sidebar navigation
- summary cards for progress analytics
- add-child modal
- child profile list with management actions
- “Play” actions that redirect to the game area

### 4. Adding a Child
`AddChildModal.jsx` opens when the parent clicks “Add Child”. The modal captures details such as the child’s name and age, and passes the new object back to the parent dashboard for display.

### 5. Game and Lobby Experience
Once the dashboard sends the user into the game flow:

- `Game.jsx` boots the Phaser game and passes navigation through the Phaser registry.
- `MainMenu.js` creates the intro menu with items like Play and Lobby.
- The lobby scene builds the environment and displays character UI.
- The user can access the character selection and world assets that are loaded from the `/public/game-assests` folder.

## Asset and Scene Architecture

The game visuals are stored in the `public/game-assests` directory and loaded directly by Phaser scenes.

The most important scene files are:

- `src/game/MainMenu.js` → intro menu scene
- `src/game/LobbyScene.js` → main lobby environment, UI, animations, and character actions
- `src/game/ChooseCharacterScene.js` → character preview and selection screen

These files are responsible for rendering the game world and interacting with the app navigation flow.

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the app in development mode

```bash
npm run dev
```

This starts the Vite development server, usually at:

```text
http://localhost:5173
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Notes

- This is a front-end-focused project; there is no backend database configured in the current setup.
- Child data is managed in local React state for the dashboard experience.
- Data and visuals for the game are served from static assets in the public folder.
- The project is designed to be expanded with real authentication, database storage, AI-based analysis, and deeper gameplay modules in the future.

## Summary

MindBloom connects the user journey from product introduction to parent management and then into a game world. The overall architecture is built around React pages for the app experience and Phaser scenes for interactive gameplay, with navigation linking each layer together through the main router and game scene events.
