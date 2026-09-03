import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import loginImage from '../assets/login.png';
import './Login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple authentication placeholder – directly navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-split">
        <div className="login-image-side">
          <img src={loginImage} alt="MindBloom illustration" className="login-image" />
        </div>
        <div className="login-form-side">
          <div className="login-card">
            <h2 className="login-title">Sign In</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
                placeholder="you@example.com"
              />

              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                placeholder="••••••••"
              />

              <button type="submit" className="login-submit">
                Sign In
              </button>
            </form>
            <Link to="/" className="forgot-link">Forgot Password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
