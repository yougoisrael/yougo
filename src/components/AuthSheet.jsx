// ══════════════════════════════════════════════════
//  AuthSheet.jsx — Bottom Sheet Auth
//  Step 1: Phone → existing: show password, new: next
//  Step 2: Name / Age / Gender
//  Step 3: Email + Password
//  hCaptcha invisible on every auth call
// ══════════════════════════════════════════════════
import { useState, useEffect } from "react";
import BottomSheet from "./BottomSheet";
import { supabase } from "../lib/supabase";

const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";
const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

const isPhone = v => { const d=(v||"").replace(/\D/g,""); return d.length>=9&&d.length<=12; };
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||"").trim());
const pwOk    = v => v && v.length>=8 && /[A-Z]/.test(v);

/* ── hCaptcha ── */
function loadHcap() {
  if (document.getElementById("hcap-script")) return;
  const s = document.createElement("script");
  s.id  = "hcap-script";
  s.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
  s.async = true;
  document.head.appendChild(s);
}
async function getCaptchaToken() {
  if (!HCAPTCHA_SITE_KEY) return undefined;
  return new Promise(resolve => {
    function tryExec() {
      if (!window.hcaptcha) { setTimeout(tryExec, 200); return; }
      const el = document.createElement("div");
      el.style.display = "none";
      document.body.appendChild(el);
      try {
        const wid = window.hcaptcha.render(el, {
          sitekey: HCAPTCHA_SITE_KEY, size: "invisible",
          callback:          token => { try { document.body.removeChild(el); } catch {} resolve(token); },
          "error-callback":  ()    => { try { document.body.removeChild(el); } catch {} resolve(undefined); },
          "expired-callback":()    => { try { document.body.removeChild(el); } catch {} resolve(undefined); },
        });
        window.hcaptcha.execute(wid);
      } catch { try { document.body.removeChild(el); } catch {} resolve(undefined); }
    }
    tryExec();
  });
}

/* ── Small UI pieces ── */
const CSS = `
  @keyframes stepIn { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
  *{box-sizing:border-box}
`;

function Inp({ label, value, onChange, type="text", placeholder, dir="rtl", autoFocus, maxLength, right, disabled }) {
  const [f,setF] = useState(false);
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12,fontWeight:700,color:GRAY,marginBottom:5,direction:"rtl" }}>{label}</div>}
      <div style={{ position:"relative" }}>
        <input
          value={value} onChange={onChange} type={type} placeholder={placeholder}
          autoFocus={autoFocus} maxLength={maxLength} disabled={disabled}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{
            width:"100%", padding: right ? "13px 46px 13px 14px" : "13px 14px",
            border:`1.5px solid ${f?RED:"#E5E7EB"}`, borderRadius:14,
            fontSize:15, outline:"none", background:disabled?"#F9FAFB":"white",
            direction:dir, textAlign:dir==="ltr"?"left":"right",
            fontFamily:"inherit", color:DARK, transition:"border-color .15s",
          }}
        />
        {right && <div style={{ position:"absolute",top:"50%",right:14,transform:"translateY(-50%)" }}>{right}</div>}
      </div>
    </div>
  );
}

function Btn({ children, onClick, loading, disabled, secondary }) {
  return (
    <button
      type="button" onClick={onClick}
      disabled={disabled||loading}
      style={{
        width:"100%", padding:"15px", borderRadius:16,
        border: secondary ? `1.5px solid #E5E7EB` : "none",
        background: secondary ? "white" : (disabled||loading ? "rgba(200,16,46,0.5)" : RED),
        color: secondary ? DARK : "white",
        fontSize:15, fontWeight:800, cursor:disabled||loading?"not-allowed":"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        fontFamily:"inherit", marginBottom:10,
        boxShadow: secondary ? "none" : "0 6px 20px rgba(200,16,46,.25)",
      }}
    >
      {loading && <Spin/>}
      {children}
    </button>
  );
}

function Spin() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      style={{ animation:"sheetUp .7s linear infinite", flexShrink:0 }}>
      <style>{`@keyframes sheetUp{to{transform:rotate(360deg)}}`}</style>
      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5"
        strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round"/>
    </svg>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" onClick={toggle}
      style={{ background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",color:GRAY }}>
      {show
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      }
    </button>
  );
}

function Err({ msg }) {
  return msg ? (
    <div style={{ background:"#FEF2F2",border:"1px solid #FCA5A5",borderRadius:10,
      padding:"10px 14px",marginBottom:12,fontSize:13,color:"#DC2626",fontWeight:600 }}>
      ⚠️ {msg}
    </div>
  ) : null;
}

/* ── Steps indicator ── */
function Steps({ current, total }) {
  return (
    <div style={{ display:"flex",gap:6,justifyContent:"center",marginBottom:22 }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{
          height:4, flex:1, borderRadius:4,
          background: i<=current ? RED : "#E5E7EB",
          transition:"background .3s",
        }}/>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function AuthSheet({ onClose, onDone }) {
  const [step,      setStep]      = useState(0); // 0=phone, 1=info, 2=email+pass
  const [phone,     setPhone]     = useState("");
  const [phoneErr,  setPhoneErr]  = useState("");
  const [phoneExists, setPhoneExists] = useState(false);
  const [loginPass, setLoginPass] = useState("");
  const [showLP,    setShowLP]    = useState(false);
  const [info,      setInfo]      = useState({ firstName:"", lastName:"", gender:"", age:"" });
  const [infoErrs,  setInfoErrs]  = useState({});
  const [email,     setEmail]     = useState("");
  const [pass,      setPass]      = useState("");
  const [pass2,     setPass2]     = useState("");
  const [showP,     setShowP]     = useState(false);
  const [showP2,    setShowP2]    = useState(false);
  const [finalErr,  setFinalErr]  = useState("");
  const [busy,      setBusy]      = useState(false);

  useEffect(() => { loadHcap(); }, []);

  /* ── STEP 0: Phone ── */
  async function submitPhone() {
    setPhoneErr(""); setPhoneExists(false);
    const raw = phone.replace(/\D/g,"");
    if (!isPhone(raw)) { setPhoneErr("מספר טלפון לא תקין"); return; }
    setBusy(true);
    const variants = [raw, raw.replace(/^0/,""), "0"+raw.replace(/^0/,""),
      "+972"+raw.replace(/^0/,""), "972"+raw.replace(/^0/,"")];
    let found = null;
    for (const v of variants) {
      const { data } = await supabase.from("users").select("id,email").eq("phone",v).maybeSingle();
      if (data) { found = data; break; }
    }
    setBusy(false);
    if (found) { setPhoneExists(true); return; } // show password inline
    setStep(1); // new user → info
  }

  async function doLogin() {
    setPhoneErr("");
    if (!loginPass) { setPhoneErr("הזן סיסמה"); return; }
    setBusy(true);
    const raw = phone.replace(/\D/g,"");
    const variants = [raw, raw.replace(/^0/,""), "0"+raw.replace(/^0/,"")];
    let emailFound = null;
    for (const v of variants) {
      const { data } = await supabase.from("users").select("email").eq("phone",v).maybeSingle();
      if (data?.email) { emailFound = data.email; break; }
    }
    if (!emailFound) { setPhoneErr("לא נמצא חשבון"); setBusy(false); return; }
    const captchaToken = await getCaptchaToken();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailFound, password: loginPass,
      ...(captchaToken && { options: { captchaToken } }),
    });
    setBusy(false);
    if (error) { setPhoneErr("סיסמה שגויה"); return; }
    const m = data.user?.user_metadata || {};
    onDone?.({ id:data.user.id, email:data.user.email,
      name:(m.firstName||"")+" "+(m.lastName||""),
      firstName:m.firstName||"", phone:m.phone||phone });
  }

  /* ── STEP 1: Info ── */
  function submitInfo() {
    const errs = {};
    if (!info.firstName.trim()) errs.firstName = "שדה חובה";
    if (!info.lastName.trim())  errs.lastName  = "שדה חובה";
    if (!info.gender)           errs.gender    = "יש לבחור מגדר";
    const a = parseInt(info.age);
    if (!info.age || isNaN(a) || a<13 || a>100) errs.age = "גיל לא תקין (13-100)";
    if (Object.keys(errs).length) { setInfoErrs(errs); return; }
    setInfoErrs({});
    setStep(2);
  }

  /* ── STEP 2: Email + Password ── */
  async function doRegister() {
    setFinalErr("");
    const e = email.trim().toLowerCase();
    if (!isEmail(e)) { setFinalErr("כתובת אימייל לא תקינה"); return; }
    if (!pwOk(pass))  { setFinalErr("סיסמה: לפחות 8 תווים + אות גדולה"); return; }
    if (pass !== pass2) { setFinalErr("הסיסמאות אינן תואמות"); return; }
    setBusy(true);
    const rawPhone = phone.replace(/\D/g,"");
    const meta = {
      firstName: info.firstName.trim(), lastName: info.lastName.trim(),
      phone: rawPhone, gender: info.gender, age: info.age,
    };
    const captchaToken = await getCaptchaToken();
    const { data, error } = await supabase.auth.signUp({
      email: e, password: pass,
      options: { data: meta, ...(captchaToken && { captchaToken }) },
    });
    if (error) {
      const msg = error.message?.toLowerCase();
      setFinalErr(msg?.includes("already") || msg?.includes("registered")
        ? "האימייל כבר רשום — נסה להתחבר" : "שגיאה: " + error.message);
      setBusy(false); return;
    }
    if (data.user) {
      await supabase.from("users").upsert({
        id: data.user.id,
        name: meta.firstName+" "+meta.lastName,
        phone: rawPhone, email: e,
      });
    }
    setBusy(false);
    onDone?.({ id:data.user.id, email:e,
      name:meta.firstName+" "+meta.lastName,
      firstName:meta.firstName, phone:rawPhone });
  }

  const TITLES = ["מספר הטלפון", "פרטים אישיים", "אימייל וסיסמה"];
  const SUBS   = ["הירשם או התחבר", "עוד שלב קטן", "כמעט סיימנו 🎉"];

  return (
    <>
      <style>{CSS}</style>
      <BottomSheet open={true} onClose={onClose} maxHeight="92vh" zIndex={8000}>
        <div style={{ fontFamily:"system-ui,Arial,sans-serif", direction:"rtl", position:"relative" }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position:"absolute", top:6, left:16,
          width:32,height:32,borderRadius:"50%",
          background:"#F3F4F6",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          zIndex:2,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke={GRAY} strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div style={{ padding:"8px 22px 28px" }}>
          {/* Steps */}
          <Steps current={step} total={3}/>

          {/* Title */}
          <div style={{ key:step, animation:"stepIn .25s" }}>
            <div style={{ fontSize:22,fontWeight:900,color:DARK,marginBottom:4 }}>
              {TITLES[step]}
            </div>
            <div style={{ fontSize:13,color:GRAY,marginBottom:22 }}>{SUBS[step]}</div>
          </div>

          {/* ── STEP 0: Phone ── */}
          {step===0 && (
            <>
              <div style={{ display:"flex",gap:10,marginBottom:14 }}>
                <div style={{
                  background:"#F3F4F6",border:"1.5px solid #E5E7EB",borderRadius:14,
                  padding:"13px 14px",display:"flex",alignItems:"center",gap:6,flexShrink:0,
                  fontSize:14,fontWeight:700,color:DARK,
                }}>
                  🇮🇱 +972
                </div>
                <div style={{ flex:1 }}>
                  <input
                    value={phone}
                    onChange={e=>{setPhone(e.target.value.replace(/[^\d\-]/g,""));setPhoneErr("");setPhoneExists(false);}}
                    placeholder="05X-XXX-XXXX"
                    type="tel" dir="ltr" maxLength={12} autoFocus
                    onKeyDown={e=>e.key==="Enter"&&submitPhone()}
                    style={{
                      width:"100%",padding:"13px 14px",
                      border:`1.5px solid ${phoneErr?"#FCA5A5":"#E5E7EB"}`,
                      borderRadius:14,fontSize:15,outline:"none",
                      direction:"ltr",textAlign:"left",
                      fontFamily:"inherit",color:DARK,
                    }}
                  />
                </div>
              </div>

              {/* Existing user → show password inline */}
              {phoneExists && (
                <div style={{ background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:14,padding:"14px",marginBottom:14,animation:"stepIn .25s" }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"#92400E",marginBottom:10 }}>
                    👋 מספר קיים — הזן סיסמה לכניסה
                  </div>
                  <Inp
                    value={loginPass}
                    onChange={e=>{setLoginPass(e.target.value);setPhoneErr("");}}
                    type={showLP?"text":"password"}
                    placeholder="הסיסמה שלך" dir="ltr" autoFocus
                    right={<EyeBtn show={showLP} toggle={()=>setShowLP(p=>!p)}/>}
                  />
                  <Btn onClick={doLogin} loading={busy}>כניסה ←</Btn>
                  <button onClick={()=>{setPhoneExists(false);setPhone("");setLoginPass("");}}
                    style={{width:"100%",background:"none",border:"none",color:GRAY,fontSize:12,cursor:"pointer",padding:"4px",fontFamily:"inherit"}}>
                    מספר שגוי? שנה
                  </button>
                </div>
              )}

              <Err msg={phoneErr}/>

              {!phoneExists && (
                <Btn onClick={submitPhone} loading={busy} disabled={!phone}>
                  המשך ←
                </Btn>
              )}
            </>
          )}

          {/* ── STEP 1: Info ── */}
          {step===1 && (
            <>
              <div style={{ display:"flex",gap:10 }}>
                <div style={{ flex:1 }}>
                  <Inp label="שם פרטי *" value={info.firstName}
                    onChange={e=>setInfo(p=>({...p,firstName:e.target.value}))}
                    placeholder="שם פרטי" autoFocus/>
                  {infoErrs.firstName && <div style={{color:"#DC2626",fontSize:11,marginTop:-10,marginBottom:8}}>{infoErrs.firstName}</div>}
                </div>
                <div style={{ flex:1 }}>
                  <Inp label="שם משפחה *" value={info.lastName}
                    onChange={e=>setInfo(p=>({...p,lastName:e.target.value}))}
                    placeholder="שם משפחה"/>
                  {infoErrs.lastName && <div style={{color:"#DC2626",fontSize:11,marginTop:-10,marginBottom:8}}>{infoErrs.lastName}</div>}
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:12,fontWeight:700,color:GRAY,marginBottom:5 }}>מגדר *</div>
                <div style={{ display:"flex",gap:8 }}>
                  {[{v:"male",l:"זכר 👨"},{v:"female",l:"נקבה 👩"},{v:"other",l:"אחר 🧑"}].map(g=>(
                    <button key={g.v} type="button" onClick={()=>setInfo(p=>({...p,gender:g.v}))}
                      style={{
                        flex:1,padding:"12px 6px",borderRadius:14,
                        border:`2px solid ${info.gender===g.v?RED:"#E5E7EB"}`,
                        background:info.gender===g.v?"rgba(200,16,46,0.06)":"white",
                        cursor:"pointer",fontSize:12,fontWeight:info.gender===g.v?700:500,
                        color:info.gender===g.v?RED:GRAY,fontFamily:"inherit",
                      }}>
                      {g.l}
                    </button>
                  ))}
                </div>
                {infoErrs.gender && <div style={{color:"#DC2626",fontSize:11,marginTop:4}}>{infoErrs.gender}</div>}
              </div>

              <Inp label="גיל *" value={info.age}
                onChange={e=>setInfo(p=>({...p,age:e.target.value.replace(/\D/g,"")}))}
                placeholder="גיל (13-100)" maxLength={3}/>
              {infoErrs.age && <div style={{color:"#DC2626",fontSize:11,marginTop:-10,marginBottom:8}}>{infoErrs.age}</div>}

              <Btn onClick={submitInfo}>המשך ←</Btn>
              <Btn secondary onClick={()=>setStep(0)}>← חזור</Btn>
            </>
          )}

          {/* ── STEP 2: Email + Password ── */}
          {step===2 && (
            <>
              <Inp label="אימייל *" value={email}
                onChange={e=>{setEmail(e.target.value);setFinalErr("");}}
                type="email" placeholder="example@email.com" dir="ltr" autoFocus/>

              <Inp label="סיסמה *" value={pass}
                onChange={e=>{setPass(e.target.value);setFinalErr("");}}
                type={showP?"text":"password"} placeholder="לפחות 8 תווים + אות גדולה" dir="ltr"
                right={<EyeBtn show={showP} toggle={()=>setShowP(p=>!p)}/>}/>

              {pass.length>0 && (
                <div style={{ display:"flex",flexDirection:"column",gap:3,marginTop:-10,marginBottom:12 }}>
                  {[{ok:pass.length>=8,t:"8 תווים לפחות"},{ok:/[A-Z]/.test(pass),t:"אות גדולה"},{ok:/\d/.test(pass),t:"מספר"}].map((r,i)=>(
                    <div key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:11,color:r.ok?"#10B981":"#D1D5DB"}}>{r.ok?"✓":"○"}</span>
                      <span style={{fontSize:11,color:r.ok?"#10B981":"#9CA3AF",fontWeight:r.ok?600:400}}>{r.t}</span>
                    </div>
                  ))}
                </div>
              )}

              <Inp label="אימות סיסמה *" value={pass2}
                onChange={e=>{setPass2(e.target.value);setFinalErr("");}}
                type={showP2?"text":"password"} placeholder="חזור על הסיסמה" dir="ltr"
                right={<EyeBtn show={showP2} toggle={()=>setShowP2(p=>!p)}/>}/>

              <Err msg={finalErr}/>
              <Btn onClick={doRegister} loading={busy}>צור חשבון ✓</Btn>
              <Btn secondary onClick={()=>setStep(1)}>← חזור</Btn>
            </>
          )}

          <div style={{ textAlign:"center",color:"#9CA3AF",fontSize:10,marginTop:8,lineHeight:1.7 }}>
            בהמשך אתה מסכים ל<span style={{color:RED,fontWeight:700}}>תנאי השימוש</span> ול<span style={{color:RED,fontWeight:700}}>מדיניות הפרטיות</span>
          </div>
        </div>
        </div>
      </BottomSheet>
    </>
  );
}
