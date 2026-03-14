// ═══════════════════════════════════════════════════════════
//  AuthPage.jsx — YOUGO v3 Clean Rebuild
//  1. Email + Password login
//  2. Phone + Password login (lookup from users table)
//  3. OTP email code
//  4. Google OAuth
//  Register: email, name, phone, gender, age, password
// ═══════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
import { supabase } from "../lib/supabase";
import { C, IcoCheck, IcoBack, IcoFork, IcoStore, IcoTruck, IcoBusiness } from "../components/Icons";

const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||"").trim());
const isPhone = v => { const d=(v||"").replace(/\D/g,""); return d.length>=9&&d.length<=12; };
const pwErr   = v => { if(!v||v.length<8) return "לפחות 8 תווים"; if(!/[A-Z]/.test(v)) return "חייב אות גדולה"; return null; };

function Logo({s=48}){return(<svg width={s} height={s} viewBox="0 0 60 60" fill="none"><rect width="60" height="60" rx="16" fill="white"/><path d="M12 42V20l16 16V20" stroke={C.red} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><path d="M34 30h16M42 24l8 6-8 6" stroke={C.red} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function Spin({s=18,c="white"}){return(<svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{animation:"_sp .7s linear infinite",flexShrink:0}}><circle cx="12" cy="12" r="10" stroke={c} strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round"/></svg>);}
function Eye({show,toggle}){return(<button type="button" onClick={toggle} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",color:"#9CA3AF"}}>{show?<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}</button>);}

function Input({value,onChange,placeholder,type="text",dir="rtl",maxLength,autoFocus,onKeyDown,right,disabled}){
  const [f,setF]=useState(false);
  return(<div style={{position:"relative"}}><input value={value} onChange={onChange} placeholder={placeholder} type={type} maxLength={maxLength} autoFocus={autoFocus} onKeyDown={onKeyDown} disabled={disabled} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:"100%",padding:right?"13px 46px 13px 14px":"13px 14px",border:`1.5px solid ${f?C.red:"#E5E7EB"}`,borderRadius:14,fontSize:14,outline:"none",background:disabled?"#F9FAFB":"white",direction:dir,textAlign:dir==="ltr"?"left":"right",fontFamily:"inherit",color:"#111827",transition:"border-color .15s"}}/>{right&&<div style={{position:"absolute",top:"50%",right:14,transform:"translateY(-50%)"}}>{right}</div>}</div>);
}
function Lbl({children}){return <div style={{fontSize:12,fontWeight:700,color:"#6B7280",marginBottom:6,direction:"rtl"}}>{children}</div>;}
function Err({msg}){return msg?<div style={{color:C.red,fontSize:11,fontWeight:600,marginTop:4}}>{msg}</div>:null;}
function Box({children,style:sx}){return <div style={{marginBottom:14,...sx}}>{children}</div>;}
function Alrt({msg,type="error"}){if(!msg)return null;return(<div style={{background:type==="error"?"#FEF2F2":"#F0FDF4",border:`1px solid ${type==="error"?"#FCA5A5":"#86EFAC"}`,borderRadius:12,padding:"11px 14px",marginBottom:14,fontSize:13,color:type==="error"?"#DC2626":"#16A34A",fontWeight:600}}>{type==="error"?"⚠️":"✅"} {msg}</div>);}

function Btn({children,onClick,disabled,loading,variant="red",sx}){
  const bg=variant==="red"?(disabled||loading?"rgba(200,16,46,0.5)":C.red):variant==="dark"?"#111827":"white";
  return(<button type="button" onClick={onClick} disabled={disabled||loading} style={{width:"100%",padding:"14px",borderRadius:16,border:variant==="white"?"1.5px solid #E5E7EB":"none",background:bg,color:variant==="white"?"#374151":"white",fontSize:14,fontWeight:800,cursor:disabled||loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit",boxShadow:variant==="red"?"0 6px 20px rgba(200,16,46,.25)":"none",...sx}}>{loading&&<Spin s={18} c={variant==="white"?"#374151":"white"}/>}{children}</button>);
}

const GOOG=(<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.3 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.5 13.1 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.1z"/><path fill="#FBBC05" d="M10.6 28.6C10.2 27.5 10 26.3 10 25s.2-2.5.6-3.6L2.7 15.3C1 18.4 0 21.6 0 25s1 6.6 2.7 9.7l7.9-6.1z"/><path fill="#34A853" d="M24 50c6.2 0 11.5-2 15.3-5.5l-7.6-5.9c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-3.6-13.4-8.8l-7.9 6.1C6.7 44.6 14.7 50 24 50z"/></svg>);
const CSS=`@keyframes _sp{to{transform:rotate(360deg)}}@keyframes _pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}@keyframes _up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes _fd{from{opacity:0}to{opacity:1}}*{box-sizing:border-box}`;
const WRAP={fontFamily:"'Segoe UI',Arial,sans-serif",background:"#F7F7F8",minHeight:"100vh",maxWidth:430,margin:"0 auto",direction:"rtl",display:"flex",flexDirection:"column"};

function Hdr({title,sub,onBack,showSkip,onSkip}){return(<div style={{background:"linear-gradient(150deg,#C8102E,#8B0B1E)",padding:"44px 22px 68px",position:"relative",overflow:"hidden",flexShrink:0}}><div style={{position:"absolute",width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,0.04)",top:-70,right:-60,pointerEvents:"none"}}/><div style={{position:"absolute",bottom:-32,left:0,right:0,height:65,background:"#F7F7F8",borderRadius:"50% 50% 0 0"}}/>{onBack&&<button onClick={onBack} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:18}}><IcoBack s={18} c="white"/></button>}{showSkip&&<button onClick={onSkip} style={{position:"absolute",top:18,left:18,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:20,padding:"6px 14px",color:"rgba(255,255,255,0.85)",fontSize:11,fontWeight:700,cursor:"pointer"}}>דלג ←</button>}{!onBack&&<div style={{marginBottom:16}}><Logo s={46}/></div>}<div style={{color:"white",fontSize:26,fontWeight:900,lineHeight:1.2}}>{title}</div>{sub&&<div style={{color:"rgba(255,255,255,0.75)",fontSize:13,marginTop:6}}>{sub}</div>}</div>);}

export default function AuthPage({onDone,onGuest,onBusiness}){
  const [screen,setScreen]=useState("splash");
  const [tab,setTab]=useState("login");
  const [lType,setLType]=useState("email");
  const [lMethod,setLMethod]=useState("password");
  const [emailIn,setEmailIn]=useState("");
  const [phoneIn,setPhoneIn]=useState("");
  const [passIn,setPassIn]=useState("");
  const [showP,setShowP]=useState(false);
  const [lErr,setLErr]=useState("");
  const [lBusy,setLBusy]=useState(false);
  const [gBusy,setGBusy]=useState(false);
  const [otp,setOtp]=useState(["","","","","",""]);
  const [otpErr,setOtpErr]=useState("");
  const [otpBusy,setOtpBusy]=useState(false);
  const [timer,setTimer]=useState(60);
  const [canR,setCanR]=useState(false);
  const [reg,setReg]=useState({email:"",firstName:"",lastName:"",phone:"",gender:"",age:"",pass:"",pass2:""});
  const [rErrs,setRErrs]=useState({});
  const [rBusy,setRBusy]=useState(false);
  const [sp,setSp]=useState(false);
  const [sp2,setSp2]=useState(false);
  useEffect(()=>{
    if(!HCAPTCHA_SITE_KEY||document.getElementById("hcap-script"))return;
    const s=document.createElement("script");
    s.id="hcap-script";
    s.src="https://js.hcaptcha.com/1/api.js?render=explicit";
    s.async=true;
    document.head.appendChild(s);
  },[]);

  async function getCaptchaToken(){
    if(!HCAPTCHA_SITE_KEY)return undefined;
    return new Promise((resolve)=>{
      function tryExec(){
        if(!window.hcaptcha){setTimeout(tryExec,200);return;}
        const el=document.createElement("div");
        el.style.display="none";
        document.body.appendChild(el);
        try{
          const wid=window.hcaptcha.render(el,{
            sitekey:HCAPTCHA_SITE_KEY,
            size:"invisible",
            callback:(token)=>{document.body.removeChild(el);resolve(token);},
            "error-callback":()=>{try{document.body.removeChild(el);}catch{}resolve(undefined);},
            "expired-callback":()=>{try{document.body.removeChild(el);}catch{}resolve(undefined);}
          });
          window.hcaptcha.execute(wid);
        }catch{try{document.body.removeChild(el);}catch{}resolve(undefined);}
      }
      tryExec();
    });
  }

  useEffect(()=>{if(screen!=="splash")return;const t=setTimeout(()=>setScreen("main"),2400);return()=>clearTimeout(t);},[screen]);
  useEffect(()=>{if(screen!=="otp-code")return;setTimer(60);setCanR(false);const t=setInterval(()=>setTimer(p=>{if(p<=1){clearInterval(t);setCanR(true);return 0;}return p-1;}),1000);return()=>clearInterval(t);},[screen]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session?.user)return;
      const m=session.user.user_metadata||{};
      if(m.firstName)done(session.user,m);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((ev,session)=>{
      if(ev==="SIGNED_IN"&&session?.user){
        const m=session.user.user_metadata||{};
        if(m.firstName){done(session.user,m);}
        else if(m.full_name||m.name){
          const p=(m.full_name||m.name||"").split(" ");
          setReg(r=>({...r,email:session.user.email||"",firstName:p[0]||"",lastName:p.slice(1).join(" ")||""}));
          setScreen("register");
        }
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  function done(user,meta){onDone({id:user.id,email:user.email,name:(meta.firstName||"")+" "+(meta.lastName||""),firstName:meta.firstName||"",lastName:meta.lastName||"",phone:meta.phone||"",gender:meta.gender||"",age:meta.age||""});}

  async function doGoogle(){setGBusy(true);const{error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.href}});if(error){setLErr("שגיאת Google");setGBusy(false);}}

  async function doLoginEmail(){
    setLErr("");
    const e=emailIn.trim().toLowerCase();
    if(!isEmail(e)){setLErr("הזן אימייל תקין");return;}
    if(!passIn){setLErr("הזן סיסמה");return;}
    setLBusy(true);
    const captchaToken=await getCaptchaToken();
    const{data,error}=await supabase.auth.signInWithPassword({email:e,password:passIn,...(captchaToken&&{options:{captchaToken}})});
    setLBusy(false);
    if(error){setLErr("אימייל או סיסמה שגויים");return;}
    const m=data.user?.user_metadata||{};
    if(!m.firstName){setReg(r=>({...r,email:data.user.email||""}));setScreen("register");return;}
    done(data.user,m);
  }

  async function doLoginPhone(){
    setLErr("");
    const raw=phoneIn.replace(/\D/g,"");
    if(!isPhone(raw)){setLErr("הזן מספר טלפון תקין");return;}
    if(!passIn){setLErr("הזן סיסמה");return;}
    setLBusy(true);
    let found=null;
    for(const v of[raw,raw.replace(/^0/,""),"0"+raw.replace(/^0/,"")]){
      const{data}=await supabase.from("users").select("email").eq("phone",v).maybeSingle();
      if(data?.email){found=data.email;break;}
    }
    if(!found){setLBusy(false);setLErr("מספר הטלפון לא נמצא — נסה עם אימייל");return;}
    const captchaToken=await getCaptchaToken();
    const{data,error}=await supabase.auth.signInWithPassword({email:found,password:passIn,...(captchaToken&&{options:{captchaToken}})});
    setLBusy(false);
    if(error){setLErr("סיסמה שגויה");return;}
    const m=data.user?.user_metadata||{};
    done(data.user,m);
  }

  async function doSendOtp(){
    setLErr("");
    const e=emailIn.trim().toLowerCase();
    if(!isEmail(e)){setLErr("הזן אימייל תקין");return;}
    setLBusy(true);
    const captchaToken=await getCaptchaToken();
    const{error}=await supabase.auth.signInWithOtp({email:e,options:{shouldCreateUser:true,...(captchaToken&&{captchaToken})}});
    setLBusy(false);
    if(error){setLErr(error.status===429||error.message?.includes("rate")?"יותר מדי בקשות — המתן דקה":"שגיאה: "+(error.message||"נסה שוב"));return;}
    setScreen("otp-code");
  }

  function onDigit(i,v){if(!/^\d*$/.test(v))return;const n=[...otp];n[i]=v.slice(-1);setOtp(n);setOtpErr("");if(v&&i<5)document.getElementById("o"+( i+1))?.focus();if(n.join("").length===6)doVerify(n.join(""));}
  function onBk(i,e){if(e.key==="Backspace"&&!otp[i]&&i>0)document.getElementById("o"+(i-1))?.focus();}
  async function doVerify(code){
    setOtpBusy(true);
    const{data,error}=await supabase.auth.verifyOtp({email:emailIn.trim().toLowerCase(),token:code,type:"email"});
    setOtpBusy(false);
    if(error){setOtpErr("הקוד שגוי — נסה שוב");setOtp(["","","","","",""]);setTimeout(()=>document.getElementById("o0")?.focus(),100);return;}
    const u=data.user;const m=u?.user_metadata||{};
    if(m.firstName){done(u,m);}else{setReg(r=>({...r,email:u?.email||emailIn}));setScreen("register");}
  }

  function sr(k,v){setReg(p=>({...p,[k]:v}));setRErrs(p=>({...p,[k]:""}))}

  async function doReg(){
    setRErrs({});
    const{data:{session}}=await supabase.auth.getSession();
    const oauth=!!session?.user;
    const errs={};
    const eFin=(reg.email||emailIn).trim().toLowerCase();
    if(!isEmail(eFin))errs.email="הזן אימייל תקין";
    if(!reg.firstName.trim())errs.firstName="שדה חובה";
    if(!reg.lastName.trim())errs.lastName="שדה חובה";
    if(!isPhone(reg.phone))errs.phone="מספר לא תקין";
    if(!reg.gender)errs.gender="יש לבחור מגדר";
    const a=parseInt(reg.age);
    if(!reg.age||isNaN(a)||a<13||a>100)errs.age="גיל לא תקין (13-100)";
    if(!oauth){const pe=pwErr(reg.pass);if(pe)errs.pass=pe;if(reg.pass!==reg.pass2)errs.pass2="הסיסמאות אינן תואמות";}
    if(Object.keys(errs).length>0){setRErrs(errs);return;}
    setRBusy(true);
    // ✅ CHECK: רקם טלפון ייחודי — אסור לשני חשבונות להשתמש באותו מספר
    const rawPhone=reg.phone.replace(/\D/g,"");
    const phoneVariants=[rawPhone,rawPhone.replace(/^0/,""),"0"+rawPhone.replace(/^0/,"")];
    let phoneTaken=false;
    for(const v of phoneVariants){
      const{data:pd}=await supabase.from("users").select("id,email").eq("phone",v).maybeSingle();
      if(pd && pd.id !== session?.user?.id){phoneTaken=true;break;}
    }
    if(phoneTaken){setRErrs({phone:"מספר הטלפון כבר רשום לחשבון אחר"});setRBusy(false);return;}
    const meta={firstName:reg.firstName.trim(),lastName:reg.lastName.trim(),phone:reg.phone,gender:reg.gender,age:reg.age};
    if(oauth){
      const{error}=await supabase.auth.updateUser({data:meta});
      if(error){setRErrs({general:"שגיאה בשמירה — נסה שוב"});setRBusy(false);return;}
      await supabase.from("users").upsert({id:session.user.id,name:meta.firstName+" "+meta.lastName,phone:meta.phone,email:eFin});
      setRBusy(false);setScreen("success");
      setTimeout(()=>done(session.user,{...session.user.user_metadata,...meta}),1600);
      return;
    }
    const captchaToken=await getCaptchaToken();
    const{data,error}=await supabase.auth.signUp({email:eFin,password:reg.pass,options:{data:meta,emailRedirectTo:window.location.href,...(captchaToken&&{captchaToken})}});
    if(error){const m2=error.message?.toLowerCase();setRErrs({general:m2?.includes("already")||m2?.includes("registered")?"האימייל כבר רשום — נסה להתחבר":"שגיאה: "+(error.message||"נסה שוב")});setRBusy(false);return;}
    if(data.user)await supabase.from("users").upsert({id:data.user.id,name:meta.firstName+" "+meta.lastName,phone:meta.phone,email:eFin});
    setRBusy(false);setScreen("success");
    setTimeout(()=>done(data.user,meta),1600);
  }

  // ── SPLASH
  if(screen==="splash")return(<div style={{...WRAP,background:"linear-gradient(155deg,#C8102E 0%,#6B0716 65%,#300208 100%)",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",width:380,height:380,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.06)",top:-120,left:-120}}/><div style={{position:"absolute",width:280,height:280,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.07)",bottom:-80,right:-80}}/><button onClick={onGuest} style={{position:"absolute",top:22,left:18,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.22)",borderRadius:20,padding:"7px 16px",color:"rgba(255,255,255,0.85)",fontSize:11,fontWeight:700,cursor:"pointer",animation:"_fd 1s .7s both"}}>דלג ←</button><div style={{animation:"_pop .7s cubic-bezier(.34,1.56,.64,1) both"}}><Logo s={110}/></div><div style={{color:"white",fontSize:42,fontWeight:900,marginTop:18,letterSpacing:2,animation:"_pop .7s .12s cubic-bezier(.34,1.56,.64,1) both"}}>YOUGO</div><div style={{color:"rgba(255,255,255,0.65)",fontSize:15,marginTop:7,animation:"_up 1s .3s both"}}>הכל מגיע אליך</div><div style={{display:"flex",gap:28,marginTop:44,animation:"_up 1s .5s both"}}>{[{I:IcoFork,l:"מסעדות"},{I:IcoStore,l:"מרקט"},{I:IcoTruck,l:"משלוח מהיר"}].map((x,i)=>(<div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7}}><div style={{width:56,height:56,borderRadius:18,background:"rgba(255,255,255,0.11)",display:"flex",alignItems:"center",justifyContent:"center"}}><x.I s={26} c="white"/></div><span style={{color:"rgba(255,255,255,0.65)",fontSize:11}}>{x.l}</span></div>))}</div><style>{CSS}</style></div>);

  // ── SUCCESS
  if(screen==="success")return(<div style={{...WRAP,background:"linear-gradient(155deg,#C8102E,#7B0D1E)",alignItems:"center",justifyContent:"center"}}><div style={{animation:"_pop .6s cubic-bezier(.34,1.56,.64,1)"}}><div style={{width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 24px"}}><IcoCheck s={60} c="white"/></div></div><div style={{color:"white",fontSize:30,fontWeight:900}}>ברוך הבא{reg.firstName?", "+reg.firstName:""}! 🎉</div><div style={{color:"rgba(255,255,255,0.75)",fontSize:14,marginTop:8}}>החשבון שלך נוצר בהצלחה</div><style>{CSS}</style></div>);

  // ── OTP CODE
  if(screen==="otp-code")return(<div style={WRAP}><Hdr title="קוד אימות" sub={`שלחנו קוד 6 ספרות ל-${emailIn}`} onBack={()=>{setScreen("main");setOtp(["","","","","",""]);setOtpErr("");}}/><div style={{flex:1,padding:"36px 22px",overflowY:"auto"}}><div style={{textAlign:"center",fontSize:14,fontWeight:700,color:"#111827",marginBottom:28}}>הזן את הקוד</div><div style={{display:"flex",gap:10,justifyContent:"center",direction:"ltr",marginBottom:12}}>{otp.map((d,i)=>(<input key={i} id={"o"+i} value={d} maxLength={1} autoFocus={i===0} onChange={e=>onDigit(i,e.target.value)} onKeyDown={e=>onBk(i,e)} style={{width:50,height:62,textAlign:"center",fontSize:26,fontWeight:900,border:`2px solid ${otpErr?C.red:d?C.red:"#E5E7EB"}`,borderRadius:16,outline:"none",background:d?"rgba(200,16,46,0.05)":"white",color:otpErr?"#EF4444":"#111827",fontFamily:"inherit",transition:"border-color .15s"}}/>))}</div>{otpErr&&<div style={{textAlign:"center",color:"#EF4444",fontSize:13,fontWeight:600,marginBottom:14}}>{otpErr}</div>}{otpBusy&&<div style={{textAlign:"center",padding:12}}><Spin s={28} c={C.red}/></div>}<div style={{textAlign:"center",marginTop:26}}>{canR?<button onClick={doSendOtp} style={{background:"none",border:"none",color:C.red,fontSize:13,fontWeight:700,cursor:"pointer"}}>שלח קוד חדש</button>:<div style={{color:"#9CA3AF",fontSize:13}}>שלח שוב בעוד <b style={{color:C.red}}>{timer}</b> שניות</div>}</div></div><style>{CSS}</style></div>);

  // ── REGISTER
  if(screen==="register")return(<div style={WRAP}><Hdr title="יצירת חשבון" sub="ספר לנו קצת על עצמך" onBack={()=>setScreen("main")}/><div style={{flex:1,padding:"26px 22px 44px",overflowY:"auto"}}><Alrt msg={rErrs.general}/>
    <Box><Lbl>כתובת אימייל *</Lbl><Input value={reg.email||emailIn} onChange={e=>sr("email",e.target.value)} placeholder="example@email.com" type="email" dir="ltr"/><Err msg={rErrs.email}/></Box>
    <div style={{display:"flex",gap:10}}>
      <Box sx={{flex:1}}><Lbl>שם פרטי *</Lbl><Input value={reg.firstName} onChange={e=>sr("firstName",e.target.value)} placeholder="שם פרטי"/><Err msg={rErrs.firstName}/></Box>
      <Box sx={{flex:1}}><Lbl>שם משפחה *</Lbl><Input value={reg.lastName} onChange={e=>sr("lastName",e.target.value)} placeholder="שם משפחה"/><Err msg={rErrs.lastName}/></Box>
    </div>
    <Box><Lbl>מספר טלפון *</Lbl><div style={{display:"flex",gap:8}}><div style={{background:"white",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0}}><span>🇮🇱</span><span style={{fontSize:12,fontWeight:700}}>+972</span></div><div style={{flex:1}}><Input value={reg.phone} onChange={e=>sr("phone",e.target.value.replace(/[^\d-]/g,""))} placeholder="05X-XXX-XXXX" dir="ltr" maxLength={12}/></div></div><Err msg={rErrs.phone}/></Box>
    <Box><Lbl>מגדר *</Lbl><div style={{display:"flex",gap:8}}>{[{v:"male",l:"זכר 👨"},{v:"female",l:"נקבה 👩"},{v:"other",l:"אחר 🧑"}].map(g=>(<button key={g.v} type="button" onClick={()=>sr("gender",g.v)} style={{flex:1,padding:"12px 6px",borderRadius:14,border:`2px solid ${reg.gender===g.v?C.red:"#E5E7EB"}`,background:reg.gender===g.v?"rgba(200,16,46,0.06)":"white",cursor:"pointer",fontSize:12,fontWeight:reg.gender===g.v?700:500,color:reg.gender===g.v?C.red:"#6B7280",fontFamily:"inherit",transition:"all .15s"}}>{g.l}</button>))}</div><Err msg={rErrs.gender}/></Box>
    <Box><Lbl>גיל *</Lbl><Input value={reg.age} onChange={e=>sr("age",e.target.value.replace(/\D/g,""))} placeholder="גיל (13-100)" maxLength={3}/><Err msg={rErrs.age}/></Box>
    <Box><Lbl>סיסמה *</Lbl><Input value={reg.pass} onChange={e=>sr("pass",e.target.value)} placeholder="לפחות 8 תווים + אות גדולה" type={sp?"text":"password"} dir="ltr" right={<Eye show={sp} toggle={()=>setSp(p=>!p)}/>}/>{reg.pass.length>0&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:3}}>{[{ok:reg.pass.length>=8,t:"8 תווים לפחות"},{ok:/[A-Z]/.test(reg.pass),t:"אות גדולה"},{ok:/\d/.test(reg.pass),t:"מספר"}].map((r,i)=>(<div key={i} style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:11,color:r.ok?"#10B981":"#D1D5DB"}}>{r.ok?"✓":"○"}</span><span style={{fontSize:11,color:r.ok?"#10B981":"#9CA3AF",fontWeight:r.ok?600:400}}>{r.t}</span></div>))}</div>}<Err msg={rErrs.pass}/></Box>
    <Box><Lbl>אימות סיסמה *</Lbl><Input value={reg.pass2} onChange={e=>sr("pass2",e.target.value)} placeholder="חזור על הסיסמה" type={sp2?"text":"password"} dir="ltr" right={<Eye show={sp2} toggle={()=>setSp2(p=>!p)}/>}/><Err msg={rErrs.pass2}/></Box>
    <Btn onClick={doReg} loading={rBusy}><IcoCheck s={18} c="white"/> יצירת חשבון</Btn>
  </div><style>{CSS}</style></div>);

  // ── MAIN
  return(<div style={WRAP}>
    <Hdr title={tab==="login"?"ברוך הבא! 👋":"הצטרף ל-Yougo 🚀"} sub={tab==="login"?"התחבר לחשבון שלך":"צור חשבון חדש"} showSkip onSkip={onGuest}/>
    <div style={{flex:1,padding:"22px 20px 34px",overflowY:"auto"}}>

      {/* Tab */}
      <div style={{display:"flex",background:"#F0F0F2",borderRadius:14,padding:3,marginBottom:20}}>{[{id:"login",l:"כניסה"},{id:"register",l:"הרשמה"}].map(t=>(<button key={t.id} type="button" onClick={()=>{setTab(t.id);setLErr("");if(t.id==="register")setScreen("register");}} style={{flex:1,padding:"10px",borderRadius:12,border:"none",background:tab===t.id?"white":"transparent",color:tab===t.id?"#111827":"#9CA3AF",fontSize:13,fontWeight:tab===t.id?800:500,cursor:"pointer",fontFamily:"inherit",boxShadow:tab===t.id?"0 1px 6px rgba(0,0,0,0.09)":"none",transition:"all .2s"}}>{t.l}</button>))}</div>

      {/* Social */}
      <div style={{display:"flex",gap:10,marginBottom:18}}>
        <Btn onClick={doGoogle} loading={gBusy} variant="white" sx={{flex:1}}>{!gBusy&&GOOG} Google</Btn>
        <Btn disabled variant="white" sx={{flex:1,opacity:.45}}><svg width="14" height="17" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.1 269-317.1 70.6 0 133.1 46.5 178.8 46.5 43.6 0 113-49.2 192.4-49.2 30.8 0 110.7 2.6 165.7 78.8zm-170.5-276c28.7-35 49.7-83.4 49.7-131.8 0-6.7-.6-13.5-1.9-19.5-46.8 1.9-101.8 31.3-134.7 69.4-25.3 28.7-49.7 74-49.7 123.1 0 7.4 1.3 14.9 1.9 17.2 3.2.6 8.4 1.3 13.6 1.3 43 0 95.6-27.7 121.1-60.7z"/></svg> Apple <span style={{fontSize:9}}>בקרוב</span></Btn>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}><div style={{flex:1,height:1,background:"#E5E7EB"}}/><span style={{color:"#9CA3AF",fontSize:11,fontWeight:600}}>או המשך עם</span><div style={{flex:1,height:1,background:"#E5E7EB"}}/></div>

      {/* Method */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>{[{id:"password",l:"🔑 אימייל / טלפון"},{id:"otp",l:"✉️ קוד לאימייל"}].map(m=>(<button key={m.id} type="button" onClick={()=>{setLMethod(m.id);setLErr("");}} style={{flex:1,padding:"10px 6px",borderRadius:12,border:`2px solid ${lMethod===m.id?C.red:"#E5E7EB"}`,background:lMethod===m.id?"rgba(200,16,46,0.05)":"white",color:lMethod===m.id?C.red:"#6B7280",fontSize:11,fontWeight:lMethod===m.id?800:500,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{m.l}</button>))}</div>

      {/* Email/Phone sub-toggle */}
      {lMethod==="password"&&(<div style={{display:"flex",gap:5,marginBottom:14,background:"#F4F4F6",borderRadius:12,padding:3}}>{[{id:"email",l:"📧 אימייל"},{id:"phone",l:"📱 טלפון"}].map(t=>(<button key={t.id} type="button" onClick={()=>{setLType(t.id);setLErr("");}} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:lType===t.id?"white":"transparent",color:lType===t.id?"#111827":"#9CA3AF",fontSize:12,fontWeight:lType===t.id?700:400,cursor:"pointer",fontFamily:"inherit",boxShadow:lType===t.id?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all .2s"}}>{t.l}</button>))}</div>)}

      {/* Identifier */}
      {lMethod==="password"?(lType==="email"?(<Box><Lbl>כתובת אימייל</Lbl><Input value={emailIn} onChange={e=>{setEmailIn(e.target.value);setLErr("");}} placeholder="example@email.com" type="email" dir="ltr" onKeyDown={e=>e.key==="Enter"&&doLoginEmail()}/></Box>):(<Box><Lbl>מספר טלפון</Lbl><div style={{display:"flex",gap:8}}><div style={{background:"white",border:"1.5px solid #E5E7EB",borderRadius:14,padding:"13px 12px",display:"flex",alignItems:"center",gap:6,flexShrink:0}}><span>🇮🇱</span><span style={{fontSize:12,fontWeight:700}}>+972</span></div><div style={{flex:1}}><Input value={phoneIn} onChange={e=>{setPhoneIn(e.target.value.replace(/[^\d-]/g,""));setLErr("");}} placeholder="05X-XXX-XXXX" dir="ltr" maxLength={12} onKeyDown={e=>e.key==="Enter"&&doLoginPhone()}/></div></div></Box>)):(<Box><Lbl>כתובת אימייל</Lbl><Input value={emailIn} onChange={e=>{setEmailIn(e.target.value);setLErr("");}} placeholder="example@email.com" type="email" dir="ltr"/></Box>)}

      {/* Password */}
      {lMethod==="password"&&(<Box><Lbl>סיסמה</Lbl><Input value={passIn} onChange={e=>{setPassIn(e.target.value);setLErr("");}} placeholder="הסיסמה שלך" type={showP?"text":"password"} dir="ltr" onKeyDown={e=>e.key==="Enter"&&(lType==="email"?doLoginEmail():doLoginPhone())} right={<Eye show={showP} toggle={()=>setShowP(p=>!p)}/>}/></Box>)}

      {lErr&&<Alrt msg={lErr}/>}

      <div style={{marginBottom:10}}>{lMethod==="password"?<Btn onClick={lType==="email"?doLoginEmail:doLoginPhone} loading={lBusy}><IcoCheck s={18} c="white"/> כניסה</Btn>:<Btn onClick={doSendOtp} loading={lBusy}>✉️ שלח קוד לאימייל</Btn>}</div>

      {lMethod==="password"&&(<div style={{textAlign:"center",marginBottom:18}}><button type="button" onClick={()=>{setLMethod("otp");setLErr("");}} style={{background:"none",border:"none",color:C.red,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>שכחתי סיסמה — שלח לי קוד לאימייל</button></div>)}

      <div style={{borderTop:"1px solid #EBEBED",paddingTop:16}}><div style={{textAlign:"center",fontSize:11,color:"#9CA3AF",marginBottom:8,fontWeight:600}}>יש לך מסעדה או עסק?</div><Btn onClick={onBusiness} variant="dark"><IcoBusiness s={18} c="#F87171"/> פורטל עסקים — הירשם כבעל עסק</Btn></div>

      <div style={{textAlign:"center",color:"#9CA3AF",fontSize:10,marginTop:16,lineHeight:1.7}}>בהמשך אתה מסכים ל<span style={{color:C.red,fontWeight:700}}>תנאי השימוש</span> ול<span style={{color:C.red,fontWeight:700}}>מדיניות הפרטיות</span></div>
    </div>
    <style>{CSS}</style>
  </div>);

}