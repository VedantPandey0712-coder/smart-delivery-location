import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthAPI } from "../api";
import { useAuth } from "../auth";
import Toast from "../components/Toast";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      signIn(await AuthAPI.signIn(form));
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.response?.data?.error || "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1 className="page-title">Sign in to your delivery space</h1>
        <p className="page-subtitle">Keep your saved delivery points and verification details together.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="signin-email">Email address</label>
            <input id="signin-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="signin-password">Password</label>
            <input id="signin-password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
        {error && <Toast message={error} type="error" onClose={() => setError("")} />}
        <p className="auth-switch">New here? <Link to="/signup">Create an account</Link></p>
      </div>
    </div>
  );
}
