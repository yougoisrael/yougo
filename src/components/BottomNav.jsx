// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  BottomNav — uses React Router NavLink
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useNavigate, useLocation } from "react-router-dom";
import { IcoFork, IcoStore, IcoCart, IcoOrders, IcoUser, C } from "./Icons";

export default function BottomNav({ cartCount }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const items = [
    { path:"/profile",    label:"פרופיל",       I: IcoUser   },
    { path:"/orders",     label:"ההזמנות שלי",  I: IcoOrders },
    { path:"/cart",       label:"העגלה שלי",    I: IcoCart   },
    { path:"/market",     label:"מרקט",         I: IcoStore  },
    { path:"/",           label:"מסעדות",       I: IcoFork   },
  ];

  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"white",borderTop:"1px solid #F0F0F0",display:"flex",padding:"8px 4px 14px",zIndex:300,boxShadow:"0 -2px 18px rgba(0,0,0,0.07)"}}>
      {items.map(t => {
        const active = pathname === t.path || (t.path !== "/" && pathname.startsWith(t.path));
        return (
          <button key={t.path} onClick={() => navigate(t.path)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,background:"none",border:"none",cursor:"pointer",padding:"4px 0",position:"relative"}}>
            {t.path === "/cart" && cartCount > 0 && (
              <span style={{position:"absolute",top:-2,right:"50%",transform:"translateX(8px)",background:C.red,color:"white",fontSize:9,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{cartCount}</span>
            )}
            <t.I s={21} c={active ? C.red : C.gray}/>
            <span style={{fontSize:9,fontWeight:active?700:500,color:active?C.red:C.gray}}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
