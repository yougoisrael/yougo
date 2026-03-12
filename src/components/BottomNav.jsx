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

  const items = [
    { path:"/profile", label:"פרופיל", I:IcoUser   },
    { path:"/orders",  label:"הזמנות", I:IcoOrders },
    { path:"/cart",    label:"העגלה",  I:IcoCart   },
    { path:"/market",  label:"מרקט",   I:IcoStore  },
    { path:"/",        label:"מסעדות", I:IcoFork   },
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
                  transform:`translateX(10px) scale(${bounce?1.35:1})`,
                  background:C.red, color:"white",
                  fontSize:9, fontWeight:800,
                  minWidth:17, height:17, borderRadius:9,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  padding:"0 4px",
                  transition:"transform 0.2s ease",
                  boxShadow:"0 2px 6px rgba(200,16,46,0.35)",
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
