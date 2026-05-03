import { useEffect, useState } from "react";
import "./App.css";
import { getMe, login, logout, refresh, type UserPublic } from "./lib/auth";
import UsersPage from "./pages/UsersPage";

export default function App() {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    refresh()
      .then((ok) => (ok ? getMe() : Promise.reject()))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const u = await login(email, password);
      setUser(u);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a10",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "2.5px solid rgba(99,102,241,0.25)",
            borderTopColor: "#6366f1",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
          .login-input {
            width: 100%; background: rgba(255,255,255,0.03);
            border: 1px solid rgba(120,120,180,0.18); border-radius: 10px;
            color: #e0e0f0; padding: 12px 14px; font-size: 14px;
            font-family: 'DM Sans', sans-serif; box-sizing: border-box;
            transition: border-color 0.15s, background 0.15s;
          }
          .login-input:focus { outline: none; border-color: #6366f1; background: rgba(99,102,241,0.06); }
          .login-input::placeholder { color: rgba(120,120,180,0.4); }
        `}</style>

        <div
          style={{
            minHeight: "100vh",
            background: "#0a0a10",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: 700,
              height: 700,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              animation: "fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
              width: "100%",
              maxWidth: 380,
              padding: "0 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                  boxShadow: "0 8px 32px rgba(99,102,241,0.28)",
                }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 14 14">
                  <rect
                    x="1"
                    y="1"
                    width="5"
                    height="5"
                    rx="1.5"
                    fill="white"
                  />
                  <rect
                    x="8"
                    y="1"
                    width="5"
                    height="5"
                    rx="1.5"
                    fill="white"
                    opacity="0.6"
                  />
                  <rect
                    x="1"
                    y="8"
                    width="5"
                    height="5"
                    rx="1.5"
                    fill="white"
                    opacity="0.6"
                  />
                  <rect
                    x="8"
                    y="8"
                    width="5"
                    height="5"
                    rx="1.5"
                    fill="white"
                    opacity="0.3"
                  />
                </svg>
              </div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#e0e0f0",
                  margin: 0,
                  letterSpacing: "-0.03em",
                }}
              >
                Axiom
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "rgba(120,120,180,0.6)",
                }}
              >
                Sign in to continue
              </p>
            </div>

            <div
              style={{
                background: "rgba(17,17,24,0.95)",
                border: "1px solid rgba(120,120,180,0.12)",
                borderRadius: 18,
                padding: "28px 28px 24px",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.02)",
              }}
            >
              <form
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {error && (
                  <div
                    style={{
                      background: "rgba(244,63,94,0.1)",
                      border: "1px solid rgba(244,63,94,0.28)",
                      borderRadius: 9,
                      padding: "11px 14px",
                      fontSize: 13,
                      color: "#fb7185",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <span>⚠</span> {error}
                  </div>
                )}
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 7 }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(120,120,180,0.65)",
                    }}
                  >
                    Email
                  </label>
                  <input
                    className="login-input"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 7 }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "rgba(120,120,180,0.65)",
                    }}
                  >
                    Password
                  </label>
                  <input
                    className="login-input"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    marginTop: 6,
                    padding: "13px 0",
                    background: submitting
                      ? "rgba(99,102,241,0.45)"
                      : "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                    border: "none",
                    color: "#fff",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: submitting
                      ? "none"
                      : "0 4px 20px rgba(99,102,241,0.3)",
                    transition: "opacity 0.15s",
                  }}
                >
                  {submitting && (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                  )}
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (user.is_superuser) {
    return <UsersPage currentUser={user} />;
  }

  // Regular user — minimal profile
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          color: "#e0e0f0",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "#fff",
              margin: "0 auto 20px",
            }}
          >
            {(user.full_name ?? user.email).slice(0, 2).toUpperCase()}
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 24,
              fontWeight: 800,
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            {user.full_name ?? user.email}
          </h1>
          <p
            style={{
              margin: "0 0 28px",
              color: "rgba(120,120,180,0.65)",
              fontSize: 14,
            }}
          >
            {user.email}
          </p>
          <button
            onClick={async () => {
              await logout();
              setUser(null);
            }}
            style={{
              padding: "10px 24px",
              background: "rgba(120,120,180,0.08)",
              border: "1px solid rgba(120,120,180,0.18)",
              color: "rgba(160,160,210,0.8)",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
