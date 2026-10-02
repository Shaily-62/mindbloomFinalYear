import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/Login.jsx';
import Dashboard from './Dashboard.jsx';
import Game from './components/Game.jsx';
import Lobby from './components/Lobby.jsx';
import ChooseCharacter from './components/ChooseCharacter.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/game" element={<Game />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/choosecharacter" element={<ChooseCharacter />} />
      </Routes>
    </Router>
  );
}