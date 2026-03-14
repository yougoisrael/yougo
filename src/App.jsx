import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "./hooks/useCart";
import { AdminAuthGuard } from "./lib/adminAuth";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

// ✅ AuthSheet — Auth as BottomSheet (smooth like Haat/Wolt)
import AuthSheet from "./pages/AuthSheet";

import HomePage       from "./pages/HomePage";
import RestaurantPage from "./pages/RestaurantPage";
import CartPage       from "./pages/CartPage";
import OrdersPage     from "./pages/OrdersPage";
import ProfilePage    from "./pages/ProfilePage";
import PrivacyPage    from "./pages/PrivacyPage";
import TermsPage      from "./pages/TermsPage";
import CardsPage      from "./pages/CardsPage";
import InvitePage     from "./pages/InvitePage";
import SupportPage    from "./pages/SupportPage";
import MarketPage     from "./pages/MarketPage";
import MapPage        from "./pages/MapPage";
import AddressPickerPage from "./pages/AddressPickerPage";
import BusinessPortal from "./BusinessPortal";
import AdminReal      from "./AdminReal";

// شاشة السبلاش فقط — بدون تسجيل
function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);

  const CSS = `
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes _pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
    @keyframes _up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @keyframes _fd{from{opacity:0}to{opacity:1}}
  `;

  return (
    <div style={{
      fontFamily:"'Segoe UI',Arial,sans-serif",
      background:"linear-gradient(155deg,#C8102E 0%,#6B0716 65%,#300208 100%)",
      minHeight:"100vh", maxWidth:430, margin:"0 auto",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      position:"relative", overflow:"hidden",
    }}>
      <style>{CSS}</style>
      <div style={{position:"absolute",width:380,height:380,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.06)",top:-120,left:-120}}/>
      <div style={{position:"absolute",width:280,height:280,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.07)",bottom:-80,right:-80}}/>

      {/* Logo */}
      <div style={{animation:"_pop .7s cubic-bezier(.34,1.56,.64,1) both"}}>
        <svg width={110} height={110} viewBox="0 0 60 60" fill="none">
          <rect width="60" height="60" rx="16" fill="white"/>
          <path d="M12 42V20l16 16V20" stroke="#C8102E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M34 30h16M42 24l8 6-8 6" stroke="#C8102E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{color:"white",fontSize:42,fontWeight:900,marginTop:18,letterSpacing:2,animation:"_pop .7s .12s cubic-bezier(.34,1.56,.64,1) both"}}>
        YOUGO
      </div>
      <div style={{color:"rgba(255,255,255,0.65)",fontSize:15,marginTop:7,animation:"_up 1s .3s both"}}>
        הכל מגיע אליך
      </div>

      <div style={{display:"flex",gap:28,marginTop:44,animation:"_up 1s .5s both"}}>
        {[
          {emoji:"🍽️", label:"מסעדות"},
          {emoji:"🛒", label:"מרקט"},
          {emoji:"🚀", label:"משלוח מהיר"},
        ].map((x,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7}}>
            <div style={{width:56,height:56,borderRadius:18,background:"rgba(255,255,255,0.11)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>
              {x.emoji}
            </div>
            <span style={{color:"rgba(255,255,255,0.65)",fontSize:11}}>{x.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { cart, setCart, addToCart, removeFromCart, cartCount, cartTotal } = useCart();
  const [user,         setUser]         = useState(null);
  const [authed,       setAuthed]       = useState(false);
  const [checking,     setChecking]     = useState(true);
  const [showSplash,   setShowSplash]   = useState(true);
  const [showBusiness, setShowBusiness] = useState(false);
  // ✅ showAuth — يفتح AuthSystem لما المستخدم يضغط تسجيل دخول من أي مكان
  const [showAuth,     setShowAuth]     = useState(false);
  // منطقة الضيف المختارة
  const [selectedArea, setSelectedArea] = useState(
    () => { try { return JSON.parse(localStorage.getItem("yougo_area")||"null"); } catch{ return null; } }
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        if (meta.firstName) {
          setUser({ id:u.id, email:u.email, name:meta.firstName+" "+meta.lastName,
            firstName:meta.firstName, phone:meta.phone||"", gender:meta.gender, age:meta.age });
          setAuthed(true);
        }
      }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthed(false); setUser(null); setCart([]); }
      else if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        if (meta.firstName && _event !== "SIGNED_OUT") {
          setUser({ id:u.id, email:u.email, name:meta.firstName+" "+meta.lastName,
            firstName:meta.firstName, phone:meta.phone||"", gender:meta.gender, age:meta.age });
          setAuthed(true);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function handleAreaSelect(area) {
    setSelectedArea(area);
    try { localStorage.setItem("yougo_area", JSON.stringify(area)); } catch{}
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthed(false);
    setUser(null);
    setCart([]);
  }

  function handleUserUpdate(updates) {
    setUser(prev => ({ ...prev, ...updates }));
  }

  // لودينج أول مرة
  if (checking) return (
    <div style={{ minHeight:"100vh", maxWidth:430, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"center", background:"#F7F7F8" }}>
      <div style={{ width:40, height:40, borderRadius:"50%", border:"3px solid #C8102E", borderTopColor:"transparent", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Splash screen
  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  // Business portal
  if (showBusiness) return <BusinessPortal onBack={() => setShowBusiness(false)}/>;

  // ✅ الكل يدخل مباشرة — الضيف والمسجل سوا
  return (
    <>
      <AuthSheet
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onDone={(u) => { setUser(u); setAuthed(true); setShowAuth(false); }}
        onBusiness={() => { setShowAuth(false); setShowBusiness(true); }}
      />
      <Routes>
      {/* الصفحة الرئيسية — تفتح الخريطة لو ما اختار منطقة */}
      <Route path="/" element={
        <HomePage
          cart={cart} add={addToCart} rem={removeFromCart}
          cartCount={cartCount} guest={!authed} user={user}
          selectedArea={selectedArea} onAreaSelect={handleAreaSelect}
        />
      }/>
      <Route path="/market" element={
        <MarketPage
          cartCount={cartCount} guest={!authed}
          selectedArea={selectedArea} onAreaSelect={handleAreaSelect}
        />
      }/>
      <Route path="/restaurant/:id" element={
        <RestaurantPage cart={cart} add={addToCart} rem={removeFromCart}
          cartCount={cartCount} cartTotal={cartTotal} setCart={setCart}/>
      }/>
      <Route path="/cart" element={
        <CartPage cart={cart} add={addToCart} rem={removeFromCart}
          setCart={setCart} cartCount={cartCount} user={user}
          guest={!authed} selectedArea={selectedArea}
          onLogin={(u) => { if(u){setUser(u);setAuthed(true);} else setShowAuth(true); }}/>
      }/>
      <Route path="/orders" element={
        <OrdersPage cartCount={cartCount} user={user} guest={!authed} onLogin={() => setShowAuth(true)}/>
      }/>
      {/* פروفיל — يفتح AuthSystem لو ضيف */}
      <Route path="/profile" element={
        <ProfilePage
          user={user} cartCount={cartCount}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
          guest={!authed}
          onAuthDone={(u) => { setUser(u); setAuthed(true); }}
          onLogin={() => setShowAuth(true)}
        />
      }/>
      <Route path="/map" element={
        <MapPage cartCount={cartCount} onAreaSelect={handleAreaSelect}/>
      }/>
      <Route path="/privacy"  element={<PrivacyPage/>}/>
      <Route path="/terms"    element={<TermsPage/>}/>
      <Route path="/cards"    element={<CardsPage guest={!authed} user={user} onLogin={(u)=>{ if(u){setUser(u);setAuthed(true);} else setShowAuth(true); }} cartCount={cartCount}/>}/>
      <Route path="/invite"   element={<InvitePage user={user} guest={!authed} onLogin={() => setShowAuth(true)}/>}/>
      <Route path="/support"  element={<SupportPage user={user}/>}/>
      <Route path="/address"  element={<AddressPickerPage onAddressSave={handleAreaSelect} user={user} guest={!authed}/>}/>
      <Route path="/business" element={<BusinessPortal onBack={() => window.history.back()}/>}/>
      {/* /admin/zones removed — ניהול אזורים deleted from app */}
      <Route path="/admin" element={
        <AdminAuthGuard onBack={() => window.history.back()}>
          {({ onLogout }) => <AdminReal onBack={onLogout}/>}
        </AdminAuthGuard>
      }/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
    </>
  );
}
