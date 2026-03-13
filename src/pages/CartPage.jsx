// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CartPage.jsx — v4 FINAL
//  ✅ Guest sees items only + login modal
//  ✅ Logged-in sees full checkout
//  ✅ "תשלום מאובטח" always visible above button
//  ✅ Registration: phone → email → info → password
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C, IcoBack, IcoPlus, IcoMinus, IcoClose, IcoCheck, IcoShield, IcoPin, IcoCash, IcoCreditCard } from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";

const FREE_DELIVERY_MIN = 150;
const PROMO_CODES = { "NAAT10": 0.10 };
const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";
const GREEN = "#16A34A";

// ── Validators ─────────────────────────────────────
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||"").trim());
const isPhone = v => { const d=(v||"").replace(/\D/g,""); return d.length>=9&&d.length<=12; };
const pwStrong = v => v&&v.length>=8&&/[A-Z]/.test(v)&&/\d/.test(v);
const pwErr = v => {
  if(!v||v.length<8) return "לפחות 8 תווים";
  if(!/[A-Z]/.test(v)) return "חייב אות גדולה אחת לפחות";
  if(!/\d/.test(v)) return "חייב מספר אחד לפחות";
  return null;
};

// ── Spinner ─────────────────────────────────────────
function Spinner({ s=18, c="white" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ animation:"cpSpin .8s linear infinite", flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
      <style>{`@keyframes cpSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </svg>
  );
}

// ── Eye toggle ──────────────────────────────────────
function Eye({ show, toggle }) {
  return (
    <button type="button" onClick={toggle} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",color:"#9CA3AF",flexShrink:0}}>
      {show
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      }
    </button>
  );
}

// ── Tracking Screen ─────────────────────────────────
function TrackingScreen({ orderId, total, navigate }) {
  const STEPS = [
    { label:"ההזמנה התקבלה", icon:"✅", delay:0 },
    { label:"בהכנה",          icon:"👨‍🍳", delay:4000 },
    { label:"בדרך אליך",      icon:"🛵", delay:12000 },
    { label:"הגיע!",           icon:"🎉", delay:25000 },
  ];
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const ts = STEPS.slice(1).map((s,i) => setTimeout(()=>setStepIdx(i+1), s.delay));
    return () => ts.forEach(clearTimeout);
  }, []);
  const cur = STEPS[stepIdx];
  return (
    <div style={{ fontFamily:"system-ui,Arial,sans-serif",background:"linear-gradient(160deg,#C8102E,#7B0D1E)",minHeight:"100vh",maxWidth:430,margin:"0 auto",direction:"rtl",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:60,paddingBottom:40 }}>
      <div key={stepIdx} style={{ width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:56,marginBottom:20,animation:"cpPop .5s cubic-bezier(.34,1.56,.64,1)" }}>
        {cur.icon}
      </div>
      <div style={{ color:"white",fontSize:24,fontWeight:900,marginBottom:6 }}>{cur.label}</div>
      {orderId && <div style={{ color:"rgba(255,255,255,.6)",fontSize:12,marginBottom:32 }}>הזמנה #{String(orderId).slice(-6).toUpperCase()}</div>}
      <div style={{ display:"flex",gap:0,alignItems:"center",marginBottom:36,width:"82%" }}>
        {STEPS.map((s,i)=>{
          const done=i<=stepIdx, active=i===stepIdx;
          return (
            <div key={i} style={{ display:"flex",alignItems:"center",flex:i<STEPS.length-1?1:"none" }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
                <div style={{ width:active?42:30,height:active?42:30,borderRadius:"50%",background:done?"white":"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:active?20:13,transition:"all .4s",boxShadow:active?"0 0 0 6px rgba(255,255,255,.2)":"none" }}>
                  {done?<span>{s.icon}</span>:<div style={{ width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.4)" }}/>}
                </div>
                <div style={{ color:done?"white":"rgba(255,255,255,.4)",fontSize:9,fontWeight:active?800:500,textAlign:"center",width:55 }}>{s.label}</div>
              </div>
              {i<STEPS.length-1&&<div style={{ flex:1,height:2,background:i<stepIdx?"white":"rgba(255,255,255,.2)",transition:"background .6s",margin:"0 3px",marginBottom:18 }}/>}
            </div>
          );
        })}
      </div>
      {stepIdx<3&&<div style={{ background:"rgba(255,255,255,.15)",borderRadius:16,padding:"13px 28px",marginBottom:28,textAlign:"center" }}><div style={{ color:"rgba(255,255,255,.8)",fontSize:12 }}>זמן משלוח משוער</div><div style={{ color:"white",fontSize:22,fontWeight:900,marginTop:4 }}>~30 דקות</div></div>}
      <div style={{ color:"rgba(255,255,255,.7)",fontSize:14,marginBottom:26 }}>סה״כ שולם: <span style={{ color:"white",fontWeight:900 }}>₪{total}</span></div>
      <button onClick={()=>navigate("/")} style={{ background:"white",color:RED,border:"none",borderRadius:16,padding:"14px 40px",fontSize:15,fontWeight:900,cursor:"pointer",marginBottom:10 }}>חזור לדף הבית</button>
      <button onClick={()=>navigate("/orders")} style={{ background:"transparent",color:"rgba(255,255,255,.7)",border:"none",fontSize:14,cursor:"pointer" }}>מעקב הזמנות</button>
      <style>{`@keyframes cpPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════
//  REGISTRATION MODAL — 4 Steps (NO OTP):
//  1. טלפון  2. אימייל  3. פרטים  4. סיסמה
// ══════════════════════════════════════════════════
function RegisterModal({ onClose, onSuccess }) {
  const [step, setStep]   = useState(1); // 1=phone, 2=email, 3=info, 4=password
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [info, setInfo]   = useState({ firstName:"", lastName:"", gender:"", age:"" });
  const [pass,  setPass]  = useState("");
  const [pass2, setPass2] = useState("");
  const [showP,  setShowP]  = useState(false);
  const [showP2, setShowP2] = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [errs,  setErrs]  = useState({});

  // ── Step 1: Phone ───────────────────────────────
  const [phoneExists, setPhoneExists] = useState(false);

  async function submitPhone() {
    setErr(""); setPhoneExists(false);
    const raw = phone.replace(/\D/g,"");
    if (!isPhone(raw)) { setErr("מספר טלפון לא תקין"); return; }
    setBusy(true);
    // Check if phone already registered → show login inline
    const variants = [raw, raw.replace(/^0/,""), "0"+raw.replace(/^0/,""),
      "+972"+raw.replace(/^0/,""), "972"+raw.replace(/^0/,"")];
    let found = false;
    for (const v of variants) {
      const { data } = await supabase.from("users").select("id,email").eq("phone", v).maybeSingle();
      if (data) { found = true; break; }
    }
    setBusy(false);
    if (found) {
      setPhoneExists(true); // show password login inline
      return;
    }
    setStep(2);
  }

  // Login with phone → find email → login with password
  const [phoneLoginPass, setPhoneLoginPass] = useState("");
  const [showPhonePass, setShowPhonePass]   = useState(false);
  async function doPhoneLogin() {
    setErr("");
    if (!phoneLoginPass) { setErr("הזן סיסמה"); return; }
    setBusy(true);
    const raw = phone.replace(/\D/g,"");
    const variants = [raw, raw.replace(/^0/,""), "0"+raw.replace(/^0/,""),
      "+972"+raw.replace(/^0/,""), "972"+raw.replace(/^0/,"")];
    let email = null;
    for (const v of variants) {
      const { data } = await supabase.from("users").select("email").eq("phone", v).maybeSingle();
      if (data?.email) { email = data.email; break; }
    }
    if (!email) { setErr("לא נמצא חשבון — נסה שוב"); setBusy(false); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: phoneLoginPass });
    setBusy(false);
    if (error) { setErr("סיסמה שגויה"); return; }
    const m = data.user?.user_metadata || {};
    onSuccess({ id:data.user.id, email:data.user.email, name:(m.firstName||"")+" "+(m.lastName||""), firstName:m.firstName||"", phone:m.phone||phone });
  }

  // ── Step 2: Email (NO OTP) ──────────────────────
  async function submitEmail() {
    setErr("");
    const e = email.trim().toLowerCase();
    if (!isEmail(e)) { setErr("כתובת אימייל לא תקינה"); return; }
    setBusy(true);
    // Check email uniqueness in our users table
    const { data: existing } = await supabase.from("users").select("id").eq("email", e).maybeSingle();
    if (existing) { setErr("האימייל כבר רשום — נסה להתחבר"); setBusy(false); return; }
    setBusy(false);
    setStep(3);
  }

  // ── Step 3: Info ────────────────────────────────
  function submitInfo() {
    const e = {};
    if (!info.firstName.trim()) e.firstName = "שדה חובה";
    if (!info.lastName.trim())  e.lastName  = "שדה חובה";
    if (!info.gender)           e.gender    = "יש לבחור מגדר";
    const a = parseInt(info.age);
    if (!info.age||isNaN(a)||a<13||a>100) e.age = "גיל לא תקין (13–100)";
    if (Object.keys(e).length) { setErrs(e); return; }
    setErrs({});
    setStep(4);
  }

  // ── Step 4: Password + Create Account ──────────
  async function submitPassword() {
    setErr("");
    const pe = pwErr(pass);
    if (pe) { setErr(pe); return; }
    if (pass !== pass2) { setErr("הסיסמאות אינן תואמות"); return; }
    setBusy(true);
    const eFin = email.trim().toLowerCase();
    const meta = {
      firstName: info.firstName.trim(),
      lastName:  info.lastName.trim(),
      phone, gender: info.gender, age: info.age,
    };
    // Create account with email + password directly
    const { data, error } = await supabase.auth.signUp({
      email: eFin,
      password: pass,
      options: { data: meta },
    });
    if (error) {
      const m = error.message?.toLowerCase();
      if (m?.includes("already")||m?.includes("registered")) {
        setErr("האימייל כבר רשום — נסה להתחבר");
      } else {
        setErr("שגיאה: " + (error.message || "נסה שוב"));
      }
      setBusy(false);
      return;
    }
    // ✅ Save full user profile to users table
    if (data.user) {
      const phoneRaw = phone.replace(/\D/g,"");
      const phoneNorm = phoneRaw.startsWith("0") ? "+972"+phoneRaw.slice(1) : "+972"+phoneRaw;
      const { error: uErr } = await supabase.from("users").upsert({
        id: data.user.id,
        name: meta.firstName+" "+meta.lastName,
        phone: phoneNorm,
        email: eFin,
        city: "",
        street: "",
        active: true,
        orders_count: 0,
        total_spent: 0,
      });
      if (uErr) console.error("users table save error:", uErr.message);
    }
    setBusy(false);
    onSuccess({
      id: data.user?.id,
      email: eFin,
      name: meta.firstName+" "+meta.lastName,
      firstName: meta.firstName,
      phone: phone,
    });
  }

  const STEPS_LABELS = ["📱 טלפון","📧 אימייל","👤 פרטים","🔒 סיסמה"];

  return (
    <div style={{ position:"fixed",inset:0,zIndex:4000,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:430,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",maxHeight:"92vh",overflowY:"auto",animation:"cpSheet .32s cubic-bezier(.34,1.1,.64,1)" }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${RED},#8B0B1E)`,padding:"22px 20px 24px",borderRadius:"26px 26px 0 0",position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute",top:16,left:16,background:"rgba(255,255,255,.2)",border:"none",borderRadius:"50%",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ color:"white",fontSize:20,fontWeight:900,marginBottom:4 }}>הצטרף ל-Yougo 🚀</div>
          <div style={{ color:"rgba(255,255,255,.7)",fontSize:12 }}>צור חשבון — מהיר ופשוט</div>
          {/* Steps progress */}
          <div style={{ display:"flex",gap:6,marginTop:16 }}>
            {STEPS_LABELS.map((l,i) => (
              <div key={i} style={{ flex:1,textAlign:"center" }}>
                <div style={{ height:3,borderRadius:2,background:i+1<=step?"white":"rgba(255,255,255,.25)",marginBottom:4,transition:"background .3s" }}/>
                <span style={{ fontSize:9,color:i+1<=step?"white":"rgba(255,255,255,.45)",fontWeight:i+1===step?800:400 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"22px 20px 36px" }}>

          {/* ── STEP 1: PHONE ── */}
          {step === 1 && (<>
            <div style={{ fontSize:16,fontWeight:900,color:DARK,marginBottom:4 }}>📱 מספר טלפון</div>
            <div style={{ fontSize:12,color:GRAY,marginBottom:18 }}>הזן מספר — ייחודי לכל חשבון</div>
            <div style={{ display:"flex",gap:8,marginBottom:8 }}>
              <div style={{ background:"#F9FAFB",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                <span style={{ fontSize:18 }}>🇮🇱</span>
                <span style={{ fontSize:13,fontWeight:700,color:DARK }}>+972</span>
              </div>
              <input value={phone} onChange={e=>{ setPhone(e.target.value.replace(/[^\d-]/g,"")); setErr(""); }}
                placeholder="05X-XXX-XXXX" maxLength={12} autoFocus
                style={{ flex:1,border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 14px",fontSize:15,outline:"none",direction:"ltr",fontFamily:"inherit",color:DARK,letterSpacing:1 }}
                onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
                onKeyDown={e=>e.key==="Enter"&&submitPhone()}
              />
            </div>
            {err && <div style={{ color:RED,fontSize:12,fontWeight:600,marginBottom:10,background:"#FEF2F2",borderRadius:10,padding:"10px 13px" }}>⚠️ {err}</div>}
            {!phoneExists ? (
              <button onClick={submitPhone} disabled={busy||phone.replace(/\D/g,"").length<9}
                style={{ width:"100%",background:busy||phone.replace(/\D/g,"").length<9?`rgba(200,16,46,.4)`:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:900,cursor:busy||phone.replace(/\D/g,"").length<9?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 5px 18px rgba(200,16,46,.35)" }}>
                {busy?<><Spinner/>בודק...</>:"הבא ←"}
              </button>
            ) : (
              // ✅ Phone exists → show inline login
              <div style={{ background:"#F0FDF4",borderRadius:16,padding:"18px 16px",border:"1px solid #BBF7D0",marginTop:4 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
                  <span style={{ fontSize:18 }}>✅</span>
                  <div>
                    <div style={{ fontSize:14,fontWeight:900,color:"#15803D" }}>מספר מוכר!</div>
                    <div style={{ fontSize:11,color:GRAY }}>הזן סיסמה כדי להיכנס</div>
                  </div>
                </div>
                <div style={{ position:"relative",marginBottom:10 }}>
                  <input value={phoneLoginPass} onChange={e=>{ setPhoneLoginPass(e.target.value); setErr(""); }}
                    type={showPhonePass?"text":"password"} placeholder="הסיסמה שלך" autoFocus
                    style={{ width:"100%",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"13px 44px 13px 14px",fontSize:14,outline:"none",direction:"ltr",fontFamily:"inherit",boxSizing:"border-box" }}
                    onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
                    onKeyDown={e=>e.key==="Enter"&&doPhoneLogin()}
                  />
                  <div style={{ position:"absolute",top:"50%",right:12,transform:"translateY(-50%)" }}>
                    <Eye show={showPhonePass} toggle={()=>setShowPhonePass(p=>!p)}/>
                  </div>
                </div>
                {err && <div style={{ color:RED,fontSize:12,fontWeight:600,marginBottom:8,background:"#FEF2F2",borderRadius:8,padding:"8px 12px" }}>⚠️ {err}</div>}
                <button onClick={doPhoneLogin} disabled={busy}
                  style={{ width:"100%",background:busy?`rgba(200,16,46,.5)`:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                  {busy?<><Spinner/>נכנס...</>:"כניסה ←"}
                </button>
                <button onClick={()=>{ setPhoneExists(false); setPhoneLoginPass(""); setErr(""); }}
                  style={{ width:"100%",background:"none",border:"none",color:GRAY,fontSize:12,cursor:"pointer",marginTop:10,fontFamily:"inherit" }}>
                  ← שנה מספר
                </button>
              </div>
            )}
            <div style={{ textAlign:"center",marginTop:16,paddingTop:16,borderTop:"1px solid #F3F4F6" }}>
              <span style={{ fontSize:12,color:GRAY }}>יש לך כבר חשבון? </span>
              <button onClick={onClose} style={{ background:"none",border:"none",color:RED,fontSize:12,fontWeight:700,cursor:"pointer" }}>כניסה</button>
            </div>
          </>)}

          {/* ── STEP 2: EMAIL (NO OTP) ── */}
          {step === 2 && (<>
            <div style={{ fontSize:16,fontWeight:900,color:DARK,marginBottom:4 }}>📧 כתובת אימייל</div>
            <div style={{ fontSize:12,color:GRAY,marginBottom:18 }}>ייחודי לכל חשבון — לא ניתן לשינוי</div>
            <input value={email} onChange={e=>{ setEmail(e.target.value); setErr(""); }}
              placeholder="example@email.com" type="email" autoFocus
              style={{ width:"100%",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 14px",fontSize:14,outline:"none",direction:"ltr",fontFamily:"inherit",color:DARK,marginBottom:8,boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
              onKeyDown={e=>e.key==="Enter"&&submitEmail()}
            />
            {err && <div style={{ color:RED,fontSize:12,fontWeight:600,marginBottom:10,background:"#FEF2F2",borderRadius:10,padding:"10px 13px" }}>⚠️ {err}</div>}
            <button onClick={submitEmail} disabled={busy||!isEmail(email)}
              style={{ width:"100%",background:busy||!isEmail(email)?`rgba(200,16,46,.4)`:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:900,cursor:busy||!isEmail(email)?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 5px 18px rgba(200,16,46,.35)" }}>
              {busy?<><Spinner/>בודק...</>:"הבא ←"}
            </button>
            <button onClick={()=>{ setStep(1); setErr(""); }} style={{ marginTop:14,background:"none",border:"none",color:GRAY,fontSize:13,cursor:"pointer",width:"100%",fontFamily:"inherit" }}>← חזור</button>
          </>)}

          {/* ── STEP 3: INFO ── */}
          {step === 3 && (<>
            <div style={{ fontSize:16,fontWeight:900,color:DARK,marginBottom:16 }}>👤 פרטים אישיים</div>
            <div style={{ display:"flex",gap:10,marginBottom:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>שם פרטי *</div>
                <input value={info.firstName} onChange={e=>{ setInfo(p=>({...p,firstName:e.target.value})); setErrs(p=>({...p,firstName:""})); }}
                  placeholder="שם פרטי" autoFocus
                  style={{ width:"100%",border:`1.5px solid ${errs.firstName?RED:"#E5E7EB"}`,borderRadius:12,padding:"12px 13px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}
                />
                {errs.firstName && <div style={{ color:RED,fontSize:11,marginTop:3 }}>{errs.firstName}</div>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>שם משפחה *</div>
                <input value={info.lastName} onChange={e=>{ setInfo(p=>({...p,lastName:e.target.value})); setErrs(p=>({...p,lastName:""})); }}
                  placeholder="שם משפחה"
                  style={{ width:"100%",border:`1.5px solid ${errs.lastName?RED:"#E5E7EB"}`,borderRadius:12,padding:"12px 13px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}
                />
                {errs.lastName && <div style={{ color:RED,fontSize:11,marginTop:3 }}>{errs.lastName}</div>}
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>מגדר *</div>
              <div style={{ display:"flex",gap:8 }}>
                {[{v:"male",l:"זכר 👨"},{v:"female",l:"נקבה 👩"},{v:"other",l:"אחר 🧑"}].map(g=>(
                  <button key={g.v} type="button" onClick={()=>{ setInfo(p=>({...p,gender:g.v})); setErrs(p=>({...p,gender:""})); }}
                    style={{ flex:1,padding:"11px 6px",borderRadius:12,border:`2px solid ${info.gender===g.v?RED:"#E5E7EB"}`,background:info.gender===g.v?"rgba(200,16,46,.06)":"white",cursor:"pointer",fontSize:11,fontWeight:info.gender===g.v?700:500,color:info.gender===g.v?RED:GRAY,fontFamily:"inherit",transition:"all .15s" }}>
                    {g.l}
                  </button>
                ))}
              </div>
              {errs.gender && <div style={{ color:RED,fontSize:11,marginTop:3 }}>{errs.gender}</div>}
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>גיל *</div>
              <input value={info.age} onChange={e=>{ setInfo(p=>({...p,age:e.target.value.replace(/\D/g,"")})); setErrs(p=>({...p,age:""})); }}
                placeholder="גיל (13–100)" maxLength={3}
                style={{ width:"100%",border:`1.5px solid ${errs.age?RED:"#E5E7EB"}`,borderRadius:12,padding:"12px 13px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}
                onKeyDown={e=>e.key==="Enter"&&submitInfo()}
              />
              {errs.age && <div style={{ color:RED,fontSize:11,marginTop:3 }}>{errs.age}</div>}
            </div>
            <button onClick={submitInfo}
              style={{ width:"100%",background:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 5px 18px rgba(200,16,46,.35)" }}>
              הבא ←
            </button>
            <button onClick={()=>{ setStep(2); setErr(""); }} style={{ marginTop:14,background:"none",border:"none",color:GRAY,fontSize:13,cursor:"pointer",width:"100%",fontFamily:"inherit" }}>← חזור</button>
          </>)}

          {/* ── STEP 4: PASSWORD ── */}
          {step === 4 && (<>
            <div style={{ fontSize:16,fontWeight:900,color:DARK,marginBottom:4 }}>🔒 סיסמה</div>
            <div style={{ fontSize:12,color:GRAY,marginBottom:18 }}>8 תווים לפחות, אות גדולה ומספר</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>סיסמה *</div>
              <div style={{ position:"relative" }}>
                <input value={pass} onChange={e=>{ setPass(e.target.value); setErr(""); }}
                  type={showP?"text":"password"} placeholder="לפחות 8 תווים + אות גדולה + מספר"
                  autoFocus
                  style={{ width:"100%",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"12px 44px 12px 13px",fontSize:13,outline:"none",direction:"ltr",fontFamily:"inherit",boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
                />
                <div style={{ position:"absolute",top:"50%",right:12,transform:"translateY(-50%)" }}>
                  <Eye show={showP} toggle={()=>setShowP(p=>!p)}/>
                </div>
              </div>
              {pass.length > 0 && (
                <div style={{ marginTop:8,display:"flex",flexDirection:"column",gap:4 }}>
                  {[{ok:pass.length>=8,t:"8 תווים לפחות"},{ok:/[A-Z]/.test(pass),t:"אות גדולה"},{ok:/\d/.test(pass),t:"מספר"}].map((r,i)=>(
                    <div key={i} style={{ display:"flex",gap:6,alignItems:"center" }}>
                      <span style={{ fontSize:12,color:r.ok?GREEN:"#D1D5DB" }}>{r.ok?"✓":"○"}</span>
                      <span style={{ fontSize:11,color:r.ok?GREEN:"#9CA3AF",fontWeight:r.ok?600:400 }}>{r.t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>אימות סיסמה *</div>
              <div style={{ position:"relative" }}>
                <input value={pass2} onChange={e=>{ setPass2(e.target.value); setErr(""); }}
                  type={showP2?"text":"password"} placeholder="חזור על הסיסמה"
                  style={{ width:"100%",border:`1.5px solid ${pass2&&pass2!==pass?RED:"#E5E7EB"}`,borderRadius:12,padding:"12px 44px 12px 13px",fontSize:13,outline:"none",direction:"ltr",fontFamily:"inherit",boxSizing:"border-box" }}
                  onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
                  onKeyDown={e=>e.key==="Enter"&&submitPassword()}
                />
                <div style={{ position:"absolute",top:"50%",right:12,transform:"translateY(-50%)" }}>
                  <Eye show={showP2} toggle={()=>setShowP2(p=>!p)}/>
                </div>
              </div>
              {pass2 && pass2!==pass && <div style={{ color:RED,fontSize:11,marginTop:3 }}>הסיסמאות אינן תואמות</div>}
              {pass2 && pass2===pass && <div style={{ color:GREEN,fontSize:11,marginTop:3 }}>✓ הסיסמאות תואמות</div>}
            </div>
            {err && <div style={{ color:RED,fontSize:12,fontWeight:600,marginBottom:12,background:"#FEF2F2",borderRadius:10,padding:"10px 13px" }}>⚠️ {err}</div>}
            <button onClick={submitPassword} disabled={busy||!pwStrong(pass)||pass!==pass2}
              style={{ width:"100%",background:busy||!pwStrong(pass)||pass!==pass2?`rgba(34,197,94,.4)`:`linear-gradient(135deg,${GREEN},#14532D)`,color:"white",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:900,cursor:busy||!pwStrong(pass)||pass!==pass2?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 5px 18px rgba(22,163,74,.35)",transition:"all .2s" }}>
              {busy?<><Spinner/>יוצר חשבון...</>:"✅ יצירת חשבון"}
            </button>
            <button onClick={()=>{ setStep(3); setErr(""); }} style={{ marginTop:14,background:"none",border:"none",color:GRAY,fontSize:13,cursor:"pointer",width:"100%",fontFamily:"inherit" }}>← חזור</button>
          </>)}

        </div>
        <style>{`@keyframes cpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}*{box-sizing:border-box}`}</style>
      </div>
    </div>
  );
}

// ── Login Modal (existing user) ─────────────────────
function LoginModal({ onClose, onSuccess, onRegister }) {
  const [email,  setEmail]  = useState("");
  const [pass,   setPass]   = useState("");
  const [showP,  setShowP]  = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState("");

  async function doLogin() {
    setErr("");
    if (!isEmail(email)) { setErr("אימייל לא תקין"); return; }
    if (!pass) { setErr("הזן סיסמה"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(), password: pass,
    });
    setBusy(false);
    if (error) { setErr("אימייל או סיסמה שגויים"); return; }
    const m = data.user?.user_metadata || {};
    onSuccess({
      id: data.user.id, email: data.user.email,
      name: (m.firstName||"")+" "+(m.lastName||""),
      firstName: m.firstName||"", phone: m.phone||"",
    });
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:4000,background:"rgba(0,0,0,.65)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:430,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",padding:"0 0 44px",animation:"cpSheet .32s cubic-bezier(.34,1.1,.64,1)" }}>

        {/* Header */}
        <div style={{ background:`linear-gradient(135deg,${RED},#8B0B1E)`,padding:"22px 20px 24px",borderRadius:"26px 26px 0 0",position:"relative",marginBottom:22 }}>
          <button onClick={onClose} style={{ position:"absolute",top:16,left:16,background:"rgba(255,255,255,.2)",border:"none",borderRadius:"50%",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div style={{ color:"white",fontSize:20,fontWeight:900,marginBottom:3 }}>כניסה לחשבון 👋</div>
          <div style={{ color:"rgba(255,255,255,.7)",fontSize:12 }}>התחבר כדי להמשיך עם ההזמנה</div>
        </div>

        <div style={{ padding:"0 20px" }}>
          {/* Email */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>כתובת אימייל</div>
            <input value={email} onChange={e=>{ setEmail(e.target.value); setErr(""); }}
              placeholder="example@email.com" type="email" autoFocus
              style={{ width:"100%",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"13px 14px",fontSize:14,outline:"none",direction:"ltr",fontFamily:"inherit",boxSizing:"border-box" }}
              onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
              onKeyDown={e=>e.key==="Enter"&&document.getElementById("cart-login-pass")?.focus()}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:700,color:GRAY,marginBottom:5 }}>סיסמה</div>
            <div style={{ position:"relative" }}>
              <input id="cart-login-pass" value={pass} onChange={e=>{ setPass(e.target.value); setErr(""); }}
                type={showP?"text":"password"} placeholder="הסיסמה שלך"
                style={{ width:"100%",border:"1.5px solid #E5E7EB",borderRadius:12,padding:"13px 44px 13px 14px",fontSize:14,outline:"none",direction:"ltr",fontFamily:"inherit",boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor=RED} onBlur={e=>e.target.style.borderColor="#E5E7EB"}
                onKeyDown={e=>e.key==="Enter"&&doLogin()}
              />
              <div style={{ position:"absolute",top:"50%",right:12,transform:"translateY(-50%)" }}>
                <Eye show={showP} toggle={()=>setShowP(p=>!p)}/>
              </div>
            </div>
          </div>

          {err && <div style={{ color:RED,fontSize:12,fontWeight:600,marginBottom:12,background:"#FEF2F2",borderRadius:10,padding:"10px 13px" }}>⚠️ {err}</div>}

          <button onClick={doLogin} disabled={busy}
            style={{ width:"100%",background:busy?`rgba(200,16,46,.5)`:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"15px",fontSize:15,fontWeight:900,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 5px 18px rgba(200,16,46,.35)",marginBottom:14 }}>
            {busy?<><Spinner/>מתחבר...</>:"כניסה ←"}
          </button>

          <div style={{ textAlign:"center" }}>
            <span style={{ fontSize:12,color:GRAY }}>אין לך חשבון? </span>
            <button onClick={onRegister} style={{ background:"none",border:"none",color:RED,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>הירשם עכשיו</button>
          </div>
        </div>
        <style>{`@keyframes cpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}*{box-sizing:border-box}`}</style>
      </div>
    </div>
  );
}

// ── Location Picker Modal ───────────────────────────
function LocationPickerModal({ savedLocations, selectedArea, onSelect, onClose, onAddNew }) {
  const [chosen, setChosen] = useState(null);
  const [otherPhone, setOtherPhone] = useState("");
  const myLoc = selectedArea ? { label:selectedArea.short, address:selectedArea.short, emoji:"🏠", isMe:true, zone:selectedArea } : null;
  const allLocs = [...(myLoc?[myLoc]:[]), ...savedLocations.map(s=>({...s,isMe:false}))];

  function confirm() {
    if (!chosen) return;
    onSelect({ loc: { ...chosen, otherPhone:(chosen.isMe?null:otherPhone)||null } });
    onClose();
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:3000,background:"rgba(0,0,0,.55)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",fontFamily:"system-ui,Arial,sans-serif",direction:"rtl" }}
      onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ width:"100%",maxWidth:430,margin:"0 auto",background:"white",borderRadius:"26px 26px 0 0",padding:"20px 16px 40px",animation:"cpSheet .32s cubic-bezier(.34,1.1,.64,1)",maxHeight:"80vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"center",marginBottom:14 }}><div style={{ width:38,height:4,background:"#E5E7EB",borderRadius:2 }}/></div>
        <div style={{ fontSize:16,fontWeight:900,color:DARK,marginBottom:4,textAlign:"center" }}>כתובת למשלוח</div>
        <div style={{ fontSize:12,color:GRAY,marginBottom:16,textAlign:"center" }}>בחר מיקום שמור</div>
        {allLocs.length===0 && <div style={{ textAlign:"center",padding:"20px",color:GRAY,fontSize:13 }}>אין מיקומים שמורים</div>}
        {allLocs.map((loc,i) => (
          <button key={i} onClick={()=>setChosen(loc)}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:14,border:`2px solid ${chosen===loc?RED:"#E5E7EB"}`,background:chosen===loc?"rgba(200,16,46,.05)":"white",cursor:"pointer",marginBottom:8,fontFamily:"inherit",textAlign:"right" }}>
            <div style={{ width:42,height:42,borderRadius:12,background:chosen===loc?"rgba(200,16,46,.1)":"#F9FAFB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>{loc.emoji||"📍"}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:800,color:DARK }}>{loc.label||loc.zoneName}</div>
              <div style={{ fontSize:11,color:GRAY,marginTop:1 }}>{loc.address||loc.zone?.short}</div>
            </div>
            {chosen===loc && <div style={{ width:22,height:22,borderRadius:"50%",background:RED,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></div>}
          </button>
        ))}
        <button onClick={onAddNew} style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:14,border:"2px dashed #D1D5DB",background:"white",cursor:"pointer",marginBottom:14,fontFamily:"inherit" }}>
          <div style={{ width:42,height:42,borderRadius:12,background:"#F9FAFB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0 }}>➕</div>
          <div style={{ fontSize:13,fontWeight:700,color:RED }}>הוסף מיקום חדש</div>
        </button>
        {chosen && !chosen.isMe && (
          <div style={{ background:"#F9FAFB",borderRadius:14,padding:"13px 14px",marginBottom:14 }}>
            <div style={{ fontSize:11,fontWeight:700,color:DARK,marginBottom:6 }}>📞 טלפון איש קשר (אופציונלי)</div>
            <input type="tel" value={otherPhone} onChange={e=>setOtherPhone(e.target.value)}
              placeholder="+972 050 000 0000"
              style={{ width:"100%",border:"1.5px solid #E5E7EB",borderRadius:11,padding:"10px 12px",fontSize:13,outline:"none",direction:"ltr",fontFamily:"inherit",boxSizing:"border-box" }}
            />
          </div>
        )}
        <button onClick={confirm} disabled={!chosen} style={{ width:"100%",background:!chosen?`rgba(200,16,46,.35)`:`linear-gradient(135deg,${RED},#9B0B22)`,border:"none",borderRadius:16,padding:"15px",color:"white",fontSize:15,fontWeight:900,cursor:!chosen?"default":"pointer",fontFamily:"inherit",boxShadow:!chosen?"none":"0 5px 18px rgba(200,16,46,.35)" }}>
          אישור המיקום ←
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
//  MAIN CartPage
// ══════════════════════════════════════════════════
export default function CartPage({ cart, add, rem, setCart, cartCount, user, guest, onLogin, selectedArea }) {
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState("");
  const [promo,      setPromo]      = useState(null);
  const [promoError, setPromoError] = useState("");
  const [payment,    setPayment]    = useState("cash");
  const [loading,    setLoading]    = useState(false);
  const [ordered,    setOrdered]    = useState(false);
  const [orderId,    setOrderId]    = useState(null);
  const [showLogin,  setShowLogin]  = useState(false);
  const [showReg,    setShowReg]    = useState(false);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [stage, setStage] = useState(1); // 1=items, 2=checkout
  const [deliveryLoc,   setDeliveryLoc]   = useState(null);
  const [savedLocs,     setSavedLocs]     = useState([]);

  useEffect(() => {
    try { setSavedLocs(JSON.parse(localStorage.getItem("yougo_saved_locations") || "[]")); } catch {}
  }, []);

  useEffect(() => {
    if (selectedArea && !deliveryLoc) {
      setDeliveryLoc({ label:selectedArea.short, address:selectedArea.short, isMe:true, zone:selectedArea, emoji:"📍" });
    }
  }, [selectedArea]);

  const subtotal    = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_MIN ? 0 : 12;
  const discount    = promo ? Math.floor(subtotal * PROMO_CODES[promo]) : 0;
  const total       = subtotal + deliveryFee - discount;
  const restaurantName = cart[0]?.rname || null;

  function applyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) { setPromo(code); setPromoError(""); }
    else { setPromoError("קוד שגוי או לא תקף"); setPromo(null); }
  }

  async function placeOrder() {
    if (!deliveryLoc) { setShowLocPicker(true); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        user_id: user?.id || null,
        customer_name: user?.name || user?.firstName || "",
        customer_phone: user?.phone || "",
        restaurant_name: restaurantName,
        items: cart,
        subtotal, delivery_fee: deliveryFee, total,
        address: deliveryLoc.address || deliveryLoc.label,
        contact_phone: deliveryLoc.otherPhone || null,
        payment_method: { cash:"מזומן", card:"אשראי", paypal:"PayPal", googlepay:"Google Pay", applepay:"Apple Pay" }[payment],
        status: "جديد",
        notes: promo ? `קוד פרומו: ${promo}` : null,
      }).select().single();
      setOrderId(!error && data ? data.id : "DEMO-" + Math.floor(Math.random()*9000+1000));
    } catch {
      setOrderId("DEMO-" + Math.floor(Math.random()*9000+1000));
    }
    setLoading(false);
    setCart([]);
    setOrdered(true);
  }

  function handleAuthSuccess(u) {
    setShowLogin(false); setShowReg(false);
    onLogin?.(u);
  }

  if (ordered) return <TrackingScreen orderId={orderId} total={total} navigate={navigate} />;

  // ── Empty cart ──
  if (cart.length === 0) return (
    <div style={{ fontFamily:"system-ui,Arial,sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",direction:"rtl",paddingBottom:80 }}>
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)",padding:"44px 20px 60px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",bottom:-30,left:0,right:0,height:60,background:C.bg,borderRadius:"50% 50% 0 0" }}/>
        <button onClick={()=>navigate(-1)} style={{ background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
          <IcoBack s={18} c="white"/>
        </button>
        <div style={{ color:"white",fontSize:24,fontWeight:900,marginTop:12 }}>העגלה שלי</div>
      </div>
      <div style={{ textAlign:"center",padding:"60px 24px",color:C.gray }}>
        <div style={{ fontSize:60,marginBottom:16 }}>🛒</div>
        <div style={{ fontSize:18,fontWeight:700,color:C.dark,marginBottom:8 }}>העגלה ריקה</div>
        <div style={{ fontSize:14,marginBottom:28 }}>הוסף פריטים מהתפריט</div>
        <button onClick={()=>navigate("/")} style={{ background:C.red,color:"white",border:"none",borderRadius:16,padding:"14px 32px",fontSize:15,fontWeight:900,cursor:"pointer" }}>גלה מסעדות</button>
      </div>
      <BottomNav cartCount={cartCount}/>
      <style>{`*{box-sizing:border-box}`}</style>
    </div>
  );

  // ── Main cart ──
  return (
    <div style={{ fontFamily:"system-ui,Arial,sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",direction:"rtl",paddingBottom:220 }}>
      <style>{`*{box-sizing:border-box} @keyframes cpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}} .cp-inp:focus{border-color:${RED}!important;outline:none}`}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)",padding:"44px 20px 60px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",bottom:-30,left:0,right:0,height:60,background:C.bg,borderRadius:"50% 50% 0 0" }}/>
        <button onClick={()=>navigate(-1)} style={{ background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
          <IcoBack s={18} c="white"/>
        </button>
        <div style={{ color:"white",fontSize:24,fontWeight:900,marginTop:12 }}>ההזמנה שלי</div>
        <div style={{ color:"rgba(255,255,255,.75)",fontSize:13,marginTop:4 }}>{cart.length} פריטים</div>
      </div>

      <div style={{ padding:"0 16px" }}>

        {/* ── Cart items — ALWAYS visible ── */}
        <div style={{ marginBottom:14 }}>
          {cart.map(item=>(
            <div key={`${item.id}-${item.rid}`} style={{ background:"white",borderRadius:16,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.06)",display:"flex",gap:12,alignItems:"center" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:14,color:C.dark }}>{item.name}</div>
                <div style={{ fontSize:12,color:C.gray,marginTop:2 }}>{item.rname}</div>
                <div style={{ fontSize:14,fontWeight:900,color:C.red,marginTop:4 }}>₪{item.price}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <button onClick={()=>rem(item.id,item.rid)} style={{ width:30,height:30,borderRadius:"50%",border:"2px solid #E5E7EB",background:"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <IcoMinus s={12} c={C.dark}/>
                </button>
                <span style={{ fontSize:15,fontWeight:900,color:C.dark,minWidth:20,textAlign:"center" }}>{item.qty}</span>
                <button onClick={()=>add(item,{id:item.rid,name:item.rname})} style={{ width:30,height:30,borderRadius:"50%",border:"none",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                  <IcoPlus s={14} c="white"/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Stage 2: Delivery + Promo + Payment + Summary ── */}
        {!guest && stage === 2 && (<>

          {/* Delivery */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
              <IcoPin s={14} c={RED}/> כתובת למשלוח
            </div>
            {deliveryLoc ? (
              <div style={{ display:"flex",alignItems:"center",gap:12,background:"rgba(200,16,46,.04)",borderRadius:12,padding:"11px 13px",border:"1.5px solid rgba(200,16,46,.15)" }}>
                <div style={{ fontSize:22,flexShrink:0 }}>{deliveryLoc.emoji||"📍"}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:800,color:DARK }}>{deliveryLoc.label}</div>
                  <div style={{ fontSize:11,color:GRAY,marginTop:1 }}>{deliveryLoc.address}</div>
                  {deliveryLoc.otherPhone && <div style={{ fontSize:11,color:"#059669",marginTop:1 }}>📞 {deliveryLoc.otherPhone}</div>}
                </div>
                <button onClick={()=>setShowLocPicker(true)} style={{ background:"none",border:"none",cursor:"pointer",color:RED,fontSize:12,fontWeight:700,flexShrink:0 }}>שנה</button>
              </div>
            ) : (
              <button onClick={()=>setShowLocPicker(true)} style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"13px 14px",borderRadius:12,border:"2px dashed #E5E7EB",background:"#F9FAFB",cursor:"pointer",fontFamily:"inherit" }}>
                <div style={{ width:36,height:36,borderRadius:10,background:"rgba(200,16,46,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>📍</div>
                <span style={{ fontSize:13,fontWeight:700,color:RED }}>בחר כתובת למשלוח</span>
              </button>
            )}
          </div>

          {/* Promo */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:8 }}>🎟️ קוד פרומו</div>
            {promo ? (
              <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(16,185,129,.08)",borderRadius:12,padding:"10px 14px" }}>
                <IcoCheck s={16} c={C.green}/>
                <span style={{ color:C.green,fontWeight:700,fontSize:14 }}>{promo} — {PROMO_CODES[promo]*100}% הנחה</span>
                <button onClick={()=>{setPromo(null);setPromoInput("");}} style={{ marginRight:"auto",background:"none",border:"none",cursor:"pointer" }}><IcoClose s={13} c={C.gray}/></button>
              </div>
            ) : (<>
              <div style={{ display:"flex",gap:8 }}>
                <input className="cp-inp" value={promoInput} onChange={e=>{setPromoInput(e.target.value);setPromoError("");}}
                  onKeyDown={e=>{if(e.key==="Enter")applyPromo();}}
                  placeholder="הזן קוד (כגון: NAAT10)"
                  style={{ flex:1,border:"1.5px solid #E5E7EB",borderRadius:12,padding:"10px 12px",fontSize:13,outline:"none",direction:"rtl",fontFamily:"inherit" }}/>
                <button onClick={applyPromo} style={{ background:C.dark,color:"white",border:"none",borderRadius:12,padding:"10px 16px",fontSize:13,fontWeight:700,cursor:"pointer" }}>אשר</button>
              </div>
              {promoError && <div style={{ color:C.red,fontSize:11,marginTop:5 }}>{promoError}</div>}
            </>)}
          </div>

          {/* Payment */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:10 }}>אמצעי תשלום</div>
            <div style={{ display:"flex",gap:7 }}>
              {[{v:"cash",l:"מזומן",Ico:IcoCash},{v:"card",l:"אשראי",Ico:IcoCreditCard},{v:"paypal",l:"PayPal",e:"🅿️"},{v:"googlepay",l:"Google",e:"G"},{v:"applepay",l:"Apple",e:"🍎"}].map(p=>(
                <button key={p.v} onClick={()=>setPayment(p.v)} style={{ flex:1,padding:"10px 4px",borderRadius:12,border:`2px solid ${payment===p.v?RED:"#E5E7EB"}`,background:payment===p.v?"rgba(200,16,46,.06)":"white",cursor:"pointer",fontSize:11,fontWeight:payment===p.v?700:500,color:payment===p.v?RED:GRAY,display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit",transition:"all .15s" }}>
                  {p.Ico?<p.Ico s={20} c={payment===p.v?RED:GRAY}/>:<span style={{fontSize:16}}>{p.e}</span>}{p.l}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{ background:"white",borderRadius:16,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:13,fontWeight:700,color:C.dark,marginBottom:10 }}>סיכום הזמנה</div>
            {[
              { l:"סכום ביניים", v:`₪${subtotal}` },
              { l:"משלוח", v:deliveryFee===0?"חינם 🎉":`₪${deliveryFee}` },
              ...(promo?[{l:`הנחה (${promo})`,v:`-₪${discount}`,c:C.green}]:[]),
            ].map((r,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",marginBottom:7 }}>
                <span style={{ fontSize:13,color:C.gray }}>{r.l}</span>
                <span style={{ fontSize:13,fontWeight:600,color:r.c||C.dark }}>{r.v}</span>
              </div>
            ))}
            <div style={{ borderTop:"1.5px solid #E5E7EB",paddingTop:10,display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:15,fontWeight:800,color:C.dark }}>סה״כ</span>
              <span style={{ fontSize:18,fontWeight:900,color:C.red }}>₪{total}</span>
            </div>
            {subtotal < FREE_DELIVERY_MIN && (
              <div style={{ marginTop:8,background:"rgba(245,166,35,.1)",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#B45309",fontWeight:600,textAlign:"center" }}>
                הוסף עוד ₪{FREE_DELIVERY_MIN-subtotal} לקבלת משלוח חינם! 🚀
              </div>
            )}
          </div>
        </>)}
      </div>

      {/* ── FIXED BOTTOM BAR — always visible ── */}
      <div style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"white",borderTop:"1px solid #F0F0F0",boxShadow:"0 -4px 20px rgba(0,0,0,.08)",zIndex:400,padding:"10px 16px",paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 10px)" }}>

        {/* תשלום מאובטח — always visible */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"#F0FDF4",borderRadius:10,padding:"7px 14px",border:"1px solid #BBF7D0",marginBottom:10 }}>
          <IcoShield s={14} c={GREEN}/>
          <span style={{ fontSize:12,color:"#15803D",fontWeight:700 }}>תשלום מאובטח ומוצפן 🔒</span>
        </div>

        {/* STAGE 1: go to checkout or login */}
        {stage === 1 && (
          guest ? (
            <button onClick={()=>setShowLogin(true)}
              style={{ width:"100%",background:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 6px 20px rgba(200,16,46,.35)" }}>
              🔐 התחבר/י להמשך הזמנה
            </button>
          ) : (
            <button onClick={()=>setStage(2)}
              style={{ width:"100%",background:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:16,padding:"16px",fontSize:16,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:"0 6px 20px rgba(200,16,46,.35)" }}>
              עבור לתשלום — ₪{subtotal} ←
            </button>
          )
        )}

        {/* STAGE 2: place order */}
        {stage === 2 && (
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={()=>setStage(1)}
              style={{ background:"#F3F4F6",border:"none",borderRadius:14,padding:"14px 16px",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,color:DARK }}>
              ← עגלה
            </button>
            <button onClick={placeOrder} disabled={loading}
              style={{ flex:1,background:loading?`rgba(200,16,46,.5)`:`linear-gradient(135deg,${RED},#9B0B22)`,color:"white",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:900,cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 6px 20px rgba(200,16,46,.35)" }}>
              {loading?<><Spinner/>מעבד...</>:<>אישור הזמנה — ₪{total}</>}
            </button>
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={()=>setShowLogin(false)}
          onSuccess={handleAuthSuccess}
          onRegister={()=>{ setShowLogin(false); setShowReg(true); }}
        />
      )}

      {/* Register Modal */}
      {showReg && (
        <RegisterModal
          onClose={()=>setShowReg(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Location picker */}
      {showLocPicker && (
        <LocationPickerModal
          savedLocations={savedLocs}
          selectedArea={selectedArea}
          onSelect={loc=>setDeliveryLoc(loc.loc)}
          onClose={()=>setShowLocPicker(false)}
          onAddNew={()=>{ setShowLocPicker(false); navigate("/address"); }}
        />
      )}

      <BottomNav cartCount={cartCount}/>
    </div>
  );
}
