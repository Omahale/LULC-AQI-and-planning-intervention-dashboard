import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api, authStorage } from "../services/api";

const demoAccounts = [
  {
    label: "Citizen",
    username: "citizen",
    password: "citizen123",
    role: "citizen",
    description: "Basic public access",
  },
  {
    label: "Engineer",
    username: "engineer",
    password: "engineer123",
    role: "engineer",
    description: "Planning department access",
  },
  {
    label: "Admin",
    username: "admin",
    password: "admin123",
    role: "admin",
    description: "Full platform access",
  },
];

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || "/";

  const [form, setForm] = useState({
    username: "admin",
    password: "admin123",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDemoSelect = (account) => {
    setForm({
      username: account.username,
      password: account.password,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = await api.post("/api/auth/login", form);

      authStorage.saveSession({
        token: data.access_token,
        user: {
          username: data.user.username,
          role: data.user.role,
          name: data.user.name,
          permissions: data.user.permissions,
        },
      });

      navigate(redirectPath, { replace: true });
    } catch (loginError) {
      setError(loginError.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span>🌿</span>
          </div>

          <h2>LULC-AQI</h2>
          <p>Environmental Monitoring Console</p>
        </div>

        <div className="demo-role-list">
          {demoAccounts.map((account) => (
            <button
              key={account.username}
              type="button"
              className="demo-role-button"
              onClick={() => handleDemoSelect(account)}
            >
              <span>{account.label}</span>
              <small>{account.description}</small>
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="username"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <small>
            Demo accounts: citizen / citizen123 • engineer / engineer123 • admin / admin123
          </small>
        </div>

        <div className="auth-switch">
          <span>Need an account?</span>
          <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
