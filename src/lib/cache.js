/**
 * cache.js — Two-layer cache (Memory + localStorage)
 *
 * Layer 1: Memory (Map) — instant, resets on page refresh
 * Layer 2: localStorage — survives refresh, TTL-based
 *
 * Usage:
 *   import { cachedQuery } from './cache'
 *   const data = await cachedQuery('restaurants:east', () =>
 *     supabase.from('restaurants').select('*').eq('zone','east'), 300)
 */

const MEM = new Map(); // key → { data, exp }

/* ── helpers ── */
function memGet(k)       { const e=MEM.get(k); return e&&e.exp>Date.now()?e.data:null; }
function memSet(k,d,ttl) { MEM.set(k,{data:d,exp:Date.now()+ttl*1000}); }

function lsGet(k) {
  try {
    const raw = localStorage.getItem('yg:'+k);
    if (!raw) return null;
    const { data, exp } = JSON.parse(raw);
    if (exp < Date.now()) { localStorage.removeItem('yg:'+k); return null; }
    return data;
  } catch { return null; }
}
function lsSet(k,d,ttl) {
  try { localStorage.setItem('yg:'+k, JSON.stringify({data:d, exp:Date.now()+ttl*1000})); } catch {}
}

/* ── main function ── */
export async function cachedQuery(key, queryFn, ttlSeconds=300) {
  // 1. Memory hit (fastest)
  const mem = memGet(key);
  if (mem) return { data:mem, error:null, source:'mem' };

  // 2. localStorage hit
  const ls = lsGet(key);
  if (ls) { memSet(key,ls,ttlSeconds); return { data:ls, error:null, source:'ls' }; }

  // 3. Fetch from Supabase
  const result = await queryFn();
  if (!result.error && result.data) {
    memSet(key, result.data, ttlSeconds);
    lsSet(key, result.data, ttlSeconds);
  }
  return { ...result, source:'network' };
}

/* ── invalidate specific key or pattern ── */
export function invalidateCache(keyOrPrefix) {
  // Memory
  for (const k of MEM.keys()) {
    if (k.startsWith(keyOrPrefix)) MEM.delete(k);
  }
  // localStorage
  try {
    const prefix = 'yg:' + keyOrPrefix;
    Object.keys(localStorage)
      .filter(k => k.startsWith(prefix))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

/* ── TTLs (seconds) ── */
export const TTL = {
  restaurants : 300,   // 5 min — changes rarely
  menu        : 600,   // 10 min — very stable
  banners     : 900,   // 15 min — almost never changes
  offers      : 120,   // 2 min  — can change more often
  orders      : 0,     // NO cache — always fresh
  profile     : 60,    // 1 min
};
