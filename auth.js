// ============================================================
// CoinBrave auth.js — SUPABASE VERSION (Race-Condition Fixed)
// ============================================================

(function cbInject() {
  if (typeof document === 'undefined') return;
  const add = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v)); document.head.appendChild(el); };
  if (!document.querySelector('link[rel="icon"]')) add('link', { rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg' });
  if (!document.querySelector('link[rel="apple-touch-icon"]')) add('link', { rel: 'apple-touch-icon', href: 'favicon.svg' });
  if (!document.querySelector('link[rel="manifest"]')) add('link', { rel: 'manifest', href: 'manifest.json' });
  if (!document.querySelector('meta[name="theme-color"]')) add('meta', { name: 'theme-color', content: '#0b0e11' });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();

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
      const url = window.CB_SUPABASE_URL || "https://yycwsvtxtrqzpjdpnjjb.supabase.co";
      const key = window.CB_SUPABASE_ANON_KEY || "sb_publishable_b4keaWfThlv9vgxQcMTyGA_e-nwKLRd";
      window.sb = window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return window.sb;
  })();
  return window._cbSupabaseReady;
}

const CB_REDIRECT_KEY = "cb_redirect";
const CB_THEME_KEY = "cb_theme";
const CB_RECENT_KEY = "cb_recent";
const CB_LOGIN_ATTEMPTS = "cb_login_attempts";
const CB_EMOJIS = ["🦁","🐂","🐻","🦊","🐺","🐯","🦄","🐳","🦈","🐬","🦅","🐉","🚀","💎","🌙","⭐","🔥","🎯","🎨","🧠"];

let _cbUserCache = null;
let _cbUserCacheTime = 0;
const CB_USER_CACHE_MS = 5000;

async function cbGetSession() {
  const sb = await cbSB(); if (!sb) return null;
  const { data } = await sb.auth.getSession(); return data.session;
}
async function cbSetSession() { }
async function cbClearSession() {
  _cbUserCache = null;
  const sb = await cbSB(); if (sb) await sb.auth.signOut();
}

async function cbCurrentUser() {
  try {
    const sb = await cbSB(); if (!sb) return null;
    if (_cbUserCache && Date.now() - _cbUserCacheTime < CB_USER_CACHE_MS) return _cbUserCache;
    
    // Wait for Supabase to finish reading local storage
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) { _cbUserCache = null; return null; }
    const user = session.user;

    let profile = null;
    try {
      const { data } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
      profile = data;
    } catch (e) { console.warn("profile fetch failed", e); }

    _cbUserCache = {
      id: user.id,
      email: user.email || "",
      name: profile?.name || (user.email ? user.email.split("@")[0] : "Trader"),
      userId: profile?.user_id || "CB-UNKNOWN",
      avatarEmoji: profile?.avatar_emoji || "🦁",
      avatarImage: profile?.avatar_image || null,
      createdAt: user.created_at
    };
    _cbUserCacheTime = Date.now();
    return _cbUserCache;
  } catch (err) { return null; }
}

function cbInvalidateUserCache() { _cbUserCache = null; _cbUserCacheTime = 0; }

async function cbGetWallet(email) {
  const sb = await cbSB(); if (!sb) return null;
  const user = await cbCurrentUser(); if (!user) return null;
  const { data } = await sb.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
  return data;
}
async function cbSaveWallet(email, wallet) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) return;
  const payload = { user_id: user.id, usd: wallet.usd || 0, updated_at: new Date().toISOString() };
  const reserved = ["usd", "user_id", "updated_at"];
  Object.keys(wallet).forEach(k => { if (!reserved.includes(k) && typeof wallet[k] === "number") payload[k] = wallet[k]; });
  await sb.from("wallets").update(payload).eq("user_id", user.id);
}

function cbDefaultWallet() { return { usd: 5000, bitcoin: 0.03, ethereum: 0.5, solana: 5, dogecoin: 5000, cardano: 1000, chainlink: 10 }; }
function cbDefaultAvgPrices() { return { bitcoin: 82497, ethereum: 2430, solana: 104.55, dogecoin: 0.08, cardano: 0.218, chainlink: 12.17 }; }

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

function cbGetLoginAttempts() { try { return JSON.parse(localStorage.getItem(CB_LOGIN_ATTEMPTS) || "{}"); } catch { return {}; } }
function cbRecordFailedAttempt(email) { const attempts = cbGetLoginAttempts(); attempts[email] = (attempts[email] || 0) + 1; localStorage.setItem(CB_LOGIN_ATTEMPTS, JSON.stringify(attempts)); return attempts[email]; }
function cbResetLoginAttempts(email) { const attempts = cbGetLoginAttempts(); delete attempts[email]; delete attempts[email + "_until"]; localStorage.setItem(CB_LOGIN_ATTEMPTS, JSON.stringify(attempts)); }
function cbIsLockedOut(email) {
  const attempts = cbGetLoginAttempts(); const count = attempts[email] || 0;
  if (count >= 3) {
    if (!attempts[email + "_until"] || Date.now() > attempts[email + "_until"]) { attempts[email + "_until"] = Date.now() + 30 * 1000; localStorage.setItem(CB_LOGIN_ATTEMPTS, JSON.stringify(attempts)); }
    const remaining = Math.ceil((attempts[email + "_until"] - Date.now()) / 1000);
    if (remaining > 0) return remaining;
    else { cbResetLoginAttempts(email); return 0; }
  }
  return 0;
}

function cbGetFavorites() { try { return JSON.parse(localStorage.getItem("cb_favorites") || "[]"); } catch { return []; } }
function cbSaveFavorites(l) { localStorage.setItem("cb_favorites", JSON.stringify(l)); }
function cbToggleFavorite(id) {
  const f = cbGetFavorites(); const i = f.indexOf(id);
  if (i >= 0) f.splice(i, 1); else f.push(id);
  cbSaveFavorites(f); return f.includes(id);
}
function cbGetRecent() { try { return JSON.parse(localStorage.getItem(CB_RECENT_KEY) || "[]"); } catch { return []; } }
function cbSaveRecent(l) { localStorage.setItem(CB_RECENT_KEY, JSON.stringify(l)); }
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

async function cbGetTransactions(email) {
  const sb = await cbSB(); if (!sb) return [];
  const user = await cbCurrentUser(); if (!user) return [];
  const { data } = await sb.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return (data || []).map(t => ({ id: t.id, type: t.type, coinId: t.coin_id, coinName: t.coin_name, coinSymbol: t.coin_symbol, coinImage: t.coin_image, amount: t.amount, price: t.price, total: t.total, fee: t.fee, timestamp: t.created_at }));
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

async function cbGetNotifications(email) {
  const sb = await cbSB(); if (!sb) return [];
  const user = await cbCurrentUser(); if (!user) return [];
  const { data } = await sb.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return (data || []).map(n => ({ id: n.id, type: n.type, title: n.title, body: n.body, read: n.read, timestamp: n.created_at }));
}
async function cbAddNotification(email, notif) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) return;
  await sb.from("notifications").insert({ user_id: user.id, type: notif.type, title: notif.title, body: notif.body });
  cbUpdateBellBadge();
}
async function cbMarkNotificationsRead(email) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) return;
  await sb.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  cbUpdateBellBadge();
}
async function cbUnreadNotificationsCount(email) {
  const sb = await cbSB(); if (!sb) return 0;
  const user = await cbCurrentUser(); if (!user) return 0;
  const { count } = await sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
  return count || 0;
}
async function cbUpdateBellBadge() {
  const user = await cbCurrentUser();
  const badge = document.getElementById("cbBellBadge");
  if (!badge) return;
  if (!user) { badge.style.display = "none"; return; }
  const count = await cbUnreadNotificationsCount(user.email);
  if (count > 0) { badge.textContent = count > 99 ? "99+" : count; badge.style.display = "flex"; }
  else badge.style.display = "none";
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

function cbGetHistory(email) { try { return JSON.parse(localStorage.getItem("cb_history_" + email) || "[]"); } catch { return []; } }
function cbSaveHistory(email, l) { localStorage.setItem("cb_history_" + email, JSON.stringify(l)); }
function cbSnapshotPortfolio(email, totalUsd) {
  if (!email || totalUsd == null || isNaN(totalUsd)) return;
  const h = cbGetHistory(email); const today = new Date().toISOString().slice(0, 10); const last = h[h.length - 1];
  if (last && last.date === today) last.value = +totalUsd.toFixed(2);
  else h.push({ date: today, value: +totalUsd.toFixed(2) });
  if (h.length > 365) h.splice(0, h.length - 365);
  cbSaveHistory(email, h);
}

function cbGetTheme() { return localStorage.getItem(CB_THEME_KEY) || "dark"; }
function cbSetTheme(t) { localStorage.setItem(CB_THEME_KEY, t); if (t === "light") document.body.classList.add("light"); else document.body.classList.remove("light"); }
function cbApplyTheme() { cbSetTheme(cbGetTheme()); }

async function cbRequireAuth() {
  // Wait for Supabase to finish its async setup before checking
  await cbSB();
  const user = await cbCurrentUser();
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

async function cbDeleteAccount(email) {
  if (!confirm("Delete your account PERMANENTLY?\n\nAll your wallet, trades, alerts, and settings will be erased forever. This cannot be undone.")) return false;
  const typed = prompt('Type DELETE (all caps) to confirm:');
  if (typed !== "DELETE") { alert("Cancelled. Account not deleted."); return false; }
  const sb = await cbSB();
  if (sb) { const user = await cbCurrentUser(); if (user) await sb.from("profiles").delete().eq("id", user.id); await cbClearSession(); }
  return true;
}

async function cbResetWallet(email) {
  if (!confirm("Reset your demo wallet?\n\nYour cash returns to $5,000 and your starter coins are restored. All transactions are cleared. Your account and alerts stay.")) return false;
  const sb = await cbSB(); if (!sb) return false;
  const user = await cbCurrentUser(); if (!user) return false;
  const w = cbDefaultWallet(); const payload = { user_id: user.id, updated_at: new Date().toISOString() };
  Object.keys(w).forEach(k => payload[k] = w[k]);
  await sb.from("wallets").update(payload).eq("user_id", user.id);
  await sb.from("transactions").delete().eq("user_id", user.id);
  await cbAddTransaction(email, { type: "deposit", total: 5000, coinId: "usd", coinName: "USD", coinSymbol: "USD" });
  await cbAddNotification(email, { type: "deposit", title: "Wallet reset", body: "Demo wallet restored to $5,000 + starter coins." });
  return true;
}

async function cbValidateReferralCode(code) {
  const sb = await cbSB(); if (!code || !sb) return null;
  const normalized = code.trim().toUpperCase(); if (!normalized) return null;
  const { data, error } = await sb.from("profiles").select("id, name, user_id").eq("user_id", normalized).maybeSingle();
  if (error || !data) return null;
  return { email: data.id, name: data.name };
}
async function cbApplyReferral(newUserEmail, referrerId) {
  const sb = await cbSB(); if (!sb) return;
  const bonus = 5; const me = await cbCurrentUser();
  if (me) {
    const w = await cbGetWallet(me.email);
    if (w) await sb.from("wallets").update({ usd: (w.usd || 0) + bonus }).eq("user_id", me.id);
    await cbAddTransaction(me.email, { type: "deposit", total: bonus, coinId: "usd", coinName: "USD", coinSymbol: "USD" });
    await cbAddNotification(me.email, { type: "reward", title: `Welcome bonus +$${bonus}`, body: "Referral bonus applied." });
  }
  if (referrerId) {
    const { data: ref } = await sb.from("wallets").select("*").eq("user_id", referrerId).maybeSingle();
    if (ref) {
      await sb.from("wallets").update({ usd: (ref.usd || 0) + bonus }).eq("user_id", referrerId);
      await sb.from("notifications").insert({ user_id: referrerId, type: "reward", title: `Referral bonus +$${bonus}`, body: "Someone signed up with your code." });
    }
  }
}

function cbRenderFooter() {
  if (document.querySelector(".cb-footer")) return;
  const f = document.createElement("footer"); f.className = "cb-footer";
  f.innerHTML = `<div class="cb-footer-inner"><div class="cb-footer-links"><a href="about.html">About</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="mailto:support@coinbrave.demo">Contact</a></div><div class="cb-footer-copy">© ${new Date().getFullYear()} CoinBrave · Demo project · No real funds</div></div>`;
  document.body.appendChild(f);
}
function cbEnablePullToRefresh(onRefresh) {
  let startY = 0, pulling = false, indicator = null;
  function ensure() { if (indicator) return indicator; indicator = document.createElement("div"); indicator.className = "ptr-indicator"; indicator.innerHTML = '<div class="ptr-spinner"></div>'; document.body.appendChild(indicator); return indicator; }
  document.addEventListener("touchstart", (e) => { if (window.scrollY <= 0 && !pulling) { startY = e.touches[0].clientY; pulling = true; } }, { passive: true });
  document.addEventListener("touchmove", (e) => { if (!pulling) return; const dy = e.touches[0].clientY - startY; if (dy > 8) { const ind = ensure(); ind.style.opacity = Math.min(1, dy / 80); ind.style.transform = `translate(-50%, ${Math.min(dy - 30, 30)}px)`; } if (dy > 90) { pulling = false; const ind = ensure(); ind.classList.add("active"); ind.style.opacity = "1"; ind.style.transform = "translate(-50%, 30px)"; Promise.resolve(onRefresh()).finally(() => setTimeout(() => { ind.classList.remove("active"); ind.style.opacity = ""; ind.style.transform = ""; }, 500)); } }, { passive: true });
  document.addEventListener("touchend", () => { if (pulling) { pulling = false; if (indicator) { indicator.style.opacity = ""; indicator.style.transform = ""; } } }, { passive: true });
}

let _cbMarketCache = null, _cbMarketTime = 0;
async function cbGetMarketForFunds() {
  if (_cbMarketCache && Date.now() - _cbMarketTime < 5 * 60 * 1000) return _cbMarketCache;
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false";
  let res = await fetch(url);
  if (!res.ok) res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
  if (!res.ok) throw new Error("Failed to load market");
  _cbMarketCache = await res.json(); _cbMarketTime = Date.now();
  return _cbMarketCache;
}

async function cbOpenFundsModal(mode, onSuccess) {
  const sb = await cbSB(); if (!sb) return;
  const user = await cbCurrentUser(); if (!user) { location.href = "signup.html"; return; }
  let existing = document.getElementById("cbFundsModal"); if (existing) existing.remove();
  const modal = document.createElement("div"); modal.id = "cbFundsModal"; modal.className = "modal-overlay hidden";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${mode === "deposit" ? "Deposit" : "Withdraw"}</h3><button class="modal-close" id="cbFundsClose">×</button></div><div class="modal-body"><div class="form-group"><label>Asset</label><select id="cbFundsAsset"><option value="usd">USD (Cash)</option></select></div><div class="form-group"><label>Amount</label><input id="cbFundsAmount" type="number" step="any" min="0" placeholder="0.00" /></div><div id="cbFundsInfo" class="muted" style="font-size:0.85rem;margin-bottom:12px"></div><div id="cbFundsError" class="form-error"></div></div><div class="modal-footer"><button id="cbFundsConfirm" class="btn-primary">Confirm ${mode === "deposit" ? "Deposit" : "Withdrawal"}</button></div></div>`;
  document.body.appendChild(modal); modal.classList.remove("hidden");
  let market = []; try { market = await cbGetMarketForFunds(); const sel = document.getElementById("cbFundsAsset"); market.slice(0, 15).forEach(c => { const opt = document.createElement("option"); opt.value = c.id; opt.textContent = `${c.name} (${c.symbol.toUpperCase()})`; sel.appendChild(opt); }); } catch (e) { console.error(e); }
  const wallet = await cbGetWallet(user.email) || {};
  const selEl = document.getElementById("cbFundsAsset"), amtEl = document.getElementById("cbFundsAmount"), infoEl = document.getElementById("cbFundsInfo"), errEl = document.getElementById("cbFundsError");
  function updateInfo() { const asset = selEl.value, amt = parseFloat(amtEl.value) || 0; errEl.classList.remove("show"); if (asset === "usd") { infoEl.innerHTML = `Available: <b>$${(wallet.usd || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</b>`; } else { const coin = market.find(c => c.id === asset); if (!coin) { infoEl.textContent = ""; return; } const usdVal = amt * coin.current_price; const lines = [`1 ${coin.symbol.toUpperCase()} = ${cbFormatPrice(coin.current_price)}`]; if (amt > 0) lines.push(`Total: <b>$${usdVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</b>`); lines.push(`Available: <b>${(wallet[asset] || 0).toLocaleString()} ${coin.symbol.toUpperCase()}</b>`); infoEl.innerHTML = lines.join("<br>"); } }
  selEl.addEventListener("change", updateInfo); amtEl.addEventListener("input", updateInfo); updateInfo();
  document.getElementById("cbFundsClose").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
  document.getElementById("cbFundsConfirm").addEventListener("click", async () => {
    const asset = selEl.value, amt = parseFloat(amtEl.value); const showErr = (m) => { errEl.textContent = m; errEl.classList.add("show"); };
    if (!amt || amt <= 0 || isNaN(amt)) return showErr("Enter a valid amount.");
    const w = await cbGetWallet(user.email) || {};
    if (mode === "deposit") {
      if (asset === "usd") { await sb.from("wallets").update({ usd: (w.usd || 0) + amt }).eq("user_id", user.id); await cbAddTransaction(user.email, { type: "deposit", total: amt, coinId: "usd", coinName: "USD", coinSymbol: "USD" }); await cbAddNotification(user.email, { type: "deposit", title: `Deposited $${amt.toFixed(2)}`, body: "Added to cash." }); }
      else { const coin = market.find(c => c.id === asset); if (!coin) return showErr("Asset unavailable."); await sb.from("wallets").update({ [asset]: (w[asset] || 0) + amt }).eq("user_id", user.id); cbUpdateAvgOnBuy(user.email, asset, amt, coin.current_price); const usd = amt * coin.current_price; await cbAddTransaction(user.email, { type: "deposit", total: usd, amount: amt, price: coin.current_price, coinId: asset, coinName: coin.name, coinSymbol: coin.symbol, coinImage: coin.image }); await cbAddNotification(user.email, { type: "deposit", title: `Deposited ${amt} ${coin.symbol.toUpperCase()}`, body: `≈ $${usd.toFixed(2)}` }); }
    } else {
      if (asset === "usd") { if (amt > (w.usd || 0)) return showErr(`Insufficient. You have $${(w.usd || 0).toFixed(2)}.`); await sb.from("wallets").update({ usd: (w.usd || 0) - amt }).eq("user_id", user.id); await cbAddTransaction(user.email, { type: "withdraw", total: amt, coinId: "usd", coinName: "USD", coinSymbol: "USD" }); await cbAddNotification(user.email, { type: "withdraw", title: `Withdrew $${amt.toFixed(2)}`, body: "Removed from cash." }); }
      else { const coin = market.find(c => c.id === asset); if (!coin) return showErr("Asset unavailable."); const have = w[asset] || 0; if (amt > have + 1e-9) return showErr(`Insufficient. You have ${have} ${coin.symbol.toUpperCase()}.`); await sb.from("wallets").update({ [asset]: Math.max(0, have - amt) }).eq("user_id", user.id); cbUpdateAvgOnSell(user.email, asset); const usd = amt * coin.current_price; await cbAddTransaction(user.email, { type: "withdraw", total: usd, amount: amt, price: coin.current_price, coinId: asset, coinName: coin.name, coinSymbol: coin.symbol, coinImage: coin.image }); await cbAddNotification(user.email, { type: "withdraw", title: `Withdrew ${amt} ${coin.symbol.toUpperCase()}`, body: `≈ $${usd.toFixed(2)}` }); }
    }
    modal.remove(); if (onSuccess) onSuccess();
  });
}

async function cbRenderNav() {
  cbApplyTheme();
  cbRenderFooter();
  _cbPaintNav(null, 0);
  try {
    const user = await cbCurrentUser();
    if (user) { const unread = await cbUnreadNotificationsCount(user.email); _cbPaintNav(user, unread); }
  } catch (e) { console.warn("Nav auth check failed", e); }
}

function _cbPaintNav(user, unread) {
  const path = (location.pathname.split("/").pop() || "");
  const isHome = (path === "" || path === "index.html") ? "active" : "";
  const is = (p) => path === p ? "active" : "";

  const nav = document.querySelector(".nav");
  if (nav) {
    if (user) { nav.innerHTML = `<a href="index.html" class="${isHome}">Home</a><a href="market.html" class="${is('market.html')}">Market</a><a href="trade.html" class="${is('trade.html')}">Trade</a><a href="wallet.html" class="${is('wallet.html')}">Assets</a><a href="notifications.html" class="cb-bell" title="Notifications" style="position:relative;font-size:1.1rem;padding:6px 10px">🔔<span id="cbBellBadge" class="bell-badge" style="${unread>0?'':'display:none'}">${unread>99?'99+':unread}</span></a><a href="#" id="logoutBtn" class="btn-signup">Log Out</a>`; document.getElementById("logoutBtn").addEventListener("click", (e) => { e.preventDefault(); cbLogout(); }); }
    else { nav.innerHTML = `<a href="index.html" class="${isHome}">Home</a><a href="market.html" class="${is('market.html')}">Market</a><a href="trade.html" class="${is('trade.html')}">Trade</a><a href="login.html" class="${is('login.html')}">Log In</a><a href="signup.html" class="btn-signup ${is('signup.html')}">Sign Up</a>`; }
  }

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    let userArea = document.getElementById("topbarUser");
    if (!userArea) { userArea = document.createElement("div"); userArea.id = "topbarUser"; userArea.className = "topbar-user"; topbar.appendChild(userArea); }
    if (user) { userArea.innerHTML = `<a href="notifications.html" class="cb-bell" title="Notifications" style="position:relative;font-size:1.15rem;padding:6px 10px;color:var(--text)">🔔<span class="bell-badge" style="${unread>0?'':'display:none'}">${unread>99?'99+':unread}</span></a><div class="user-chip">${cbRenderAvatarHTML(user, 22)} <span>${user.name}</span></div><a href="#" id="logoutBtnMobile" class="btn-signup">Log Out</a>`; document.getElementById("logoutBtnMobile").addEventListener("click", (e) => { e.preventDefault(); cbLogout(); }); }
    else { userArea.innerHTML = `<a href="login.html" class="btn-signup" style="background:var(--bg-hover);color:var(--text) !important">Log In</a><a href="signup.html" class="btn-signup">Sign Up</a>`; }
  }

  let bn = document.querySelector(".bottom-nav");
  if (!bn) { bn = document.createElement("nav"); bn.className = "bottom-nav"; document.body.appendChild(bn); }
  bn.innerHTML = `<a href="index.html" class="bn-item ${isHome}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></a><a href="market.html" class="bn-item ${is('market.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg><span>Market</span></a><a href="trade.html" class="bn-item ${is('trade.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg><span>Trade</span></a><a href="wallet.html" class="bn-item ${is('wallet.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg><span>Assets</span></a>`;

  cbRenderProfileDrawer(user);
  if (!document.getElementById("cbAIButton")) cbRenderAIHelper();
}

function cbRenderProfileDrawer(user) {
  let overlay = document.getElementById("cbDrawerOverlay"), drawer = document.getElementById("cbDrawer");
  if (!overlay || !drawer) {
    overlay = document.createElement("div"); overlay.id = "cbDrawerOverlay"; overlay.className = "drawer-overlay hidden"; document.body.appendChild(overlay);
    drawer = document.createElement("aside"); drawer.id = "cbDrawer"; drawer.className = "drawer"; document.body.appendChild(drawer);
    overlay.addEventListener("click", cbCloseDrawer);
  }
  if (!user) { drawer.innerHTML = `<div class="drawer-header"><div class="drawer-avatar"><span class="avatar-emoji" style="font-size:32px">🧠</span></div><div class="drawer-info"><div class="drawer-name">Welcome</div><div class="drawer-id">Sign up to unlock</div></div><button class="drawer-close" id="cbDrawerClose">×</button></div><nav class="drawer-menu"><a href="index.html" class="drawer-item"><span class="drawer-icon">🏠</span><span>Home</span></a><a href="market.html" class="drawer-item"><span class="drawer-icon">📊</span><span>Market</span></a><a href="about.html" class="drawer-item"><span class="drawer-icon">ℹ️</span><span>About</span></a><a href="privacy.html" class="drawer-item"><span class="drawer-icon">🔒</span><span>Privacy</span></a><a href="terms.html" class="drawer-item"><span class="drawer-icon">📄</span><span>Terms</span></a><a href="login.html" class="drawer-item"><span class="drawer-icon">🔑</span><span>Log In</span></a><a href="signup.html" class="drawer-item"><span class="drawer-icon">✨</span><span>Sign Up</span></a></nav>`; }
  else { drawer.innerHTML = `<div class="drawer-header"><div class="drawer-avatar">${cbRenderAvatarHTML(user, 48)}</div><div class="drawer-info"><div class="drawer-name">${user.name}</div><div class="drawer-id">${user.userId}</div></div><button class="drawer-close" id="cbDrawerClose">×</button></div><nav class="drawer-menu"><a href="index.html" class="drawer-item"><span class="drawer-icon">🏠</span><span>Home</span></a><a href="wallet.html" class="drawer-item"><span class="drawer-icon">💰</span><span>Assets</span></a><a href="transactions.html" class="drawer-item"><span class="drawer-icon">📜</span><span>Transaction History</span></a><a href="rewards.html" class="drawer-item"><span class="drawer-icon">🎁</span><span>Rewards Hub</span></a><a href="referral.html" class="drawer-item"><span class="drawer-icon">🤝</span><span>Referral</span></a><a href="notifications.html" class="drawer-item"><span class="drawer-icon">🔔</span><span>Notifications</span></a><a href="settings.html" class="drawer-item"><span class="drawer-icon">⚙️</span><span>Settings</span></a><a href="about.html" class="drawer-item"><span class="drawer-icon">ℹ️</span><span>About</span></a><button id="cbDrawerLogout" class="drawer-item drawer-logout"><span class="drawer-icon">🚪</span><span>Log Out</span></button></nav>`; document.getElementById("cbDrawerLogout").addEventListener("click", cbLogout); }
  const closeBtn = document.getElementById("cbDrawerClose");
  if (closeBtn) closeBtn.addEventListener("click", cbCloseDrawer);
  const logo = document.querySelector(".logo");
  if (logo && !logo._cbBound) { logo._cbBound = true; logo.style.cursor = "pointer"; logo.addEventListener("click", async () => { const u = await cbCurrentUser(); if (u) cbOpenDrawer(); else location.href = "index.html"; }); }
}

function cbOpenDrawer() { const o = document.getElementById("cbDrawerOverlay"), d = document.getElementById("cbDrawer"); if (!o || !d) return; o.classList.remove("hidden"); d.classList.add("open"); document.body.style.overflow = "hidden"; }
function cbCloseDrawer() { const o = document.getElementById("cbDrawerOverlay"), d = document.getElementById("cbDrawer"); if (!o || !d) return; o.classList.add("hidden"); d.classList.remove("open"); document.body.style.overflow = ""; }

function cbRenderAIHelper() {
  if (document.getElementById("cbAIButton")) return;
  const btn = document.createElement("button"); btn.id = "cbAIButton"; btn.className = "ai-btn"; btn.innerHTML = "🧠"; btn.setAttribute("aria-label", "AI Assistant"); btn.title = "AI Assistant";
  const panel = document.createElement("div"); panel.id = "cbAIPanel"; panel.className = "ai-panel hidden";
  panel.innerHTML = `<div class="ai-header"><span>🧠 CoinBrave Assistant</span><button id="cbAIClose" class="ai-close">×</button></div><div class="ai-body"><p class="ai-intro">Hi! Pick a topic 👇</p><div class="ai-chips"><button data-topic="balance">💰 My balance</button><button data-topic="buy">🛒 How to buy</button><button data-topic="sell">💸 How to sell</button><button data-topic="deposit">💵 Deposit / Withdraw</button><button data-topic="alerts">🔔 Set an alert</button><button data-topic="rewards">🎁 Daily rewards</button><button data-topic="pl">📊 What is P/L?</button><button data-topic="install">📲 Install as app</button><button data-topic="support">📞 Support</button></div><div id="cbAIAnswer" class="ai-answer"></div></div>`;
  document.body.appendChild(btn); document.body.appendChild(panel);
  document.getElementById("cbAIClose").addEventListener("click", () => panel.classList.add("hidden"));
  panel.querySelectorAll("[data-topic]").forEach(b => { b.addEventListener("click", async () => { document.getElementById("cbAIAnswer").innerHTML = await cbAIAnswerFor(b.dataset.topic); }); });
  let dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0;
  btn.addEventListener("pointerdown", (e) => { dragging = true; moved = false; sx = e.clientX; sy = e.clientY; const r = btn.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; btn.setPointerCapture(e.pointerId); });
  btn.addEventListener("pointermove", (e) => { if (!dragging) return; if (Math.abs(e.clientX - sx) > 5 || Math.abs(e.clientY - sy) > 5) moved = true; if (!moved) return; btn.style.left = (e.clientX - ox) + "px"; btn.style.top = (e.clientY - oy) + "px"; btn.style.right = "auto"; btn.style.bottom = "auto"; });
  btn.addEventListener("pointerup", (e) => { dragging = false; try { btn.releasePointerCapture(e.pointerId); } catch {} if (!moved) panel.classList.toggle("hidden"); });
}

async function cbAIAnswerFor(topic) {
  const user = await cbCurrentUser();
  switch (topic) {
    case "balance": if (!user) return `<p>Not logged in. <a href="signup.html">Create an account</a> to start with $5,000 cash + coins.</p>`; const w = await cbGetWallet(user.email) || {}; return `<p>You have <b>$${(w.usd || 0).toLocaleString()}</b> in cash. See <a href="wallet.html">Assets</a> for full portfolio.</p>`;
    case "buy": return `<p><a href="trade.html">Trade</a> → tap <b>Buy</b> → enter amount → confirm. Fee 0.1%.</p>`;
    case "sell": return `<p><a href="trade.html">Trade</a> → tap <b>Sell</b> on a coin you hold.</p>`;
    case "deposit": return `<p><a href="wallet.html">Assets</a> → <b>Deposit</b> or <b>Withdraw</b>. Pick USD or any coin, enter amount, confirm.</p>`;
    case "alerts": return `<p><a href="settings.html">Settings</a> → <b>Price Alerts</b> → pick coin, target, direction.</p>`;
    case "rewards": return `<p><a href="rewards.html">Rewards Hub</a> → claim $5 daily.</p>`;
    case "pl": return `<p><b>P/L</b> = Profit/Loss. Value − Cost = P/L.</p>`;
    case "install": return `<p>On mobile, tap Share → <b>Add to Home Screen</b>.</p>`;
    case "support": return `<p>Email <a href="mailto:support@coinbrave.demo">support@coinbrave.demo</a>.</p>`;
    default: return "";
  }
}
