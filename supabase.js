// CoinBrave — Supabase bootstrap
// Safe to include multiple times. Only boots once via window._cbSupabaseReady.

const SUPABASE_URL = "https://yycwsvtxtrqzpjdpnjjb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b4keaWfThlv9vgxQcMTyGA_e-nwKLRd";

if (!window._cbSupabaseReady) {
  window._cbSupabaseReady = (async () => {
    if (window.sb) return window.sb;
    await new Promise((resolve) => {
      if (window.supabase && window.supabase.createClient) return resolve();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = resolve;
      s.onerror = () => { console.error("Supabase SDK load failed"); resolve(); };
      document.head.appendChild(s);
    });
    if (!window.sb && window.supabase) {
      window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    window.dispatchEvent(new Event("supabase-ready"));
    return window.sb;
  })();
}
