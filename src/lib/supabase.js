import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) console.error("❌ Missing Supabase keys!");

export const supabase = createClient(url, key, {
  auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true },
  realtime: { params: { eventsPerSecond: 10 } },
  global: { headers: { 'x-app-version': '3.0.0' } },
});

/* Keep-alive — prevents free-tier sleep */
let _timer = null;
export function startKeepAlive() {
  if (_timer) return;
  const ping = () => supabase.from('restaurants').select('id').limit(1).then(()=>{}).catch(()=>{});
  ping();
  _timer = setInterval(ping, 4 * 60 * 1000);
}
export function stopKeepAlive() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

/* Retry wrapper */
export async function withRetry(fn, retries=3, delay=600) {
  for (let i=0; i<retries; i++) {
    const res = await fn();
    if (!res.error) return res;
    const c = res.error?.code;
    if (c==='PGRST116'||c==='401'||c==='403') return res;
    if (i < retries-1) await new Promise(ok=>setTimeout(ok, delay*(i+1)));
  }
  return fn();
}
