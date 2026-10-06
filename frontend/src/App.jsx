import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/Login.jsx';
import Signup from "./pages/Signup.jsx";
import Dashboard from './Dashboard.jsx';
import Game from './components/Game.jsx';
import Lobby from './components/Lobby.jsx';
import ChooseCharacter from './components/ChooseCharacter.jsx';
import Map from "./components/Map.jsx";
import Swamp from "./components/Swamp.jsx";
import Desert from "./components/Desert.jsx";

export default function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/game" element={<Game />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/choosecharacter" element={<ChooseCharacter />} />
        <Route path="/map" element={<Map />} />
        <Route path="/swamp" element={<Swamp />} />
        <Route path="/desert" element={<Desert />} />
      </Routes>
    </Router>
  );
}