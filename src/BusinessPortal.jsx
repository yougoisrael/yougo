// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BusinessPortal.jsx — ✅ Fixed: uses shared supabase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";


const C = {
  red: "#C8102E", lightRed: "#FEF2F2", darkRed: "#991B1B",
  green: "#10B981", lightGreen: "#ECFDF5", darkGreen: "#065F46",
  blue: "#3B82F6", lightBlue: "#EFF6FF",
  yellow: "#F59E0B", lightYellow: "#FFFBEB",
  gray: "#6B7280", lightGray: "#F3F4F6", borderGray: "#E5E7EB",
  dark: "#111827", white: "#FFFFFF", bg: "#F8FAFC",
};

// ── STATUS CONFIG ──────────────────────────────────────────────────────────────
const ST = {
  "جديد":        { c: C.blue,   bg: C.lightBlue,   emoji: "🆕", label: "جديد"         },
  "قيد التحضير": { c: C.yellow, bg: C.lightYellow,  emoji: "👨‍🍳", label: "جاري التحضير" },
  "في الطريق":   { c: "#8B5CF6", bg: "#F5F3FF",     emoji: "🛵", label: "في الطريق"    },
  "مكتمل":       { c: C.green,  bg: C.lightGreen,   emoji: "✅", label: "مكتمل"        },
  "ملغي":        { c: C.red,    bg: C.lightRed,     emoji: "❌", label: "ملغي"         },
};

function ago(iso) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "الآن";
  if (s < 3600) return `${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعة`;
  return new Date(iso).toLocaleDateString("ar");
}

// ── ICONS ──────────────────────────────────────────────────────────────────────
const I = {
  home:    "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5zM9 21V12h6v9",
  orders:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2",
  menu:    "M4 6h16M4 12h16M4 18h16",
  offers:  "M7 7h10M7 12h6M7 17h4",
  stats:   "M3 3v18h18M7 16l4-4 4 4 4-6",
  settings:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  plus:    "M12 5v14M5 12h14",
  edit:    "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:   "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  back:    "M19 12H5M12 5l-7 7 7 7",
  bell:    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  eye:     "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  store:   "M3 9l1.5-5h15L21 9M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M5 21V9M19 21V9M5 21h14",
  tag:     "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  qr:      "M3 3h7v7H3zM3 14h7v7H3zM14 3h7v7h-7zM14 14h3v3h-3zM17 17h3v3h-3zM17 14h3",
  check:   "M5 13l4 4L19 7",
  phone:   "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  star:    "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  img:     "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  fire:    "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
  close:   "M6 18L18 6M6 6l12 12",
};

function Icon({ d, size = 20, color = C.gray, strokeWidth = 1.8, fill = "none", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={style}>
      {d.split("M").filter(Boolean).map((p, i) => (
        <path key={i} d={`M${p}`} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}

// ── UI PRIMITIVES ──────────────────────────────────────────────────────────────
function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: C.white, borderRadius: 16, border: `1px solid ${C.borderGray}`,
      boxShadow: "0 1px 4px rgba(0,0,0,.05)", overflow: "hidden", ...style,
      cursor: onClick ? "pointer" : "default",
    }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, style = {}, full = false }) {
  const sizes = { sm: { padding: "6px 12px", fontSize: 12 }, md: { padding: "10px 18px", fontSize: 13 }, lg: { padding: "14px 24px", fontSize: 15 } };
  const variants = {
    primary:  { background: C.red,       color: "#fff",    border: "none",                    boxShadow: "0 2px 8px rgba(200,16,46,.25)" },
    secondary:{ background: C.lightRed,  color: C.red,     border: `1.5px solid ${C.red}22`,  boxShadow: "none" },
    ghost:    { background: C.lightGray, color: C.dark,    border: "none",                    boxShadow: "none" },
    danger:   { background: C.lightRed,  color: C.red,     border: "none",                    boxShadow: "none" },
    success:  { background: C.lightGreen,color: C.green,   border: "none",                    boxShadow: "none" },
    outline:  { background: "transparent", color: C.gray,  border: `1.5px solid ${C.borderGray}`, boxShadow: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...sizes[size], ...variants[variant],
      borderRadius: 10, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: 6, opacity: disabled ? 0.6 : 1, transition: "all .15s",
      width: full ? "100%" : "auto", ...style,
    }}>
      {children}
    </button>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: C.dark, display: "block", marginBottom: 5 }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} type={type}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", background: C.bg, border: `1.5px solid ${focused ? C.red : C.borderGray}`,
        borderRadius: 10, padding: "10px 13px", fontSize: 13, color: C.dark,
        outline: "none", fontFamily: "inherit", transition: "border .15s", boxSizing: "border-box", ...style,
      }} />
  );
}

function Select({ value, onChange, children, style = {} }) {
  return (
    <select value={value} onChange={onChange} style={{
      width: "100%", background: C.bg, border: `1.5px solid ${C.borderGray}`,
      borderRadius: 10, padding: "10px 13px", fontSize: 13, color: C.dark,
      outline: "none", fontFamily: "inherit", boxSizing: "border-box", cursor: "pointer", ...style,
    }}>
      {children}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, style = {} }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", background: C.bg, border: `1.5px solid ${focused ? C.red : C.borderGray}`,
        borderRadius: 10, padding: "10px 13px", fontSize: 13, color: C.dark,
        outline: "none", fontFamily: "inherit", transition: "border .15s",
        resize: "vertical", boxSizing: "border-box", ...style,
      }} />
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, color: C.dark, fontWeight: 600 }}>{label}</span>
      <div onClick={() => onChange(!value)} style={{
        width: 46, height: 26, borderRadius: 13, cursor: "pointer", transition: "background .2s",
        background: value ? C.green : C.lightGray, position: "relative",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3, right: value ? 3 : "auto", left: value ? "auto" : 3,
          transition: "all .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        }} />
      </div>
    </div>
  );
}

function Toast({ msg, type = "success", onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  const colors = { success: C.green, error: C.red, info: C.blue };
  const c = colors[type] || C.blue;
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: C.dark, color: "#fff", borderRadius: 12, padding: "12px 20px",
      display: "flex", alignItems: "center", gap: 9, zIndex: 9999, maxWidth: 340,
      boxShadow: "0 4px 20px rgba(0,0,0,.3)", animation: "toastIn .3s ease",
      fontFamily: "inherit", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
      {msg}
    </div>
  );
}

function StatusBadge({ status }) {
  const m = ST[status] || ST["جديد"];
  return (
    <span style={{
      background: m.bg, color: m.c, borderRadius: 20, padding: "3px 10px",
      fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
    }}>
      {m.emoji} {status}
    </span>
  );
}

function BottomNav({ tab, setTab, newOrdersCount }) {
  const tabs = [
    { id: "home",     label: "الرئيسية", icon: I.home    },
    { id: "orders",   label: "الطلبات",  icon: I.orders, badge: newOrdersCount },
    { id: "menu",     label: "القائمة",  icon: I.menu    },
    { id: "offers",   label: "العروض",   icon: I.tag     },
    { id: "qr",       label: "QR كود",    icon: I.qr      },
    { id: "settings", label: "الإعدادات",icon: I.settings},
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto",
      background: C.white, borderTop: `1px solid ${C.borderGray}`,
      display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          padding: "10px 4px 8px", border: "none", background: "none", cursor: "pointer",
          position: "relative",
        }}>
          {t.badge > 0 && (
            <div style={{
              position: "absolute", top: 6, right: "50%", transform: "translateX(6px)",
              background: C.red, color: "#fff", fontSize: 9, fontWeight: 900,
              minWidth: 16, height: 16, borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", padding: "0 3px",
            }}>{t.badge}</div>
          )}
          <Icon d={t.icon} size={22} color={tab === t.id ? C.red : "#9CA3AF"} strokeWidth={tab === t.id ? 2.2 : 1.8} />
          <span style={{ fontSize: 10, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? C.red : "#9CA3AF" }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS AUTH FLOW
// ═══════════════════════════════════════════════════════════════════════════════
function BusinessAuth({ onDone, onBack }) {
  const [screen, setScreen]   = useState("choose"); // choose | login | register
  const [step, setStep]       = useState(3);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [form, setForm]       = useState({
    phone: "", businessName: "", category: "",
    city: "", address: "", ownerName: "", email: "",
    description: "", openTime: "10:00", closeTime: "22:00",
    deliveryFee: "10", minOrder: "40",
  });

  const notify = (msg, type = "success") => setToast({ msg, type });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleLogin() {
    const cleaned = loginEmail.trim().toLowerCase();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setLoginError("أدخل بريد إلكتروني صحيح"); return;
    }
    setLoginError(""); setLoading(true);
    try {
      const { data, error } = await supabase.from("businesses").select("*").eq("email", cleaned).single();
      if (error || !data) {
        setLoginError("لا يوجد عمل مسجل بهذا البريد"); setLoading(false); return;
      }
      onDone(data);
    } catch (_) {
      setLoginError("حدث خطأ، حاول مجدداً");
    }
    setLoading(false);
  }

  async function verifyOtp() { setStep(3); }

  async function registerBusiness() {
    if (!form.businessName || !form.category || !form.city) {
      notify("أكمل البيانات المطلوبة", "error"); return;
    }
    setLoading(true);
    const biz = {
      name: form.businessName, category: form.category, location: form.city,
      address: form.address, phone: form.phone, owner_name: form.ownerName,
      email: form.email, description: form.description,
      open_time: form.openTime, close_time: form.closeTime,
      delivery_fee: parseFloat(form.deliveryFee) || 10,
      min_order: parseFloat(form.minOrder) || 40,
      active: false, verified: false, rating: 0, reviews_count: 0,
    };
    try {
      const { data, error } = await supabase.from("businesses").insert([biz]).select().single();
      if (error) throw error;
      onDone(data || { ...biz, id: "temp_" + Date.now() });
    } catch (_) {
      // Return mock business for demo
      onDone({ ...biz, id: "demo_" + Date.now() });
    }
    setLoading(false);
    notify("تم تسجيل عملك! سيتم مراجعته خلال 24 ساعة ✅");
  }

  const cats = ["مطعم","كافيه","حلويات","عصائر","سوشي","بيتزا","شاورما","وجبات سريعة","سوبرماركت","جزارة","مخبز","صيدلية","أخرى"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, maxWidth: 480, margin: "0 auto", direction: "rtl", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 24px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ position: "absolute", bottom: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
        <button onClick={screen === "choose" ? onBack : () => setScreen("choose")} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 20 }}>
          <Icon d={I.back} size={18} color="#fff" />
        </button>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🏪</div>
        <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
          {screen === "choose" ? "بوابة الأعمال" : screen === "login" ? "تسجيل الدخول" : "سجّل عملك"}
        </div>
        <div style={{ color: "rgba(255,255,255,.8)", fontSize: 13 }}>
          {screen === "choose" ? "أدر مطعمك أو متجرك" : screen === "login" ? "ادخل على حسابك المسجّل" : "أضف مطعمك أو متجرك على Yougo"}
        </div>
      </div>

      <div style={{ padding: "24px 20px 40px" }}>

        {/* شاشة الاختيار */}
        {screen === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <button onClick={() => setScreen("login")}
              style={{ background: C.red, color: "white", border: "none", borderRadius: 18, padding: "22px 20px", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "right", fontFamily: "inherit" }}>
              <span style={{ fontSize: 32 }}>🔑</span>
              <div>
                <div>دخول حساب مسجّل</div>
                <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85, marginTop: 3 }}>لديك حساب بالفعل؟ ادخل هنا</div>
              </div>
            </button>
            <button onClick={() => setScreen("register")}
              style={{ background: "white", color: C.dark, border: `2px solid ${C.borderGray}`, borderRadius: 18, padding: "22px 20px", fontSize: 16, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "right", fontFamily: "inherit" }}>
              <span style={{ fontSize: 32 }}>🏪</span>
              <div>
                <div>تسجيل عمل جديد</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.gray, marginTop: 3 }}>أضف مطعمك أو متجرك لأول مرة</div>
              </div>
            </button>
          </div>
        )}

        {/* شاشة الدخول */}
        {screen === "login" && (
          <Card style={{ padding: "24px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 6 }}>البريد الإلكتروني</div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 18 }}>أدخل البريد المسجّل معنا</div>
            <input
              value={loginEmail}
              onChange={e => { setLoginEmail(e.target.value); setLoginError(""); }}
              onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
              placeholder="example@email.com"
              type="email"
              style={{ width: "100%", border: `1.5px solid ${loginError ? C.red : C.borderGray}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, outline: "none", direction: "ltr", textAlign: "left", fontFamily: "inherit", marginBottom: 4 }}
            />
            {loginError && <div style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{loginError}</div>}
            <Btn onClick={handleLogin} disabled={loading} full style={{ marginTop: 8 }}>
              {loading ? "جاري البحث..." : "دخول ←"}
            </Btn>
          </Card>
        )}

        {/* Step 3: Business Details */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card style={{ padding: "20px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>🏪</span> معلومات العمل
              </div>
              <Field label="اسم العمل / المطعم" required>
                <Input value={form.businessName} onChange={e => setF("businessName", e.target.value)} placeholder="مثال: ورونا كريسبي" />
              </Field>
              <Field label="نوع العمل" required>
                <Select value={form.category} onChange={e => setF("category", e.target.value)}>
                  <option value="">اختر النوع</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="المدينة / البلدة" required>
                <Input value={form.city} onChange={e => setF("city", e.target.value)} placeholder="مثال: رامة، نحف، الناصرة..." />
              </Field>
              <Field label="العنوان التفصيلي">
                <Input value={form.address} onChange={e => setF("address", e.target.value)} placeholder="الشارع والمنطقة" />
              </Field>
              <Field label="وصف العمل">
                <Textarea value={form.description} onChange={e => setF("description", e.target.value)} placeholder="اكتب وصفاً قصيراً عن مطعمك أو متجرك..." />
              </Field>
            </Card>

            <Card style={{ padding: "20px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>👤</span> بيانات المالك
              </div>
              <Field label="اسم المالك">
                <Input value={form.ownerName} onChange={e => setF("ownerName", e.target.value)} placeholder="اسمك الكامل" />
              </Field>
              <Field label="البريد الإلكتروني">
                <Input value={form.email} onChange={e => setF("email", e.target.value)} placeholder="example@email.com" type="email" />
              </Field>
            </Card>

            <Card style={{ padding: "20px" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>⚙️</span> إعدادات التوصيل
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="فتح">
                  <Input value={form.openTime} onChange={e => setF("openTime", e.target.value)} type="time" />
                </Field>
                <Field label="إغلاق">
                  <Input value={form.closeTime} onChange={e => setF("closeTime", e.target.value)} type="time" />
                </Field>
                <Field label="رسوم التوصيل (₪)">
                  <Input value={form.deliveryFee} onChange={e => setF("deliveryFee", e.target.value)} type="number" />
                </Field>
                <Field label="الحد الأدنى (₪)">
                  <Input value={form.minOrder} onChange={e => setF("minOrder", e.target.value)} type="number" />
                </Field>
              </div>
            </Card>

            <Btn onClick={registerBusiness} disabled={loading} size="lg" full>
              {loading ? "جاري التسجيل..." : "✅ تسجيل العمل"}
            </Btn>

            <div style={{ background: C.lightYellow, borderRadius: 12, padding: "12px 16px", border: `1px solid ${C.yellow}33` }}>
              <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600, lineHeight: 1.6 }}>
                ⚠️ سيتم مراجعة طلبك من فريق Yougo خلال 24 ساعة وسنتواصل معك للتفعيل.
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME TAB
// ═══════════════════════════════════════════════════════════════════════════════
function HomeTab({ business, orders, menuItems, offers, setTab }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter(o => (o.created_at || "").startsWith(todayStr));
  const todayRev = todayOrders.filter(o => o.status === "مكتمل").reduce((s, o) => s + (o.total || 0), 0);
  const pending = orders.filter(o => ["جديد", "قيد التحضير"].includes(o.status));
  const newCount = orders.filter(o => o.status === "جديد").length;

  return (
    <div style={{ padding: "0 0 90px" }}>
      {/* Business header */}
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.07)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <div style={{ width: 54, height: 54, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🏪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{business?.name || "مطعمك"}</div>
            <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, marginTop: 2 }}>{business?.category} • {business?.location}</div>
          </div>
          {business?.active !== false ? (
            <div style={{ background: C.lightGreen, color: C.green, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>🟢 مفتوح</div>
          ) : (
            <div style={{ background: C.lightRed, color: C.red, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>🔴 مغلق</div>
          )}
        </div>
        {!business?.verified && (
          <div style={{ marginTop: 14, background: "rgba(245,158,11,.2)", border: "1px solid rgba(245,158,11,.4)", borderRadius: 10, padding: "10px 14px", position: "relative" }}>
            <div style={{ color: "#FEF3C7", fontSize: 12, fontWeight: 600 }}>⏳ طلبك قيد المراجعة — سيتم تفعيل حسابك خلال 24 ساعة</div>
          </div>
        )}
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "طلبات اليوم",  value: todayOrders.length, icon: "📦", color: C.blue,   bg: C.lightBlue   },
            { label: "إيرادات اليوم",value: `₪${todayRev}`,     icon: "💰", color: C.green,  bg: C.lightGreen  },
            { label: "قيد التنفيذ",  value: pending.length,     icon: "⏳", color: C.yellow, bg: C.lightYellow },
            { label: "عناصر القائمة",value: menuItems.length,    icon: "🍽️", color: C.red,   bg: C.lightRed    },
          ].map((k, i) => (
            <Card key={i} style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: C.gray, fontWeight: 600, marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, lineHeight: 1 }}>{k.value}</div>
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{k.icon}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* New orders alert */}
        {newCount > 0 && (
          <div onClick={() => setTab("orders")} style={{
            background: `linear-gradient(135deg,${C.red},${C.darkRed})`, borderRadius: 14,
            padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
            animation: "pulse 2s infinite",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>{newCount} طلب جديد!</div>
              <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12 }}>اضغط لعرض الطلبات</div>
            </div>
            <div style={{ color: "#fff", fontSize: 20 }}>←</div>
          </div>
        )}

        {/* Recent orders */}
        {orders.length > 0 && (
          <Card>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.lightGray}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>آخر الطلبات</div>
              <button onClick={() => setTab("orders")} style={{ background: "none", border: "none", color: C.red, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>عرض الكل</button>
            </div>
            {orders.slice(0, 4).map((o, i) => (
              <div key={o.id} style={{ padding: "12px 16px", borderBottom: i < 3 && i < orders.slice(0, 4).length - 1 ? `1px solid ${C.lightGray}` : "none", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: (ST[o.status] || ST["جديد"]).bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {(ST[o.status] || ST["جديد"]).emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer_name || "عميل"}</div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 1 }}>{ago(o.created_at)}</div>
                </div>
                <div style={{ textAlign: "left", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>₪{o.total || 0}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Quick actions */}
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 12 }}>إجراءات سريعة</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "إضافة وجبة",   icon: "🍽️", tab: "menu",     action: "add" },
              { label: "إضافة عرض",    icon: "🏷️", tab: "offers",   action: "add" },
              { label: "إعدادات",      icon: "⚙️", tab: "settings", action: ""    },
              { label: "عرض الإحصائيات",icon:"📊", tab: "home",    action: "stats"},
            ].map((a, i) => (
              <button key={i} onClick={() => setTab(a.tab)} style={{
                background: C.lightGray, border: "none", borderRadius: 12,
                padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center",
                gap: 6, cursor: "pointer", fontFamily: "inherit", transition: "background .15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = C.lightRed}
                onMouseLeave={e => e.currentTarget.style.background = C.lightGray}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.dark }}>{a.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OrdersTab({ orders, setOrders, business, notify }) {
  const [filter, setFilter]   = useState("الكل");
  const [detail, setDetail]   = useState(null);
  const [updating, setUpdating] = useState(null);

  const fOrders = filter === "الكل" ? orders : orders.filter(o => o.status === filter);

  async function changeStatus(id, status) {
    setUpdating(id);
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
    if (detail?.id === id) setDetail(p => ({ ...p, status }));
    try { await supabase.from("orders").update({ status }).eq("id", id); } catch (_) {}
    setUpdating(null);
    notify("تم تحديث حالة الطلب ✅");
  }

  if (detail) return (
    <div style={{ padding: "0 0 90px" }}>
      {/* Order detail header */}
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 24px" }}>
        <button onClick={() => setDetail(null)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 16 }}>
          <Icon d={I.back} size={18} color="#fff" />
        </button>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>طلب {detail.id?.slice(-6) || "#----"}</div>
        <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, marginTop: 4 }}>{ago(detail.created_at)}</div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Status banner */}
        <Card style={{ padding: "14px 16px", background: (ST[detail.status] || ST["جديد"]).bg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{(ST[detail.status] || ST["جديد"]).emoji}</span>
            <div>
              <div style={{ fontSize: 11, color: C.gray, fontWeight: 600 }}>الحالة الحالية</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: (ST[detail.status] || ST["جديد"]).c }}>{detail.status}</div>
            </div>
          </div>
        </Card>

        {/* Customer info */}
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.dark, marginBottom: 12 }}>👤 بيانات العميل</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.gray }}>الاسم</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{detail.customer_name || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.gray }}>الهاتف</span>
              <a href={`tel:${detail.customer_phone}`} style={{ fontSize: 13, fontWeight: 700, color: C.blue, textDecoration: "none" }}>{detail.customer_phone || "—"}</a>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: C.gray }}>العنوان</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.dark, textAlign: "left", maxWidth: "60%" }}>{detail.customer_address || "—"}</span>
            </div>
            {detail.notes && (
              <div style={{ background: C.lightYellow, borderRadius: 8, padding: "8px 10px", marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#92400E", fontWeight: 700, marginBottom: 2 }}>ملاحظات العميل:</div>
                <div style={{ fontSize: 12, color: "#78350F" }}>{detail.notes}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Items */}
        <Card style={{ padding: "16px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.dark, marginBottom: 12 }}>🍽️ الطلب</div>
          {Array.isArray(detail.items) ? detail.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < detail.items.length - 1 ? `1px dashed ${C.lightGray}` : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{item.name || item}</div>
                {item.qty && <div style={{ fontSize: 11, color: C.gray }}>الكمية: {item.qty}</div>}
              </div>
              {item.price && <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>₪{item.price * (item.qty || 1)}</div>}
            </div>
          )) : (
            <div style={{ fontSize: 12, color: C.gray }}>عدد العناصر: {detail.items_count || "—"}</div>
          )}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1.5px solid ${C.borderGray}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: C.gray }}>رسوم التوصيل</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>₪{detail.delivery_fee || 0}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>الإجمالي</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: C.green }}>₪{detail.total || 0}</span>
            </div>
          </div>
        </Card>

        {/* Change status */}
        {!["مكتمل","ملغي"].includes(detail.status) && (
          <Card style={{ padding: "16px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.dark, marginBottom: 12 }}>🔄 تحديث الحالة</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {Object.entries(ST).filter(([s]) => s !== detail.status && !["ملغي"].includes(s)).map(([s, m]) => (
                <button key={s} onClick={() => changeStatus(detail.id, s)} disabled={updating === detail.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: m.bg, border: `1.5px solid ${m.c}22`, borderRadius: 10,
                  cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                  opacity: updating === detail.id ? 0.6 : 1,
                }}>
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: m.c }}>تغيير إلى: {s}</span>
                </button>
              ))}
              <button onClick={() => changeStatus(detail.id, "ملغي")} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                background: C.lightRed, border: `1.5px solid ${C.red}22`, borderRadius: 10,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                <span style={{ fontSize: 18 }}>❌</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>إلغاء الطلب</span>
              </button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "0 0 90px" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 20px" }}>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>الطلبات</div>
        <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12 }}>{orders.length} طلب إجمالي</div>
      </div>

      {/* Filter tabs */}
      <div style={{ background: C.white, padding: "12px 16px", borderBottom: `1px solid ${C.lightGray}`, display: "flex", gap: 7, overflowX: "auto" }}>
        {["الكل", "جديد", "قيد التحضير", "في الطريق", "مكتمل", "ملغي"].map(f => {
          const cnt = f === "الكل" ? orders.length : orders.filter(o => o.status === f).length;
          const m = f !== "الكل" ? ST[f] : null;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer",
              background: filter === f ? (m ? m.bg : C.lightRed) : C.lightGray,
              color: filter === f ? (m ? m.c : C.red) : C.gray,
              fontWeight: filter === f ? 700 : 500, fontSize: 12,
              fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              {f}{cnt > 0 && <span style={{ opacity: .7, marginRight: 3 }}>({cnt})</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {fOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.gray }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>لا توجد طلبات</div>
          </div>
        ) : fOrders.map(o => (
          <Card key={o.id} onClick={() => setDetail(o)} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: (ST[o.status] || ST["جديد"]).bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {(ST[o.status] || ST["جديد"]).emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer_name || "عميل"}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.green, flexShrink: 0 }}>₪{o.total || 0}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: C.gray }}>{ago(o.created_at)} · {o.items_count || "—"} عنصر · {o.payment_method || "كاش"}</div>
                  <StatusBadge status={o.status} />
                </div>
                {o.customer_address && (
                  <div style={{ fontSize: 11, color: C.blue, marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                    <Icon d={I.phone} size={11} color={C.blue} />
                    {o.customer_address}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENU TAB
// ═══════════════════════════════════════════════════════════════════════════════
function MenuTab({ business, menuItems, setMenuItems, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [catFilter, setCatFilter] = useState("الكل");
  const [blank] = useState({ name: "", desc: "", price: "", category: "", available: true, hot: false, img: "" });
  const [form, setForm]         = useState({ ...blank });

  const cats = ["الكل", ...new Set(menuItems.map(m => m.category || m.cat || "عام").filter(Boolean))];

  function openAdd()  { setForm({ ...blank }); setEditItem(null); setShowForm(true); }
  function openEdit(item) { setForm({ ...item, price: String(item.price || ""), category: item.category || item.cat || "" }); setEditItem(item); setShowForm(true); }
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    if (!form.name.trim() || !form.price) { notify("أدخل الاسم والسعر", "error"); return; }
    setSaving(true);
    const item = { ...form, price: parseFloat(form.price), business_id: business?.id, restaurant_id: business?.id };
    if (editItem) {
      setMenuItems(p => p.map(m => m.id === editItem.id ? { ...m, ...item } : m));
      try { await supabase.from("menu_items").update(item).eq("id", editItem.id); } catch (_) {}
      notify("تم تحديث الوجبة ✅");
    } else {
      const newItem = { ...item, id: "item_" + Date.now() };
      setMenuItems(p => [...p, newItem]);
      try { await supabase.from("menu_items").insert([item]); } catch (_) {}
      notify("تم إضافة الوجبة ✅");
    }
    setSaving(false); setShowForm(false);
  }

  async function deleteItem(id) {
    setMenuItems(p => p.filter(m => m.id !== id));
    try { await supabase.from("menu_items").delete().eq("id", id); } catch (_) {}
    notify("تم حذف الوجبة");
  }

  async function toggleAvailable(id, cur) {
    setMenuItems(p => p.map(m => m.id === id ? { ...m, available: !cur } : m));
    try { await supabase.from("menu_items").update({ available: !cur }).eq("id", id); } catch (_) {}
    notify(!cur ? "الوجبة متاحة ✅" : "الوجبة محجوبة");
  }

  const filtered = catFilter === "الكل" ? menuItems : menuItems.filter(m => (m.category || m.cat || "عام") === catFilter);

  if (showForm) return (
    <div style={{ padding: "0 0 90px" }}>
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 24px" }}>
        <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 16 }}>
          <Icon d={I.back} size={18} color="#fff" />
        </button>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{editItem ? "تعديل الوجبة" : "إضافة وجبة جديدة"}</div>
      </div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Card style={{ padding: "20px" }}>
          <Field label="اسم الوجبة" required>
            <Input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="مثال: كريسبي كبير" />
          </Field>
          <Field label="الوصف">
            <Textarea value={form.desc || form.description || ""} onChange={e => setF("desc", e.target.value)} placeholder="وصف الوجبة ومحتوياتها..." />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="السعر (₪)" required>
              <Input value={form.price} onChange={e => setF("price", e.target.value)} placeholder="0.00" type="number" />
            </Field>
            <Field label="الفئة">
              <Input value={form.category} onChange={e => setF("category", e.target.value)} placeholder="مثال: وجبات رئيسية" />
            </Field>
          </div>
          <Field label="رابط الصورة (اختياري)">
            <Input value={form.img || ""} onChange={e => setF("img", e.target.value)} placeholder="https://..." />
          </Field>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
            <Toggle value={form.available !== false} onChange={v => setF("available", v)} label="الوجبة متاحة للطلب" />
            <Toggle value={form.hot || false} onChange={v => setF("hot", v)} label="🔥 وجبة شعبية / مميزة" />
          </div>
        </Card>
        <Btn onClick={save} disabled={saving} size="lg" full>
          {saving ? "جاري الحفظ..." : editItem ? "💾 حفظ التعديلات" : "✅ إضافة الوجبة"}
        </Btn>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "0 0 90px" }}>
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>قائمة الطعام</div>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, marginTop: 2 }}>{menuItems.length} وجبة</div>
        </div>
        <button onClick={openAdd} style={{ background: "rgba(255,255,255,.2)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d={I.plus} size={16} color="#fff" /> إضافة
        </button>
      </div>

      {/* Cat filter */}
      {cats.length > 1 && (
        <div style={{ background: C.white, padding: "10px 16px", borderBottom: `1px solid ${C.lightGray}`, display: "flex", gap: 7, overflowX: "auto" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              padding: "5px 13px", borderRadius: 20, border: "none", cursor: "pointer",
              background: catFilter === c ? C.lightRed : C.lightGray,
              color: catFilter === c ? C.red : C.gray,
              fontWeight: catFilter === c ? 700 : 500, fontSize: 12,
              fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
            }}>{c}</button>
          ))}
        </div>
      )}

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🍽️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>لا توجد وجبات بعد</div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>ابدأ بإضافة وجباتك</div>
            <Btn onClick={openAdd}>+ إضافة أول وجبة</Btn>
          </div>
        ) : filtered.map(item => (
          <Card key={item.id} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {/* Image or emoji */}
              <div style={{ width: 56, height: 56, borderRadius: 12, background: C.lightGray, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                {item.img ? <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} /> : "🍽️"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  {item.hot && <span style={{ fontSize: 14 }}>🔥</span>}
                </div>
                {(item.desc || item.description) && (
                  <div style={{ fontSize: 11, color: C.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{item.desc || item.description}</div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.green }}>₪{item.price}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {/* Available toggle */}
                    <div onClick={() => toggleAvailable(item.id, item.available !== false)} style={{ cursor: "pointer" }}>
                      <span style={{
                        background: item.available !== false ? C.lightGreen : C.lightRed,
                        color: item.available !== false ? C.green : C.red,
                        borderRadius: 20, padding: "3px 9px", fontSize: 10, fontWeight: 700,
                      }}>{item.available !== false ? "متاح" : "محجوب"}</span>
                    </div>
                    <button onClick={() => openEdit(item)} style={{ background: C.lightBlue, border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon d={I.edit} size={14} color={C.blue} />
                    </button>
                    <button onClick={() => deleteItem(item.id)} style={{ background: C.lightRed, border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon d={I.trash} size={14} color={C.red} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OFFERS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function OffersTab({ business, offers, setOffers, notify }) {
  const [showForm, setShowForm] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [saving, setSaving]     = useState(false);
  const blank = { title: "", desc: "", discount: "", type: "percent", minOrder: "", code: "", active: true, expires: "" };
  const [form, setForm]         = useState({ ...blank });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function openAdd()  { setForm({ ...blank }); setEditOffer(null); setShowForm(true); }
  function openEdit(o){ setForm({ ...o, discount: String(o.discount || "") }); setEditOffer(o); setShowForm(true); }

  async function save() {
    if (!form.title.trim() || !form.discount) { notify("أدخل العنوان والخصم", "error"); return; }
    setSaving(true);
    const offer = { ...form, discount: parseFloat(form.discount), business_id: business?.id };
    if (editOffer) {
      setOffers(p => p.map(o => o.id === editOffer.id ? { ...o, ...offer } : o));
      try { await supabase.from("offers").update(offer).eq("id", editOffer.id); } catch (_) {}
      notify("تم تحديث العرض ✅");
    } else {
      const newOffer = { ...offer, id: "offer_" + Date.now() };
      setOffers(p => [...p, newOffer]);
      try { await supabase.from("offers").insert([offer]); } catch (_) {}
      notify("تم إضافة العرض ✅");
    }
    setSaving(false); setShowForm(false);
  }

  async function deleteOffer(id) {
    setOffers(p => p.filter(o => o.id !== id));
    try { await supabase.from("offers").delete().eq("id", id); } catch (_) {}
    notify("تم حذف العرض");
  }

  async function toggleOffer(id, cur) {
    setOffers(p => p.map(o => o.id === id ? { ...o, active: !cur } : o));
    try { await supabase.from("offers").update({ active: !cur }).eq("id", id); } catch (_) {}
    notify(!cur ? "العرض مفعّل ✅" : "العرض موقوف");
  }

  if (showForm) return (
    <div style={{ padding: "0 0 90px" }}>
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 24px" }}>
        <button onClick={() => setShowForm(false)} style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 16 }}>
          <Icon d={I.back} size={18} color="#fff" />
        </button>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{editOffer ? "تعديل العرض" : "إضافة عرض جديد"}</div>
      </div>
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
        <Card style={{ padding: "20px" }}>
          <Field label="عنوان العرض" required>
            <Input value={form.title} onChange={e => setF("title", e.target.value)} placeholder="مثال: خصم 20% على كل الطلبات" />
          </Field>
          <Field label="الوصف">
            <Textarea value={form.desc || form.description || ""} onChange={e => setF("desc", e.target.value)} placeholder="تفاصيل العرض والشروط..." rows={2} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="نوع الخصم">
              <Select value={form.type} onChange={e => setF("type", e.target.value)}>
                <option value="percent">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت ₪</option>
              </Select>
            </Field>
            <Field label={form.type === "percent" ? "النسبة %" : "المبلغ ₪"} required>
              <Input value={form.discount} onChange={e => setF("discount", e.target.value)} placeholder={form.type === "percent" ? "20" : "15"} type="number" />
            </Field>
            <Field label="حد أدنى للطلب (₪)">
              <Input value={form.minOrder || ""} onChange={e => setF("minOrder", e.target.value)} placeholder="40" type="number" />
            </Field>
            <Field label="كود الخصم (اختياري)">
              <Input value={form.code || ""} onChange={e => setF("code", e.target.value.toUpperCase())} placeholder="YOUGO20" />
            </Field>
          </div>
          <Field label="تاريخ الانتهاء (اختياري)">
            <Input value={form.expires || ""} onChange={e => setF("expires", e.target.value)} type="date" />
          </Field>
          <Toggle value={form.active !== false} onChange={v => setF("active", v)} label="العرض مفعّل الآن" />
        </Card>
        <Btn onClick={save} disabled={saving} size="lg" full>
          {saving ? "جاري الحفظ..." : editOffer ? "💾 حفظ التعديلات" : "✅ إضافة العرض"}
        </Btn>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "0 0 90px" }}>
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>العروض والخصومات</div>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 12, marginTop: 2 }}>{offers.length} عرض</div>
        </div>
        <button onClick={openAdd} style={{ background: "rgba(255,255,255,.2)", border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon d={I.plus} size={16} color="#fff" /> إضافة
        </button>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {offers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🏷️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>لا توجد عروض</div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 20 }}>أضف عروضاً لجذب المزيد من العملاء</div>
            <Btn onClick={openAdd}>+ إضافة أول عرض</Btn>
          </div>
        ) : offers.map(o => (
          <Card key={o.id} style={{ padding: "16px", opacity: o.active === false ? 0.6 : 1 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: o.active !== false ? C.lightRed : C.lightGray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {o.type === "percent" ? "%" : "₪"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>{o.title}</div>
                  <div style={{ background: o.active !== false ? C.lightRed : C.lightGray, color: o.active !== false ? C.red : C.gray, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {o.active !== false ? "مفعّل" : "موقوف"}
                  </div>
                </div>
                {(o.desc || o.description) && <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{o.desc || o.description}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ background: C.lightRed, color: C.red, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 800 }}>
                    {o.discount}{o.type === "percent" ? "%" : "₪"} خصم
                  </span>
                  {o.code && <span style={{ background: C.lightGray, color: C.dark, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{o.code}</span>}
                  {o.expires && <span style={{ fontSize: 11, color: C.gray }}>ينتهي: {new Date(o.expires).toLocaleDateString("ar")}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => toggleOffer(o.id, o.active !== false)} style={{ flex: 1, padding: "8px", background: o.active !== false ? C.lightYellow : C.lightGreen, border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: o.active !== false ? "#92400E" : C.green }}>
                {o.active !== false ? "⏸️ إيقاف" : "▶️ تفعيل"}
              </button>
              <button onClick={() => openEdit(o)} style={{ flex: 1, padding: "8px", background: C.lightBlue, border: "none", borderRadius: 9, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: C.blue }}>
                ✏️ تعديل
              </button>
              <button onClick={() => deleteOffer(o.id)} style={{ padding: "8px 12px", background: C.lightRed, border: "none", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={I.trash} size={15} color={C.red} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// QR TAB — Professional QR Code page for business
// ═══════════════════════════════════════════════════════════════════════════════
function QRTab({ business }) {
  const [copied, setCopied] = useState(false);
  const [showPrint, setShowPrint] = useState(false);

  const baseUrl = "https://yougo-delv1.vercel.app";
  const bizId   = business?.id || "demo";
  const bizName = business?.name || "مطعمك";
  const bizCategory = business?.category || "مطعم";
  const bizLocation = business?.location || "";

  const restaurantUrl = `${baseUrl}/#/restaurant/${bizId}`;
  const shortCode = String(bizId).slice(0,8).toUpperCase();
  const qrSize = 260;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(restaurantUrl)}&bgcolor=ffffff&color=111827&margin=12&ecc=H`;

  function copyLink() {
    try { navigator.clipboard?.writeText(restaurantUrl); } catch(_){}
    const el = document.createElement("textarea");
    el.value = restaurantUrl;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: bizName, text: `🍽️ ${bizName} على Yougo — اطلب الآن!`, url: restaurantUrl });
    } else {
      copyLink();
    }
  }

  function printPoster() {
    // Open print poster in new window
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<title>QR Poster — ${bizName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: white; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
    @page { margin: 0; size: A4; }
  }
  .poster {
    width: 210mm; min-height: 297mm;
    display: flex; flex-direction: column; align-items: center;
    padding: 0;
    background: white;
  }
  .top-band {
    width: 100%;
    background: linear-gradient(135deg, #C8102E 0%, #7B0D1E 100%);
    padding: 36px 40px 28px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .top-band::before {
    content: '';
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
    top: -100px; right: -80px;
  }
  .brand { color: rgba(255,255,220,0.85); font-size: 13px; font-weight: 700; letter-spacing: 3px; margin-bottom: 8px; }
  .biz-name { color: white; font-size: 42px; font-weight: 900; margin-bottom: 6px; line-height: 1.1; }
  .biz-cat { color: rgba(255,255,255,0.75); font-size: 16px; font-weight: 500; }
  .biz-loc { color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 4px; }
  .qr-section {
    display: flex; flex-direction: column; align-items: center;
    padding: 40px 40px 24px;
    background: white;
    flex: 1;
  }
  .scan-text {
    font-size: 22px; font-weight: 900; color: #111827;
    margin-bottom: 6px; text-align: center;
  }
  .scan-sub {
    font-size: 14px; color: #6B7280;
    margin-bottom: 32px; text-align: center;
  }
  .qr-wrapper {
    background: white;
    border-radius: 24px;
    padding: 20px;
    box-shadow: 0 0 0 8px #F3F4F6, 0 0 0 10px #E5E7EB, 0 12px 40px rgba(0,0,0,0.12);
    margin-bottom: 28px;
    position: relative;
  }
  .qr-wrapper img { display: block; border-radius: 12px; }
  .yougo-badge {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 48px; height: 48px;
    background: #C8102E;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    border: 4px solid white;
    box-shadow: 0 4px 12px rgba(200,16,46,0.4);
  }
  .yougo-badge-text { color: white; font-size: 18px; font-weight: 900; }
  .code-badge {
    background: #F3F4F6;
    border-radius: 14px;
    padding: 10px 28px;
    margin-bottom: 24px;
    display: flex; align-items: center; gap: 10;
  }
  .code-label { font-size: 12px; color: #6B7280; font-weight: 600; }
  .code-value { font-size: 20px; font-weight: 900; color: #111827; font-family: monospace; letter-spacing: 3px; }
  .steps {
    width: 100%;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 28px;
  }
  .step {
    background: #F9FAFB;
    border-radius: 16px;
    padding: 16px;
    display: flex; align-items: flex-start; gap: 12;
  }
  .step-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .step-num { font-size: 10px; color: #9CA3AF; font-weight: 700; margin-bottom: 2px; }
  .step-title { font-size: 13px; font-weight: 800; color: #111827; }
  .step-desc { font-size: 11px; color: #6B7280; margin-top: 2px; line-height: 1.4; }
  .divider { width: 80px; height: 4px; background: #C8102E; border-radius: 2px; margin: 0 auto 16px; }
  .url-box {
    background: #F8FAFC; border: 1.5px solid #E5E7EB;
    border-radius: 12px; padding: 10px 16px;
    font-size: 12px; color: #6B7280;
    width: 100%; text-align: center;
    font-family: monospace; direction: ltr;
    margin-bottom: 20px;
  }
  .footer {
    width: 100%;
    background: #111827;
    padding: 16px 40px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .footer-logo { color: white; font-size: 20px; font-weight: 900; letter-spacing: 1px; }
  .footer-tag { color: rgba(255,255,255,0.5); font-size: 11px; }
  .print-btn {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #111827; color: white; border: none;
    border-radius: 16px; padding: 14px 40px;
    font-size: 16px; font-weight: 800; cursor: pointer;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
    display: flex; align-items: center; gap: 8;
  }
</style>
</head>
<body>
<div class="poster">
  <!-- TOP BAND -->
  <div class="top-band">
    <div class="brand">YOUGO • يوغو</div>
    <div class="biz-name">${bizName}</div>
    <div class="biz-cat">${bizCategory}</div>
    ${bizLocation ? `<div class="biz-loc">📍 ${bizLocation}</div>` : ""}
  </div>

  <!-- QR SECTION -->
  <div class="qr-section">
    <div class="scan-text">📱 صوّر الكود واطلب الآن!</div>
    <div class="scan-sub">لا تحتاج تطبيق — فقط افتح الكاميرا</div>

    <div class="qr-wrapper">
      <img src="${qrApiUrl}" width="240" height="240" alt="QR"/>
      <div class="yougo-badge"><span class="yougo-badge-text">Y</span></div>
    </div>

    <div class="code-badge">
      <span class="code-label">كود المطعم:</span>
      <span class="code-value">${shortCode}</span>
    </div>

    <div class="divider"></div>

    <div class="steps">
      <div class="step">
        <div class="step-icon" style="background:#FEF2F2;">📱</div>
        <div>
          <div class="step-num">الخطوة 1</div>
          <div class="step-title">افتح الكاميرا</div>
          <div class="step-desc">وجّه الكاميرا نحو الكود</div>
        </div>
      </div>
      <div class="step">
        <div class="step-icon" style="background:#EFF6FF;">🔗</div>
        <div>
          <div class="step-num">الخطوة 2</div>
          <div class="step-title">اضغط الرابط</div>
          <div class="step-desc">يفتح صفحة مطعمنا مباشرة</div>
        </div>
      </div>
      <div class="step">
        <div class="step-icon" style="background:#F0FDF4;">🍽️</div>
        <div>
          <div class="step-num">الخطوة 3</div>
          <div class="step-title">اختر وجبتك</div>
          <div class="step-desc">تصفح القائمة واختر ما تريد</div>
        </div>
      </div>
      <div class="step">
        <div class="step-icon" style="background:#FFF7ED;">🛵</div>
        <div>
          <div class="step-num">الخطوة 4</div>
          <div class="step-title">اطلب وادفع</div>
          <div class="step-desc">يصلك الطلب لبابك</div>
        </div>
      </div>
    </div>

    <div class="url-box">${restaurantUrl}</div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-logo">YOUGO</div>
    <div class="footer-tag">منصة التوصيل الذكية • ${new Date().getFullYear()}</div>
  </div>
</div>

<button class="print-btn no-print" onclick="window.print()">
  🖨️ طباعة البوستر
</button>
</body>
</html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <div style={{ fontFamily: "Arial,sans-serif", direction: "rtl", paddingBottom: 100 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#111827,#1F2937)", padding: "48px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>QR CODE • كود المطعم</div>
          <div style={{ color: "white", fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{bizName}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{bizCategory}</div>
        </div>
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Main QR Card ── */}
        <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
          {/* Red header */}
          <div style={{ background: "linear-gradient(135deg,#C8102E,#7B0D1E)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📱</div>
            <div>
              <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>كود QR الخاص بمطعمك</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2 }}>يفتح صفحة مطعمك مباشرة بدون تطبيق</div>
            </div>
          </div>

          {/* QR + info */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 20px 24px" }}>
            {/* QR Image with frame */}
            <div style={{ background: "white", borderRadius: 22, padding: 14, boxShadow: "0 0 0 6px #F3F4F6, 0 0 0 9px #E5E7EB, 0 8px 30px rgba(0,0,0,0.1)", marginBottom: 22, position: "relative" }}>
              <img src={qrApiUrl} alt="QR Code" width={220} height={220} style={{ display: "block", borderRadius: 10 }} onError={e => e.target.style.opacity="0.3"} />
              {/* Yougo badge in center */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, background: "#C8102E", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid white", boxShadow: "0 3px 10px rgba(200,16,46,0.4)" }}>
                <span style={{ color: "white", fontSize: 16, fontWeight: 900 }}>Y</span>
              </div>
            </div>

            {/* Code badge */}
            <div style={{ background: "#F3F4F6", borderRadius: 14, padding: "10px 24px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 600 }}>كود المطعم:</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827", fontFamily: "monospace", letterSpacing: 3 }}>{shortCode}</span>
            </div>

            {/* URL bar */}
            <div style={{ width: "100%", background: "#F8FAFC", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 10, color: "#9CA3AF", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr", textAlign: "left" }}>{restaurantUrl}</span>
              <button onClick={copyLink}
                style={{ background: copied ? "#ECFDF5" : "#F3F4F6", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: copied ? "#10B981" : "#374151", flexShrink: 0, fontFamily: "inherit", transition: "all 0.2s" }}>
                {copied ? "✓ تم!" : "نسخ"}
              </button>
            </div>

            {/* 3 action buttons */}
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button onClick={() => { const a = document.createElement("a"); a.href = qrApiUrl; a.download = `yougo-qr-${shortCode}.png`; a.click(); }}
                style={{ flex: 1, background: "#111827", color: "white", border: "none", borderRadius: 14, padding: "13px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
                ⬇️ تحميل
              </button>
              <button onClick={share}
                style={{ flex: 1, background: "#C8102E", color: "white", border: "none", borderRadius: 14, padding: "13px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
                🔗 مشاركة
              </button>
              <button onClick={printPoster}
                style={{ flex: 1, background: "#F3F4F6", color: "#111827", border: "none", borderRadius: 14, padding: "13px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
                🖨️ طباعة
              </button>
            </div>
          </div>
        </div>

        {/* ── Print Poster CTA ── */}
        <div onClick={printPoster}
          style={{ background: "linear-gradient(135deg,#1D4ED8,#7C3AED)", borderRadius: 22, padding: "22px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 6px 24px rgba(124,58,237,0.3)" }}>
          <div style={{ width: 56, height: 56, background: "rgba(255,255,255,0.15)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🖨️</div>
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 16 }}>بوستر جاهز للطباعة</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              بس اطبع وعلّق — تصميم A4 احترافي مع QR وشرح للزبائن
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              ✓ A4 جاهز &nbsp;·&nbsp; ✓ عربي + اسم المطعم &nbsp;·&nbsp; ✓ مجاني
            </div>
          </div>
        </div>

        {/* ── How to use ── */}
        <div style={{ background: "white", borderRadius: 20, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#111827", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            📋 كيف يعمل الكود؟
          </div>
          {[
            { icon: "🖨️", bg: "#F3F4F6", title: "اطبع وعلّق", desc: "اطبع البوستر وعلّقه عند المدخل أو على الطاولات" },
            { icon: "📸", bg: "#FEF2F2", title: "الزبون يصوّر", desc: "يفتح الكاميرا ويصوّر — يدخل لمطعمك مباشرة!" },
            { icon: "🛒", bg: "#EFF6FF", title: "يختار ويطلب", desc: "يتصفح القائمة ويطلب ويدفع — يصلك الطلب فوراً" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < 2 ? 16 : 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
              <div style={{ paddingTop: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Share on Social ── */}
        <div style={{ background: "white", borderRadius: 20, padding: "18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#111827", marginBottom: 14 }}>📲 شارك مطعمك على</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "واتساب", bg: "#25D366", emoji: "💬", url: `https://wa.me/?text=${encodeURIComponent(`🍽️ ${bizName} على Yougo!
اطلب مباشرة: ${restaurantUrl}`)}` },
              { label: "فيسبوك", bg: "#1877F2", emoji: "👥", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(restaurantUrl)}` },
              { label: "مشاركة", bg: "linear-gradient(135deg,#E1306C,#833AB4)", emoji: "📤", url: null },
            ].map((s, i) => (
              <button key={i}
                onClick={() => s.url ? window.open(s.url, "_blank") : share()}
                style={{ flex: 1, background: s.bg, color: "white", border: "none", borderRadius: 14, padding: "13px 6px", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


function SettingsTab({ business, setBusiness, notify, onLogout }) {
  const [form, setForm] = useState({
    name: business?.name || "", category: business?.category || "",
    location: business?.location || "", address: business?.address || "",
    phone: business?.phone || "", description: business?.description || "",
    open_time: business?.open_time || "10:00", close_time: business?.close_time || "22:00",
    delivery_fee: String(business?.delivery_fee || "10"), min_order: String(business?.min_order || "40"),
    active: business?.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const updated = { ...form, delivery_fee: parseFloat(form.delivery_fee), min_order: parseFloat(form.min_order) };
    setBusiness(p => ({ ...p, ...updated }));
    try { await supabase.from("businesses").update(updated).eq("id", business?.id); } catch (_) {}
    setSaving(false);
    notify("تم حفظ الإعدادات ✅");
  }

  const cats = ["مطعم","كافيه","حلويات","عصائر","سوشي","بيتزا","شاورما","وجبات سريعة","سوبرماركت","جزارة","مخبز","أخرى"];

  return (
    <div style={{ padding: "0 0 90px" }}>
      <div style={{ background: `linear-gradient(135deg,${C.red},${C.darkRed})`, padding: "48px 20px 24px" }}>
        <div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>إعدادات العمل</div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Status card */}
        <Card style={{ padding: "16px" }}>
          <div style={{ marginBottom: 12 }}>
            <Toggle value={form.active} onChange={v => setF("active", v)} label={`حالة العمل: ${form.active ? "🟢 مفتوح" : "🔴 مغلق"}`} />
          </div>
          <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.5 }}>
            عند الإغلاق لن يظهر عملك للعملاء ولن يمكنهم الطلب منك.
          </div>
        </Card>

        {/* Info */}
        <Card style={{ padding: "20px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 14 }}>📋 معلومات العمل</div>
          <Field label="اسم العمل" required>
            <Input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="اسم مطعمك أو متجرك" />
          </Field>
          <Field label="نوع العمل">
            <Select value={form.category} onChange={e => setF("category", e.target.value)}>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="المدينة">
            <Input value={form.location} onChange={e => setF("location", e.target.value)} placeholder="المدينة أو البلدة" />
          </Field>
          <Field label="العنوان">
            <Input value={form.address} onChange={e => setF("address", e.target.value)} placeholder="الشارع والمنطقة" />
          </Field>
          <Field label="الهاتف">
            <Input value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="04-XXX-XXXX" type="tel" />
          </Field>
          <Field label="الوصف">
            <Textarea value={form.description} onChange={e => setF("description", e.target.value)} placeholder="وصف مختصر عن عملك..." />
          </Field>
        </Card>

        {/* Hours & delivery */}
        <Card style={{ padding: "20px" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.dark, marginBottom: 14 }}>⚙️ ساعات وتوصيل</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="وقت الفتح">
              <Input value={form.open_time} onChange={e => setF("open_time", e.target.value)} type="time" />
            </Field>
            <Field label="وقت الإغلاق">
              <Input value={form.close_time} onChange={e => setF("close_time", e.target.value)} type="time" />
            </Field>
            <Field label="رسوم التوصيل (₪)">
              <Input value={form.delivery_fee} onChange={e => setF("delivery_fee", e.target.value)} type="number" />
            </Field>
            <Field label="الحد الأدنى (₪)">
              <Input value={form.min_order} onChange={e => setF("min_order", e.target.value)} type="number" />
            </Field>
          </div>
        </Card>

        {/* Status info */}
        <Card style={{ padding: "16px", background: business?.verified ? C.lightGreen : C.lightYellow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{business?.verified ? "✅" : "⏳"}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: business?.verified ? C.darkGreen : "#92400E" }}>
                {business?.verified ? "حسابك موثّق ✅" : "الحساب قيد المراجعة"}
              </div>
              <div style={{ fontSize: 11, color: business?.verified ? C.green : "#B45309" }}>
                {business?.verified ? "عملك يظهر للعملاء على Yougo" : "سيتم مراجعة حسابك خلال 24 ساعة"}
              </div>
            </div>
          </div>
        </Card>

        <Btn onClick={save} disabled={saving} size="lg" full>
          {saving ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
        </Btn>

        <button onClick={onLogout} style={{ background: C.lightRed, border: "none", borderRadius: 12, padding: "14px", color: C.red, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
          🚪 تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BUSINESS PORTAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function BusinessPortal({ onBack }) {
  const [authed, setAuthed]       = useState(false);
  const [business, setBusiness]   = useState(null);
  const [tab, setTab]             = useState("home");
  const [orders, setOrders]       = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [offers, setOffers]       = useState([]);
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(false);

  const notify = (msg, type = "success") => setToast({ msg, type });

  useEffect(() => {
    if (!business?.id) return;
    setLoading(true);
    const bizId = business.id;

    Promise.all([
      supabase.from("orders").select("*").eq("restaurant_id", bizId).order("created_at", { ascending: false }).limit(100),
      supabase.from("menu_items").select("*").eq("business_id", bizId),
      supabase.from("offers").select("*").eq("business_id", bizId),
    ]).then(([o, m, of]) => {
      if (o.data) setOrders(o.data);
      if (m.data) setMenuItems(m.data);
      if (of.data) setOffers(of.data);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Realtime orders
    const ch = supabase.channel("biz-orders-" + bizId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${bizId}` }, p => {
        setOrders(prev => [p.new, ...prev]);
        notify(`🔔 طلب جديد من ${p.new.customer_name}!`, "info");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${bizId}` }, p => {
        setOrders(prev => prev.map(o => o.id === p.new.id ? p.new : o));
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [business?.id]);

  if (!authed) return (
    <BusinessAuth
      onBack={onBack}
      onDone={(biz) => { setBusiness(biz); setAuthed(true); }}
    />
  );

  const newOrdersCount = orders.filter(o => o.status === "جديد").length;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: C.bg, direction: "rtl", fontFamily: "'Cairo', system-ui, -apple-system, sans-serif", position: "relative" }}>

      {tab === "home"     && <HomeTab     business={business} orders={orders} menuItems={menuItems} offers={offers} setTab={setTab} />}
      {tab === "orders"   && <OrdersTab   orders={orders} setOrders={setOrders} business={business} notify={notify} />}
      {tab === "menu"     && <MenuTab     business={business} menuItems={menuItems} setMenuItems={setMenuItems} notify={notify} />}
      {tab === "offers"   && <OffersTab   business={business} offers={offers} setOffers={setOffers} notify={notify} />}
      {tab === "settings" && <SettingsTab business={business} setBusiness={setBusiness} notify={notify} onLogout={() => { setAuthed(false); setBusiness(null); onBack(); }} />}
      {tab === "qr"       && <QRTab       business={business} />}

      <BottomNav tab={tab} setTab={setTab} newOrdersCount={newOrdersCount} />

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {loading && (
        <div style={{ position: "fixed", top: 14, right: "50%", transform: "translateX(50%)", background: C.dark, color: "#fff", borderRadius: 20, padding: "6px 14px", fontSize: 11, fontWeight: 600, zIndex: 999 }}>
          جاري التحميل...
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.85} }
      `}</style>
    </div>
  );
}
