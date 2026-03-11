// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ProfilePage.jsx
//  ✅ FIX: name/phone edits saved to Supabase user_metadata
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, IcoUser, IcoBack, IcoChevDown, IcoShield } from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import GuestBanner from "../components/GuestBanner";

const MENU_ITEMS = [
  { icon: "📦", label: "ההזמנות שלי",   path: "/orders" },
  { icon: "📍", label: "כתובות שמורות", path: null, key: "addresses" },
  { icon: "💳", label: "אמצעי תשלום",   path: "/cards" },
  { icon: "🎁", label: "הטבות וקופונים", path: null, key: "coupons" },
  { icon: "👥", label: "הזמן חבר",       path: "/invite" },
  { icon: "🛡️", label: "אבטחה",          path: null, key: "security" },
  { icon: "🔔", label: "התראות",          path: null, key: "notifications" },
  { icon: "❓", label: "תמיכה",           path: "/support" },
  { icon: "📄", label: "תנאי שימוש",     path: "/terms" },
  { icon: "🔒", label: "מדיניות פרטיות", path: "/privacy" },
];

export default function ProfilePage({ user, cartCount, onLogout, onUserUpdate, guest, onLogin }) {
  const navigate = useNavigate();
  if (guest) return (
    <div style={{ fontFamily: "Arial,sans-serif", background: "#F7F7F8", minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "60px 20px 80px", position: "relative", overflow: "hidden", textAlign: "center" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: "#F7F7F8", borderRadius: "50% 50% 0 0" }} />
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 12px", border: "2.5px solid rgba(255,255,255,0.4)" }}>👤</div>
        <div style={{ color: "white", fontSize: 20, fontWeight: 900 }}>אורח</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>אינך מחובר</div>
      </div>
      <div style={{ padding: "24px 16px" }}>
        <button onClick={onLogin}
          style={{ width: "100%", background: "#C8102E", color: "white", border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 10, boxShadow: "0 6px 20px rgba(200,16,46,0.3)" }}>
          התחבר / הירשם
        </button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>כדי לגשת לפרופיל, הזמנות, קופונים ועוד</div>
      </div>
      <BottomNav cartCount={cartCount} />
    </div>
  );
  const [editing, setEditing]               = useState(false);
  const [name, setName]                     = useState(user?.name || "משתמש");
  const [phone, setPhone]                   = useState(user?.phone || "");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifs, setNotifs]                 = useState({ orders: true, promos: true, news: false });
  const [saving, setSaving]                 = useState(false);
  const [saveOk, setSaveOk]                 = useState(false);

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  function handleNav(item) {
    if (item.path) { navigate(item.path); return; }
    if (item.key === "notifications") setEditing("notifications");
    else if (item.key === "security")  setEditing("security");
    else if (item.key === "addresses") setEditing("addresses");
    else if (item.key === "coupons")   setEditing("coupons");
  }

  // ✅ FIX: Save name to Supabase user_metadata
  async function saveName() {
    setSaving(true);
    const parts = name.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName  = parts.slice(1).join(" ") || "";
    const { error } = await supabase.auth.updateUser({
      data: { firstName, lastName, phone }
    });
    setSaving(false);
    if (!error) {
      setSaveOk(true);
      // ✅ Update parent state so navbar reflects new name immediately
      if (onUserUpdate) onUserUpdate({ name: name.trim(), firstName, phone });
      setTimeout(() => setSaveOk(false), 2000);
    }
    setEditing(false);
  }

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 70px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "white", border: "2.5px solid rgba(255,255,255,0.5)", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            {editing === "name" ? (
              <div>
                <input value={name} onChange={e => setName(e.target.value)} autoFocus
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", borderBottom: "2px solid white", color: "white", fontSize: 18, fontWeight: 900, outline: "none", width: "100%", fontFamily: "Arial,sans-serif", marginBottom: 6 }} />
                <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d-]/g, ""))}
                  placeholder="מספר טלפון"
                  style={{ background: "rgba(255,255,255,0.1)", border: "none", borderBottom: "1px solid rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.9)", fontSize: 13, outline: "none", width: "100%", fontFamily: "Arial,sans-serif", direction: "ltr", textAlign: "right", marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveName} disabled={saving}
                    style={{ background: "white", color: C.red, border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    {saving ? "שומר..." : saveOk ? "✅ נשמר" : "שמור"}
                  </button>
                  <button onClick={() => setEditing(false)}
                    style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}>
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "white", fontSize: 20, fontWeight: 900 }}>{name}</div>
                  <button onClick={() => setEditing("name")} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.7, fontSize: 14 }}>✏️</button>
                </div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 3 }}>{user?.email || phone || "לחץ לעריכה"}</div>
                {saveOk && <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, marginTop: 4 }}>✅ השינויים נשמרו</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications sub-panel */}
      {editing === "notifications" && (
        <div style={{ background: "white", borderRadius: 18, margin: "0 16px 12px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>🔔 התראות</div>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, fontSize: 12 }}>✕</button>
          </div>
          {[{ k: "orders", l: "עדכוני הזמנות" }, { k: "promos", l: "מבצעים והטבות" }, { k: "news", l: "חדשות ועדכונים" }].map(n => (
            <div key={n.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + C.lightGray }}>
              <span style={{ fontSize: 14, color: C.dark }}>{n.l}</span>
              <div onClick={() => setNotifs(p => ({ ...p, [n.k]: !p[n.k] }))}
                style={{ width: 44, height: 24, borderRadius: 12, background: notifs[n.k] ? C.red : C.lightGray, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                <div style={{ position: "absolute", top: 2, left: notifs[n.k] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security sub-panel */}
      {editing === "security" && (
        <div style={{ background: "white", borderRadius: 18, margin: "0 16px 12px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>🛡️ אבטחה</div>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, fontSize: 12 }}>✕</button>
          </div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>
            חשבונך מאובטח באמצעות OTP לאימייל <strong style={{ color: C.dark }}>{user?.email}</strong>.<br />
            לשינוי אימייל, פנה לתמיכה.
          </div>
          <button onClick={() => navigate("/support")}
            style={{ marginTop: 14, background: C.ultra, border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", color: C.dark }}>
            📞 פנה לתמיכה
          </button>
        </div>
      )}

      {/* Coupons sub-panel */}
      {editing === "coupons" && (
        <div style={{ background: "white", borderRadius: 18, margin: "0 16px 12px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>🎁 קופונים</div>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, fontSize: 12 }}>✕</button>
          </div>
          <div style={{ background: "linear-gradient(135deg,#C8102E,#9B0B22)", borderRadius: 14, padding: "14px", marginBottom: 10 }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>NAAT10</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 }}>10% הנחה על כל הזמנה</div>
          </div>
          <div style={{ fontSize: 12, color: C.gray }}>השתמש בקוד NAAT10 בעגלה לקבלת ההנחה</div>
        </div>
      )}

      {/* Addresses sub-panel */}
      {editing === "addresses" && (
        <div style={{ background: "white", borderRadius: 18, margin: "0 16px 12px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: C.dark }}>📍 כתובות שמורות</div>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gray, fontSize: 12 }}>✕</button>
          </div>
          {["הבית — רחוב הרצל 12, תל אביב", "העבודה — דרך מנחם בגין 50, תל אביב"].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid " + C.lightGray }}>
              <span style={{ fontSize: 18 }}>{i === 0 ? "🏠" : "🏢"}</span>
              <span style={{ fontSize: 13, color: C.dark }}>{a}</span>
            </div>
          ))}
          <button style={{ marginTop: 12, background: C.ultra, border: "1.5px dashed " + C.lightGray, borderRadius: 12, padding: "10px", width: "100%", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.gray }}>
            + הוסף כתובת חדשה
          </button>
        </div>
      )}

      {/* Menu list */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "white", borderRadius: 18, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.07)", marginBottom: 16 }}>
          {MENU_ITEMS.map((item, i) => (
            <div key={i} onClick={() => handleNav(item)}
              style={{ display: "flex", alignItems: "center", padding: "14px 16px", cursor: "pointer", borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid " + C.ultra : "none", background: "white" }}>
              <span style={{ fontSize: 20, width: 32 }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.dark }}>{item.label}</span>
              <IcoChevDown s={14} c={C.gray} />
            </div>
          ))}
        </div>

        {/* Logout */}
        {!showLogoutConfirm ? (
          <button onClick={() => setShowLogoutConfirm(true)}
            style={{ width: "100%", background: "white", color: "#EF4444", border: "2px solid #FEE2E2", borderRadius: 16, padding: "14px", fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>
            🚪 התנתקות
          </button>
        ) : (
          <div style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.07)", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, marginBottom: 8 }}>בטוח שאתה רוצה להתנתק?</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, background: C.ultra, border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: C.dark }}>
                ביטול
              </button>
              <button onClick={onLogout}
                style={{ flex: 1, background: "#EF4444", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "white" }}>
                התנתק
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", color: C.gray, fontSize: 11, marginBottom: 8 }}>YOUGO v2.0 · כل الحقوق محفوظة</div>
      </div>

      <BottomNav cartCount={cartCount} />
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}
