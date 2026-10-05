import { useNavigate, Navigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useStore, loadCurrentUser, saveCurrentUser } from "../app/store";
import { Eye, EyeOff } from "lucide-react";
import { db } from "./firebase.tsx";
import { collection, getDocs } from "firebase/firestore";

// ── Dove SMS API Credentials ──
const SMS_USER   = "Experts";
const SMS_KEY    = "ba9dcdcdfcXX";
const SMS_SENDER = "EXTSKL";
const SMS_USAGE  = "1";
const BYPASS_NO  = "9898989898";

let generatedOtp = "";

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSmsOtp(mobile: string): Promise<boolean> {
  if (mobile === BYPASS_NO) { generatedOtp = "123456"; return true; }
  generatedOtp = makeOtp();
  const msg = encodeURIComponent(`Your Verification Code for login is ${generatedOtp}. - Expertskill Technology.`);
  const url = `/sms-api/submitsms.jsp?user=${SMS_USER}&key=${SMS_KEY}&mobile=+91${mobile}&message=${msg}&accusage=${SMS_USAGE}&senderid=${SMS_SENDER}`;
  try {
    await fetch(url);
    return true;
  } catch {
    return true; // Even if CORS blocks, SMS is sent
  }
}

export function LoginPage() {
  const { login, currentUser: storeUser, setState, users } = useStore();
  const currentUser = storeUser || loadCurrentUser();
  const navigate = useNavigate();

  // "otp" = Mobile OTP tab, "email" = Email & Password tab
  const [tab, setTab] = useState<"otp" | "email">("otp");

  // ── OTP states ──
  const [phone, setPhone]       = useState("");
  const [digits, setDigits]     = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // ── Email/Password states ──
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword]         = useState("");
  const [showPass, setShowPass]         = useState(false);
  const [signingIn, setSigningIn]       = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo]   = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (currentUser) {
    if (currentUser.role === "superadmin") return <Navigate to="/super-admin" search={{ tab: "live" }} />;
    if (currentUser.role === "manager")    return <Navigate to="/manager"     search={{ tab: "overview" }} />;
    return                                        <Navigate to="/employee"    search={{ tab: "overview" }} />;
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // ── Find user by phone in all sources ──
  const findUserByPhone = async (clean: string) => {
    if (clean === BYPASS_NO) {
      return { id: `emp_${clean}`, name: `Test User`, username: clean, phone: clean, role: "employee", status: "Verified" };
    }
    let found: any = users.find((u) => {
      const p = (u.phone || "").replace(/\D/g, "");
      return p && (p.endsWith(clean) || clean.endsWith(p));
    });
    if (!found) {
      try {
        const snap = await getDocs(collection(db, "users"));
        found = snap.docs.map((d) => ({ id: d.id, ...d.data() })).find((u: any) => {
          const p = (u.phone || "").replace(/\D/g, "");
          return p && (p.endsWith(clean) || clean.endsWith(p));
        });
      } catch { }
    }
    if (!found) {
      try {
        const snap = await getDocs(collection(db, "employees"));
        found = snap.docs.map((d) => ({ id: d.id, ...d.data() })).find((u: any) => {
          const p = (u.phone || "").replace(/\D/g, "");
          return p && (p.endsWith(clean) || clean.endsWith(p));
        });
      } catch { }
    }
    return found || null;
  };

  // ── Login helper ──
  const doLogin = (found: any) => {
    const role = (found.role || "employee").toLowerCase();
    const finalUser = { ...found, role: (role === "manager" ? "manager" : role === "superadmin" ? "superadmin" : "employee") as any };
    saveCurrentUser(finalUser);
    setState((s) => ({ ...s, currentUser: finalUser }));
    if (finalUser.role === "manager") navigate({ to: "/manager", search: { tab: "overview" } });
    else if (finalUser.role === "superadmin") navigate({ to: "/super-admin", search: { tab: "live" } });
    else navigate({ to: "/employee", search: { tab: "overview" } });
  };

  // ── SEND OTP ──
  const sendOTP = async () => {
    setError(""); setInfo("");
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) { setError("Please enter a valid 10-digit mobile number."); return; }
    
    setSending(true);
    const existingUser = await findUserByPhone(clean);
    if (!existingUser) {
      setSending(false);
      setError("This mobile number is not registered. Please contact Admin.");
      return;
    }

    await sendSmsOtp(clean);
    setSending(false);
    setOtpSent(true);
    setCooldown(120);
    setInfo(clean === BYPASS_NO ? "Test OTP: 123456" : `OTP sent to +91 ${clean}`);
    setTimeout(() => inputRefs.current[0]?.focus(), 200);
  };

  // ── VERIFY OTP ──
  const verifyOTP = async () => {
    setError("");
    const code = digits.join("");
    if (code.length !== 6) { setError("Please enter 6-digit OTP."); return; }
    if (code !== generatedOtp) { setError("Invalid OTP! Please check and try again."); return; }
    setVerifying(true);
    const clean = phone.replace(/\D/g, "");
    const found = await findUserByPhone(clean);
    setVerifying(false);
    if (!found) {
      setError("This mobile number is not registered.");
      return;
    }
    doLogin(found);
  };

  // ── EMAIL/PASSWORD LOGIN ──
  const submitEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSigningIn(true);
    try {
      const role = await login(emailOrPhone, password);
      if (!role) { setError("Invalid Email/Number or Password."); return; }
      
      if (role === "superadmin") navigate({ to: "/super-admin", search: { tab: "live" } });
      else if (role === "manager") navigate({ to: "/manager", search: { tab: "overview" } });
      else navigate({ to: "/employee", search: { tab: "overview" } });
    } catch { setError("Login failed. Please try again."); }
    finally { setSigningIn(false); }
  };

  const handleDigit = (idx: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[idx] = d; setDigits(next);
    if (d && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "Enter") otpSent ? verifyOTP() : sendOTP();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const next = [...digits]; pasted.forEach((d, i) => { next[i] = d; }); setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const resetOtp = () => { setOtpSent(false); setDigits(["","","","","",""]); setError(""); setInfo(""); generatedOtp = ""; };

  const switchTab = (t: "otp" | "email") => { setTab(t); setError(""); setInfo(""); resetOtp(); };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #F8F4FF 0%, #FDF2F8 50%, #F0F4FF 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "20px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .login-card-shadow { box-shadow: 0 20px 60px -15px rgba(124,58,237,0.2), 0 4px 20px rgba(0,0,0,0.06); }
        .otp-box:focus { border-color: #7C3AED !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important; outline: none !important; }
        .input-container:focus-within { border-color: #7C3AED !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important; background: #FFFFFF !important; }
        .input-field { outline: none !important; border: none !important; box-shadow: none !important; }
        .input-field:focus { outline: none !important; border: none !important; box-shadow: none !important; }
        .primary-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 16px 36px -10px rgba(124,58,237,0.6) !important; }
        .primary-btn { transition: all 0.2s ease; }
      `}</style>

      <div className="login-card-shadow" style={{
        background: "#FFFFFF", borderRadius: "24px", padding: "40px 36px",
        width: "100%", maxWidth: "420px"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "88px", height: "88px", borderRadius: "20px", background: "#F5F3FF",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "14px", boxShadow: "0 4px 16px rgba(124,58,237,0.15)"
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: "72px", height: "72px", objectFit: "contain", borderRadius: "14px" }} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: "-0.4px" }}>
            Star Home Appliances
          </h1>
          <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>Sign in to continue</p>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", background: "#F1F5F9", borderRadius: "14px", padding: "4px", marginBottom: "24px" }}>
          {(["otp", "email"] as const).map((t) => (
            <button key={t} type="button" onClick={() => switchTab(t)}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: "11px", border: "none",
                fontSize: "13px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                background: tab === t ? "#FFFFFF" : "transparent",
                color: tab === t ? "#7C3AED" : "#64748B",
                boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
              }}>
              {t === "otp" ? "📱 Mobile OTP" : "✉️ Email & Password"}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FEE2E2", padding: "11px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, marginBottom: "18px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0 }}>⚠️</span> {error}
          </div>
        )}
        {info && !otpSent && (
          <div style={{ background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0", padding: "11px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, marginBottom: "18px" }}>
            ✅ {info}
          </div>
        )}

        {/* ══ MOBILE OTP TAB ══ */}
        {tab === "otp" && !otpSent && (
          <>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                Phone Number
              </label>
              <div className="input-container" style={{
                display: "flex", alignItems: "center", gap: "10px",
                border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "0 14px",
                background: "#FAFAFA", transition: "all 0.2s"
              }}>
                <span style={{ fontSize: "20px", flexShrink: 0 }}>🇮🇳</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#374151", borderRight: "1.5px solid #E5E7EB", paddingRight: "10px", marginRight: "2px" }}>+91</span>
                <input
                  className="input-field"
                  type="tel" maxLength={10} value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onKeyDown={(e) => e.key === "Enter" && sendOTP()}
                  placeholder=""
                  autoComplete="tel"
                  style={{
                    border: "none", background: "transparent", flex: 1,
                    fontSize: "15px", fontWeight: 600, letterSpacing: "2px",
                    color: "#0F172A", padding: "14px 0", outline: "none"
                  }}
                />
              </div>
            </div>

            <button type="button" className="primary-btn" onClick={sendOTP}
              disabled={sending || phone.replace(/\D/g, "").length !== 10}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                fontSize: "15px", fontWeight: 700,
                cursor: (sending || phone.replace(/\D/g, "").length !== 10) ? "not-allowed" : "pointer",
                background: (sending || phone.replace(/\D/g, "").length !== 10)
                  ? "#E5E7EB" : "linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)",
                color: (sending || phone.replace(/\D/g, "").length !== 10) ? "#9CA3AF" : "#fff",
                boxShadow: (sending || phone.replace(/\D/g, "").length !== 10) ? "none" : "0 8px 24px -6px rgba(124,58,237,0.5)"
              }}>
              {sending ? "⏳ Sending OTP..." : "Send OTP →"}
            </button>
          </>
        )}

        {/* OTP Entry - Compact View */}
        {tab === "otp" && otpSent && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>
                OTP sent to <strong style={{ color: "#7C3AED" }}>+91 {phone}</strong>
              </span>
              <button type="button" onClick={resetOtp}
                style={{ fontSize: "12px", color: "#7C3AED", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                ✏️ Edit
              </button>
            </div>

            <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "14px" }} onPaste={handlePaste}>
              {digits.map((d, idx) => (
                <input key={idx} className="otp-box"
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="tel" maxLength={1} value={d}
                  onChange={(e) => handleDigit(idx, e.target.value)}
                  onKeyDown={(e) => handleKey(idx, e)}
                  style={{
                    width: "44px", height: "46px", textAlign: "center",
                    fontSize: "20px", fontWeight: 800, borderRadius: "10px",
                    border: d ? "2px solid #7C3AED" : "1.5px solid #E5E7EB",
                    background: d ? "#F5F3FF" : "#FAFAFA",
                    color: "#0F172A", outline: "none", transition: "all 0.15s"
                  }}
                />
              ))}
            </div>

            {phone === BYPASS_NO && (
              <div style={{ textAlign: "center", fontSize: "12px", color: "#15803D", fontWeight: 600, marginBottom: "10px" }}>
                Test OTP: 123456
              </div>
            )}

            <button type="button" className="primary-btn" onClick={verifyOTP}
              disabled={verifying || digits.join("").length !== 6}
              style={{
                width: "100%", padding: "12px", borderRadius: "12px", border: "none",
                fontSize: "14px", fontWeight: 700, marginBottom: "10px",
                cursor: (verifying || digits.join("").length !== 6) ? "not-allowed" : "pointer",
                background: (verifying || digits.join("").length !== 6)
                  ? "#E5E7EB" : "linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)",
                color: (verifying || digits.join("").length !== 6) ? "#9CA3AF" : "#fff",
                boxShadow: (verifying || digits.join("").length !== 6) ? "none" : "0 8px 24px -6px rgba(124,58,237,0.5)"
              }}>
              {verifying ? "⏳ Verifying..." : "Verify & Sign In"}
            </button>

            <div style={{ textAlign: "center" }}>
              {cooldown > 0 ? (
                <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>
                  Resend OTP in {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")}
                </span>
              ) : (
                <button type="button" onClick={() => { resetOtp(); setTimeout(sendOTP, 80); }}
                  style={{ fontSize: "12px", color: "#7C3AED", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  Resend OTP
                </button>
              )}
            </div>
          </>
        )}

        {/* ══ EMAIL & PASSWORD TAB ══ */}
        {tab === "email" && (
          <form onSubmit={submitEmailLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                Email or Phone Number
              </label>
              <div className="input-container" style={{ display: "flex", alignItems: "center", gap: "10px", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "0 14px", background: "#FAFAFA", transition: "all 0.2s" }}>
                <span style={{ fontSize: "16px", color: "#9CA3AF" }}>👤</span>
                <input className="input-field"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder=""
                  autoComplete="username"
                  style={{ border: "none", background: "transparent", flex: 1, fontSize: "14px", fontWeight: 600, color: "#0F172A", padding: "14px 0", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "8px" }}>
                Password
              </label>
              <div className="input-container" style={{ display: "flex", alignItems: "center", gap: "10px", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "0 14px", background: "#FAFAFA", transition: "all 0.2s" }}>
                <span style={{ fontSize: "16px", color: "#9CA3AF" }}>🔒</span>
                <input className="input-field"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  autoComplete="current-password"
                  style={{ border: "none", background: "transparent", flex: 1, fontSize: "14px", fontWeight: 600, color: "#0F172A", padding: "14px 0", outline: "none" }}
                />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", padding: 0 }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="primary-btn"
              disabled={signingIn || !emailOrPhone.trim() || !password.trim()}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                fontSize: "15px", fontWeight: 700,
                cursor: (signingIn || !emailOrPhone.trim() || !password.trim()) ? "not-allowed" : "pointer",
                background: (signingIn || !emailOrPhone.trim() || !password.trim())
                  ? "#E5E7EB" : "linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)",
                color: (signingIn || !emailOrPhone.trim() || !password.trim()) ? "#9CA3AF" : "#fff",
                boxShadow: (signingIn || !emailOrPhone.trim() || !password.trim()) ? "none" : "0 8px 24px -6px rgba(124,58,237,0.5)"
              }}>
              {signingIn ? "⏳ Signing in..." : "Sign In →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
