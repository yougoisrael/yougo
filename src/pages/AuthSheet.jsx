// ═══════════════════════════════════════════════════════════════
//  AuthSheet.jsx — Yougo v5
//  Auth as BottomSheet ONLY — no full page, smooth like Haat/Wolt
//
//  FLOW:
//  Sheet opens → phone field → debounce DB check →
//    existing:  password field slides in + שכחתי/קוד buttons
//    new user:  register fields slide in step by step
//  OTP screen: 6-box code
//  Success: confetti + close
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import BottomSheet from "../components/BottomSheet";
import { supabase } from "../lib/supabase";

// ─── Colors ─────────────────────────────────────────────────────
const R  = "#C8102E";
const RD = "#8B0B1E";
const RB = "#FEF2F2";
const DK = "#111827";
const GR = "#6B7280";
const BD = "#E5E7EB";
const WH = "#FFFFFF";
const GN = "#10B981";
const AM = "#F59E0B";

// ─── Helpers ────────────────────────────────────────────────────
const isValidPhone = v => { const d=(v||"").replace(/\D/g,""); return d.length>=9&&d.length<=12; };
const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||"").trim());

const normalizePhone = v => {
  const d = (v||"").replace(/\D/g,"");
  const s = d.replace(/^972/,"").replace(/^0/,"");
  return { raw:d, local:"0"+s, intl:"+972"+s, intlNoPlus:"972"+s };
};

const pwValidate = v => {
  if (!v || v.length < 8)  return "לפחות 8 תווים";
  if (!/[A-Z]/.test(v))   return "חייב אות גדולה אחת";
  if (!/\d/.test(v))      return "חייב מספר אחד לפחות";
  return null;
};

const pwStrength = v => {
  let s=0;
  if(v.length>=8)  s++;
  if(v.length>=12) s++;
  if(/[A-Z]/.test(v)) s++;
  if(/\d/.test(v))    s++;
  if(/[^A-Za-z0-9]/.test(v)) s++;
  return s;
};

function maskEmail(em) {
  if (!em || !em.includes("@")) return em;
  const [local,domain] = em.split("@");
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const stars = "*".repeat(Math.min(local.length-2,5));
  return `${local[0]}${stars}${local[local.length-1]}@${domain}`;
}

// ─── Tiny UI ─────────────────────────────────────────────────────
const CSS = `
  @keyframes _ash_spin { to{transform:rotate(360deg)} }
  @keyframes _ash_in   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes _ash_shake{ 0%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} 100%{transform:translateX(0)} }
  @keyframes _ash_pop  { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  ._ash_in  { animation: _ash_in .25s ease both }
  ._ash_shk { animation: _ash_shake .4s ease }
  *{box-sizing:border-box}
`;

function Spinner({ s=18, c="white" }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      style={{animation:"_ash_spin .7s linear infinite",flexShrink:0}}>
      <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2.5"
        strokeDasharray="40" strokeDashoffset="14" strokeLinecap="round"/>
    </svg>
  );
}

function PhoneInput({ value, onChange, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{display:"flex",gap:8,alignItems:"center"}}>
      <div style={{
        background:WH, border:`1.5px solid ${BD}`,
        borderRadius:14, padding:"13px 12px",
        display:"flex", alignItems:"center", gap:6, flexShrink:0,
        fontSize:13, fontWeight:700, color:DK,
      }}>
        🇮🇱 <span>+972</span>
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^\d]/g,""))}
        placeholder="05X-XXX-XXXX"
        type="tel" inputMode="numeric" dir="ltr"
        maxLength={10} disabled={disabled}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        autoFocus
        style={{
          flex:1, padding:"13px 14px",
          border:`1.5px solid ${focused?R:BD}`,
          borderRadius:14, fontSize:15, outline:"none",
          background:disabled?"#F9FAFB":WH,
          fontFamily:"inherit", color:DK,
          transition:"border-color .15s", letterSpacing:1,
        }}
      />
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type="text", dir="rtl",
                     maxLength, autoFocus, disabled, right, onKeyDown, label, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{marginBottom:14}}>
      {label && <div style={{fontSize:12,fontWeight:700,color:GR,marginBottom:6,direction:"rtl"}}>{label}</div>}
      <div style={{position:"relative"}}>
        <input
          value={value} onChange={onChange} placeholder={placeholder}
          type={type} dir={dir} maxLength={maxLength}
          autoFocus={autoFocus} disabled={disabled} onKeyDown={onKeyDown}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{
            width:"100%", padding: right ? "13px 44px 13px 14px" : "13px 14px",
            border:`1.5px solid ${error?R:focused?R:BD}`,
            borderRadius:14, fontSize:14, outline:"none",
            background:disabled?"#F9FAFB":WH,
            direction:dir, fontFamily:"inherit", color:DK,
            transition:"border-color .15s", boxSizing:"border-box",
          }}
        />
        {right && (
          <div style={{position:"absolute",top:"50%",right:14,transform:"translateY(-50%)"}}>
            {right}
          </div>
        )}
      </div>
      {error && <div style={{color:R,fontSize:11,fontWeight:600,marginTop:4,direction:"rtl"}}>{error}</div>}
    </div>
  );
}

function EyeBtn({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      style={{background:"none",border:"none",cursor:"pointer",padding:4,color:GR,display:"flex"}}>
      {show
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
      }
    </button>
  );
}

function StrengthBar({ value }) {
  const s = pwStrength(value);
  const colors = [s>=1?R:BD, s>=2?AM:BD, s>=3?AM:BD, s>=4?GN:BD, s>=5?GN:BD];
  const label = ["","חלשה","בינונית","טובה","חזקה","מצוינת"][s]||"";
  const lc = s<=1?R:s<=3?AM:GN;
  return (
    <div style={{marginTop:8}}>
      <div style={{display:"flex",gap:4,marginBottom:4}}>
        {colors.map((c,i)=>(
          <div key={i} style={{flex:1,height:4,borderRadius:2,background:c,transition:"background .3s"}}/>
        ))}
      </div>
      {value.length>0 && <div style={{fontSize:11,color:lc,fontWeight:600}}>{label}</div>}
    </div>
  );
}

function BigBtn({ children, onClick, loading, disabled, variant="red", style:sx }) {
  const active = !disabled && !loading;
  const bg = variant==="dark" ? DK : active ? `linear-gradient(135deg,${R},${RD})` : "rgba(200,16,46,0.45)";
  return (
    <button onClick={onClick} disabled={!active} style={{
      width:"100%", padding:"14px", borderRadius:16, border:"none",
      background:bg, color:"white", fontSize:14, fontWeight:800,
      cursor:active?"pointer":"not-allowed",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      fontFamily:"inherit", boxShadow:active&&variant!=="dark"?"0 6px 20px rgba(200,16,46,.3)":"none",
      transition:"all .15s", ...sx,
    }}>
      {loading && <Spinner/>}
      {children}
    </button>
  );
}

function GenderPicker({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[{v:"male",l:"זכר 👨"},{v:"female",l:"נקבה 👩"},{v:"other",l:"אחר 🧑"}].map(g=>(
        <button key={g.v} type="button" onClick={()=>onChange(g.v)} style={{
          flex:1, padding:"11px 4px", borderRadius:12,
          border:`2px solid ${value===g.v?R:BD}`,
          background:value===g.v?RB:WH,
          cursor:"pointer", fontSize:12, fontWeight:value===g.v?700:500,
          color:value===g.v?R:GR, fontFamily:"inherit", transition:"all .15s",
        }}>{g.l}</button>
      ))}
    </div>
  );
}

// ─── OTP Boxes ───────────────────────────────────────────────────
function OTPBoxes({ value, onChange, disabled, error }) {
  const r0=useRef(null),r1=useRef(null),r2=useRef(null);
  const r3=useRef(null),r4=useRef(null),r5=useRef(null);
  const refs=[r0,r1,r2,r3,r4,r5];
  const digits = Array.from({length:6},(_,i)=>value[i]||"");

  const handleChange = (e,i) => {
    const ch = e.target.value.replace(/\D/g,"").slice(-1);
    if (!ch) return;
    const next = value.slice(0,i)+ch+value.slice(i+1);
    onChange(next.slice(0,6));
    if (i<5) refs[i+1].current?.focus();
  };
  const handleKey = (e,i) => {
    if (e.key==="Backspace") {
      if (value[i]) { onChange(value.slice(0,i)+value.slice(i+1)); }
      else if (i>0) refs[i-1].current?.focus();
    }
  };
  const handlePaste = e => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g,"").slice(0,6);
    onChange(p);
    refs[Math.min(p.length,5)].current?.focus();
  };

  return (
    <div style={{display:"flex",gap:8,justifyContent:"center",direction:"ltr",margin:"20px 0"}}>
      {digits.map((d,i)=>(
        <input key={i} ref={refs[i]}
          type="text" inputMode="numeric" maxLength={1}
          value={d} disabled={disabled}
          onChange={e=>handleChange(e,i)}
          onKeyDown={e=>handleKey(e,i)}
          onPaste={handlePaste}
          style={{
            width:46,height:56,textAlign:"center",
            fontFamily:"monospace",fontSize:22,fontWeight:900,
            border:`2px solid ${error?R:d?R:BD}`,
            borderRadius:14,outline:"none",
            background:d?RB:WH,
            color:error?"#EF4444":DK,
            transition:"border-color .15s,background .15s",
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AuthSheet({ open, onClose, onDone, onBusiness }) {

  // ── mode: idle|checking|login|register|otp_sent|otp_verify|submitting
  const [mode,        setMode]       = useState("idle");
  const [phone,       setPhone]      = useState("");
  const [loginEmail,  setLoginEmail] = useState("");
  const [password,    setPassword]   = useState("");
  const [showPw,      setShowPw]     = useState(false);
  const [otp,         setOtp]        = useState("");
  const [maskedEmail, setMasked]     = useState("");
  const [otpTimer,    setOtpTimer]   = useState(60);
  const [canResend,   setCanResend]  = useState(false);

  // register fields
  const [regEmail,   setRegEmail]   = useState("");
  const [regPass,    setRegPass]    = useState("");
  const [regPass2,   setRegPass2]   = useState("");
  const [showRegPw,  setShowRegPw]  = useState(false);
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [gender,     setGender]     = useState("");
  const [age,        setAge]        = useState("");

  // forgot password
  const [forgotSent,    setForgotSent]    = useState(false);
  const [forgotSending, setForgotSending] = useState(false);

  // errors
  const [error,      setError]    = useState("");
  const [fieldErrs,  setFieldErrs]= useState({});

  const debounceRef = useRef(null);
  const timerRef    = useRef(null);
  const pwRef       = useRef(null);

  const isBusy = ["checking","submitting","otp_verify"].includes(mode);

  // ── reset on open ────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setMode("idle"); setPhone(""); setPassword(""); setLoginEmail("");
      setRegEmail(""); setRegPass(""); setRegPass2(""); setFirstName("");
      setLastName(""); setGender(""); setAge(""); setOtp("");
      setError(""); setFieldErrs({}); setForgotSent(false); setForgotSending(false);
    }
  }, [open]);

  // ── OTP timer ────────────────────────────────────────────────
  useEffect(() => {
    if (mode!=="otp_sent") return;
    setOtpTimer(60); setCanResend(false);
    timerRef.current = setInterval(()=>{
      setOtpTimer(t=>{
        if(t<=1){clearInterval(timerRef.current);setCanResend(true);return 0;}
        return t-1;
      });
    },1000);
    return ()=>clearInterval(timerRef.current);
  },[mode]);

  // ── auto-focus password on login mode ───────────────────────
  useEffect(()=>{
    if(mode==="login") setTimeout(()=>pwRef.current?.focus(),300);
  },[mode]);

  // ── phone change → debounce DB check ────────────────────────
  const handlePhone = useCallback(val => {
    setPhone(val); setError(""); setFieldErrs({});
    if (!["idle","checking"].includes(mode)) {
      setMode("idle"); setPassword(""); setLoginEmail("");
      setForgotSent(false);
    }
    clearTimeout(debounceRef.current);
    if (!isValidPhone(val)) { if(mode==="checking") setMode("idle"); return; }
    setMode("checking");
    debounceRef.current = setTimeout(async()=>{
      try {
        const {local,intl,intlNoPlus,raw} = normalizePhone(val);
        let found=null;
        for (const v of [intl,local,intlNoPlus,raw]) {
          const {data} = await supabase.from("users").select("email").eq("phone",v).maybeSingle();
          if(data?.email){found=data.email;break;}
        }
        if(found){ setLoginEmail(found); setMode("login"); }
        else      { setMode("register"); }
      } catch {
        setMode("idle"); setError("שגיאת חיבור — נסה שוב");
      }
    },450);
  },[mode]);

  // ── login with password ──────────────────────────────────────
  const doLogin = async () => {
    if(!password){setFieldErrs({pw:"נא להזין סיסמה"});return;}
    setError(""); setFieldErrs({}); setMode("submitting");
    const {data,error:e} = await supabase.auth.signInWithPassword({email:loginEmail,password});
    if(e){setMode("login");setError("הסיסמה שגויה — נסה שוב");return;}
    const m=data.user?.user_metadata||{};
    if(!m.firstName){setMode("login");setError("שגיאה בטעינת הפרופיל");return;}
    _done(data.user,m);
  };

  // ── send OTP ─────────────────────────────────────────────────
  const doSendOTP = async () => {
    setError(""); setMode("submitting");
    const {error:e} = await supabase.auth.signInWithOtp({
      email:loginEmail, options:{shouldCreateUser:false}
    });
    if(e){
      setMode("login");
      setError(e.status===429?"יותר מדי בקשות — המתן דקה":"לא ניתן לשלוח קוד");
      return;
    }
    setMasked(maskEmail(loginEmail)); setOtp(""); setMode("otp_sent");
  };

  // ── forgot password ──────────────────────────────────────────
  const doForgot = async () => {
    if(!loginEmail||forgotSending) return;
    setForgotSending(true); setError("");
    const {error:e} = await supabase.auth.resetPasswordForEmail(loginEmail,{
      redirectTo: window.location.origin,
    });
    setForgotSending(false);
    if(e){ setError("שגיאה — נסה שוב"); }
    else  { setForgotSent(true); }
  };

  // ── verify OTP ───────────────────────────────────────────────
  const doVerifyOTP = async code => {
    if(code.length!==6) return;
    setMode("otp_verify");
    const {data,error:e} = await supabase.auth.verifyOtp({
      email:loginEmail, token:code, type:"email"
    });
    if(e){setMode("otp_sent");setOtp("");setError("הקוד שגוי — נסה שוב");return;}
    _done(data.user,data.user?.user_metadata||{});
  };

  const handleOtpChange = val => {
    setOtp(val); setError("");
    if(val.length===6) doVerifyOTP(val);
  };

  // ── register ─────────────────────────────────────────────────
  const doRegister = async () => {
    const errs={};
    if(!isValidEmail(regEmail))   errs.regEmail="אימייל לא תקין";
    const pe=pwValidate(regPass); if(pe) errs.regPass=pe;
    if(regPass!==regPass2)        errs.regPass2="הסיסמאות אינן תואמות";
    if(!firstName.trim())         errs.firstName="שדה חובה";
    if(!lastName.trim())          errs.lastName="שדה חובה";
    if(!gender)                   errs.gender="יש לבחור מגדר";
    const a=parseInt(age);
    if(!age||isNaN(a)||a<13||a>100) errs.age="גיל לא תקין (13–100)";
    if(Object.keys(errs).length){setFieldErrs(errs);return;}
    setError(""); setFieldErrs({}); setMode("submitting");

    // check phone uniqueness
    const {local,intl,intlNoPlus,raw} = normalizePhone(phone);
    for(const v of [intl,local,intlNoPlus,raw]){
      const {data:pd} = await supabase.from("users").select("id").eq("phone",v).maybeSingle();
      if(pd){setMode("register");setFieldErrs({regPhone:"מספר הטלפון כבר רשום"});return;}
    }

    // check email uniqueness
    const emailFinal=regEmail.trim().toLowerCase();
    const {data:ed} = await supabase.from("users").select("id").eq("email",emailFinal).maybeSingle();
    if(ed){setMode("register");setFieldErrs({regEmail:"האימייל כבר רשום — נסה להתחבר"});return;}

    const meta={firstName:firstName.trim(),lastName:lastName.trim(),phone:intl,gender,age};
    const {data,error:e} = await supabase.auth.signUp({
      email:emailFinal, password:regPass, options:{data:meta}
    });
    if(e){
      setMode("register");
      setError(e.message?.toLowerCase().includes("already")
        ? "האימייל כבר רשום — נסה להתחבר"
        : "שגיאה: "+e.message);
      return;
    }
    if(data.user){
      await supabase.from("users").upsert({
        id:data.user.id, name:`${meta.firstName} ${meta.lastName}`,
        phone:meta.phone, email:emailFinal,
      });
    }
    _done(data.user,meta);
  };

  // ── done ─────────────────────────────────────────────────────
  function _done(user,meta){
    const profile={
      id:user.id, email:user.email,
      name:`${meta.firstName||""} ${meta.lastName||""}`.trim(),
      firstName:meta.firstName||"", lastName:meta.lastName||"",
      phone:meta.phone||"", gender:meta.gender||"", age:meta.age||"",
    };
    setTimeout(()=>onDone(profile),400);
    onClose();
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  const isLogin    = mode==="login" || (mode==="submitting" && loginEmail);
  const isRegister = mode==="register" || (mode==="submitting" && !loginEmail);
  const isOTP      = mode==="otp_sent" || mode==="otp_verify";

  return (
    <BottomSheet open={open} onClose={onClose} maxHeight="92vh" zIndex={8000}>
      <style>{CSS}</style>
      <div style={{padding:"6px 22px 44px",direction:"rtl",fontFamily:"'Segoe UI',Arial,sans-serif"}}>

        {/* ── Handle label ── */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:900,color:DK}}>
            {isOTP ? "🔐 קוד אימות"
             : isLogin ? "👋 ברוך הבא!"
             : isRegister ? "🎉 יצירת חשבון"
             : "📱 כניסה / הרשמה"}
          </div>
          <div style={{fontSize:13,color:GR,marginTop:4}}>
            {isOTP ? `קוד נשלח ל-${maskedEmail}`
             : isLogin ? "הזן את הסיסמה שלך"
             : isRegister ? "ספר לנו קצת על עצמך"
             : "הירשם או התחבר עם מספר הטלפון שלך"}
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="_ash_shk" style={{
            background:RB, border:`1px solid #FCA5A5`,
            borderRadius:12, padding:"11px 14px",
            fontSize:13, color:"#DC2626", fontWeight:600,
            marginBottom:14, direction:"rtl",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ══════════════════════════════════════
            OTP SCREEN
        ══════════════════════════════════════ */}
        {isOTP && (
          <div className="_ash_in">
            <div style={{
              background:"#FFFBEB", border:"1px solid #FDE68A",
              borderRadius:14, padding:"14px 16px", marginBottom:20, textAlign:"center",
            }}>
              <div style={{fontSize:11,fontWeight:700,color:"#92400E",marginBottom:4}}>קוד נשלח אל</div>
              <div style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:DK}}>{maskedEmail}</div>
            </div>

            <OTPBoxes value={otp} onChange={handleOtpChange}
              disabled={mode==="otp_verify"} error={!!error} />

            {mode==="otp_verify" && (
              <div style={{display:"flex",justifyContent:"center",padding:12}}>
                <Spinner s={28} c={R}/>
              </div>
            )}

            <div style={{textAlign:"center",marginTop:12}}>
              {canResend
                ? <button onClick={doSendOTP} style={{
                    background:"none",border:"none",color:R,
                    fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  }}>שלח קוד חדש</button>
                : <div style={{color:GR,fontSize:13}}>
                    שלח שוב בעוד <b style={{color:R}}>{otpTimer}</b> שניות
                  </div>
              }
            </div>

            <div style={{
              marginTop:20, background:"#EFF6FF", border:"1px solid #BFDBFE",
              borderRadius:12, padding:"12px 16px", fontSize:12, color:"#1E40AF", textAlign:"center",
            }}>
              🔒 הקוד תקף ל-5 דקות
            </div>

            <button onClick={()=>{setMode("login");setOtp("");setError("");}}
              style={{
                width:"100%",background:"none",border:"none",
                color:GR,fontSize:13,cursor:"pointer",
                marginTop:16,fontFamily:"inherit",
              }}>
              ← חזור
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════
            MAIN: PHONE + LOGIN/REGISTER
        ══════════════════════════════════════ */}
        {!isOTP && (
          <>
            {/* Phone field */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,color:GR,marginBottom:6}}>מספר טלפון</div>
              <PhoneInput value={phone} onChange={handlePhone} disabled={isBusy&&mode!=="checking"}/>
              {mode==="checking" && (
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,fontSize:12,color:GR}}>
                  <Spinner s={14} c={R}/> בודק מספר...
                </div>
              )}
            </div>

            {/* ── LOGIN mode: password slides in ── */}
            {isLogin && (
              <div className="_ash_in">
                {/* mode badge */}
                <div style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  background:RB,border:`1px solid #FCA5A5`,
                  borderRadius:20,padding:"4px 12px",
                  fontSize:11,fontWeight:700,color:R,marginBottom:16,
                }}>
                  🔑 מספר מוכר — כניסה לחשבון
                </div>

                {/* password */}
                <TextInput
                  ref={pwRef}
                  label="סיסמה"
                  value={password}
                  onChange={e=>{setPassword(e.target.value);setFieldErrs(p=>({...p,pw:""}));}}
                  placeholder="הסיסמה שלך"
                  type={showPw?"text":"password"}
                  dir="ltr"
                  disabled={isBusy}
                  onKeyDown={e=>e.key==="Enter"&&doLogin()}
                  error={fieldErrs.pw}
                  right={<EyeBtn show={showPw} onToggle={()=>setShowPw(p=>!p)}/>}
                />

                {/* forgot + OTP row */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <button onClick={doSendOTP} disabled={isBusy} style={{
                    background:"none",border:"none",color:R,
                    fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                    display:"flex",alignItems:"center",gap:5,
                  }}>
                    🔢 כניסה דרך קוד
                  </button>
                  {forgotSent
                    ? <div style={{fontSize:11,color:GN,fontWeight:700}}>✓ קישור נשלח לאימייל</div>
                    : <button onClick={doForgot} disabled={forgotSending} style={{
                        background:"none",border:"none",color:GR,
                        fontSize:12,cursor:"pointer",fontFamily:"inherit",
                        opacity:forgotSending?.6:1,
                      }}>
                        {forgotSending?"שולח...":"שכחת סיסמה?"}
                      </button>
                  }
                </div>

                <BigBtn onClick={doLogin} loading={isBusy} disabled={!password}>
                  ✓ כניסה
                </BigBtn>
              </div>
            )}

            {/* ── REGISTER mode ── */}
            {isRegister && (
              <div className="_ash_in">
                <div style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  background:"#F0FDF4",border:"1px solid #BBF7D0",
                  borderRadius:20,padding:"4px 12px",
                  fontSize:11,fontWeight:700,color:"#16A34A",marginBottom:16,
                }}>
                  ✨ מספר חדש — יצירת חשבון
                </div>

                <TextInput label="אימייל *" value={regEmail}
                  onChange={e=>{setRegEmail(e.target.value);setFieldErrs(p=>({...p,regEmail:""}));}}
                  placeholder="example@email.com" type="email" dir="ltr"
                  disabled={isBusy} error={fieldErrs.regEmail}/>

                <div style={{display:"flex",gap:10}}>
                  <div style={{flex:1}}>
                    <TextInput label="שם פרטי *" value={firstName}
                      onChange={e=>{setFirstName(e.target.value);setFieldErrs(p=>({...p,firstName:""}));}}
                      placeholder="שם פרטי" disabled={isBusy} error={fieldErrs.firstName}/>
                  </div>
                  <div style={{flex:1}}>
                    <TextInput label="שם משפחה *" value={lastName}
                      onChange={e=>{setLastName(e.target.value);setFieldErrs(p=>({...p,lastName:""}));}}
                      placeholder="שם משפחה" disabled={isBusy} error={fieldErrs.lastName}/>
                  </div>
                </div>

                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,fontWeight:700,color:GR,marginBottom:6}}>מגדר *</div>
                  <GenderPicker value={gender} onChange={v=>{setGender(v);setFieldErrs(p=>({...p,gender:""}));}}/>
                  {fieldErrs.gender && <div style={{color:R,fontSize:11,fontWeight:600,marginTop:-8,marginBottom:8}}>{fieldErrs.gender}</div>}
                </div>

                <TextInput label="גיל *" value={age}
                  onChange={e=>{setAge(e.target.value.replace(/\D/g,""));setFieldErrs(p=>({...p,age:""}));}}
                  placeholder="גיל (13–100)" maxLength={3} disabled={isBusy} error={fieldErrs.age}/>

                <TextInput label="סיסמה *" value={regPass}
                  onChange={e=>{setRegPass(e.target.value);setFieldErrs(p=>({...p,regPass:""}));}}
                  placeholder="8+ תווים, אות גדולה ומספר"
                  type={showRegPw?"text":"password"} dir="ltr" disabled={isBusy}
                  error={fieldErrs.regPass}
                  right={<EyeBtn show={showRegPw} onToggle={()=>setShowRegPw(p=>!p)}/>}/>
                {regPass.length>0 && <StrengthBar value={regPass}/>}

                <div style={{marginTop:regPass.length>0?12:0}}>
                  <TextInput label="אימות סיסמה *" value={regPass2}
                    onChange={e=>{setRegPass2(e.target.value);setFieldErrs(p=>({...p,regPass2:""}));}}
                    placeholder="חזור על הסיסמה"
                    type="password" dir="ltr" disabled={isBusy}
                    onKeyDown={e=>e.key==="Enter"&&doRegister()}
                    error={fieldErrs.regPass2}/>
                </div>

                <BigBtn onClick={doRegister} loading={isBusy} style={{marginTop:8}}>
                  ✓ יצירת חשבון
                </BigBtn>
              </div>
            )}

            {/* ── Divider + Google (always shown unless login/register filling) ── */}
            {(mode==="idle"||mode==="checking") && (
              <>
                <div style={{display:"flex",alignItems:"center",gap:10,margin:"20px 0"}}>
                  <div style={{flex:1,height:1,background:BD}}/>
                  <span style={{color:GR,fontSize:11,fontWeight:600}}>או המשך עם</span>
                  <div style={{flex:1,height:1,background:BD}}/>
                </div>

                <button onClick={async()=>{
                  await supabase.auth.signInWithOAuth({
                    provider:"google",
                    options:{redirectTo:window.location.href},
                  });
                }} style={{
                  width:"100%",padding:"13px",borderRadius:14,
                  border:`1.5px solid ${BD}`,background:WH,color:DK,
                  fontSize:14,fontWeight:700,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  fontFamily:"inherit",marginBottom:12,
                }}>
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.5 13.1 17.8 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/>
                    <path fill="#FBBC05" d="M10.6 28.6c-.4-1.1-.6-2.3-.6-3.6s.2-2.5.6-3.6L2.7 15.3C1 18.4 0 21.6 0 25s1 6.6 2.7 9.7l7.9-6.1z"/>
                    <path fill="#34A853" d="M24 50c6.2 0 11.5-2 15.3-5.5l-7.6-5.9c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-3.6-13.4-8.8l-7.9 6.1C6.7 44.6 14.7 50 24 50z"/>
                  </svg>
                  כניסה עם Google
                </button>
              </>
            )}

            {/* ── Business portal (only in idle/checking) ── */}
            {(mode==="idle"||mode==="checking") && (
              <div style={{borderTop:`1px solid ${BD}`,paddingTop:16,marginTop:4}}>
                <div style={{textAlign:"center",fontSize:11,color:GR,marginBottom:8,fontWeight:600}}>
                  יש לך עסק או מסעדה?
                </div>
                <BigBtn onClick={()=>{onClose();onBusiness?.();}} variant="dark">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
                    <polyline points="9 22 9 12 15 12 15 22"
                      stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  פורטל עסקים — הירשם כבעל עסק
                </BigBtn>
              </div>
            )}

            {/* terms */}
            <div style={{textAlign:"center",color:GR,fontSize:10,marginTop:16,lineHeight:1.7}}>
              בהמשך אתה מסכים ל
              <span style={{color:R,fontWeight:700}}>תנאי השימוש</span> ול
              <span style={{color:R,fontWeight:700}}>מדיניות הפרטיות</span>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
