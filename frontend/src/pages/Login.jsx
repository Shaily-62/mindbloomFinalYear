import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import loginImage from "../assets/login.png";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        toast.error("Login could not be completed. Please try again.");
        return;
      }

      toast.success("Welcome back!");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      const errorMessage = err.message?.toLowerCase() || "";

      if (errorMessage.includes("invalid login credentials")) {
        toast.error(
          "Incorrect email or password. If you just registered, confirm your email first.",
        );
      } else if (errorMessage.includes("email not confirmed")) {
        toast.error(
          "Please confirm your email using the link sent to your inbox before logging in.",
        );
      } else {
        toast.error(err.message || "Unable to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="login-split">
        <div className="login-image-side">
          <img
            src={loginImage}
            alt="MindBloom illustration"
            className="login-image"
          />
        </div>

        <div className="login-form-side">
          <div className="login-card">
            <h2 className="login-title">Welcome Back 🌱</h2>
            <p className="login-subtitle">
              Log in to continue your family's learning journey.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="login-input"
                disabled={loading}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="login-input"
                disabled={loading}
                required
              />

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <p className="signup-prompt">
              Don't have an account?{" "}
              <Link to="/signup" className="signup-link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
