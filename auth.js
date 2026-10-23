// ============================================================
// CoinBrave auth.js — FINAL FIX
// ============================================================

async function cbSB() {
  if (window.sb) return window.sb;
  if (window._cbSupabaseReady) return window._cbSupabaseReady;
  
  window._cbSupabaseReady = (async () => {
    await new Promise((resolve) => {
      if (window.supabase && window.supabase.createClient) return resolve();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = resolve;
      s.onerror = () => { console.error("Supabase SDK load failed"); resolve(); };
      document.head.appendChild(s);
    });
    
    if (!window.sb && window.supabase) {
      window.sb = window.supabase.createClient(
        "https://yycwsvtxtrqzpjdpnjjb.supabase.co", 
        "sb_publishable_b4keaWfThlv9vgxQcMTyGA_e-nwKLRd",
        { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
      );
    }
    return window.sb;
  })();
  return window._cbSupabaseReady;
}

(function cbInject() {
  if (typeof document === 'undefined') return;
  const add = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v)); document.head.appendChild(el); };
  if (!document.querySelector('link[rel="icon"]')) add('link', { rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg' });
  if (!document.querySelector('link[rel="apple-touch-icon"]')) add('link', { rel: 'apple-touch-icon', href: 'favicon.svg' });
  if (!document.querySelector('link[rel="manifest"]')) add('link', { rel: 'manifest', href: 'manifest.json' });
  if (!document.querySelector('meta[name="theme-color"]')) add('meta', { name: 'theme-color', content: '#0b0e11' });
})();

const CB_REDIRECT_KEY = "cb_redirect";
const CB_THEME_KEY = "cb_theme";
const CB_EMOJIS = ["🦁","🐂","🐻","🦊","🐺","🐯","🦄","🐳","🦈","🐬","🦅","🐉","🚀","💎","🌙","⭐","🔥","🎯","🎨","🧠"];

async function cbCurrentUser() {
  try {
    const sb = await cbSB(); 
    if (!sb) return null;
    
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) return null;
    const user = session.user;

    let profile = null;
    try {
      const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
      profile = data;
    } catch (e) { console.warn("profile fetch failed", e); }

    return {
      id: user.id,
      email: user.email || "",
      name: profile?.name || (user.email ? user.email.split("@")[0] : "Trader"),
      userId: profile?.user_id || "CB-UNKNOWN",
      avatarEmoji: profile?.avatar_emoji || "🦁",
      avatarImage: profile?.avatar_image || null,
      createdAt: user.created_at
    };
  } catch (e) { return null; }
}

async function cbClearSession() {
  const sb = await cbSB(); 
  if (sb) await sb.auth.signOut();
}

async function cbGetWallet(email) {
  const sb = await cbSB(); if (!sb) return null;
  const user = await cbCurrentUser(); if (!user) return null;
  const { data } = await sb.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
  return data;
}

function cbGetAvgPrices(email) { try { return JSON.parse(localStorage.getItem("cb_avg_" + email) || "{}"); } catch { return {}; } }
function cbSaveAvgPrices(email, obj) { localStorage.setItem("cb_avg_" + email, JSON.stringify(obj)); }
function cbUpdateAvgOnBuy(email, coinId, qty, price) { const avg = cbGetAvgPrices(email); const prev = avg[coinId] || price; avg[coinId] = (prev + price) / 2; cbSaveAvgPrices(email, avg); }
function cbUpdateAvgOnSell(email, coinId) { const avg = cbGetAvgPrices(email); delete avg[coinId]; cbSaveAvgPrices(email, avg); }

function cbPasswordStrength(pw) {
  if (!pw || pw.length < 8) return { level: "weak", label: "Too short", score: 1 };
  let score = 0;
  if (pw.length >= 8) score++; if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++; if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 3) return { level: "weak", label: "Weak", score: 1 };
  if (score <= 4) return { level: "medium", label: "Medium", score: 2 };
  return { level: "strong", label: "Strong", score: 3 };
}

function cbGetFavorites() { try { return JSON.parse(localStorage.getItem("cb_favorites") || "[]"); } catch { return []; } }
function cbSaveFavorites(l) { localStorage.setItem("cb_favorites", JSON.stringify(l)); }
function cbToggleFavorite(id) {
  const f = cbGetFavorites(); const i = f.indexOf(id);
  if (i >= 0) f.splice(i, 1); else f.push(id);
  cbSaveFavorites(f); return f.includes(id);
}
function cbGetRecent() { try { return JSON.parse(localStorage.getItem("cb_recent") || "[]"); } catch { return []; } }
function cbSaveRecent(l) { localStorage.setItem("cb_recent", JSON.stringify(l)); }
function cbPushRecent(coin) {
  if (!coin || !coin.id) return;
  const list = cbGetRecent().filter(c => c.id !== coin.id);
  list.unshift({ id: coin.id, name: coin.name, symbol: coin.symbol, image: coin.image, price: coin.current_price, change: coin.price_change_percentage_24h });
  cbSaveRecent(list.slice(0, 5));
}

function cbFormatPrice(p) {
  if (p == null || isNaN(p)) return "—";
  if (p >= 1) return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toFixed(6);
}
function cbFormatSigned(n, decimals) {
  const d = decimals == null ? 2 : decimals; const sign = n >= 0 ? "+" : "-";
  return sign + "$" + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}
function cbSparkline(prices, width, height, up) {
  width = width || 60; height = height || 24;
  if (!prices || prices.length < 2) return "";
  const min = Math.min(...prices), max = Math.max(...prices); const range = max - min || 1;
  const step = width / (prices.length - 1);
  const pts = prices.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * (height - 4) - 2).toFixed(1)}`).join(" ");
  const color = up ? "var(--up)" : "var(--down)";
  return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

async function cbAddTransaction(email, tx) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) return;
  await sb.from("transactions").insert({ user_id: user.id, type: tx.type, coin_id: tx.coinId, coin_name: tx.coinName, coin_symbol: tx.coinSymbol, coin_image: tx.coinImage, amount: tx.amount, price: tx.price, total: tx.total, fee: tx.fee });
}

async function cbGetAlerts(email) {
  const sb = await cbSB(); if (!sb) return [];
  const user = await cbCurrentUser(); if (!user) return [];
  const { data } = await sb.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return (data || []).map(a => ({ id: a.id, coinId: a.coin_id, coinName: a.coin_name, coinSymbol: a.coin_symbol, direction: a.direction, targetPrice: a.target_price, triggered: a.triggered, createdAt: a.created_at }));
}
async function cbAddAlert(email, alert) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) return;
  await sb.from("alerts").insert({ user_id: user.id, coin_id: alert.coinId, coin_name: alert.coinName, coin_symbol: alert.coinSymbol, direction: alert.direction, target_price: alert.targetPrice });
}
async function cbRemoveAlert(email, id) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) return;
  await sb.from("alerts").delete().eq("id", id).eq("user_id", user.id);
}

async function cbAddNotification(email, notif) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) return;
  await sb.from("notifications").insert({ user_id: user.id, type: notif.type, title: notif.title, body: notif.body });
}

async function cbCheckAlerts(coins) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user || !Array.isArray(coins)) return;
  const alerts = await cbGetAlerts(user.email);
  const byId = Object.fromEntries(coins.map(c => [c.id, c]));
  for (const a of alerts) {
    if (a.triggered) continue;
    const coin = byId[a.coinId]; if (!coin) continue;
    const hit = (a.direction === "above" && coin.current_price >= a.targetPrice) || (a.direction === "below" && coin.current_price <= a.targetPrice);
    if (hit) {
      await sb.from("alerts").update({ triggered: true }).eq("id", a.id);
      await cbAddNotification(user.email, { type: "alert", title: `${coin.name} ${a.direction === "above" ? "hit" : "dropped to"} ${cbFormatPrice(a.targetPrice)}`, body: `Current: ${cbFormatPrice(coin.current_price)}` });
    }
  }
}

function cbGetTheme() { return localStorage.getItem(CB_THEME_KEY) || "dark"; }
function cbSetTheme(t) { localStorage.setItem(CB_THEME_KEY, t); if (t === "light") document.body.classList.add("light"); else document.body.classList.remove("light"); }
function cbApplyTheme() { cbSetTheme(cbGetTheme()); }

async function cbRequireAuth() {
  // Give Supabase 1 second to load the token before kicking them out
  let user = await cbCurrentUser();
  if (!user) {
    await new Promise(r => setTimeout(r, 1000));
    user = await cbCurrentUser();
  }
  
  if (!user) { 
    localStorage.setItem(CB_REDIRECT_KEY, location.href); 
    location.href = "login.html"; 
    return false; 
  }
  return true;
}

function cbRenderAvatarHTML(user, size) {
  const s = size || 32;
  if (!user) return "";
  if (user.avatarImage) return `<img src="${user.avatarImage}" alt="avatar" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover" />`;
  return `<span class="avatar-emoji" style="font-size:${Math.round(s * 0.7)}px">${user.avatarEmoji || "🦁"}</span>`;
}

async function cbLogout() { if (confirm("Log out of CoinBrave?")) { await cbClearSession(); location.href = "index.html"; } }

function cbEnablePullToRefresh(onRefresh) {
  let startY = 0, pulling = false, indicator = null;
  function ensure() { if (indicator) return indicator; indicator = document.createElement("div"); indicator.className = "ptr-indicator"; indicator.innerHTML = '<div class="ptr-spinner"></div>'; document.body.appendChild(indicator); return indicator; }
  document.addEventListener("touchstart", (e) => { if (window.scrollY <= 0 && !pulling) { startY = e.touches[0].clientY; pulling = true; } }, { passive: true });
  document.addEventListener("touchmove", (e) => { if (!pulling) return; const dy = e.touches[0].clientY - startY; if (dy > 8) { const ind = ensure(); ind.style.opacity = Math.min(1, dy / 80); ind.style.transform = `translate(-50%, ${Math.min(dy - 30, 30)}px)`; } if (dy > 90) { pulling = false; const ind = ensure(); ind.classList.add("active"); ind.style.opacity = "1"; ind.style.transform = "translate(-50%, 30px)"; Promise.resolve(onRefresh()).finally(() => setTimeout(() => { ind.classList.remove("active"); ind.style.opacity = ""; ind.style.transform = ""; }, 500)); } }, { passive: true });
  document.addEventListener("touchend", () => { if (pulling) { pulling = false; if (indicator) { indicator.style.opacity = ""; indicator.style.transform = ""; } } }, { passive: true });
}

function cbRenderFooter() {
  if (document.querySelector(".cb-footer")) return;
  const f = document.createElement("footer"); f.className = "cb-footer";
  f.innerHTML = `<div class="cb-footer-inner"><div class="cb-footer-links"><a href="about.html">About</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="mailto:support@coinbrave.demo">Contact</a></div><div class="cb-footer-copy">© ${new Date().getFullYear()} CoinBrave · Demo project · No real funds</div></div>`;
  document.body.appendChild(f);
}

async function cbRenderNav() {
  cbApplyTheme();
  cbRenderFooter();
  const user = await cbCurrentUser();
  const path = (location.pathname.split("/").pop() || "");
  const isHome = (path === "" || path === "index.html") ? "active" : "";
  const is = (p) => path === p ? "active" : "";

  const nav = document.querySelector(".nav");
  if (nav) {
    if (user) { nav.innerHTML = `<a href="index.html" class="${isHome}">Home</a><a href="market.html" class="${is('market.html')}">Market</a><a href="trade.html" class="${is('trade.html')}">Trade</a><a href="wallet.html" class="${is('wallet.html')}">Assets</a><a href="#" id="logoutBtn" class="btn-signup">Log Out</a>`; document.getElementById("logoutBtn").addEventListener("click", (e) => { e.preventDefault(); cbLogout(); }); }
    else { nav.innerHTML = `<a href="index.html" class="${isHome}">Home</a><a href="market.html" class="${is('market.html')}">Market</a><a href="trade.html" class="${is('trade.html')}">Trade</a><a href="login.html" class="${is('login.html')}">Log In</a><a href="signup.html" class="btn-signup ${is('signup.html')}">Sign Up</a>`; }
  }

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    let userArea = document.getElementById("topbarUser");
    if (!userArea) { userArea = document.createElement("div"); userArea.id = "topbarUser"; userArea.className = "topbar-user"; topbar.appendChild(userArea); }
    if (user) { userArea.innerHTML = `<div class="user-chip">${cbRenderAvatarHTML(user, 22)} <span>${user.name}</span></div><a href="#" id="logoutBtnMobile" class="btn-signup">Log Out</a>`; document.getElementById("logoutBtnMobile").addEventListener("click", (e) => { e.preventDefault(); cbLogout(); }); }
    else { userArea.innerHTML = `<a href="login.html" class="btn-signup" style="background:var(--bg-hover);color:var(--text) !important">Log In</a><a href="signup.html" class="btn-signup">Sign Up</a>`; }
  }

  let bn = document.querySelector(".bottom-nav");
  if (!bn) { bn = document.createElement("nav"); bn.className = "bottom-nav"; document.body.appendChild(bn); }
  bn.innerHTML = `<a href="index.html" class="bn-item ${isHome}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></a><a href="market.html" class="bn-item ${is('market.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg><span>Market</span></a><a href="trade.html" class="bn-item ${is('trade.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg><span>Trade</span></a><a href="wallet.html" class="bn-item ${is('wallet.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg><span>Assets</span></a>`;
}
