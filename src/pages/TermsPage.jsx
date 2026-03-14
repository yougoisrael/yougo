// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TermsPage.jsx — Terms of Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useNavigate } from "react-router-dom";
import { C, IcoBack } from "../components/Icons";

const SECTIONS = [
  { title: "1. קבלת התנאים", content: "השימוש באפליקציית YOUGO מהווה הסכמה לתנאי שימוש אלה. אם אינך מסכים לתנאים, אנא הפסק את השימוש באפליקציה." },
  { title: "2. השירותים שלנו", content: "YOUGO מספקת פלטפורמה לתיווך בין לקוחות למסעדות ולשירותי משלוח. אנחנו לא מייצרים את האוכל ואחריות על איכות המוצרים חלה על המסעדות." },
  { title: "3. רישום וחשבון", content: "עליך להיות בן 13 לפחות לשימוש בשירות. אתה אחראי לשמירת סיסמתך ולכל הפעולות שנעשות בחשבונך." },
  { title: "4. הזמנות ותשלום", content: "הזמנה שבוצעה מחייבת. ביטול אפשרי עד 2 דקות לאחר הזמנה. מחירים כוללים מע\"מ אלא אם צוין אחרת. YOUGO גובה עמלת שירות על כל הזמנה." },
  { title: "5. מדיניות ביטול והחזרים", content: "ביטול לאחר תחילת ההכנה לא מאפשר החזר כספי. במקרה של בעיה עם הזמנה (חסר פריט, אוכל שגוי), נטפל ונפצה בהתאם לבדיקתנו." },
  { title: "6. התנהגות משתמשים", content: "אסור להשתמש בשירות למטרות בלתי חוקיות, להטריד נהגים או עובדי מסעדות, לספק מידע כוזב, או לנסות לפרוץ את מערכות האפליקציה." },
  { title: "7. קניין רוחני", content: "כל התוכן באפליקציה, כולל לוגו, עיצוב, טקסטים ותמונות, הוא רכוש YOUGO ומוגן בזכויות יוצרים. אין להעתיק או להשתמש ללא אישור." },
  { title: "8. הגבלת אחריות", content: "YOUGO לא תהיה אחראית לנזקים עקיפים, מקריים או תוצאתיים הנובעים מהשימוש בשירות. אחריותנו המרבית מוגבלת לסכום ההזמנה הספציפית." },
  { title: "9. שינויים בתנאים", content: "אנחנו שומרים לעצמנו את הזכות לשנות תנאים אלה בכל עת. המשך השימוש לאחר שינויים מהווה הסכמה לתנאים המעודכנים." },
];

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="page-enter" style={{ fontFamily: "Arial,sans-serif", background: C.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", direction: "rtl", paddingBottom: 30 }}>
      <div style={{ background: "linear-gradient(160deg,#C8102E,#9B0B22)", padding: "44px 20px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -30, left: 0, right: 0, height: 60, background: C.bg, borderRadius: "50% 50% 0 0" }} />
        <button onClick={() => navigate(-1)} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 14 }}>
          <IcoBack s={18} c="white" />
        </button>
        <div style={{ color: "white", fontSize: 24, fontWeight: 900 }}>📄 תנאי שימוש</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 4 }}>עודכן לאחרונה: ינואר 2025</div>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ background: "rgba(200,16,46,0.06)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, borderRight: "4px solid " + C.red }}>
          <div style={{ fontSize: 13, color: C.dark, lineHeight: 1.6 }}>
            ברוך הבא ל-YOUGO. אנא קרא את תנאי השימוש הבאים בעיון לפני שימוש בשירות.
          </div>
        </div>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: C.dark, marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7 }}>{s.content}</div>
          </div>
        ))}
        <div style={{ textAlign: "center", padding: "16px", color: C.gray, fontSize: 12 }}>
          לשאלות משפטיות: <span style={{ color: C.red, fontWeight: 700 }}>legal@yougo.app</span>
        </div>
      </div>
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );
}
