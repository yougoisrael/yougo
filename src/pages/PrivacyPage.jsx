// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PrivacyPage.jsx — Privacy Policy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useNavigate } from "react-router-dom";
import { C, IcoBack } from "../components/Icons";

const SECTIONS = [
  { title: "1. מידע שאנחנו אוספים", content: "אנחנו אוספים מידע אישי שאתה מספק לנו, כולל שם, מספר טלפון, כתובת למשלוח, ומידע על הזמנות. כמו כן אנחנו אוספים נתוני שימוש כמו היסטוריית הזמנות, העדפות, ומידע טכני על המכשיר שלך." },
  { title: "2. איך אנחנו משתמשים במידע", content: "המידע משמש לעיבוד הזמנות, שיפור השירות, שליחת עדכונים על הזמנות, מתן תמיכה, התאמה אישית של חווית המשתמש, וניתוח שימוש לשיפור האפליקציה." },
  { title: "3. שיתוף מידע", content: "אנחנו לא מוכרים את המידע האישי שלך לצד שלישי. אנחנו עשויים לשתף מידע עם שותפי משלוח וסאפלייר ים לצורך ביצוע ההזמנות, ועם גורמים רגולטוריים אם נדרש על פי חוק." },
  { title: "4. אבטחת מידע", content: "אנחנו משתמשים בטכנולוגיות הצפנה מתקדמות כדי להגן על המידע שלך. גישה למידע אישי מוגבלת לעובדים מורשים בלבד." },
  { title: "5. זכויותיך", content: "יש לך זכות לעיין במידע האישי שלך, לתקן אותו, ולבקש מחיקתו. לבקשות פנה אלינו דרך דף התמיכה." },
  { title: "6. עוגיות ומעקב", content: "האפליקציה משתמשת בעוגיות ובטכנולוגיות דומות לשיפור חוויית המשתמש ולצרכי אנליטיקה. ניתן לכבות עוגיות בהגדרות המכשיר." },
  { title: "7. שינויים במדיניות", content: "אנחנו עשויים לעדכן מדיניות זו מעת לעת. נודיע לך על שינויים מהותיים דרך האפליקציה." },
];

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="page-enter" style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 30 }}>
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 14 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 24, fontWeight: 900 }}>🔒 מדיניות פרטיות</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 }}>עודכן לאחרונה: ינואר 2025</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "rgba(200,16,46,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, borderRight: "4px solid " + C.red }}>
          <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>
            ב-YOUGO אנחנו מחויבים להגנה על פרטיותך. מדיניות זו מסבירה כיצד אנחנו אוספים, משתמשים ומגנים על המידע האישי שלך.
          </div>
        </div>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7 }}>{s.content}</div>
          </div>
        ))}
        <div style={{ textAlign: "center", padding: "16px", color: C.gray, fontSize: 12 }}>
          לשאלות ופניות: <span style={{ color: C.red, fontWeight: 700 }}>privacy@yougo.app</span>
        </div>
      </div>
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}
