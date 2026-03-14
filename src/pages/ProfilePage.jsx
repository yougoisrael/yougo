// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ProfilePage.jsx — Yougo v4
//  ضيف → مربع هاتف → اسم/عمر/جنس → إيميل+OTP+رقم سري
//  أو هاتف موجود → رقم سري فقط
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  C, IcoUser, IcoChevDown, IcoShield, IcoPackage,
  IcoMapPin, IcoCreditCard, IcoCoupon, IcoUsers,
  IcoBell, IcoHelp, IcoDoc, IcoLock, IcoBack,
  IcoBox, IcoCardPayment, IcoGift, IcoLightning,
} from "../components/Icons";
import BottomNav from "../components/BottomNav";
import { supabase } from "../lib/supabase";
import AuthSheet from "../components/AuthSheet";
import BottomSheet from "../components/BottomSheet";

const RED  = "#C8102E";
const DARK = "#111827";
const GRAY = "#6B7280";
const BG   = "#F7F7F8";
const CSS  = `
  @keyframes _up  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
  @keyframes _fd  { from{opacity:0} to{opacity:1} }
  @keyframes _sp  { to{transform:rotate(360deg)} }
  *{box-sizing:border-box}
`;

// ── helpers ──────────────────────────────────────
const isPhone = v => { const d=(v||"").replace(/\D/g,""); return d.length>=9&&d.length<=12; };
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||"").trim());
const pwErr   = v => { if(!v||v.length<6) return "לפחות 6 תווים"; return null; };

function Spin() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    style={{animation:"_sp .7s linear infinite",flexShrink:0}}>
    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2.5"
      strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round"/>
  </svg>;
}

function Modal({ children, onClose }) {
  return (
    <BottomSheet open={true} onClose={onClose} maxHeight="90vh" zIndex={9000}>
      <div style={{ padding:"20px 22px 36px" }}>
        {children}
      </div>
    </BottomSheet>
  );
}

function Inp({ label, value, onChange, placeholder, type="text", dir="rtl", maxLen, autoFocus, prefix }) {
  const [f,setF] = useState(false);
  return (
    <div style={{marginBottom:14}}>
      {label && <div style={{fontSize:12,fontWeight:700,color:GRAY,marginBottom:6,direction:"rtl"}}>{label}</div>}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {prefix && (
          <div style={{background:"white",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"12px 10px",
            display:"flex",alignItems:"center",gap:5,flexShrink:0,fontSize:12,fontWeight:700}}>
            🇮🇱 +972
          </div>
        )}
        <input value={value} onChange={onChange} placeholder={placeholder} type={type}
          maxLength={maxLen} autoFocus={autoFocus} dir={dir}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{
            width:"100%",padding:"13px 14px",
            border:`1.5px solid ${f?RED:"#E5E7EB"}`,borderRadius:14,
            fontSize:14,outline:"none",background:"white",
            direction:dir,fontFamily:"inherit",color:DARK,
            transition:"border-color .15s",
          }}
        />
      </div>
    </div>
  );
}

function Btn({ children, onClick, loading, disabled, variant="red" }) {
  const bg = variant==="red" ? (disabled||loading ? "rgba(200,16,46,0.5)" : RED) : "#F3F4F6";
  const color = variant==="red" ? "white" : DARK;
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      width:"100%",padding:"14px",borderRadius:16,border:"none",
      background:bg,color,fontSize:14,fontWeight:800,
      cursor:disabled||loading?"not-allowed":"pointer",
      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      fontFamily:"inherit",
      boxShadow: variant==="red" ? "0 6px 20px rgba(200,16,46,.25)" : "none",
      transition:"all .15s",
    }}>
      {loading && <Spin/>}
      {children}
    </button>
  );
}

function Err({ msg }) {
  if (!msg) return null;
  return <div style={{color:"#EF4444",fontSize:12,fontWeight:600,marginTop:-8,marginBottom:10,direction:"rtl"}}>{msg}</div>;
}

// ── MENU ─────────────────────────────────────────
const MENU_ITEMS = [
  { Ico:IcoPackage,    label:"ההזמנות שלי",    path:"/orders" },
  { Ico:IcoCreditCard, label:"אמצעי תשלום",    path:"/cards" },
  { Ico:IcoUsers,      label:"הזמן חבר",        path:"/invite" },
  { Ico:IcoBell,       label:"התראות",           key:"notifs" },
  { Ico:IcoHelp,       label:"תמיכה",            path:"/support" },
  { Ico:IcoMapPin,     label:"ניהול אזורים",     path:"/admin/zones" },
  { Ico:IcoDoc,        label:"תנאי שימוש",       path:"/terms" },
  { Ico:IcoLock,       label:"מדיניות פרטיות",   path:"/privacy" },
];

// ════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════
export default function ProfilePage({ user, cartCount, onLogout, onUserUpdate, guest, onAuthDone }) {
  const navigate = useNavigate();

  // حالة التسجيل المتعدد الخطوات
  const [modal,      setModal]      = useState(null); // null | "phone" | "info" | "email" | "otp" | "password" | "login-pw"
  const [showAuth,   setShowAuth]   = useState(false);
  const [phone,      setPhone]      = useState("");
  const [phoneErr,   setPhoneErr]   = useState("");
  const [phoneBusy,  setPhoneBusy]  = useState(false);
  const [regInfo,    setRegInfo]    = useState({ firstName:"", lastName:"", age:"", gender:"" });
  const [infoErr,    setInfoErr]    = useState({});
  const [email,      setEmail]      = useState("");
  const [emailErr,   setEmailErr]   = useState("");
  const [emailBusy,  setEmailBusy]  = useState(false);
  const [otp,        setOtp]        = useState(["","","","","",""]);
  const [otpErr,     setOtpErr]     = useState("");
  const [otpBusy,    setOtpBusy]    = useState(false);
  const [otpTimer,   setOtpTimer]   = useState(60);
  const [canResend,  setCanResend]  = useState(false);
  const [pass,       setPass]       = useState("");
  const [pass2,      setPass2]      = useState("");
  const [passErr,    setPassErr]    = useState("");
  const [passBusy,   setPassBusy]   = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // OTP timer
  useEffect(() => {
    if (modal !== "otp") return;
    setOtpTimer(60); setCanResend(false);
    const t = setInterval(() => setOtpTimer(p => {
      if (p <= 1) { clearInterval(t); setCanResend(true); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [modal]);

  // ── STEP 1: Phone check ──────────────────────
  async function doPhone() {
    setPhoneErr("");
    const raw = phone.replace(/\D/g,"");
    if (!isPhone(raw)) { setPhoneErr("הזן מספר טלפון תקין"); return; }
    setPhoneBusy(true);

    // نجرب كل صيغ الرقم — مع 0 وبدون 0 ومع 972
    const stripped = raw.replace(/^972/,"").replace(/^0/,"");
    const variants = [
      raw,
      "0" + stripped,
      stripped,
      "972" + stripped,
    ];

    let found = null;
    for (const v of variants) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("email")
          .eq("phone", v)
          .maybeSingle();
        if (!error && data?.email) { found = data.email; break; }
      } catch {}
    }
    setPhoneBusy(false);

    if (found) {
      // مستخدم موجود — اطلب رقم السري فقط
      setEmail(found);
      setPass("");
      setPassErr("");
      setModal("login-pw");
    } else {
      // جديد — انتقل لمعلومات
      setModal("info");
    }
  }

  // ── STEP 2: Info ─────────────────────────────
  function doInfo() {
    const e = {};
    if (!regInfo.firstName.trim()) e.firstName = "שדה חובה";
    if (!regInfo.lastName.trim())  e.lastName  = "שדה חובה";
    const a = parseInt(regInfo.age);
    if (!regInfo.age || isNaN(a) || a<13 || a>100) e.age = "גיל 13-100";
    if (!regInfo.gender) e.gender = "בחר מגדר";
    if (Object.keys(e).length) { setInfoErr(e); return; }
    setInfoErr({});
    setModal("email");
  }

  // ── STEP 3: Send OTP ─────────────────────────
  async function doSendOtp() {
    setEmailErr("");
    const e = email.trim().toLowerCase();
    if (!isEmail(e)) { setEmailErr("הזן אימייל תקין"); return; }
    setEmailBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email:e, options:{ shouldCreateUser:true }});
    setEmailBusy(false);
    if (error) {
      setEmailErr(error.status===429 ? "יותר מדי בקשות — המתן דקה" : "שגיאה: "+(error.message||"נסה שוב"));
      return;
    }
    setOtp(["","","","","",""]);
    setOtpErr("");
    setModal("otp");
  }

  // ── STEP 4: Verify OTP ───────────────────────
  function onDigit(i, v) {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n); setOtpErr("");
    if (v && i < 5) document.getElementById("o"+(i+1))?.focus();
    if (n.join("").length === 6) doVerifyOtp(n.join(""));
  }
  function onBk(i, e) { if (e.key==="Backspace" && !otp[i] && i>0) document.getElementById("o"+(i-1))?.focus(); }

  async function doVerifyOtp(code) {
    setOtpBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(), token: code, type: "email"
    });
    setOtpBusy(false);
    if (error) {
      setOtpErr("הקוד שגוי — נסה שוב");
      setOtp(["","","","","",""]);
      setTimeout(() => document.getElementById("o0")?.focus(), 100);
      return;
    }
    // صفّر حقول كلمة السر قبل ما نفتح المودال
    setPass("");
    setPass2("");
    setPassErr("");
    setModal("password");
  }

  // ── STEP 5: Set password + save ──────────────
  async function doSetPassword() {
    setPassErr("");
    const pe = pwErr(pass);
    if (pe) { setPassErr(pe); return; }
    if (pass !== pass2) { setPassErr("הסיסמאות אינן תואמות"); return; }
    setPassBusy(true);

    // نحفظ الرقم بصيغة موحدة — مع 0 في البداية
    const rawPhone = phone.replace(/\D/g,"");
    const stripped = rawPhone.replace(/^972/,"").replace(/^0/,"");
    const normalPhone = "0" + stripped;

    const meta = {
      firstName: regInfo.firstName.trim(),
      lastName:  regInfo.lastName.trim(),
      phone:     normalPhone,
      gender:    regInfo.gender,
      age:       regInfo.age,
    };

    const { error: pwError } = await supabase.auth.updateUser({ password: pass, data: meta });
    if (pwError) { setPassErr("שגיאה: "+(pwError.message||"נסה שוב")); setPassBusy(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const strippedSave = meta.phone.replace(/^0/,"");
      await supabase.from("users").upsert({
        id:    session.user.id,
        name:  meta.firstName+" "+meta.lastName,
        phone: meta.phone,        // صيغة "0XX..."
        email: email.trim().toLowerCase(),
      });
      // نحفظ الصيغة البديلة أيضاً لو ما انحفظت
      await supabase.from("users").upsert({
        id:    session.user.id,
        name:  meta.firstName+" "+meta.lastName,
        phone: strippedSave,      // صيغة بدون 0
        email: email.trim().toLowerCase(),
      }).then(() => {}).catch(() => {});
      onAuthDone?.({
        id:        session.user.id,
        email:     session.user.email,
        name:      meta.firstName+" "+meta.lastName,
        firstName: meta.firstName,
        phone:     meta.phone,
        gender:    meta.gender,
        age:       meta.age,
      });
    }
    setPassBusy(false);
    setModal(null);
  }

  // ── Login existing: password only ────────────
  async function doLoginWithPw() {
    setPassErr("");
    if (!pass) { setPassErr("הזן סיסמה"); return; }
    setPassBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setPassBusy(false);
    if (error) { setPassErr("סיסמה שגויה — נסה שוב"); return; }
    const m = data.user?.user_metadata || {};
    onAuthDone?.({
      id:        data.user.id,
      email:     data.user.email,
      name:      (m.firstName||"")+" "+(m.lastName||""),
      firstName: m.firstName||"",
      phone:     m.phone||"",
      gender:    m.gender||"",
      age:       m.age||"",
    });
    setModal(null);
  }

  // ─────────────────────────────────────────────
  //  GUEST VIEW
  // ─────────────────────────────────────────────
  if (guest) return (
    <div style={{ fontFamily:"Arial,sans-serif", background:BG, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", paddingBottom:80 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)", padding:"60px 20px 80px", position:"relative", overflow:"hidden", textAlign:"center" }}>
        <div style={{ position:"absolute", bottom:-30, left:0, right:0, height:60, background:BG, borderRadius:"50% 50% 0 0" }}/>
        <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", border:"2.5px solid rgba(255,255,255,0.35)" }}>
          <IcoUser s={34} c="white"/>
        </div>
        <div style={{ color:"white", fontSize:22, fontWeight:900 }}>אורח</div>
        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginTop:4 }}>התחבר לחוויה מלאה</div>
      </div>

      <div style={{ padding:"24px 18px" }}>
        {/* فوائد التسجيل */}
        <div style={{ background:"white", borderRadius:18, padding:"18px", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontWeight:900, fontSize:15, color:DARK, marginBottom:14, textAlign:"center" }}>למה להירשם? 🚀</div>
          {[
            { Ico:IcoPackage, t:"מעקב הזמנות בזמן אמת" },
            { Ico:IcoCreditCard, t:"שמור אמצעי תשלום" },
            { Ico:IcoGift, t:"קופונים והטבות בלעדיות" },
            { Ico:IcoFlash, t:"הזמנה מהירה יותר" },
          ].map((x,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:i<3?"1px solid #F3F4F6":"none" }}>
              <span style={{ width:28, display:"flex", alignItems:"center", justifyContent:"center" }}>{x.Ico ? <x.Ico s={22} c="#C8102E"/> : null}</span>
              <span style={{ fontSize:13, fontWeight:600, color:DARK }}>{x.t}</span>
            </div>
          ))}
        </div>

        <Btn onClick={() => setShowAuth(true)}>
          📱 הירשם / התחבר
        </Btn>
      </div>

      {/* ── MODAL: Phone ── */}
      {modal === "phone" && (
        <Modal onClose={() => setModal(null)}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>📱</div>
            <div style={{ fontSize:20, fontWeight:900, color:DARK }}>מספר טלפון</div>
            <div style={{ fontSize:13, color:GRAY, marginTop:4 }}>הירשם או התחבר עם מספר הטלפון שלך</div>
          </div>
          <Inp value={phone} onChange={e => { setPhone(e.target.value.replace(/[^\d-]/g,"")); setPhoneErr(""); }}
            placeholder="05X-XXX-XXXX" dir="ltr" maxLen={12} autoFocus prefix />
          <Err msg={phoneErr}/>
          <Btn onClick={doPhone} loading={phoneBusy}>המשך →</Btn>
        </Modal>
      )}

      {/* ── MODAL: Info ── */}
      {modal === "info" && (
        <Modal onClose={() => setModal("phone")}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>👤</div>
            <div style={{ fontSize:20, fontWeight:900, color:DARK }}>פרטים אישיים</div>
            <div style={{ fontSize:13, color:GRAY, marginTop:4 }}>ספר לנו קצת על עצמך</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1 }}>
              <Inp label="שם פרטי *" value={regInfo.firstName}
                onChange={e => setRegInfo(p=>({...p,firstName:e.target.value}))}
                placeholder="שם פרטי" autoFocus/>
              <Err msg={infoErr.firstName}/>
            </div>
            <div style={{ flex:1 }}>
              <Inp label="שם משפחה *" value={regInfo.lastName}
                onChange={e => setRegInfo(p=>({...p,lastName:e.target.value}))}
                placeholder="שם משפחה"/>
              <Err msg={infoErr.lastName}/>
            </div>
          </div>
          <Inp label="גיל *" value={regInfo.age}
            onChange={e => setRegInfo(p=>({...p,age:e.target.value.replace(/\D/g,"")}))}
            placeholder="גיל (13-100)" maxLen={3}/>
          <Err msg={infoErr.age}/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:GRAY, marginBottom:6 }}>מגדר *</div>
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"male",l:"זכר 👨"},{v:"female",l:"נקבה 👩"},{v:"other",l:"אחר 🧑"}].map(g => (
                <button key={g.v} onClick={() => setRegInfo(p=>({...p,gender:g.v}))} style={{
                  flex:1, padding:"11px 4px", borderRadius:14,
                  border:`2px solid ${regInfo.gender===g.v?RED:"#E5E7EB"}`,
                  background:regInfo.gender===g.v?"rgba(200,16,46,0.06)":"white",
                  cursor:"pointer", fontSize:11, fontWeight:regInfo.gender===g.v?700:500,
                  color:regInfo.gender===g.v?RED:GRAY, fontFamily:"inherit", transition:"all .15s",
                }}>{g.l}</button>
              ))}
            </div>
            <Err msg={infoErr.gender}/>
          </div>
          <Btn onClick={doInfo}>המשך →</Btn>
        </Modal>
      )}

      {/* ── MODAL: Email ── */}
      {modal === "email" && (
        <Modal onClose={() => setModal("info")}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>✉️</div>
            <div style={{ fontSize:20, fontWeight:900, color:DARK }}>כתובת אימייל</div>
            <div style={{ fontSize:13, color:GRAY, marginTop:4 }}>נשלח לך קוד אימות של 6 ספרות</div>
          </div>
          <Inp value={email} onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
            placeholder="example@email.com" type="email" dir="ltr" autoFocus/>
          <Err msg={emailErr}/>
          <Btn onClick={doSendOtp} loading={emailBusy}>שלח קוד →</Btn>
        </Modal>
      )}

      {/* ── MODAL: OTP ── */}
      {modal === "otp" && (
        <Modal onClose={() => setModal("email")}>
          <div style={{ textAlign:"center", marginBottom:22 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🔐</div>
            <div style={{ fontSize:20, fontWeight:900, color:DARK }}>קוד אימות</div>
            <div style={{ fontSize:13, color:GRAY, marginTop:4 }}>שלחנו קוד 6 ספרות ל-<b style={{color:DARK}}>{email}</b></div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", direction:"ltr", marginBottom:14 }}>
            {otp.map((d,i) => (
              <input key={i} id={"o"+i} value={d} maxLength={1} autoFocus={i===0}
                onChange={e => onDigit(i,e.target.value)} onKeyDown={e => onBk(i,e)}
                style={{
                  width:46, height:56, textAlign:"center", fontSize:24, fontWeight:900,
                  border:`2px solid ${otpErr?RED:d?RED:"#E5E7EB"}`,
                  borderRadius:14, outline:"none",
                  background:d?"rgba(200,16,46,0.05)":"white",
                  color:otpErr?"#EF4444":DARK, fontFamily:"inherit",
                  transition:"border-color .15s",
                }}
              />
            ))}
          </div>
          {otpErr && <div style={{textAlign:"center",color:"#EF4444",fontSize:13,fontWeight:600,marginBottom:12}}>{otpErr}</div>}
          {otpBusy && <div style={{textAlign:"center",padding:8,color:GRAY,fontSize:13}}>מאמת...</div>}
          <div style={{ textAlign:"center", marginTop:10 }}>
            {canResend
              ? <button onClick={doSendOtp} style={{background:"none",border:"none",color:RED,fontSize:13,fontWeight:700,cursor:"pointer"}}>שלח קוד חדש</button>
              : <div style={{color:GRAY,fontSize:13}}>שלח שוב בעוד <b style={{color:RED}}>{otpTimer}</b> שניות</div>
            }
          </div>
        </Modal>
      )}

      {/* ── MODAL: Set Password ── */}
      {modal === "password" && (
        <Modal onClose={() => {}}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ marginBottom:8 }}><IcoKey s={36} c="#C8102E"/></div>
            <div style={{ fontSize:20, fontWeight:900, color:DARK }}>בחר סיסמה</div>
            <div style={{ fontSize:13, color:GRAY, marginTop:4 }}>לפחות 6 תווים</div>
          </div>
          <Inp label="סיסמה *" value={pass} onChange={e => { setPass(e.target.value); setPassErr(""); }}
            type="password" placeholder="הסיסמה שלך" dir="ltr" autoFocus/>
          <Inp label="אימות סיסמה *" value={pass2} onChange={e => { setPass2(e.target.value); setPassErr(""); }}
            type="password" placeholder="חזור על הסיסמה" dir="ltr"/>
          <Err msg={passErr}/>
          <Btn onClick={doSetPassword} loading={passBusy}>צור חשבון ✓</Btn>
        </Modal>
      )}

      {/* ── MODAL: Login with password (existing user) ── */}
      {modal === "login-pw" && (
        <Modal onClose={() => setModal("phone")}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ marginBottom:8 }}><IcoUser s={36} c="#C8102E"/></div>
            <div style={{ fontSize:20, fontWeight:900, color:DARK }}>ברוך הבא!</div>
            <div style={{ fontSize:13, color:GRAY, marginTop:4 }}>חשבון קיים — הזן את הסיסמה</div>
          </div>
          <Inp label="סיסמה" value={pass} onChange={e => { setPass(e.target.value); setPassErr(""); }}
            type="password" placeholder="הסיסמה שלך" dir="ltr" autoFocus/>
          <Err msg={passErr}/>
          <Btn onClick={doLoginWithPw} loading={passBusy}>כניסה →</Btn>
          <div style={{ textAlign:"center", marginTop:14 }}>
            <button onClick={() => { setModal("email"); setEmail(""); }} style={{
              background:"none",border:"none",color:RED,fontSize:12,fontWeight:600,cursor:"pointer"
            }}>שכחתי סיסמה — אמת עם אימייל</button>
          </div>
        </Modal>
      )}

      <BottomNav cartCount={cartCount}/>

      {/* Auth Modal */}
      {showAuth && (
        <AuthSheet
          onClose={() => setShowAuth(false)}
          onDone={(u) => { setShowAuth(false); onAuthDone?.(u); }}
        />
      )}
    </div>
  );

  // ─────────────────────────────────────────────
  //  LOGGED IN VIEW
  // ─────────────────────────────────────────────
  const initials = (user?.name||"U").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{ fontFamily:"Arial,sans-serif", background:BG, minHeight:"100vh", maxWidth:430, margin:"0 auto", direction:"rtl", paddingBottom:80 }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(160deg,#C8102E,#9B0B22)", padding:"44px 20px 70px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", bottom:-30, left:0, right:0, height:60, background:BG, borderRadius:"50% 50% 0 0" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ width:68, height:68, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:900, color:"white", border:"2.5px solid rgba(255,255,255,0.5)", flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:"white", fontSize:20, fontWeight:900 }}>{user?.name||"משתמש"}</div>
            <div style={{ color:"rgba(255,255,255,0.75)", fontSize:13, marginTop:3 }}>{user?.email||user?.phone||""}</div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding:"0 16px" }}>
        <div style={{ background:"white", borderRadius:18, overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)", marginBottom:16 }}>
          {MENU_ITEMS.map((item,i) => (
            <div key={i} onClick={() => item.path && navigate(item.path)}
              style={{ display:"flex", alignItems:"center", padding:"14px 16px", cursor:"pointer",
                borderBottom:i<MENU_ITEMS.length-1?"1px solid #F3F4F6":"none", background:"white" }}>
              <span style={{ width:32, display:"flex", alignItems:"center" }}><item.Ico s={20} c={RED}/></span>
              <span style={{ flex:1, fontSize:14, fontWeight:600, color:DARK }}>{item.label}</span>
              <IcoChevDown s={14} c={GRAY}/>
            </div>
          ))}
        </div>

        {!showLogout ? (
          <button onClick={() => setShowLogout(true)} style={{ width:"100%", background:"white", color:"#EF4444", border:"2px solid #FEE2E2", borderRadius:16, padding:"14px", fontSize:14, fontWeight:800, cursor:"pointer", marginBottom:12 }}>
            התנתקות
          </button>
        ) : (
          <div style={{ background:"white", borderRadius:16, padding:"16px", marginBottom:12, boxShadow:"0 2px 10px rgba(0,0,0,0.07)", textAlign:"center" }}>
            <div style={{ fontWeight:700, fontSize:15, color:DARK, marginBottom:8 }}>בטוח שאתה רוצה להתנתק?</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setShowLogout(false)} style={{ flex:1, background:"#F3F4F6", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", color:DARK }}>ביטול</button>
              <button onClick={onLogout} style={{ flex:1, background:"#EF4444", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer", color:"white" }}>התנתק</button>
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", color:GRAY, fontSize:11, marginBottom:8 }}>YOUGO v2.0</div>
      </div>

      <BottomNav cartCount={cartCount}/>
    </div>
  );
}
