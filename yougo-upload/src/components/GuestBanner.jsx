// GuestBanner — shown on pages that require login
import { C } from "./Icons";

export default function GuestBanner({ onLogin, message = "כדי להשתמש בתכונה זו, יש להתחבר" }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "Arial,sans-serif", direction: "rtl"
    }}>
      <div style={{
        background: "white", borderRadius: "24px 24px 0 0", padding: "28px 24px 40px",
        width: "100%", maxWidth: 430, animation: "slideUp .3s cubic-bezier(.34,1.56,.64,1)"
      }}>
        <div style={{ textAlign: "center", fontSize: 44, marginBottom: 12 }}>🔒</div>
        <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, color: "#111827", marginBottom: 6 }}>
          נדרשת התחברות
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "#6B7280", marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </div>
        <button onClick={onLogin}
          style={{ width: "100%", background: C.red, color: "white", border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 6px 20px rgba(200,16,46,0.35)", marginBottom: 10 }}>
          התחבר / הירשם
        </button>
        <div style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
          או המשך לגלוש בלי חשבון
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}
