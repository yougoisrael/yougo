// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  InvitePage.jsx — Referral / Invite system
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, IcoBack, IcoCheck, IcoGift, IcoUsers, IcoWhatsApp, IcoTelegram, IcoShare, IcoCopy } from "../components/Icons";
import GuestBanner from "../components/GuestBanner";

export default function InvitePage({ user, guest, onLogin }) {
  if (guest) return <GuestBanner onLogin={onLogin} message="כדי להזמין חברים ולקבל הטבות, יש להתחבר" />;
  const navigate = useNavigate();
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "חבר";
  const refCode = "YOUGO-" + firstName.toUpperCase().replace(/[^A-Z]/g, "X").slice(0, 4) + "30";
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(refCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share(method) {
    const msg = `הצטרף ל-YOUGO עם הקוד שלי ${refCode} וקבל ₪20 על ההזמנה הראשונה! 🎁`;
    if (method === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
    else if (method === "telegram") window.open(`https://t.me/share/url?url=https://yougo.app&text=${encodeURIComponent(msg)}`);
    else if (method === "native" && navigator.share) navigator.share({ title: "YOUGO", text: msg });
    else copyCode();
  }

  return (
    <div className="page-enter" style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 30 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(160deg,#10B981,#059669)", padding: "44px 20px 70px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <div style={{ position: "absolute", top: 20, right: 20, opacity: 0.12 }}><IcoGift s={100} c="white"/></div>
        <button onClick={() => navigate(-1)}
          style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 20 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 28, fontWeight: 900 }}>הזמן חברים</div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, marginTop: 6 }}>אתה מרוויח ₪20 על כל חבר שמצטרף!</div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* How it works */}
        <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 16, marginTop: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 12 }}>איך זה עובד?</div>
          {[
            { n: "1", t: "שתף את הקוד שלך", d: "שלח לחבר את קוד ההפניה האישי שלך" },
            { n: "2", t: "חבר מצטרף", d: "הוא מזין את הקוד ונרשם ל-YOUGO" },
            { n: "3", t: "שניכם מרוויחים", d: "אתה מקבל ₪20, הוא מקבל ₪20 על ההזמנה הראשונה" },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < 2 ? 12 : 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#10B981", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{step.n}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: C.dark }}>{step.t}</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{step.d}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ref code */}
        <div style={{ background: "linear-gradient(135deg,#111827,#1f2937)", borderRadius: 18, padding: "20px", marginBottom: 16, textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>הקוד האישי שלך</div>
          <div style={{ color: "white", fontSize: 28, fontWeight: 900, letterSpacing: 3, marginBottom: 14 }}>{refCode}</div>
          <button onClick={copyCode}
            style={{ background: copied ? "#10B981" : C.red, color: "white", border: "none", borderRadius: 14, padding: "12px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, margin: "0 auto", transition: "background 0.3s" }}>
            {copied ? <><IcoCheck s={15} c="white" />הועתק!</> : <><IcoCopy s={15} c="white" />העתק קוד</>}
          </button>
        </div>

        {/* Share buttons */}
        <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, marginBottom: 10 }}>שתף דרך:</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[
            { Ico: IcoWhatsApp, l: "WhatsApp", k: "whatsapp", bg: "#25D366" },
            { Ico: IcoTelegram, l: "Telegram", k: "telegram", bg: "#229ED9" },
            { Ico: IcoShare,    l: "שתף",      k: "native",   bg: C.dark },
          ].map(s => (
            <button key={s.k} onClick={() => share(s.k)}
              style={{ flex: 1, background: s.bg, color: "white", border: "none", borderRadius: 14, padding: "12px 8px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "Arial,sans-serif" }}>
              <s.Ico s={20} c="white"/>{s.l}
            </button>
          ))}
        </div>
      </div>

      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}
