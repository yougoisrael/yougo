/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   YOUGO — Global Styles (Final Fix)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

*, *::before, *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  margin: 0; padding: 0;
  height: 100%;
  overflow: hidden; /* ← body لا يتسكرول، بس الـ page-body بداخله */
  overscroll-behavior: none;
  background: #E8E8E8;
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

#root {
  margin: 0 auto;
  max-width: 430px;
  height: 100%;
  background: #F7F7F8;
  display: flex;
  flex-direction: column;
}

/* ── الهيكل الصح:
   #root
   └── .app-header   (ثابت فوق، لا يتسكرول)
   └── .page-body    (يتسكرول)
   └── .app-nav      (ثابت تحت، لا يتسكرول)
── */

.app-header {
  flex-shrink: 0;           /* لا يتقلص */
  position: relative;       /* مش fixed! */
  z-index: 500;
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.07);
  width: 100%;
}

.page-body {
  flex: 1;                  /* يملأ المساحة المتبقية */
  overflow-y: auto;         /* هو اللي يتسكرول */
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: 80px;
}

.app-nav {
  flex-shrink: 0;           /* لا يتقلص */
  position: relative;       /* مش fixed! */
  z-index: 500;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 -2px 16px rgba(0,0,0,0.06);
  width: 100%;
}

/* sidebar overlay فوق كل شيء */
/* overlay: 600, drawer: 601 */

/* ━━ ANIMATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
@keyframes pageSlideUp {
  from { opacity:0; transform:translateY(18px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes shimmer {
  0%   { background-position:-400px 0; }
  100% { background-position:400px 0; }
}
@keyframes spin    { to { transform:rotate(360deg); } }
@keyframes slideUp {
  from { opacity:0; transform:translateY(24px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes sheetUp {
  from { transform:translateY(100%); opacity:0.6; }
  to   { transform:translateY(0); opacity:1; }
}
@keyframes fadeIn {
  from { opacity:0; } to { opacity:1; }
}
@keyframes bounceIn {
  0%  { opacity:0; transform:scale(0.3); }
  50% { transform:scale(1.08); }
  80% { transform:scale(0.97); }
  100%{ opacity:1; transform:scale(1); }
}

.page-enter   { animation: pageSlideUp 0.35s cubic-bezier(0.34,1.2,0.64,1) both; }
.bottom-sheet { animation: sheetUp 0.32s cubic-bezier(0.34,1.1,0.64,1) both; }

.skeleton {
  background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 8px;
}

::-webkit-scrollbar { display:none; }
* { scrollbar-width:none; }

button {
  transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1),
              opacity 0.12s ease, box-shadow 0.15s ease;
  cursor: pointer;
}
button:active { transform:scale(0.94) !important; opacity:0.85; }
button:disabled { cursor:not-allowed; }

input:focus, textarea:focus {
  box-shadow: 0 0 0 3px rgba(200,16,46,0.12);
}

.stagger > * { animation: slideUp 0.35s cubic-bezier(0.34,1.2,0.64,1) both; }
.stagger > *:nth-child(1) { animation-delay:0.05s; }
.stagger > *:nth-child(2) { animation-delay:0.10s; }
.stagger > *:nth-child(3) { animation-delay:0.15s; }
.stagger > *:nth-child(4) { animation-delay:0.20s; }
.stagger > *:nth-child(5) { animation-delay:0.25s; }
.stagger > *:nth-child(6) { animation-delay:0.30s; }

.ripple { position:relative; overflow:hidden; }
.ripple::after {
  content:''; position:absolute; inset:0;
  background:rgba(255,255,255,0.2);
  border-radius:inherit; opacity:0;
  transition:opacity 0.3s ease;
}
.ripple:active::after { opacity:1; }
