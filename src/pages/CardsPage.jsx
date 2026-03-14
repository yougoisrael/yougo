// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CardsPage.jsx — אמצעי תשלום
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";
const BG   = "#F7F7F8";

export default function CardsPage({ guest, user, onLogin, cartCount }) {
  const navigate = useNavigate();

  const Header = () => (
    <div style={{ background:`linear-gradient(160deg,${RED},#9B0B22)`,
      padding:"44px 20px 60px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", bottom:-30, left:0, right:0,
        height:60, background:BG, borderRadius:"50% 50% 0 0" }}/>
      <button onClick={()=>navigate(-1)} style={{
        background:"rgba(255,255,255,.15)", border:"none", borderRadius:"50%",
        width:38, height:38, display:"flex", alignItems:"center",
        justifyContent:"center", cursor:"pointer", marginBottom:16,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      <div style={{ color:"white", fontSize:22, fontWeight:900 }}>אמצעי תשלום</div>
      <div style={{ color:"rgba(255,255,255,.75)", fontSize:13, marginTop:4 }}>
        ניהול אמצעי התשלום שלך
      </div>
    </div>
  );

  if (guest) return (
    <div style={{ fontFamily:"Arial,sans-serif", background:BG, minHeight:"100vh",
      maxWidth:430, margin:"0 auto", direction:"rtl", paddingBottom:80 }}>
      <Header/>
      <div style={{ padding:"40px 20px", textAlign:"center" }}>
        <div style={{ fontSize:52, marginBottom:16 }}>💳</div>
        <div style={{ fontSize:18, fontWeight:800, color:DARK, marginBottom:8 }}>
          התחבר לניהול תשלומים
        </div>
        <div style={{ fontSize:14, color:GRAY, marginBottom:28, lineHeight:1.6 }}>
          שמור כרטיסי אשראי לתשלום מהיר
        </div>
        <button onClick={()=>onLogin?.()} style={{
          background:`linear-gradient(135deg,${RED},#9B0B22)`,
          color:"white", border:"none", borderRadius:16,
          padding:"14px 32px", fontSize:14, fontWeight:800,
          cursor:"pointer", boxShadow:"0 6px 20px rgba(200,16,46,.3)",
        }}>
          התחבר / הירשם
        </button>
      </div>
      <BottomNav cartCount={cartCount}/>
    </div>
  );

  return (
    <div style={{ fontFamily:"Arial,sans-serif", background:BG, minHeight:"100vh",
      maxWidth:430, margin:"0 auto", direction:"rtl", paddingBottom:80 }}>
      <Header/>
      <div style={{ padding:"16px" }}>
        <div style={{ background:"white", borderRadius:16, padding:"16px 18px",
          marginBottom:12, boxShadow:"0 2px 10px rgba(0,0,0,.06)",
          display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:"#F0FDF4",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
            💵
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:DARK }}>תשלום במזומן</div>
            <div style={{ fontSize:12, color:GRAY, marginTop:2 }}>תשלום בעת האספקה</div>
          </div>
          <div style={{ background:"#DCFCE7", color:"#16A34A",
            fontSize:11, fontWeight:700, borderRadius:20, padding:"3px 10px" }}>
            פעיל
          </div>
        </div>
        <div style={{ background:"white", borderRadius:16, padding:"24px 20px",
          boxShadow:"0 2px 10px rgba(0,0,0,.06)", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🚀</div>
          <div style={{ fontSize:15, fontWeight:800, color:DARK, marginBottom:8 }}>
            תשלום בכרטיס — בקרוב!
          </div>
          <div style={{ fontSize:13, color:GRAY, lineHeight:1.7 }}>
            אנחנו עובדים על אפשרות תשלום מאובטחת.<br/>תישאר מעודכן 💳
          </div>
        </div>
      </div>
      <BottomNav cartCount={cartCount}/>
    </div>
  );
}
