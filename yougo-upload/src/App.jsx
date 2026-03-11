import { Routes, Route, Navigate } from "react-router-dom";
import { useCart } from "./hooks/useCart";
import { AdminAuthGuard } from "./lib/adminAuth";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

import HomePage       from "./pages/HomePage";
import RestaurantPage from "./pages/RestaurantPage";
import CartPage       from "./pages/CartPage";
import OrdersPage     from "./pages/OrdersPage";
import ProfilePage    from "./pages/ProfilePage";
import AuthPage       from "./pages/AuthPage";
import PrivacyPage    from "./pages/PrivacyPage";
import TermsPage      from "./pages/TermsPage";
import CardsPage      from "./pages/CardsPage";
import InvitePage     from "./pages/InvitePage";
import SupportPage    from "./pages/SupportPage";
import MarketPage     from "./pages/MarketPage";
import BusinessPortal from "./BusinessPortal";
import AdminReal      from "./AdminReal";

export default function App() {
  const { cart, setCart, addToCart, removeFromCart, cartCount, cartTotal } = useCart();
  const [user, setUser]     = useState(null);
  const [authed, setAuthed] = useState(false);
  const [guest, setGuest]   = useState(false); // ✅ guest mode
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        if (meta.firstName) {
          setUser({ id: u.id, email: u.email, name: meta.firstName + " " + meta.lastName, firstName: meta.firstName, phone: meta.phone || "", gender: meta.gender, age: meta.age });
          setAuthed(true);
          setGuest(false);
        }
      }
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setAuthed(false); setUser(null); setCart([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setAuthed(false);
    setGuest(false);
    setUser(null);
    setCart([]);
  }

  function handleUserUpdate(updates) {
    setUser(prev => ({ ...prev, ...updates }));
  }

  if (checking) return (
    <div style={{ minHeight: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F7F8" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #C8102E", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ✅ Show auth page unless logged in OR guest mode
  if (!authed && !guest) return (
    <AuthPage
      onDone={u => { setUser(u); setAuthed(true); setGuest(false); }}
      onGuest={() => setGuest(true)}
      onBusiness={() => window.location.hash = "#/business"}
    />
  );

  return (
    <Routes>
      <Route path="/"               element={<HomePage cart={cart} add={addToCart} rem={removeFromCart} cartCount={cartCount} guest={guest}/>}/>
      <Route path="/restaurant/:id" element={<RestaurantPage cart={cart} add={addToCart} rem={removeFromCart} cartCount={cartCount} cartTotal={cartTotal} setCart={setCart}/>}/>
      <Route path="/cart"           element={<CartPage cart={cart} add={addToCart} rem={removeFromCart} setCart={setCart} cartCount={cartCount} user={user} guest={guest} onLogin={() => setGuest(false)}/>}/>
      <Route path="/orders"         element={<OrdersPage cartCount={cartCount} user={user} guest={guest} onLogin={() => setGuest(false)}/>}/>
      <Route path="/profile"        element={<ProfilePage user={user} cartCount={cartCount} onLogout={handleLogout} onUserUpdate={handleUserUpdate} guest={guest} onLogin={() => setGuest(false)}/>}/>
      <Route path="/market"         element={<MarketPage cartCount={cartCount}/>}/>
      <Route path="/privacy"        element={<PrivacyPage/>}/>
      <Route path="/terms"          element={<TermsPage/>}/>
      <Route path="/cards"          element={<CardsPage guest={guest} onLogin={() => setGuest(false)}/>}/>
      <Route path="/invite"         element={<InvitePage user={user} guest={guest} onLogin={() => setGuest(false)}/>}/>
      <Route path="/support"        element={<SupportPage user={user}/>}/>
      <Route path="/business"       element={<BusinessPortal onBack={() => window.history.back()}/>}/>
      <Route path="/admin"          element={
        <AdminAuthGuard onBack={() => window.history.back()}>
          {({ onLogout }) => <AdminReal onBack={onLogout}/>}
        </AdminAuthGuard>
      }/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}
