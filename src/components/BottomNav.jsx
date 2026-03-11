// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BottomNav — Fixed + Animated ✅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useNavigate, useLocation } from "react-router-dom";
import { IcoFork, IcoStore, IcoCart, IcoOrders, IcoUser, C } from "./Icons";
import { useState, useEffect } from "react";

export default function BottomNav({ cartCount }) {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const [prevPath, setPrevPath] = useState(pathname);
  const [cartBounce, setCartBounce] = useState(false);

  // انيميشن على أيقونة الكارت لما يتضاف منتج
  useEffect(() => {
    if (cartCount > 0) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 400);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  const items = [
    { path: "/profile", label: "פרופיל",      I: IcoUser   },
    { path: "/orders",  label: "הזמנות",       I: IcoOrders },
    { path: "/cart",    label: "העגלה",        I: IcoCart   },
    { path: "/market",  label: "מרקט",         I: IcoStore  },
    { path: "/",        label: "מסעדות",       I: IcoFork   },
  ];

  return (
    <>
      {/* Spacer עשה מקום للـ nav */}
      <div style={{ height: 80 }} />

      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 430,
        margin: "0 auto",
        background: "white",
        borderTop: "1px solid #F0F0F0",
        display: "flex",
        padding: "6px 4px",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        zIndex: 150,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        {items.map(t => {
          const active = pathname === t.path || (t.path !== "/" && pathname.startsWith(t.path));
          const isCart = t.path === "/cart";

          return (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 0",
                position: "relative",
                transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <div style={{
                  position: "absolute",
                  top: -6,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: C.red,
                  animation: "dotPop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }} />
              )}

              {/* Cart badge */}
              {isCart && cartCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: 0,
                  right: "50%",
                  transform: `translateX(10px) scale(${cartBounce ? 1.3 : 1})`,
                  background: C.red,
                  color: "white",
                  fontSize: 9,
                  fontWeight: 800,
                  minWidth: 17,
                  height: 17,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow: "0 2px 6px rgba(200,16,46,0.4)",
                }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}

              {/* Icon container */}
              <div style={{
                width: 44,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                background: active ? "rgba(200,16,46,0.08)" : "transparent",
                transform: active ? "scale(1.1)" : "scale(1)",
                transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                <t.I s={22} c={active ? C.red : "#9CA3AF"} />
              </div>

              <span style={{
                fontSize: 9,
                fontWeight: active ? 800 : 500,
                color: active ? C.red : "#9CA3AF",
                transition: "color 0.2s ease",
                letterSpacing: active ? 0.2 : 0,
              }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes dotPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
