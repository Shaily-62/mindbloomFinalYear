import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import loginImage from "../assets/login.png";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      // Supabase may return an empty identities array for
      // an email that is already registered.
      if (
        data?.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        toast.error("This email is already registered. Please log in instead.");
        return;
      }

      if (data.session) {
        toast.success("Account created successfully!");
        navigate("/dashboard", { replace: true });
      } else {
        toast.info(
          "Account created. Please check your email for a confirmation link, then log in.",
        );
      }
    } catch (err) {
      console.error("Signup error:", err);

      if (err.message?.toLowerCase().includes("already registered")) {
        toast.error("This email is already registered. Please log in instead.");
      } else if (err.message?.toLowerCase().includes("already exists")) {
        toast.error("This email is already registered. Please log in instead.");
      } else {
        toast.error(err.message || "Could not create your account.");
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="signup-page">
      {/* Add ToastContainer at the root level of your component */}
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="signup-split">
        <div className="signup-image-side">
          <img
            src={loginImage}
            alt="MindBloom illustration"
            className="signup-image"
          />
        </div>

        <div className="signup-form-side">
          <div className="signup-card">
            <h2 className="signup-title">Join MindBloom 🌱</h2>
            <p className="signup-subtitle">
              Create your parent account to get started.
            </p>

            <form onSubmit={handleSubmit} className="signup-form">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                placeholder="Jane Doe"
                className="signup-input"
                disabled={loading}
                required
              />

              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="signup-input"
                disabled={loading}
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="signup-input"
                minLength={8}
                disabled={loading}
                required
              />

              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className="signup-input"
                minLength={8}
                disabled={loading}
                required
              />

              <button
                type="submit"
                className="signup-submit"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <p className="login-prompt">
              Already registered?{" "}
              <Link to="/login" className="login-link">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
