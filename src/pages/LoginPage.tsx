import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "../app/store";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export function LoginPage() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const role = await login(username, password);
      if (!role) { setError("Invalid username or password"); return; }
      if (role === "superadmin") navigate({ to: "/super-admin", search: { tab: "live" } });
      else if (role === "manager") navigate({ to: "/manager", search: { tab: "overview" } });
      else navigate({ to: "/employee", search: { tab: "overview" } });
    } catch (err) {
      setError("Login failed. Please verify credentials or check connection.");
    }
  };

  return (
    <div className="sham-app">
      <div className="login-wrap" style={{ background: "radial-gradient(1100px 620px at 10% -8%, rgba(124,58,237,0.22) 0%, transparent 62%), radial-gradient(900px 560px at 92% 6%, rgba(236,72,153,0.18) 0%, transparent 60%), radial-gradient(1000px 700px at 55% 110%, rgba(56,189,248,0.2) 0%, transparent 62%), #F8FAFC" }}>
        <form className="login-card" onSubmit={submit} style={{ background: "rgba(255, 255, 255, 0.70)", backdropFilter: "saturate(180%) blur(22px)", border: "1px solid rgba(255, 255, 255, 0.45)", borderRadius: "22px", boxShadow: "0 28px 60px -18px rgba(124, 58, 237, 0.35)" }}>
          <div className="login-logo" style={{ background: "#FFFFFF", boxShadow: "0 14px 30px -8px rgba(124, 58, 237, 0.2), 0 4px 12px rgba(0,0,0,0.05)", borderRadius: "24px", padding: "10px", width: "150px", height: "150px", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/logo.png" alt="Star Home Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <p className="login-sub" style={{ color: "#64748B", fontSize: "14px", marginTop: "8px", textAlign: "center" }}>Smart Management System — Sign in to continue</p>

          {error && <div className="alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" style={{ color: "#64748B", fontWeight: 600 }}>Username</label>
            <input
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: "#64748B", fontWeight: 600 }}>Password</label>
            <div className="password-wrap">
              <input
                className="form-input"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button type="button" className="password-toggle" onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 12, background: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)", color: "#FFFFFF", borderRadius: "999px", padding: "14px", fontWeight: 700, border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 16px 32px -12px rgba(124, 58, 237, 0.65), inset 0 1px 1px rgba(255,255,255,0.4)" }}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
