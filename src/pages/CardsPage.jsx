// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  OrdersPage.jsx — Real-time order tracking ✅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C, IcoCheck, IcoFork, IcoPackage, IcoClose } from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import GuestBanner from "../components/GuestBanner";

const TABS = [
  { key: "all",       label: "הכל" },
  { key: "active",    label: "פעילות" },
  { key: "completed", label: "הושלמו" },
  { key: "cancelled", label: "בוטלו" },
];

const STATUS_MAP = {
  "جديد":           { label: "ממתין לאישור", color: "#F59E0B", icon: "🕐" },
  "قيد التحضير":    { label: "בהכנה",        color: "#F97316", icon: "👨‍🍳" },
  "في الطريق":      { label: "בדרך אליך",    color: "#8B5CF6", icon: "🛵" },
  "مكتمل":          { label: "הושלמה",        color: "#10B981", icon: "✅" },
  "ملغي":           { label: "בוטלה",         color: "#EF4444", icon: "❌" },
};

const ACTIVE_STATUSES = ["جديد", "قيد التحضير", "في الطريق"];
const STEPS = ["جديد", "قيد التحضير", "في الطريق", "مكتمل"];
const STEP_LABELS = ["התקבלה", "בהכנה", "בדרך", "הגיע!"];
const STEP_ICONS  = ["✅", "👨‍🍳", "🛵", "🎉"];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

// ── Live badge — מציג "LIVE" כשיש הזמנה פעילה ──
function LiveBadge() {
  const [dot, setDot] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setDot(p => !p), 800);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 20, padding: "3px 10px" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dot ? C.red : "transparent", transition: "background 0.3s" }} />
      <span style={{ fontSize: 10, fontWeight: 800, color: C.red }}>LIVE</span>
    </div>
  );
}

// ── Progress bar for active orders ──
function OrderProgress({ status }) {
  const curIdx = STEPS.indexOf(status);
  return (
    <div style={{ margin: "12px 0 4px" }}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        {/* Line behind */}
        <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 3, background: "#F3F4F6", zIndex: 0 }} />
        <div style={{ position: "absolute", top: 14, left: 0, height: 3, background: C.red, zIndex: 1, width: `${(curIdx / (STEPS.length - 1)) * 100}%`, transition: "width 0.6s ease" }} />

        {STEPS.map((s, i) => {
          const done   = i <= curIdx;
          const active = i === curIdx;
          return (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: i === 0 ? "flex-start" : i === STEPS.length - 1 ? "flex-end" : "center", zIndex: 2 }}>
              <div style={{
                width: active ? 30 : 24,
                height: active ? 30 : 24,
                borderRadius: "50%",
                background: done ? C.red : "#F3F4F6",
                border: active ? `3px solid ${C.red}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: active ? 14 : 11,
                boxShadow: active ? `0 0 0 5px rgba(200,16,46,0.15)` : "none",
                transition: "all 0.4s",
              }}>
                {done ? <span>{STEP_ICONS[i]}</span> : <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D1D5DB" }} />}
              </div>
              <div style={{ fontSize: 9, marginTop: 5, color: done ? C.red : "#9CA3AF", fontWeight: done ? 700 : 400, textAlign: "center" }}>
                {STEP_LABELS[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage({ cartCount, user, guest, onLogin }) {
  const navigate = useNavigate();
  if (guest) return <GuestBanner onLogin={onLogin} message="כדי לצפות בהזמנות, יש להתחבר" />;

  const [tab, setTab]       = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── טעינה ראשונית ──
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    supabase.from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user?.id]);

  // ── Real-time subscription ✅ ──
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("orders-realtime-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "*",           // INSERT, UPDATE, DELETE
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // הזמנה חדשה — הוסף לרשימה
            setOrders(prev => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            // עדכון סטטוס — עדכן בזמן אמת 🔥
            setOrders(prev =>
              prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
            );
          } else if (payload.eventType === "DELETE") {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const filtered = orders.filter(o => {
    if (tab === "all")       return true;
    if (tab === "active")    return ACTIVE_STATUSES.includes(o.status);
    if (tab === "completed") return o.status === "مكتمل";
    if (tab === "cancelled") return o.status === "ملغي";
    return true;
  });

  const hasActive = orders.some(o => ACTIVE_STATUSES.includes(o.status));

  return (
    <div style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "white", fontSize: 26, fontWeight: 900 }}>ההזמנות שלי</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>{orders.length} הזמנות סה״כ</div>
          </div>
          {/* LIVE badge למשתמש עם הזמנה פעילה */}
          {hasActive && <LiveBadge />}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", padding: "14px 16px 0", gap: 6 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "9px 4px", borderRadius: 12, border: "none", background: tab === t.key ? C.red : "white", color: tab === t.key ? "white" : "#9CA3AF", fontSize: 12, fontWeight: tab === t.key ? 800 : 500, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", fontFamily: "Arial,sans-serif", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E5E7EB", borderTopColor: C.red, animation: "spin .7s linear infinite", margin: "0 auto 12px" }} />
            טוען הזמנות...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 0", color: "#9CA3AF" }}>
            <div style={{ fontSize: 50, marginBottom: 12 }}>📦</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>אין הזמנות</div>
            <div style={{ fontSize: 13, marginTop: 4, marginBottom: 24 }}>עוד לא הזמנת שום דבר</div>
            <button onClick={() => navigate("/")}
              style={{ background: C.red, color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              הזמן עכשיו
            </button>
          </div>
        ) : filtered.map(order => {
          const st = STATUS_MAP[order.status] || { label: order.status, color: "#9CA3AF", icon: "📦" };
          const isActive = ACTIVE_STATUSES.includes(order.status);

          return (
            <div key={order.id}
              style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: isActive ? `0 4px 20px rgba(200,16,46,0.12)` : "0 2px 10px rgba(0,0,0,0.06)", border: isActive ? `1.5px solid rgba(200,16,46,0.15)` : "1.5px solid transparent", transition: "all 0.3s" }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>{order.restaurant_name || "הזמנה"}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{timeAgo(order.created_at)}</div>
                </div>
                <div style={{ background: st.color + "18", color: st.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 5 }}>
                  <span>{st.icon}</span>{st.label}
                </div>
              </div>

              {/* Items */}
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10, lineHeight: 1.6 }}>
                {Array.isArray(order.items)
                  ? order.items.map((it, i) => (
                      <div key={i}>{typeof it === "object" ? `${it.name} x${it.qty}` : it}</div>
                    ))
                  : order.items}
              </div>

              {/* Progress bar — فقط للطلبات الفعالة */}
              {isActive && <OrderProgress status={order.status} />}

              {/* Footer */}
              <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: C.red }}>₪{order.total}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {order.status === "مكتمل" && (
                    <button onClick={() => navigate("/")}
                      style={{ background: "#111827", color: "white", border: "none", borderRadius: 12, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      הזמן שוב
                    </button>
                  )}
                  {order.status === "في الطريق" && (
                    <span style={{ fontSize: 12, color: "#8B5CF6", fontWeight: 700 }}>🛵 בדרך — ~15 דק׳</span>
                  )}
                  {order.status === "جديد" && (
                    <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 700, animation: "pulse 1.5s infinite" }}>⏳ ממתין לאישור...</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav cartCount={cartCount} />
      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </div>
  );
}
