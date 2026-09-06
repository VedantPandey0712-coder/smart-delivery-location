import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthAPI } from "../api";
import { useAuth } from "../auth";
import Toast from "../components/Toast";

export default function SignUp() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", role: "customer" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setBusy(true);
    setError("");
    try {
      signIn(await AuthAPI.signUp({ fullName: form.fullName, email: form.email, password: form.password, role: form.role }));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Could not create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Start with clarity</p>
        <h1 className="page-title">Create your account</h1>
        <p className="page-subtitle">Save your delivery locations and make every handoff easier to find.</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="signup-name">Full name</label>
            <input id="signup-name" type="text" autoComplete="name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="signup-email">Email address</label>
            <input id="signup-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="signup-role">I am signing up as</label>
            <select id="signup-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
              <option value="customer">Customer</option>
              <option value="delivery_partner">Delivery partner</option>
            </select>
            <div className="hint">Delivery partners can confirm successful deliveries.</div>
          </div>
          <div className="row-2">
            <div className="field">
              <label htmlFor="signup-password">Password</label>
              <input id="signup-password" type="password" autoComplete="new-password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="signup-confirm">Confirm password</label>
              <input id="signup-confirm" type="password" autoComplete="new-password" minLength="8" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          </div>
          <p className="field-hint">Use at least 8 characters.</p>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
        </form>
        {error && <Toast message={error} type="error" onClose={() => setError("")} />}
        <p className="auth-switch">Already have an account? <Link to="/signin">Sign in</Link></p>
      </div>
    </div>
  );
}
