import { useState } from "react";
import { supabase } from "./supabase";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@yougo.app";

export function AdminAuthGuard({ children, onBack }) {
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [signing,  setSigning]  = useState(false);

  // ✅ FIX: نتحقق من الأدمين بدون ما نطرد المستخدم العادي
  // بنتحقق من الإيميل والباسورد، لو صح بنفتح الأدمين بالـ state فقط
  async function handleLogin(e) {
    e.preventDefault();
    setSigning(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    if (err || data.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError("بريد أو كلمة سر خاطئة");
      setSigning(false);
      return;
    }
    setAdminAuthed(true);
    setSigning(false);
  }

  if (!adminAuthed) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#0F172A,#1E293B)", fontFamily:"system-ui", direction:"rtl", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:24, padding:"36px 32px", width:"100%", maxWidth:380, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <svg width="56" height="56" viewBox="0 0 60 60" fill="none">
            <rect width="60" height="60" rx="16" fill="#C8102E"/>
            <path d="M12 42V20l16 16V20" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M34 30h16M42 24l8 6-8 6" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize:20, fontWeight:900, color:"#0F172A", marginTop:10 }}>لوحة الإدارة</div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Yougo Admin</div>
        </div>
        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@yougo.app" required
            style={{ border:"1.5px solid #E5E7EB", borderRadius:10, padding:"11px 13px", fontSize:13, outline:"none", direction:"ltr" }}/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
            style={{ border:"1.5px solid #E5E7EB", borderRadius:10, padding:"11px 13px", fontSize:13, outline:"none", direction:"ltr" }}/>
          {error && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:10, fontSize:12, color:"#DC2626" }}>
              ⚠️ {error}
            </div>
          )}
          <button type="submit" disabled={signing}
            style={{ background:"#C8102E", color:"white", border:"none", borderRadius:12, padding:13, fontSize:14, fontWeight:700, cursor:signing?"not-allowed":"pointer", opacity:signing?0.7:1 }}>
            {signing ? "...جاري الدخول" : "🔐 دخول للوحة الإدارة"}
          </button>
        </form>
        <button onClick={onBack} style={{ width:"100%", background:"transparent", border:"1.5px solid #E5E7EB", borderRadius:12, padding:11, fontSize:13, cursor:"pointer", color:"#6B7280", marginTop:12 }}>
          ← رجوع
        </button>
      </div>
      <style>{"*{box-sizing:border-box}"}</style>
    </div>
  );

  // ✅ FIX: onLogout فقط يطفي الأدمين بدون signOut — المستخدم العادي يبقى مسجل
  return children({ onLogout: () => { setAdminAuthed(false); onBack(); } });
}
