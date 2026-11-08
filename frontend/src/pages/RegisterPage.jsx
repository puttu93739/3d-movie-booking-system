
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Registration failed. Check your details."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="auth-eyebrow">CINEVERSE 3D</span>
        <h1>Create your account</h1>
        <p>Start booking your cinema experience.</p>

        <label htmlFor="register-name">Full name</label>
        <input
          id="register-name"
          value={form.full_name}
          onChange={(e) =>
            update("full_name", e.target.value)
          }
          autoComplete="name"
          required
          minLength={2}
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
          required
        />

        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={form.password}
          onChange={(e) =>
            update("password", e.target.value)
          }
          autoComplete="new-password"
          minLength={12}
          required
        />

        <p className="auth-hint">
          Use a unique password with at least 12 characters.
        </p>

        {error && <p role="alert">{error}</p>}

        <button disabled={busy} type="submit">
          {busy ? "Creating account..." : "Create account"}
        </button>

        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
