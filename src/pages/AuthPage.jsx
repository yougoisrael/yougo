// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AuthPage.jsx — Full Auth System
//  Flows:
//    1. Email + Password (login/register)
//    2. Email OTP (magic link)
//    3. Phone number (stored, no SMS)
//  Register: name + phone + gender + age + password
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef } from "react";
import { C, IcoCheck, IcoBack, IcoFork, IcoStore, IcoTruck, IcoBusiness } from "../components/Icons";
import { supabase } from "../lib/supabase";

// ── Helpers ──────────────────────────────────────
function YougoLogo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <rect width="60" height="60" rx="16" fill="white" />
      <path d="M12 42V20l16 16V20" stroke={C.red} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 30h16M42 24l8 6-8 6" stroke={C.red} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Spinner({ size = 18, color = "white" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: "spin .8s linear infinite" }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
    </svg>
  );
}
function EyeIcon({ open }) {
  return open
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="2"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/></svg>;
}

const GOOG_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.5 13.1 17.8 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/>
    <path fill="#FBBC05" d="M10.6 28.6C10.2 27.5 10 26.3 10 25s.2-2.5.6-3.6L2.7 15.3C1 18.4 0 21.6 0 25s1 6.6 2.7 9.7l7.9-6.1z"/>
    <path fill="#34A853" d="M24 50c6.2 0 11.5-2 15.3-5.5l-7.6-5.9c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-3.6-13.4-8.8l-7.9 6.1C6.7 44.6 14.7 50 24 50z"/>
  </svg>
);

function validatePassword(pw) {
  if (!pw || pw.length < 8) return "לפחות 8 תווים";
  if (!/[A-Z]/.test(pw)) return "חייב להכיל אות גדולה אחת לפחות";
  return null;
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, color: "#6B7280", fontWeight: 700, marginBottom: 6 }}>{children}</div>;
}

function FieldInput({ value, onChange, placeholder, type = "text", error, autoFocus, dir = "rtl", maxLength, onKeyDown, suffix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ position: "relative" }}>
        <input
          value={value} onChange={onChange} placeholder={placeholder} type={type}
          maxLength={maxLength} autoFocus={autoFocus} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", background: "white", border: `1.5px solid ${error ? C.red : focused ? C.red : "#E5E7EB"}`,
            borderRadius: 14, padding: suffix ? "13px 44px 13px 16px" : "13px 16px",
            fontSize: 14, outline: "none", direction: dir, textAlign: dir === "ltr" ? "left" : "right",
            fontFamily: "Arial,sans-serif", color: "#111827", transition: "border-color 0.15s",
          }}
        />
        {suffix && <div style={{ position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)" }}>{suffix}</div>}
      </div>
      {error && <div style={{ color: C.red, fontSize: 11, marginTop: 3, fontWeight: 600 }}>{error}</div>}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────
export default function AuthPage({ onDone, onGuest, onBusiness }) {
  // steps: splash → main → login-pass | login-otp | login-otp-code | register
  const [step, setStep] = useState("splash");
  const [authMode, setAuthMode] = useState("login"); // login | register
  const [loginMethod, setLoginMethod] = useState("password"); // password | otp

  // Email + password login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // OTP
  const [otp, setOtp]           = useState(["","","","","",""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown]   = useState(60);
  const [canResend, setCanResend]   = useState(false);

  // Register
  const [reg, setReg] = useState({
    firstName: "", lastName: "", phone: "", gender: "",
    age: "", password: "", passwordConfirm: "",
  });
  const [regErrors, setRegErrors] = useState({});
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPw, setShowRegPw]   = useState(false);
  const [showRegPw2, setShowRegPw2] = useState(false);

  const [success, setSuccess] = useState(false);

  // ── Splash → main
  useEffect(() => {
    if (step !== "splash") return;
    const t = setTimeout(() => setStep("main"), 2600);
    return () => clearTimeout(t);
  }, [step]);

  // ── OTP countdown
  useEffect(() => {
    if (step !== "otp-code") return;
    setCountdown(60); setCanResend(false);
    const t = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(t); setCanResend(true); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // ── Check existing session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        if (meta.firstName) {
          onDone({
            id: u.id, email: u.email,
            name: meta.firstName + " " + (meta.lastName || ""),
            firstName: meta.firstName, phone: meta.phone || meta.phone_number || "",
            gender: meta.gender, age: meta.age,
          });
        }
      }
    });
  }, []);

  // ── LOGIN with password ──────────────────────────
  async function handleLoginPassword() {
    setLoginError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLoginError("הזן כתובת אימייל תקינה"); return;
    }
    if (!password) { setLoginError("הזן סיסמה"); return; }
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setLoginLoading(false);
    if (error) {
      if (error.message?.includes("Invalid") || error.message?.includes("invalid"))
        setLoginError("אימייל או סיסמה שגויים");
      else
        setLoginError("שגיאה: " + (error.message || "נסה שוב"));
      return;
    }
    const u = data.user;
    const meta = u?.user_metadata || {};
    onDone({
      id: u.id, email: u.email,
      name: (meta.firstName || "") + " " + (meta.lastName || ""),
      firstName: meta.firstName || "", phone: meta.phone || "",
      gender: meta.gender, age: meta.age,
    });
  }

  // ── LOGIN with OTP — send ────────────────────────
  async function handleSendOtp() {
    setLoginError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setLoginError("הזן כתובת אימייל תקינה"); return;
    }
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail });
    setLoginLoading(false);
    if (error) {
      if (error.status === 429 || error.message?.includes("rate"))
        setLoginError("יותר מדי בקשות — המתן דקה");
      else
        setLoginError("שגיאה: " + (error.message || "נסה שוב"));
      return;
    }
    setStep("otp-code");
  }

  // ── OTP change ───────────────────────────────────
  function handleOtpChange(idx, val) {
    if (!/^\d*$/.test(val)) return;
    const next = otp.slice(); next[idx] = val.slice(-1);
    setOtp(next); setOtpError("");
    if (val && idx < 5) { const el = document.getElementById("otp-" + (idx+1)); if(el) el.focus(); }
    if (next.join("").length === 6) verifyOtp(next.join(""));
  }
  function handleOtpKey(idx, e) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const el = document.getElementById("otp-" + (idx-1)); if(el) el.focus();
    }
  }

  // ── Verify OTP ───────────────────────────────────
  async function verifyOtp(code) {
    setOtpLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(), token: code, type: "email",
    });
    setOtpLoading(false);
    if (error) {
      setOtpError("הקוד שגוי — נסה שוב");
      setOtp(["","","","","",""]);
      setTimeout(() => { const el = document.getElementById("otp-0"); if(el) el.focus(); }, 100);
      return;
    }
    const u = data.user;
    const meta = u?.user_metadata || {};
    if (meta.firstName) {
      onDone({
        id: u.id, email: u.email,
        name: meta.firstName + " " + (meta.lastName || ""),
        firstName: meta.firstName, phone: meta.phone || "",
        gender: meta.gender, age: meta.age,
      });
    } else {
      // New user — go to register to fill details
      setStep("register");
    }
  }

  // ── REGISTER ────────────────────────────────────
  function validateReg() {
    const errs = {};
    if (!reg.firstName.trim()) errs.firstName = "שדה חובה";
    if (!reg.lastName.trim())  errs.lastName  = "שדה חובה";
    const phone = reg.phone.replace(/\D/g, "");
    if (!phone || phone.length < 9) errs.phone = "מספר טלפון לא תקין";
    if (!reg.gender) errs.gender = "יש לבחור מגדר";
    const age = parseInt(reg.age);
    if (!reg.age || isNaN(age) || age < 13 || age > 100) errs.age = "גיל לא תקין (13-100)";
    const pwErr = validatePassword(reg.password);
    if (pwErr) errs.password = pwErr;
    if (reg.password !== reg.passwordConfirm) errs.passwordConfirm = "הסיסמאות אינן תואמות";
    return errs;
  }

  async function handleRegister() {
    setRegErrors({});
    const errs = validateReg();
    if (Object.keys(errs).length > 0) { setRegErrors(errs); return; }
    setRegLoading(true);

    // If we got here from OTP (user already exists in auth, just needs metadata)
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Update existing user metadata
      await supabase.auth.updateUser({
        data: {
          firstName: reg.firstName, lastName: reg.lastName,
          phone: reg.phone, gender: reg.gender, age: reg.age,
        }
      });
      setRegLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onDone({
          id: session.user.id, email: session.user.email,
          name: reg.firstName + " " + reg.lastName,
          firstName: reg.firstName, phone: reg.phone,
          gender: reg.gender, age: reg.age,
        });
      }, 1500);
      return;
    }

    // New registration with email + password
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setRegErrors({ general: "הזן כתובת אימייל תקינה" });
      setRegLoading(false); return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: reg.password,
      options: {
        data: {
          firstName: reg.firstName, lastName: reg.lastName,
          phone: reg.phone, gender: reg.gender, age: reg.age,
        },
        emailRedirectTo: window.location.href,
      }
    });
    setRegLoading(false);
    if (error) {
      if (error.message?.includes("already registered") || error.message?.includes("already exists"))
        setRegErrors({ general: "האימייל כבר רשום — נסה להתחבר" });
      else
        setRegErrors({ general: "שגיאה: " + (error.message || "נסה שוב") });
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      onDone({
        id: data.user?.id, email: cleanEmail,
        name: reg.firstName + " " + reg.lastName,
        firstName: reg.firstName, phone: reg.phone,
        gender: reg.gender, age: reg.age,
      });
    }, 1500);
  }

  function setR(k, v) {
    setReg(p => ({ ...p, [k]: v }));
    setRegErrors(p => ({ ...p, [k]: "" }));
  }

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════

  // ── SPLASH ───────────────────────────────────────
  if (step === "splash") return (
    <div style={{ fontFamily:"Arial,sans-serif", background:"linear-gradient(160deg,#C8102E 0%,#7B0D1E 60%,#3D0511 100%)", minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", direction:"rtl" }}>
      <button onClick={onGuest} style={{ position:"absolute", top:20, left:16, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:20, padding:"7px 16px", color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:700, cursor:"pointer", animation:"splashFade 1s .8s both" }}>
        דלג ←
      </button>
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.06)", top:-100, left:-100 }} />
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.08)", bottom:-80, right:-80 }} />
      <div style={{ animation:"splashPop .7s cubic-bezier(.34,1.56,.64,1) both" }}><YougoLogo size={100} /></div>
      <div style={{ color:"white", fontSize:38, fontWeight:900, marginTop:16, letterSpacing:2, animation:"splashPop .7s .15s cubic-bezier(.34,1.56,.64,1) both" }}>YOUGO</div>
      <div style={{ color:"rgba(255,255,255,0.7)", fontSize:15, marginTop:6, animation:"splashFade 1s .4s both" }}>הכל מגיע אליך</div>
      <div style={{ display:"flex", gap:24, marginTop:40, animation:"splashFade 1s .6s both" }}>
        {[{ I:IcoFork, l:"מסעדות" }, { I:IcoStore, l:"מרקט" }, { I:IcoTruck, l:"משלוח מהיר" }].map((x,i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}><x.I s={24} c="white" /></div>
            <span style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>{x.l}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes splashPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}@keyframes splashFade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}`}</style>
    </div>
  );

  // ── SUCCESS ──────────────────────────────────────
  if (success) return (
    <div style={{ fontFamily:"Arial,sans-serif", background:"linear-gradient(160deg,#C8102E,#7B0D1E)", minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", direction:"rtl" }}>
      <div style={{ animation:"pop .6s cubic-bezier(.34,1.56,.64,1)" }}>
        <div style={{ width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 22px" }}>
          <IcoCheck s={54} c="white" />
        </div>
      </div>
      <div style={{ color:"white", fontSize:28, fontWeight:900 }}>ברוך הבא, {reg.firstName || ""}!</div>
      <div style={{ color:"rgba(255,255,255,0.8)", fontSize:14, marginTop:8 }}>החשבון שלך נוצר בהצלחה ✅</div>
      <style>{`@keyframes pop{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:scale(1)}}*{box-sizing:border-box}`}</style>
    </div>
  );

  // ── OTP CODE ENTRY ──────────────────────────────
  if (step === "otp-code") return (
    <div style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)", padding:"40px 24px 60px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", bottom:-30, left:0, right:0, height:60, background:C.bg, borderRadius:"50% 50% 0 0" }} />
        <button onClick={() => { setStep("main"); setOtp(["","","","","",""]); setOtpError(""); }}
          style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginBottom:18 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color:"white", fontSize:26, fontWeight:900 }}>קוד אימות</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:6 }}>שלחנו קוד ל-<b>{email}</b></div>
      </div>
      <div style={{ flex:1, padding:"36px 24px" }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#111827", textAlign:"center", marginBottom:24 }}>הזן את הקוד בן 6 הספרות</div>
        <div style={{ display:"flex", gap:10, justifyContent:"center", direction:"ltr", marginBottom:10 }}>
          {otp.map((digit, idx) => (
            <input key={idx} id={"otp-"+idx} value={digit}
              onChange={e => handleOtpChange(idx, e.target.value)}
              onKeyDown={e => handleOtpKey(idx, e)}
              maxLength={1} autoFocus={idx === 0}
              style={{ width:48, height:60, textAlign:"center", fontSize:24, fontWeight:900, border:`2px solid ${otpError ? C.red : digit ? C.red : "#E5E7EB"}`, borderRadius:14, outline:"none", background:digit?"rgba(200,16,46,0.05)":"white", color:otpError?"#EF4444":"#111827", fontFamily:"Arial,sans-serif", transition:"border-color 0.15s" }} />
          ))}
        </div>
        {otpError && <div style={{ textAlign:"center", color:"#EF4444", fontSize:13, fontWeight:600, marginBottom:12 }}>{otpError}</div>}
        {otpLoading && <div style={{ textAlign:"center", padding:16 }}><Spinner size={28} color={C.red} /></div>}
        <div style={{ textAlign:"center", marginTop:24 }}>
          {canResend
            ? <button onClick={handleSendOtp} style={{ background:"none", border:"none", color:C.red, fontSize:13, fontWeight:700, cursor:"pointer" }}>שלח קוד חדש</button>
            : <div style={{ color:"#9CA3AF", fontSize:12 }}>שלח קוד חדש בעוד <span style={{ color:C.red, fontWeight:700 }}>{countdown}</span> שניות</div>
          }
        </div>
      </div>
      <style>{`*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── REGISTER DETAILS ────────────────────────────
  if (step === "register") return (
    <div style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)", padding:"36px 24px 52px", position:"relative", overflow:"hidden", flexShrink:0 }}>
        <div style={{ position:"absolute", bottom:-30, left:0, right:0, height:60, background:C.bg, borderRadius:"50% 50% 0 0" }} />
        <button onClick={() => setStep("main")} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginBottom:16 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color:"white", fontSize:26, fontWeight:900 }}>יצירת חשבון</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:5 }}>ספר לנו קצת על עצמך</div>
      </div>
      <div style={{ flex:1, padding:"24px 20px 40px", overflowY:"auto" }}>

        {regErrors.general && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:12, padding:"12px 16px", marginBottom:16, fontSize:13, color:"#DC2626", fontWeight:600 }}>
            ⚠️ {regErrors.general}
          </div>
        )}

        {/* Email — only show if not from OTP flow */}
        {!email && (
          <div style={{ marginBottom:14 }}>
            <FieldLabel>כתובת אימייל *</FieldLabel>
            <FieldInput value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" type="email" dir="ltr" error={regErrors.email} />
          </div>
        )}

        {/* Name row */}
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          {[{ l:"שם פרטי", k:"firstName", ph:"כגון: חמדאן" }, { l:"שם משפחה", k:"lastName", ph:"כגון: אחמד" }].map(f => (
            <div key={f.k} style={{ flex:1 }}>
              <FieldLabel>{f.l} *</FieldLabel>
              <FieldInput value={reg[f.k]} onChange={e => setR(f.k, e.target.value)} placeholder={f.ph} error={regErrors[f.k]} />
            </div>
          ))}
        </div>

        {/* Phone */}
        <div style={{ marginBottom:14 }}>
          <FieldLabel>מספר טלפון *</FieldLabel>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ background:"white", border:"1.5px solid #E5E7EB", borderRadius:14, padding:"13px 12px", display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
              <span>🇮🇱</span><span style={{ fontSize:12, fontWeight:700 }}>+972</span>
            </div>
            <div style={{ flex:1 }}>
              <FieldInput value={reg.phone} onChange={e => setR("phone", e.target.value.replace(/[^\d-]/g,""))} placeholder="05X-XXX-XXXX" dir="ltr" maxLength={12} error={regErrors.phone} />
            </div>
          </div>
        </div>

        {/* Gender */}
        <div style={{ marginBottom:14 }}>
          <FieldLabel>מגדר *</FieldLabel>
          <div style={{ display:"flex", gap:8 }}>
            {[{ v:"male", l:"זכר 👨" }, { v:"female", l:"נקבה 👩" }, { v:"other", l:"אחר 🧑" }].map(g => (
              <button key={g.v} onClick={() => setR("gender", g.v)}
                style={{ flex:1, padding:"11px 6px", borderRadius:14, border:`2px solid ${reg.gender===g.v ? C.red : "#E5E7EB"}`, background:reg.gender===g.v?"rgba(200,16,46,0.06)":"white", cursor:"pointer", fontSize:12, fontWeight:reg.gender===g.v?700:500, color:reg.gender===g.v?C.red:"#6B7280", fontFamily:"Arial,sans-serif", transition:"all 0.15s" }}>
                {g.l}
              </button>
            ))}
          </div>
          {regErrors.gender && <div style={{ color:C.red, fontSize:11, marginTop:4, fontWeight:600 }}>{regErrors.gender}</div>}
        </div>

        {/* Age */}
        <div style={{ marginBottom:14 }}>
          <FieldLabel>גיל *</FieldLabel>
          <FieldInput value={reg.age} onChange={e => setR("age", e.target.value.replace(/\D/g,""))} placeholder="גיל (13-100)" maxLength={3} error={regErrors.age} />
        </div>

        {/* Password */}
        <div style={{ marginBottom:6 }}>
          <FieldLabel>סיסמה *</FieldLabel>
          <FieldInput
            value={reg.password} onChange={e => setR("password", e.target.value)}
            placeholder="לפחות 8 תווים + אות גדולה" type={showRegPw ? "text" : "password"}
            error={regErrors.password} dir="ltr"
            suffix={<button onClick={() => setShowRegPw(p=>!p)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}><EyeIcon open={showRegPw} /></button>}
          />
          {/* Password strength */}
          {reg.password.length > 0 && (
            <div style={{ marginTop:6 }}>
              {[
                { ok: reg.password.length >= 8, text: "8 תווים לפחות" },
                { ok: /[A-Z]/.test(reg.password), text: "אות גדולה" },
                { ok: /\d/.test(reg.password), text: "מספר" },
              ].map((r,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                  <span style={{ fontSize:11, color:r.ok?"#10B981":"#9CA3AF" }}>{r.ok?"✓":"○"}</span>
                  <span style={{ fontSize:11, color:r.ok?"#10B981":"#9CA3AF", fontWeight:r.ok?600:400 }}>{r.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Password confirm */}
        <div style={{ marginBottom:24 }}>
          <FieldLabel>אימות סיסמה *</FieldLabel>
          <FieldInput
            value={reg.passwordConfirm} onChange={e => setR("passwordConfirm", e.target.value)}
            placeholder="חזור על הסיסמה" type={showRegPw2 ? "text" : "password"}
            error={regErrors.passwordConfirm} dir="ltr"
            suffix={<button onClick={() => setShowRegPw2(p=>!p)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}><EyeIcon open={showRegPw2} /></button>}
          />
        </div>

        <button onClick={handleRegister} disabled={regLoading}
          style={{ width:"100%", background:regLoading?"rgba(200,16,46,0.5)":C.red, color:"white", border:"none", borderRadius:16, padding:"15px", fontSize:15, fontWeight:900, cursor:regLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 6px 20px rgba(200,16,46,0.28)", fontFamily:"Arial,sans-serif" }}>
          {regLoading ? <><Spinner />יוצר חשבון...</> : <><IcoCheck s={18} c="white" />יצירת חשבון</>}
        </button>
      </div>
      <style>{`*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── MAIN AUTH SCREEN ─────────────────────────────
  return (
    <div style={{ fontFamily:"Arial,sans-serif", background:C.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)", padding:"44px 24px 64px", position:"relative", overflow:"hidden", flexShrink:0 }}>
        <div style={{ position:"absolute", bottom:-30, left:0, right:0, height:60, background:C.bg, borderRadius:"50% 50% 0 0" }} />
        <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", top:-60, right:-60 }} />
        <button onClick={onGuest} style={{ position:"absolute", top:16, left:16, background:"rgba(255,255,255,0.13)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:18, padding:"6px 14px", color:"rgba(255,255,255,0.85)", fontSize:11, fontWeight:700, cursor:"pointer" }}>
          דלג ←
        </button>
        <div style={{ marginBottom:14 }}><YougoLogo size={46} /></div>
        <div style={{ color:"white", fontSize:28, fontWeight:900, lineHeight:1.15 }}>
          {authMode === "login" ? "ברוך הבא! 👋" : "הצטרף ל-Yougo 🚀"}
        </div>
        <div style={{ color:"rgba(255,255,255,0.78)", fontSize:13, marginTop:6 }}>
          {authMode === "login" ? "התחבר לחשבון שלך" : "צור חשבון חדש — מהיר וקל"}
        </div>
      </div>

      <div style={{ flex:1, padding:"22px 20px 30px", overflowY:"auto" }}>

        {/* ── LOGIN / REGISTER toggle ── */}
        <div style={{ display:"flex", background:"#F3F4F6", borderRadius:14, padding:3, marginBottom:20 }}>
          {[{ id:"login", l:"כניסה" }, { id:"register", l:"הרשמה" }].map(t => (
            <button key={t.id} onClick={() => { setAuthMode(t.id); setLoginError(""); if(t.id==="register") setStep("register"); }}
              style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:authMode===t.id?"white":"transparent", color:authMode===t.id?"#111827":"#9CA3AF", fontSize:13, fontWeight:authMode===t.id?800:500, cursor:"pointer", fontFamily:"Arial,sans-serif", boxShadow:authMode===t.id?"0 1px 6px rgba(0,0,0,0.1)":"none", transition:"all 0.2s" }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── SOCIAL BUTTONS ── */}
        <div style={{ display:"flex", gap:10, marginBottom:18 }}>
          <button disabled style={{ flex:1, background:"white", border:"1.5px solid #E5E7EB", borderRadius:14, padding:"13px 8px", fontSize:12, fontWeight:600, cursor:"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:7, color:"#374151", opacity:0.5 }}>
            {GOOG_SVG} Google
            <span style={{ fontSize:9, color:"#9CA3AF" }}>בקרוב</span>
          </button>
          <button disabled style={{ flex:1, background:"#111", color:"white", border:"none", borderRadius:14, padding:"13px 8px", fontSize:12, fontWeight:600, cursor:"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:0.45 }}>
            <svg width="14" height="18" viewBox="0 0 814 1000"><path fill="currentColor" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.1 269-317.1 70.6 0 133.1 46.5 178.8 46.5 43.6 0 113-49.2 192.4-49.2 30.8 0 110.7 2.6 165.7 78.8zm-170.5-276c28.7-35 49.7-83.4 49.7-131.8 0-6.7-.6-13.5-1.9-19.5-46.8 1.9-101.8 31.3-134.7 69.4-25.3 28.7-49.7 74-49.7 123.1 0 7.4 1.3 14.9 1.9 17.2 3.2.6 8.4 1.3 13.6 1.3 43 0 95.6-27.7 121.1-60.7z"/></svg>
            Apple
            <span style={{ fontSize:9, opacity:0.5 }}>בקרוב</span>
          </button>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
          <span style={{ color:"#9CA3AF", fontSize:11, fontWeight:600 }}>או המשך עם</span>
          <div style={{ flex:1, height:1, background:"#E5E7EB" }} />
        </div>

        {/* ── LOGIN METHOD TOGGLE ── */}
        <div style={{ display:"flex", gap:8, marginBottom:18 }}>
          {[{ id:"password", l:"📧 אימייל + סיסמה" }, { id:"otp", l:"✉️ קוד לאימייל" }].map(m => (
            <button key={m.id} onClick={() => { setLoginMethod(m.id); setLoginError(""); }}
              style={{ flex:1, padding:"10px 8px", borderRadius:12, border:`2px solid ${loginMethod===m.id ? C.red : "#E5E7EB"}`, background:loginMethod===m.id?"rgba(200,16,46,0.05)":"white", color:loginMethod===m.id?C.red:"#6B7280", fontSize:11, fontWeight:loginMethod===m.id?800:500, cursor:"pointer", fontFamily:"Arial,sans-serif", transition:"all 0.15s" }}>
              {m.l}
            </button>
          ))}
        </div>

        {/* ── Email field ── */}
        <div style={{ marginBottom:12 }}>
          <FieldLabel>כתובת אימייל</FieldLabel>
          <FieldInput value={email} onChange={e => { setEmail(e.target.value); setLoginError(""); }}
            placeholder="example@email.com" type="email" dir="ltr"
            onKeyDown={e => { if (e.key==="Enter" && loginMethod==="password") handleLoginPassword(); }} />
        </div>

        {/* ── Password field (only for password mode) ── */}
        {loginMethod === "password" && (
          <div style={{ marginBottom:8 }}>
            <FieldLabel>סיסמה</FieldLabel>
            <FieldInput
              value={password} onChange={e => { setPassword(e.target.value); setLoginError(""); }}
              placeholder="הסיסמה שלך" type={showPw ? "text" : "password"} dir="ltr"
              onKeyDown={e => { if (e.key==="Enter") handleLoginPassword(); }}
              suffix={<button onClick={() => setShowPw(p=>!p)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex" }}><EyeIcon open={showPw} /></button>}
            />
          </div>
        )}

        {loginError && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#DC2626", fontWeight:600 }}>
            ⚠️ {loginError}
          </div>
        )}

        {/* ── Submit button ── */}
        {loginMethod === "password" ? (
          <button onClick={handleLoginPassword} disabled={loginLoading}
            style={{ width:"100%", background:loginLoading?"rgba(200,16,46,0.5)":C.red, color:"white", border:"none", borderRadius:16, padding:"15px", fontSize:15, fontWeight:900, cursor:loginLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 6px 20px rgba(200,16,46,0.28)", marginBottom:10, fontFamily:"Arial,sans-serif" }}>
            {loginLoading ? <><Spinner />מתחבר...</> : <><IcoCheck s={18} c="white" />כניסה</>}
          </button>
        ) : (
          <button onClick={handleSendOtp} disabled={loginLoading}
            style={{ width:"100%", background:loginLoading?"rgba(200,16,46,0.5)":C.red, color:"white", border:"none", borderRadius:16, padding:"15px", fontSize:15, fontWeight:900, cursor:loginLoading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, boxShadow:"0 6px 20px rgba(200,16,46,0.28)", marginBottom:10, fontFamily:"Arial,sans-serif" }}>
            {loginLoading ? <><Spinner />שולח קוד...</> : <>✉️ שלח קוד לאימייל</>}
          </button>
        )}

        {/* forgot password hint */}
        {loginMethod === "password" && (
          <div style={{ textAlign:"center", marginBottom:16 }}>
            <button onClick={() => setLoginMethod("otp")} style={{ background:"none", border:"none", color:C.red, fontSize:12, cursor:"pointer", fontWeight:600, fontFamily:"Arial,sans-serif" }}>
              שכחתי סיסמה — שלח לי קוד לאימייל
            </button>
          </div>
        )}

        {/* ── Business portal ── */}
        <div style={{ borderTop:"1px solid #F3F4F6", paddingTop:16, marginTop:4 }}>
          <div style={{ textAlign:"center", fontSize:11, color:"#9CA3AF", marginBottom:8, fontWeight:600 }}>יש לך מסעדה או עסק?</div>
          <button onClick={onBusiness}
            style={{ width:"100%", background:"linear-gradient(135deg,#111827,#1f2937)", color:"white", border:"none", borderRadius:14, padding:"13px", fontSize:13, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"Arial,sans-serif" }}>
            <IcoBusiness s={18} c="#F87171" /> פורטל עסקים — הירשם כבעל עסק
          </button>
        </div>

        <div style={{ textAlign:"center", color:"#9CA3AF", fontSize:10, marginTop:14, lineHeight:1.6 }}>
          בהמשך אתה מסכים ל<span style={{ color:C.red, fontWeight:700 }}>תנאי השימוש</span> ול<span style={{ color:C.red, fontWeight:700 }}>מדיניות הפרטיות</span>
        </div>
      </div>
      <style>{`*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
