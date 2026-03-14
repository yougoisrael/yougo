// ════════════════════════════════════════════════════════════
//  SettingsSheet.jsx — הגדרות
//  Opens as BottomSheet from ProfilePage
//  Sections: change email | change password | language | danger zone
// ════════════════════════════════════════════════════════════

import { useState } from "react";
import BottomSheet from "../components/BottomSheet";
import { supabase } from "../lib/supabase";

const R  = "#C8102E";
const DK = "#111827";
const GR = "#6B7280";
const BD = "#E5E7EB";
const WH = "#FFFFFF";
const BG = "#F7F7F8";

const CSS = `
  @keyframes _st_spin{to{transform:rotate(360deg)}}
  @keyframes _st_in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  ._st_in{animation:_st_in .2s ease both}
  *{box-sizing:border-box}
`;

function Spin(){
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    style={{animation:"_st_spin .7s linear infinite",flexShrink:0}}>
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5"
      strokeDasharray="40" strokeDashoffset="14" strokeLinecap="round"/>
  </svg>;
}

function Field({ label, value, onChange, placeholder, type="text", dir="rtl", error, disabled }) {
  const [f,setF]=useState(false);
  return (
    <div style={{marginBottom:14}}>
      {label&&<div style={{fontSize:12,fontWeight:700,color:GR,marginBottom:6,direction:"rtl"}}>{label}</div>}
      <input value={value} onChange={onChange} placeholder={placeholder}
        type={type} dir={dir} disabled={disabled}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{
          width:"100%",padding:"13px 14px",
          border:`1.5px solid ${error?R:f?R:BD}`,
          borderRadius:14,fontSize:14,outline:"none",
          background:disabled?"#F9FAFB":WH,
          direction:dir,fontFamily:"inherit",color:DK,
          transition:"border-color .15s",
        }}
      />
      {error&&<div style={{color:R,fontSize:11,fontWeight:600,marginTop:4,direction:"rtl"}}>{error}</div>}
    </div>
  );
}

function Btn({ children, onClick, loading, disabled, color=R, bg, style:sx }){
  const active=!disabled&&!loading;
  return (
    <button onClick={onClick} disabled={!active} style={{
      width:"100%",padding:"13px",borderRadius:14,border:"none",
      background:bg||(active?color:"rgba(200,16,46,0.4)"),
      color:"white",fontSize:14,fontWeight:800,cursor:active?"pointer":"not-allowed",
      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      fontFamily:"inherit",transition:"all .15s",...sx,
    }}>
      {loading&&<Spin/>}
      {children}
    </button>
  );
}

function Section({ title, icon, children, accent="#F9FAFB", borderColor=BD }){
  return (
    <div style={{
      background:accent,border:`1.5px solid ${borderColor}`,
      borderRadius:16,padding:"16px",marginBottom:14,
    }}>
      <div style={{fontSize:13,fontWeight:800,color:DK,marginBottom:14,
        display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{icon}</span>{title}
      </div>
      {children}
    </div>
  );
}

function Toast({ msg, ok }){
  if(!msg) return null;
  return (
    <div style={{
      position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",
      background:ok?"#064E3B":"#7F1D1D",color:"white",
      padding:"12px 22px",borderRadius:14,fontSize:13,fontWeight:700,
      boxShadow:"0 8px 24px rgba(0,0,0,.2)",zIndex:9999,
      animation:"_st_in .25s ease both",whiteSpace:"nowrap",
    }}>
      {ok?"✓ ":"⚠️ "}{msg}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function SettingsSheet({ open, onClose, user, onLogout }){
  // change email
  const [newEmail,    setNewEmail]    = useState("");
  const [emailBusy,   setEmailBusy]  = useState(false);
  const [emailErr,    setEmailErr]   = useState("");

  // change password
  const [curPw,       setCurPw]      = useState("");
  const [newPw,       setNewPw]      = useState("");
  const [newPw2,      setNewPw2]     = useState("");
  const [showCur,     setShowCur]    = useState(false);
  const [showNew,     setShowNew]    = useState(false);
  const [pwBusy,      setPwBusy]     = useState(false);
  const [pwErr,       setPwErr]      = useState("");

  // delete account
  const [confirmDel,  setConfirmDel] = useState(false);
  const [delBusy,     setDelBusy]    = useState(false);

  // language (UI only — no translation yet)
  const [lang,        setLang]       = useState("he");

  // toast
  const [toast,       setToast]      = useState(null);

  const showToast = (msg,ok=true) => {
    setToast({msg,ok});
    setTimeout(()=>setToast(null),3000);
  };

  const validatePw = v => {
    if(!v||v.length<8) return "לפחות 8 תווים";
    if(!/[A-Z]/.test(v)) return "חייב אות גדולה אחת";
    if(!/\d/.test(v))    return "חייב מספר אחד לפחות";
    return null;
  };

  // ── change email ──────────────────────────────────────────
  async function doChangeEmail(){
    setEmailErr("");
    const e=newEmail.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){setEmailErr("אימייל לא תקין");return;}
    setEmailBusy(true);
    const {error} = await supabase.auth.updateUser({email:e});
    setEmailBusy(false);
    if(error){setEmailErr(error.message||"שגיאה");return;}
    setNewEmail("");
    showToast("קישור אימות נשלח לאימייל החדש");
  }

  // ── change password ───────────────────────────────────────
  async function doChangePassword(){
    setPwErr("");
    const ve=validatePw(newPw);
    if(ve){setPwErr(ve);return;}
    if(newPw!==newPw2){setPwErr("הסיסמאות אינן תואמות");return;}
    setPwBusy(true);
    // re-auth first
    const {error:signErr} = await supabase.auth.signInWithPassword({
      email:user?.email||"", password:curPw
    });
    if(signErr){setPwBusy(false);setPwErr("הסיסמה הנוכחית שגויה");return;}
    const {error} = await supabase.auth.updateUser({password:newPw});
    setPwBusy(false);
    if(error){setPwErr(error.message||"שגיאה");return;}
    setCurPw(""); setNewPw(""); setNewPw2("");
    showToast("הסיסמה עודכנה בהצלחה ✓");
  }

  // ── delete account ────────────────────────────────────────
  async function doDelete(){
    setDelBusy(true);
    // sign out is the safe client-side action; server-side deletion via Edge Function if needed
    await supabase.auth.signOut();
    setDelBusy(false);
    onLogout?.();
    onClose();
  }

  return (
    <>
      <style>{CSS}</style>
      <BottomSheet open={open} onClose={onClose} maxHeight="92vh" zIndex={8500}>
        <div style={{padding:"6px 20px 50px",direction:"rtl",fontFamily:"'Segoe UI',Arial,sans-serif"}}>

          {/* Header */}
          <div style={{textAlign:"center",marginBottom:22}}>
            <div style={{fontSize:18,fontWeight:900,color:DK}}>⚙️ הגדרות</div>
            <div style={{fontSize:13,color:GR,marginTop:4}}>ניהול החשבון שלך</div>
          </div>

          {/* ── Change Email ── */}
          <Section title="שינוי אימייל" icon="✉️">
            <div style={{fontSize:12,color:GR,marginBottom:10,direction:"rtl"}}>
              אימייל נוכחי: <b style={{color:DK}}>{user?.email||"—"}</b>
            </div>
            <Field label="אימייל חדש" value={newEmail}
              onChange={e=>{setNewEmail(e.target.value);setEmailErr("");}}
              placeholder="new@email.com" type="email" dir="ltr"
              error={emailErr} disabled={emailBusy}/>
            <Btn onClick={doChangeEmail} loading={emailBusy} disabled={!newEmail.trim()}>
              שלח קישור אימות
            </Btn>
          </Section>

          {/* ── Change Password ── */}
          <Section title="שינוי סיסמה" icon="🔑">
            <div style={{position:"relative",marginBottom:14}}>
              <Field label="סיסמה נוכחית" value={curPw}
                onChange={e=>{setCurPw(e.target.value);setPwErr("");}}
                placeholder="הסיסמה הנוכחית שלך"
                type={showCur?"text":"password"} dir="ltr" disabled={pwBusy}/>
              <button onClick={()=>setShowCur(p=>!p)} style={{
                position:"absolute",left:14,top:36,
                background:"none",border:"none",cursor:"pointer",color:GR,padding:0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {showCur
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></>
                    : <><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
                  }
                </svg>
              </button>
            </div>
            <div style={{position:"relative",marginBottom:14}}>
              <Field label="סיסמה חדשה" value={newPw}
                onChange={e=>{setNewPw(e.target.value);setPwErr("");}}
                placeholder="לפחות 8 תווים, אות גדולה ומספר"
                type={showNew?"text":"password"} dir="ltr" disabled={pwBusy}/>
              <button onClick={()=>setShowNew(p=>!p)} style={{
                position:"absolute",left:14,top:36,
                background:"none",border:"none",cursor:"pointer",color:GR,padding:0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {showNew
                    ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></>
                    : <><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>
                  }
                </svg>
              </button>
            </div>
            <Field label="אימות סיסמה חדשה" value={newPw2}
              onChange={e=>{setNewPw2(e.target.value);setPwErr("");}}
              placeholder="חזור על הסיסמה החדשה"
              type="password" dir="ltr" disabled={pwBusy}
              error={pwErr}/>
            <Btn onClick={doChangePassword} loading={pwBusy} disabled={!curPw||!newPw||!newPw2}>
              עדכן סיסמה
            </Btn>
          </Section>

          {/* ── Language ── */}
          <Section title="שפת האפליקציה" icon="🌐">
            <div style={{display:"flex",gap:8}}>
              {[{v:"he",l:"עברית 🇮🇱"},{v:"ar",l:"عربي 🇵🇸"}].map(lg=>(
                <button key={lg.v} onClick={()=>setLang(lg.v)} style={{
                  flex:1,padding:"11px 8px",borderRadius:12,
                  border:`2px solid ${lang===lg.v?R:BD}`,
                  background:lang===lg.v?"rgba(200,16,46,0.06)":WH,
                  color:lang===lg.v?R:GR,fontSize:13,fontWeight:lang===lg.v?700:500,
                  cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
                }}>
                  {lg.l}
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:GR,marginTop:8,textAlign:"center"}}>
              * תרגום מלא יתווסף בגרסה הבאה
            </div>
          </Section>

          {/* ── Advanced / Delete ── */}
          <Section title="הגדרות מתקדמות" icon="🔧" accent="#FFF5F5" borderColor="#FEE2E2">
            {!confirmDel ? (
              <button onClick={()=>setConfirmDel(true)} style={{
                width:"100%",padding:"13px",borderRadius:14,
                border:"2px solid #FEE2E2",background:WH,
                color:"#EF4444",fontSize:14,fontWeight:700,
                cursor:"pointer",fontFamily:"inherit",
              }}>
                🗑️ מחיקת חשבון
              </button>
            ) : (
              <div className="_st_in">
                <div style={{
                  background:"#FEF2F2",border:"1px solid #FCA5A5",
                  borderRadius:12,padding:"12px 14px",marginBottom:12,
                  fontSize:13,color:"#991B1B",fontWeight:600,direction:"rtl",
                }}>
                  ⚠️ פעולה זו בלתי הפיכה — כל הנתונים שלך יימחקו לצמיתות
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>setConfirmDel(false)} style={{
                    flex:1,padding:"12px",borderRadius:12,
                    border:`1.5px solid ${BD}`,background:WH,
                    color:DK,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  }}>
                    ביטול
                  </button>
                  <button onClick={doDelete} disabled={delBusy} style={{
                    flex:1,padding:"12px",borderRadius:12,
                    border:"none",background:"#EF4444",
                    color:"white",fontSize:13,fontWeight:700,
                    cursor:delBusy?"not-allowed":"pointer",fontFamily:"inherit",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:6,
                  }}>
                    {delBusy&&<Spin/>}
                    מחק חשבון
                  </button>
                </div>
              </div>
            )}
          </Section>

        </div>
      </BottomSheet>
      {toast && <Toast msg={toast.msg} ok={toast.ok}/>}
    </>
  );
}
