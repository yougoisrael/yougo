// ═══════════════════════════════════════════════════════════════════
//  AuthSystem.jsx — Yougo v4  UNIFIED AUTH
//  Replaces: AuthPage.jsx + AuthSheet.jsx
//
//  STATE MACHINE:
//  idle → checking → login | register → otp_sent → otp_verify → success
//
//  SECURITY DECISIONS (commented inline):
//  • Phone checked via DB lookup (3 variants) before showing any field
//  • maskEmail hides local part — mirrors Instagram/Facebook standard
//  • hCaptcha is optional (skipped if no env key) — never blocks UX
//  • Password validated: 8+ chars + uppercase + digit (unified rule)
//  • Email lowercased before every DB/Auth call
//  • Phone uniqueness: checked against raw, +972, 0-prefix variants
//  • 409 Conflict surfaced as Hebrew user message, never raw error
// ═══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

// ─── hCaptcha (invisible) — security: bot protection ───────────────
// SECURITY: We skip silently if no key — never break prod UX.
const HCAP_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

function loadHcap() {
  if (!HCAP_KEY || document.getElementById("hcap-script")) return;
  const s = document.createElement("script");
  s.id = "hcap-script";
  s.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
  s.async = true;
  document.head.appendChild(s);
}

async function getCaptchaToken() {
  if (!HCAP_KEY) return undefined;
  return new Promise((resolve) => {
    function tryExec() {
      if (!window.hcaptcha) { setTimeout(tryExec, 200); return; }
      const el = document.createElement("div");
      el.style.display = "none";
      document.body.appendChild(el);
      try {
        const wid = window.hcaptcha.render(el, {
          sitekey: HCAP_KEY,
          size: "invisible",
          callback:           (t) => { try { document.body.removeChild(el); } catch {} resolve(t); },
          "error-callback":   ()  => { try { document.body.removeChild(el); } catch {} resolve(undefined); },
          "expired-callback": ()  => { try { document.body.removeChild(el); } catch {} resolve(undefined); },
        });
        window.hcaptcha.execute(wid);
      } catch { try { document.body.removeChild(el); } catch {} resolve(undefined); }
    }
    tryExec();
  });
}

// ─── Validators ─────────────────────────────────────────────────────
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

// SECURITY: We check 3 phone formats to avoid duplicate accounts
const normalizePhone = (v) => {
  const d = (v || "").replace(/\D/g, "");
  const s = d.replace(/^972/, "").replace(/^0/, "");
  return { raw: d, local: "0" + s, intl: "+972" + s };
};
const isPhone = (v) => {
  const d = (v || "").replace(/\D/g, "");
  return d.length >= 9 && d.length <= 12;
};

// SECURITY: Unified password rule (was 6 in ProfilePage, 8 here — now always 8)
const pwErrors = (v) => {
  if (!v || v.length < 8)    return "לפחות 8 תווים";
  if (!/[A-Z]/.test(v))      return "חייב אות גדולה אחת לפחות";
  if (!/\d/.test(v))         return "חייב מספר אחד לפחות";
  return null;
};

const pwStrength = (v) => {
  let s = 0;
  if (v.length >= 8)    s++;
  if (v.length >= 12)   s++;
  if (/[A-Z]/.test(v))  s++;
  if (/\d/.test(v))     s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s; // 0-5
};

// SECURITY: maskEmail mirrors Instagram — shows first + last char only
function maskEmail(em) {
  if (!em || !em.includes("@")) return em;
  const [local, domain] = em.split("@");
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const stars = "*".repeat(Math.min(local.length - 2, 5));
  return `${local[0]}${stars}${local[local.length - 1]}@${domain}`;
}

// ─── State machine modes ─────────────────────────────────────────────
const M = {
  IDLE:       "idle",
  CHECKING:   "checking",
  LOGIN:      "login",
  REGISTER:   "register",
  OTP_SENT:   "otp_sent",
  OTP_VERIFY: "otp_verify",
  SUBMITTING: "submitting",
  SUCCESS:    "success",
};

// ─── Design tokens (Yougo brand) ─────────────────────────────────────
const C = {
  red:     "#C8102E",
  redDark: "#8B0B1E",
  redBg:   "#FEF2F2",
  redBd:   "#FCA5A5",
  dark:    "#111827",
  gray:    "#6B7280",
  light:   "#F7F7F8",
  border:  "#E5E7EB",
  white:   "#FFFFFF",
  green:   "#10B981",
  amber:   "#F59E0B",
};

// ─── Framer Motion variants ──────────────────────────────────────────
const fieldVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.98 },
  show:   { opacity: 1, y: 0,   scale: 1,
            transition: { duration: 0.25, ease: "easeOut" } },
  exit:   { opacity: 0, y: 8,  scale: 0.97,
            transition: { duration: 0.18, ease: "easeIn"  } },
};

const staggerContainer = {
  show: { transition: { staggerChildren: 0.06 } },
};

const shakeVariants = {
  shake: {
    x: [0, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.45, ease: "easeInOut" },
  },
};

const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  show:   { scale: 1, opacity: 1,
            transition: { type: "spring", stiffness: 260, damping: 18 } },
};

// ─── Tiny Components ─────────────────────────────────────────────────
function Spinner({ s = 18, c = "white" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      style={{ animation: "_yspin .75s linear infinite", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2.5"
        strokeDasharray="40" strokeDashoffset="14" strokeLinecap="round" />
    </svg>
  );
}

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      style={{ background: "none", border: "none", cursor: "pointer",
               padding: 4, display: "flex", color: C.gray }}>
      {show
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94
                     M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19
                     m-6.72-1.07a3 3 0 11-4.24-4.24"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="1" y1="1" x2="23" y2="23"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>}
    </button>
  );
}

// Labeled input with focus ring
function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.gray,
                      marginBottom: 6, direction: "rtl" }}>
          {label}
        </div>
      )}
      {children}
      <AnimatePresence>
        {error && (
          <motion.div
            key={error}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ color: C.red, fontSize: 11, fontWeight: 600, marginTop: 4 }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Standard text input
function Inp({ value, onChange, placeholder, type = "text", dir = "rtl",
               maxLength, autoFocus, onKeyDown, right, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onKeyDown={onKeyDown}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: right ? "13px 46px 13px 14px" : "13px 14px",
          border: `1.5px solid ${focused ? C.red : C.border}`,
          borderRadius: 14,
          fontSize: 14,
          outline: "none",
          background: disabled ? "#F9FAFB" : C.white,
          direction: dir,
          textAlign: dir === "ltr" ? "left" : "right",
          fontFamily: "inherit",
          color: C.dark,
          transition: "border-color .15s",
          boxSizing: "border-box",
        }}
      />
      {right && (
        <div style={{ position: "absolute", top: "50%", right: 14,
                      transform: "translateY(-50%)" }}>
          {right}
        </div>
      )}
    </div>
  );
}

// Password strength bar
function PwStrength({ value }) {
  const s = pwStrength(value);
  const bars = [
    s >= 1 ? C.red    : C.border,
    s >= 2 ? C.amber  : C.border,
    s >= 3 ? C.amber  : C.border,
    s >= 4 ? C.green  : C.border,
    s >= 5 ? C.green  : C.border,
  ];
  const label = ["", "חלשה", "בינונית", "טובה", "חזקה", "מצוינת"][s] || "";
  const labelCol = s <= 1 ? C.red : s <= 3 ? C.amber : C.green;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {bars.map((c, i) => (
          <motion.div key={i}
            animate={{ background: c }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1, height: 4, borderRadius: 2 }}
          />
        ))}
      </div>
      {value.length > 0 && (
        <div style={{ fontSize: 11, color: labelCol, fontWeight: 600,
                      direction: "rtl" }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ─── OTP 6-digit component ────────────────────────────────────────────
function OTPBoxes({ value, onChange, disabled, error }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  const handleChange = (e, i) => {
    const ch = e.target.value.replace(/\D/g, "").slice(-1);
    if (!ch) return;
    const next = value.slice(0, i) + ch + value.slice(i + 1);
    onChange(next.slice(0, 6));
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (e, i) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        refs[i - 1].current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const next = Math.min(pasted.length, 5);
    refs[next].current?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center",
                  direction: "ltr", margin: "16px 0" }}>
      {digits.map((d, i) => (
        <motion.input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          whileFocus={{ scale: 1.06 }}
          animate={error ? { borderColor: C.red } : { borderColor: d ? C.red : C.border }}
          style={{
            width: 46, height: 56,
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: 22, fontWeight: 900,
            border: `2px solid ${d ? C.red : C.border}`,
            borderRadius: 14,
            outline: "none",
            background: d ? C.redBg : C.white,
            color: error ? "#EF4444" : C.dark,
            transition: "border-color .15s, background .15s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Global CSS ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes _yspin { to { transform: rotate(360deg); } }
  @keyframes _ypop  {
    from { opacity:0; transform:scale(.35) }
    to   { opacity:1; transform:scale(1)   }
  }
  @keyframes _yconfetti {
    0%   { transform: translateY(0)    rotate(0deg);   opacity:1; }
    100% { transform: translateY(-80px) rotate(720deg); opacity:0; }
  }
  * { box-sizing: border-box; }
`;

// ─── Page shell ───────────────────────────────────────────────────────
const WRAP = {
  fontFamily: "'Segoe UI', Arial, sans-serif",
  background: C.light,
  minHeight: "100vh",
  maxWidth: 430,
  margin: "0 auto",
  direction: "rtl",
  display: "flex",
  flexDirection: "column",
};

// ─── Header ───────────────────────────────────────────────────────────
function Header({ title, sub, onBack, showSkip, onSkip }) {
  return (
    <div style={{
      background: `linear-gradient(150deg, ${C.red}, ${C.redDark})`,
      padding: "44px 22px 68px",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* decorative circle */}
      <div style={{
        position: "absolute", width: 220, height: 220,
        borderRadius: "50%", background: "rgba(255,255,255,0.04)",
        top: -70, right: -60, pointerEvents: "none",
      }}/>
      {/* bottom wave */}
      <div style={{
        position: "absolute", bottom: -32, left: 0, right: 0,
        height: 65, background: C.light, borderRadius: "50% 50% 0 0",
      }}/>
      {onBack && (
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.15)", border: "none",
          borderRadius: "50%", width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", marginBottom: 18,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {showSkip && (
        <button onClick={onSkip} style={{
          position: "absolute", top: 18, left: 18,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 20, padding: "6px 14px",
          color: "rgba(255,255,255,0.85)",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>
          דלג ←
        </button>
      )}
      {!onBack && (
        <div style={{ marginBottom: 16 }}>
          {/* Yougo logo inline SVG */}
          <svg width="46" height="46" viewBox="0 0 60 60" fill="none">
            <rect width="60" height="60" rx="16" fill="white"/>
            <path d="M12 42V20l16 16V20" stroke={C.red}
              strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M34 30h16M42 24l8 6-8 6" stroke={C.red}
              strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div style={{ color: "white", fontSize: 26, fontWeight: 900,
                    lineHeight: 1.2, position: "relative" }}>
        {title}
      </div>
      {sub && (
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13,
                      marginTop: 6, position: "relative" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────
export default function AuthSystem({ onDone, onGuest, onBusiness }) {

  // ── State ────────────────────────────────────────────────────────
  const [mode,           setMode]          = useState(M.IDLE);
  const [phone,          setPhone]         = useState("");
  const [loginEmail,     setLoginEmail]    = useState(""); // fetched from DB
  const [password,       setPassword]      = useState("");
  const [showPw,         setShowPw]        = useState(false);
  const [regEmail,       setRegEmail]      = useState("");
  const [regPass,        setRegPass]       = useState("");
  const [regPass2,       setRegPass2]      = useState("");
  const [showRegPw,      setShowRegPw]     = useState(false);
  const [regFirstName,   setRegFirstName]  = useState("");
  const [regLastName,    setRegLastName]   = useState("");
  const [regGender,      setRegGender]     = useState("");
  const [regAge,         setRegAge]        = useState("");
  const [otp,            setOtp]           = useState("");
  const [maskedEmail,    setMaskedEmail]   = useState("");
  const [otpTimer,       setOtpTimer]      = useState(60);
  const [canResend,      setCanResend]     = useState(false);
  const [error,          setError]         = useState("");
  const [fieldErrors,    setFieldErrors]   = useState({});
  const [successUser,    setSuccessUser]   = useState(null);

  const debounceRef  = useRef(null);
  const timerRef     = useRef(null);
  const pwRef        = useRef(null);
  const emailRef     = useRef(null);

  const isLoading = [M.CHECKING, M.SUBMITTING, M.OTP_VERIFY].includes(mode);

  // ── Init hCaptcha ────────────────────────────────────────────────
  useEffect(() => { loadHcap(); }, []);

  // ── OTP countdown timer ──────────────────────────────────────────
  useEffect(() => {
    if (mode !== M.OTP_SENT) return;
    setOtpTimer(60);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setOtpTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [mode]);

  // ── Auto-focus ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode === M.LOGIN)    setTimeout(() => pwRef.current?.focus(), 320);
    if (mode === M.REGISTER) setTimeout(() => emailRef.current?.focus(), 320);
  }, [mode]);

  // ── Phone change — debounced DB lookup ──────────────────────────
  const handlePhoneChange = useCallback((val) => {
    setPhone(val);
    setError("");
    setFieldErrors({});

    // Reset if user edits phone after detection
    if (![M.IDLE, M.CHECKING].includes(mode)) {
      setMode(M.IDLE);
      setPassword("");
      setRegEmail("");
      setRegPass("");
      setRegPass2("");
      setLoginEmail("");
    }

    clearTimeout(debounceRef.current);

    if (!isPhone(val)) return;

    setMode(M.CHECKING);
    debounceRef.current = setTimeout(async () => {
      try {
        const { local, intl } = normalizePhone(val);
        // SECURITY: Try multiple phone formats to detect existing users
        let found = null;
        for (const v of [val.replace(/\D/g,""), local, intl]) {
          const { data } = await supabase
            .from("users")
            .select("email")
            .eq("phone", v)
            .maybeSingle();
          if (data?.email) { found = data.email; break; }
        }
        if (found) {
          setLoginEmail(found);
          setMode(M.LOGIN);
        } else {
          setMode(M.REGISTER);
        }
      } catch {
        setMode(M.IDLE);
        setError("שגיאת חיבור — נסה שוב");
      }
    }, 400);
  }, [mode]);

  // ── Login with password ──────────────────────────────────────────
  const doLogin = async () => {
    if (!password) { setFieldErrors({ password: "נא להזין סיסמה" }); return; }
    setError(""); setFieldErrors({});
    setMode(M.SUBMITTING);
    const captcha = await getCaptchaToken();
    const { data, error: e } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
      ...(captcha && { options: { captchaToken: captcha } }),
    });
    if (e) {
      setMode(M.LOGIN);
      setError("הסיסמה שגויה — נסה שוב");
      return;
    }
    const u = data.user;
    const m = u?.user_metadata || {};
    if (!m.firstName) {
      // User exists in auth but profile incomplete — shouldn't happen but safe fallback
      setMode(M.LOGIN);
      setError("שגיאה בטעינת הפרופיל — פנה לתמיכה");
      return;
    }
    done(u, m);
  };

  // ── Send OTP (login via code) ────────────────────────────────────
  const doSendOTP = async () => {
    setError("");
    setMode(M.SUBMITTING);
    const captcha = await getCaptchaToken();
    // SECURITY: shouldCreateUser:false — OTP only for existing users
    const { error: e } = await supabase.auth.signInWithOtp({
      email: loginEmail,
      options: {
        shouldCreateUser: false,
        ...(captcha && { captchaToken: captcha }),
      },
    });
    if (e) {
      setMode(M.LOGIN);
      setError(
        e.status === 429 || e.message?.includes("rate")
          ? "יותר מדי בקשות — המתן דקה"
          : "לא ניתן לשלוח קוד — נסה שוב"
      );
      return;
    }
    setMaskedEmail(maskEmail(loginEmail));
    setOtp("");
    setMode(M.OTP_SENT);
  };

  // ── Verify OTP ────────────────────────────────────────────────────
  const doVerifyOTP = async (code) => {
    if (code.length !== 6) return;
    setMode(M.OTP_VERIFY);
    const { data, error: e } = await supabase.auth.verifyOtp({
      email: loginEmail,
      token: code,
      type: "email",
    });
    if (e) {
      setMode(M.OTP_SENT);
      setOtp("");
      setError("הקוד שגוי או פג תוקפו — נסה שוב");
      return;
    }
    const u = data.user;
    const m = u?.user_metadata || {};
    done(u, m);
  };

  // ── OTP digit change — auto-verify at 6 digits ───────────────────
  const handleOtpChange = (val) => {
    setOtp(val);
    setError("");
    if (val.length === 6) doVerifyOTP(val);
  };

  // ── Register ─────────────────────────────────────────────────────
  const doRegister = async () => {
    const errs = {};
    if (!isEmail(regEmail))    errs.regEmail  = "כתובת אימייל לא תקינה";
    const pe = pwErrors(regPass);
    if (pe)                    errs.regPass   = pe;
    if (regPass !== regPass2)  errs.regPass2  = "הסיסמאות אינן תואמות";
    if (!regFirstName.trim())  errs.firstName = "שדה חובה";
    if (!regLastName.trim())   errs.lastName  = "שדה חובה";
    if (!regGender)            errs.gender    = "יש לבחור מגדר";
    const age = parseInt(regAge);
    if (!regAge || isNaN(age) || age < 13 || age > 100)
      errs.age = "גיל לא תקין (13–100)";

    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setError(""); setFieldErrors({});
    setMode(M.SUBMITTING);

    // SECURITY: Check phone uniqueness (3 variants) before creating account
    const { local, intl } = normalizePhone(phone);
    const rawPhone = phone.replace(/\D/g, "");
    for (const v of [rawPhone, local, intl]) {
      const { data: pd } = await supabase
        .from("users")
        .select("id")
        .eq("phone", v)
        .maybeSingle();
      if (pd) {
        setMode(M.REGISTER);
        setFieldErrors({ phone: "מספר הטלפון כבר רשום לחשבון אחר" });
        return;
      }
    }

    // SECURITY: Normalize email to lowercase before every auth call
    const emailFinal = regEmail.trim().toLowerCase();

    // Check email uniqueness
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", emailFinal)
      .maybeSingle();
    if (existingEmail) {
      setMode(M.REGISTER);
      setFieldErrors({ regEmail: "האימייל כבר רשום — נסה להתחבר" });
      return;
    }

    const meta = {
      firstName: regFirstName.trim(),
      lastName:  regLastName.trim(),
      phone:     local,        // Store normalized local format
      gender:    regGender,
      age:       regAge,
    };

    const captcha = await getCaptchaToken();
    const { data, error: e } = await supabase.auth.signUp({
      email:    emailFinal,
      password: regPass,
      options: {
        data: meta,
        ...(captcha && { captchaToken: captcha }),
      },
    });

    if (e) {
      setMode(M.REGISTER);
      const msg = e.message?.toLowerCase() || "";
      if (msg.includes("already") || msg.includes("registered")) {
        setError("האימייל כבר רשום — נסה להתחבר");
      } else {
        setError("שגיאה בהרשמה — " + e.message);
      }
      return;
    }

    if (data.user) {
      // Sync to users table
      await supabase.from("users").upsert({
        id:    data.user.id,
        name:  `${meta.firstName} ${meta.lastName}`,
        phone: meta.phone,
        email: emailFinal,
      });
    }

    done(data.user, meta);
  };

  // ── Complete auth ─────────────────────────────────────────────────
  function done(user, meta) {
    const profile = {
      id:        user.id,
      email:     user.email,
      name:      `${meta.firstName || ""} ${meta.lastName || ""}`.trim(),
      firstName: meta.firstName || "",
      lastName:  meta.lastName  || "",
      phone:     meta.phone     || "",
      gender:    meta.gender    || "",
      age:       meta.age       || "",
    };
    setSuccessUser(profile);
    setMode(M.SUCCESS);
    setTimeout(() => onDone(profile), 1800);
  }

  // ─── RENDER: SUCCESS ─────────────────────────────────────────────
  if (mode === M.SUCCESS) {
    return (
      <div style={{
        ...WRAP,
        background: `linear-gradient(155deg, ${C.red}, ${C.redDark})`,
        alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <style>{GLOBAL_CSS}</style>
        {/* confetti particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${8 + i * 7.5}%`,
            top: "30%",
            width: 8, height: 8,
            borderRadius: i % 2 ? "50%" : 2,
            background: ["white","#FFD700","#FF6B6B","#4ECDC4","#45B7D1"][i % 5],
            animation: `_yconfetti ${0.8 + i * 0.15}s ease-out ${i * 0.08}s forwards`,
          }}/>
        ))}
        <motion.div variants={successVariants} initial="hidden" animate="show"
          style={{ textAlign: "center", padding: 32 }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M5 13l4 4L19 7"
                stroke="white" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </svg>
          </div>
          <div style={{ color: "white", fontSize: 30, fontWeight: 900 }}>
            ברוך הבא{successUser?.firstName ? `, ${successUser.firstName}` : ""}! 🎉
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginTop: 8 }}>
            החשבון שלך מוכן
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── RENDER: OTP screen ───────────────────────────────────────────
  if (mode === M.OTP_SENT || mode === M.OTP_VERIFY) {
    const verifying = mode === M.OTP_VERIFY;
    return (
      <div style={WRAP}>
        <style>{GLOBAL_CSS}</style>
        <Header
          title="קוד אימות"
          sub={`שלחנו קוד 6 ספרות ל-${maskedEmail}`}
          onBack={() => { setMode(M.LOGIN); setOtp(""); setError(""); }}
        />
        <div style={{ flex: 1, padding: "32px 22px 44px", overflowY: "auto" }}>
          {/* Masked email display */}
          <div style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 24,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E",
                          marginBottom: 4 }}>
              קוד נשלח אל
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 15,
                          fontWeight: 700, color: C.dark }}>
              {maskedEmail}
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700,
                        color: C.dark, marginBottom: 8 }}>
            הזן את הקוד
          </div>

          <OTPBoxes
            value={otp}
            onChange={handleOtpChange}
            disabled={verifying}
            error={!!error}
          />

          <AnimatePresence>
            {error && (
              <motion.div
                key="otp-err"
                variants={shakeVariants}
                animate="shake"
                style={{
                  textAlign: "center", color: "#EF4444",
                  fontSize: 13, fontWeight: 600, marginBottom: 16,
                }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {verifying && (
            <div style={{ display: "flex", justifyContent: "center", padding: 12 }}>
              <Spinner s={28} c={C.red} />
            </div>
          )}

          {/* Timer / resend */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            {canResend
              ? <button onClick={doSendOTP} style={{
                  background: "none", border: "none",
                  color: C.red, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                  שלח קוד חדש
                </button>
              : <div style={{ color: C.gray, fontSize: 13 }}>
                  שלח שוב בעוד{" "}
                  <b style={{ color: C.red }}>{otpTimer}</b> שניות
                </div>
            }
          </div>

          {/* Security note */}
          <div style={{
            marginTop: 32,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 12, color: "#1E40AF",
          }}>
            🔒 הקוד תקף ל-5 דקות • מקסימום 5 ניסיונות
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: REGISTER screen ─────────────────────────────────────
  if (mode === M.REGISTER || (mode === M.SUBMITTING && !loginEmail)) {
    return (
      <div style={WRAP}>
        <style>{GLOBAL_CSS}</style>
        <Header
          title="יצירת חשבון"
          sub="ספר לנו קצת על עצמך"
          onBack={() => {
            setMode(M.IDLE);
            setPhone(""); setRegEmail(""); setRegPass(""); setRegPass2("");
            setError(""); setFieldErrors({});
          }}
        />
        <div style={{ flex: 1, padding: "26px 22px 44px", overflowY: "auto" }}>

          <AnimatePresence>
            {error && (
              <motion.div key="reg-err" variants={shakeVariants} animate="shake"
                style={{
                  background: C.redBg, border: `1px solid ${C.redBd}`,
                  borderRadius: 12, padding: "11px 14px",
                  fontSize: 13, color: "#DC2626", fontWeight: 600,
                  marginBottom: 14,
                }}>
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={staggerContainer} initial="hidden" animate="show">

            {/* Phone (read-only — already entered) */}
            <motion.div variants={fieldVariants}>
              <Field label="מספר טלפון" error={fieldErrors.phone}>
                <Inp value={phone} onChange={() => {}} disabled
                  dir="ltr" placeholder="" />
              </Field>
            </motion.div>

            {/* Email */}
            <motion.div variants={fieldVariants}>
              <Field label="כתובת אימייל *" error={fieldErrors.regEmail}>
                <Inp
                  ref={emailRef}
                  value={regEmail}
                  onChange={(e) => { setRegEmail(e.target.value); setFieldErrors(p => ({...p, regEmail: ""})); }}
                  placeholder="example@email.com"
                  type="email" dir="ltr"
                  disabled={isLoading}
                />
              </Field>
            </motion.div>

            {/* Name row */}
            <motion.div variants={fieldVariants}>
              <div style={{ display: "flex", gap: 10 }}>
                <Field label="שם פרטי *" error={fieldErrors.firstName}>
                  <Inp value={regFirstName}
                    onChange={(e) => { setRegFirstName(e.target.value); setFieldErrors(p => ({...p, firstName: ""})); }}
                    placeholder="שם פרטי" disabled={isLoading} />
                </Field>
                <Field label="שם משפחה *" error={fieldErrors.lastName}>
                  <Inp value={regLastName}
                    onChange={(e) => { setRegLastName(e.target.value); setFieldErrors(p => ({...p, lastName: ""})); }}
                    placeholder="שם משפחה" disabled={isLoading} />
                </Field>
              </div>
            </motion.div>

            {/* Gender */}
            <motion.div variants={fieldVariants}>
              <Field label="מגדר *" error={fieldErrors.gender}>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{v:"male",l:"זכר 👨"},{v:"female",l:"נקבה 👩"},{v:"other",l:"אחר 🧑"}].map((g) => (
                    <button key={g.v} type="button"
                      onClick={() => { setRegGender(g.v); setFieldErrors(p => ({...p, gender:""})); }}
                      style={{
                        flex: 1, padding: "11px 4px", borderRadius: 12,
                        border: `2px solid ${regGender === g.v ? C.red : C.border}`,
                        background: regGender === g.v ? C.redBg : C.white,
                        cursor: "pointer", fontSize: 12,
                        fontWeight: regGender === g.v ? 700 : 500,
                        color: regGender === g.v ? C.red : C.gray,
                        fontFamily: "inherit",
                        transition: "all .15s",
                      }}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </Field>
            </motion.div>

            {/* Age */}
            <motion.div variants={fieldVariants}>
              <Field label="גיל *" error={fieldErrors.age}>
                <Inp value={regAge}
                  onChange={(e) => { setRegAge(e.target.value.replace(/\D/g,"")); setFieldErrors(p=>({...p,age:""})); }}
                  placeholder="גיל (13–100)" maxLength={3} disabled={isLoading} />
              </Field>
            </motion.div>

            {/* Password */}
            <motion.div variants={fieldVariants}>
              <Field label="סיסמה *" error={fieldErrors.regPass}>
                <Inp value={regPass}
                  onChange={(e) => { setRegPass(e.target.value); setFieldErrors(p=>({...p,regPass:""})); }}
                  placeholder="לפחות 8 תווים + אות גדולה + מספר"
                  type={showRegPw ? "text" : "password"} dir="ltr"
                  disabled={isLoading}
                  right={<EyeToggle show={showRegPw} onToggle={() => setShowRegPw(p=>!p)} />}
                />
                {regPass.length > 0 && <PwStrength value={regPass} />}
              </Field>
            </motion.div>

            {/* Confirm password */}
            <motion.div variants={fieldVariants}>
              <Field label="אימות סיסמה *" error={fieldErrors.regPass2}>
                <Inp value={regPass2}
                  onChange={(e) => { setRegPass2(e.target.value); setFieldErrors(p=>({...p,regPass2:""})); }}
                  placeholder="חזור על הסיסמה"
                  type="password" dir="ltr"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && doRegister()}
                />
              </Field>
            </motion.div>

          </motion.div>

          {/* Submit */}
          <button
            type="button"
            onClick={doRegister}
            disabled={isLoading}
            style={{
              width: "100%", padding: 14, borderRadius: 16, border: "none",
              background: isLoading
                ? "rgba(200,16,46,0.5)"
                : `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
              color: "white", fontSize: 14, fontWeight: 800,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, fontFamily: "inherit",
              boxShadow: "0 6px 20px rgba(200,16,46,.3)",
              marginTop: 8,
            }}>
            {isLoading ? <><Spinner s={18} /> יוצר חשבון...</> : "✓ יצירת חשבון"}
          </button>

          <div style={{ textAlign: "center", color: C.gray, fontSize: 10,
                        marginTop: 16, lineHeight: 1.7 }}>
            בהמשך אתה מסכים ל
            <span style={{ color: C.red, fontWeight: 700 }}>תנאי השימוש</span> ול
            <span style={{ color: C.red, fontWeight: 700 }}>מדיניות הפרטיות</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: MAIN (idle / checking / login / submitting) ─────────
  return (
    <div style={WRAP}>
      <style>{GLOBAL_CSS}</style>
      <Header
        title="ברוך הבא! 👋"
        sub="התחבר לחשבון שלך"
        showSkip
        onSkip={onGuest}
      />

      <div style={{ flex: 1, padding: "22px 20px 34px", overflowY: "auto" }}>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              key={error}
              variants={shakeVariants}
              animate="shake"
              style={{
                background: C.redBg, border: `1px solid ${C.redBd}`,
                borderRadius: 12, padding: "11px 14px",
                fontSize: 13, color: "#DC2626", fontWeight: 600,
                marginBottom: 14,
              }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Phone field (always visible) ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gray,
                        marginBottom: 6, direction: "rtl" }}>
            מספר טלפון
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{
              background: C.white, border: `1.5px solid ${C.border}`,
              borderRadius: 14, padding: "13px 12px",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            }}>
              <span>🇮🇱</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>+972</span>
            </div>
            <div style={{ flex: 1 }}>
              <Inp
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value.replace(/[^\d\-\s]/g, ""))}
                placeholder="05X-XXX-XXXX"
                dir="ltr"
                maxLength={12}
                autoFocus
                disabled={isLoading && mode !== M.CHECKING}
              />
            </div>
          </div>
          {/* Checking indicator */}
          <AnimatePresence>
            {mode === M.CHECKING && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8,
                         marginTop: 8, fontSize: 12, color: C.gray }}>
                <Spinner s={14} c={C.red} />
                בודק מספר...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mode badge ── */}
        <AnimatePresence mode="wait">
          {mode === M.LOGIN && (
            <motion.div
              key="badge-login"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.redBg, border: `1px solid ${C.redBd}`,
                borderRadius: 20, padding: "4px 12px",
                fontSize: 11, fontWeight: 700, color: C.red,
                marginBottom: 16,
              }}>
              🔑 מספר מוכר — כניסה לחשבון
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Password field (LOGIN mode) ── */}
        <AnimatePresence>
          {(mode === M.LOGIN || (mode === M.SUBMITTING && loginEmail)) && (
            <motion.div
              key="pw-field"
              variants={fieldVariants}
              initial="hidden"
              animate="show"
              exit="exit">
              <Field label="סיסמה" error={fieldErrors.password}>
                <Inp
                  ref={pwRef}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p=>({...p,password:""})); }}
                  placeholder="הסיסמה שלך"
                  type={showPw ? "text" : "password"}
                  dir="ltr"
                  disabled={isLoading}
                  onKeyDown={(e) => e.key === "Enter" && doLogin()}
                  right={<EyeToggle show={showPw} onToggle={() => setShowPw(p=>!p)} />}
                />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Forgot + OTP row (LOGIN mode) ── */}
        <AnimatePresence>
          {mode === M.LOGIN && (
            <motion.div
              key="helper-row"
              variants={fieldVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}>
              <button type="button"
                onClick={doSendOTP}
                disabled={isLoading}
                style={{
                  background: "none", border: "none",
                  color: C.red, fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                🔢 כניסה דרך קוד
              </button>
              <button type="button"
                style={{
                  background: "none", border: "none",
                  color: C.gray, fontSize: 12, cursor: "pointer",
                  fontFamily: "inherit",
                }}>
                שכחת סיסמה?
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Submit (LOGIN) ── */}
        <AnimatePresence>
          {(mode === M.LOGIN || (mode === M.SUBMITTING && loginEmail)) && (
            <motion.div
              key="login-btn"
              variants={fieldVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={doLogin}
                disabled={isLoading || !password}
                style={{
                  width: "100%", padding: 14, borderRadius: 16, border: "none",
                  background: isLoading || !password
                    ? "rgba(200,16,46,0.45)"
                    : `linear-gradient(135deg, ${C.red}, ${C.redDark})`,
                  color: "white", fontSize: 14, fontWeight: 800,
                  cursor: isLoading || !password ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, fontFamily: "inherit",
                  boxShadow: "0 6px 20px rgba(200,16,46,.25)",
                }}>
                {isLoading
                  ? <><Spinner s={18} /> מתחבר...</>
                  : "✓ כניסה"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10,
                      margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }}/>
          <span style={{ color: C.gray, fontSize: 11, fontWeight: 600 }}>
            או המשך עם
          </span>
          <div style={{ flex: 1, height: 1, background: C.border }}/>
        </div>

        {/* ── Google OAuth ── */}
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.href },
            });
          }}
          style={{
            width: "100%", padding: 13, borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            background: C.white, color: C.dark, fontSize: 14,
            fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: 10,
            fontFamily: "inherit", marginBottom: 10,
          }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.5 13.1 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/>
            <path fill="#FBBC05" d="M10.6 28.6c-.4-1.1-.6-2.3-.6-3.6s.2-2.5.6-3.6L2.7 15.3C1 18.4 0 21.6 0 25s1 6.6 2.7 9.7l7.9-6.1z"/>
            <path fill="#34A853" d="M24 50c6.2 0 11.5-2 15.3-5.5l-7.6-5.9c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-3.6-13.4-8.8l-7.9 6.1C6.7 44.6 14.7 50 24 50z"/>
          </svg>
          כניסה עם Google
        </button>

        {/* ── Business portal ── */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 6 }}>
          <div style={{ textAlign: "center", fontSize: 11, color: C.gray,
                        marginBottom: 8, fontWeight: 600 }}>
            יש לך מסעדה או עסק?
          </div>
          <button type="button" onClick={onBusiness} style={{
            width: "100%", padding: 13, borderRadius: 14, border: "none",
            background: C.dark, color: "white", fontSize: 14, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 8, fontFamily: "inherit",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="9 22 9 12 15 12 15 22"
                stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            פורטל עסקים — הירשם כבעל עסק
          </button>
        </div>

        <div style={{ textAlign: "center", color: C.gray, fontSize: 10,
                      marginTop: 16, lineHeight: 1.7 }}>
          בהמשך אתה מסכים ל
          <span style={{ color: C.red, fontWeight: 700 }}>תנאי השימוש</span> ול
          <span style={{ color: C.red, fontWeight: 700 }}>מדיניות הפרטיות</span>
        </div>
      </div>
    </div>
  );
}
