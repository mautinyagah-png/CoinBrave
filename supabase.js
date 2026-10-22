// CoinBrave — Supabase client
// Loaded from CDN, exposes global `sb` (Supabase client)
// Safe to include: anon key + RLS protects all data

const SUPABASE_URL = "https://yycwsvtxtrqzpjdpnjjb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b4keaWfThlv9vgxQcMTyGA_e-nwKLRd";

// Load Supabase SDK from CDN (if not already loaded)
(function loadSupabase() {
  if (window.supabase && window.supabase.createClient) {
    initClient();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = initClient;
  script.onerror = () => console.error("Failed to load Supabase SDK");
  document.head.appendChild(script);

  function initClient() {
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    window.dispatchEvent(new Event("supabase-ready"));
  }
})();
