import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, authStorage } from "../services/api";

const initialState = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "citizen",
};

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await api.post("/api/auth/register", {
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      authStorage.saveSession({
        token: data.access_token,
        user: {
          username: data.user.username,
          role: data.user.role,
          name: data.user.name,
          permissions: data.user.permissions,
        },
      });

      navigate("/", { replace: true });
    } catch (registerError) {
      setError(registerError.message || "Registration failed. Please try again.");
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

          <h2>Create Account</h2>
          <p>Register for the monitoring platform</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Full Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </label>

          <label>
            <span>Username</span>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
            />
          </label>

          <label>
            <span>Role</span>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="citizen">Citizen</option>
              <option value="engineer">Engineer</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create password"
              required
            />
          </label>

          <label>
            <span>Confirm Password</span>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          <span>Already have an account?</span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
