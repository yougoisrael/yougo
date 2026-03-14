import { useNavigate, useLocation } from "react-router-dom";
import { IcoFork, IcoStore, IcoCart, IcoOrders, IcoUser, C } from "./Icons";
import { useState, useEffect } from "react";

export default function BottomNav({ cartCount }) {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 400);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  const IcoMap = ({ s=22, c="#9CA3AF" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  );

  const IcoOrders2 = ({ s=22, c="#9CA3AF" }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );

  const items = [
    { path:"/profile", label:"פרופיל",  I:IcoUser   },
    { path:"/orders",  label:"הזמנות",  I:IcoOrders2},
    { path:"/cart",    label:"העגלה",   I:IcoCart   },
    { path:"/market",  label:"מרקט",    I:IcoStore  },
    { path:"/",        label:"מסעדות",  I:IcoFork   },
  ];

  return (
    <nav className="app-nav" style={{
      display:"flex", padding:"6px 4px",
      paddingBottom:"calc(env(safe-area-inset-bottom,0px) + 8px)",
    }}>
        {items.map(t => {
          const active = pathname === t.path
            || (t.path !== "/" && pathname.startsWith(t.path));
          const isCart = t.path === "/cart";

          return (
            <button key={t.path} onClick={() => navigate(t.path)} style={{
              flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", gap:3,
              background:"none", border:"none", cursor:"pointer",
              padding:"4px 0", position:"relative",
            }}>
              {/* active dot */}
              {active && <div style={{
                position:"absolute", top:-5,
                width:4, height:4, borderRadius:"50%", background:C.red,
              }}/>}

              {/* cart badge */}
              {isCart && cartCount > 0 && (
                <span style={{
                  position:"absolute", top:0, right:"50%",
                  transform:`translateX(22px) scale(${bounce?1.35:1})`,
                  background:C.red, color:"white",
                  fontSize:9, fontWeight:800,
                  minWidth:17, height:17, borderRadius:9,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  padding:"0 4px",
                  transition:"transform 0.2s ease",
                  boxShadow:"0 2px 6px rgba(200,16,46,0.35)",
                  zIndex:2,
                }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}

              <div style={{
                width:44, height:32,
                display:"flex", alignItems:"center", justifyContent:"center",
                borderRadius:12,
                background: active ? "rgba(200,16,46,0.08)" : "transparent",
                transform: active ? "scale(1.1)" : "scale(1)",
                transition:"all 0.2s ease",
              }}>
                <t.I s={22} c={active ? C.red : "#9CA3AF"} />
              </div>

              <span style={{
                fontSize:9,
                fontWeight: active ? 800 : 500,
                color: active ? C.red : "#9CA3AF",
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
  );
}
