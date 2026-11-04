// ============================================================
// CoinBrave auth.js — LOCAL STORAGE (FINAL STABLE)
// ============================================================

(function cbInject() {
  if (typeof document === 'undefined') return;
  const add = (tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v)); document.head.appendChild(el); };
  if (!document.querySelector('link[rel="icon"]')) add('link', { rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg' });
  if (!document.querySelector('link[rel="manifest"]')) add('link', { rel: 'manifest', href: 'manifest.json' });
})();

const CB_USERS_KEY     = "cb_users";
const CB_SESSION_KEY   = "cb_session";
const CB_WALLET_PREFIX = "cb_wallet_";
const CB_AVG_PREFIX    = "cb_avg_";
const CB_FAV_KEY       = "cb_favorites";
const CB_REDIRECT_KEY  = "cb_redirect";
const CB_TX_PREFIX     = "cb_tx_";
const CB_ALERTS_PREFIX = "cb_alerts_";
const CB_NOTIF_PREFIX  = "cb_notif_";
const CB_HISTORY_PREFIX= "cb_history_";
const CB_THEME_KEY     = "cb_theme";
const CB_RECENT_KEY    = "cb_recent";
const CB_LIMIT_PREFIX  = "cb_limit_orders_";

function cbGetUsers() { try { return JSON.parse(localStorage.getItem(CB_USERS_KEY) || "[]"); } catch { return []; } }
function cbSaveUsers(u) { localStorage.setItem(CB_USERS_KEY, JSON.stringify(u)); }
function cbGetSession() { return localStorage.getItem(CB_SESSION_KEY); }
function cbSetSession(e) { localStorage.setItem(CB_SESSION_KEY, e); }
function cbClearSession() { localStorage.removeItem(CB_SESSION_KEY); }

function cbCurrentUser() {
  const email = cbGetSession();
  if (!email) return null;
  const user = cbGetUsers().find(u => u.email === email) || null;
  if (user && !user.userId) {
    user.userId = "CB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const users = cbGetUsers(); const idx = users.findIndex(u => u.email === user.email);
    if (idx >= 0) { users[idx] = user; cbSaveUsers(users); }
  }
  return user;
}

function cbGetWallet(email) { try { return JSON.parse(localStorage.getItem(CB_WALLET_PREFIX + email) || "null"); } catch { return null; } }
function cbSaveWallet(email, w) { localStorage.setItem(CB_WALLET_PREFIX + email, JSON.stringify(w)); }
function cbDefaultWallet() { return { usd: 5000, bitcoin: 0.03, ethereum: 0.5, solana: 5, dogecoin: 5000, cardano: 1000, chainlink: 10 }; }
function cbDefaultAvgPrices() { return { bitcoin: 82497, ethereum: 2430, solana: 104.55, dogecoin: 0.08, cardano: 0.218, chainlink: 12.17 }; }

function cbGetAvgPrices(email) { try { return JSON.parse(localStorage.getItem(CB_AVG_PREFIX + email) || "{}"); } catch { return {}; } }
function cbSaveAvgPrices(email, obj) { localStorage.setItem(CB_AVG_PREFIX + email, JSON.stringify(obj)); }
function cbUpdateAvgOnBuy(email, coinId, qty, price) {
  const avg = cbGetAvgPrices(email), wallet = cbGetWallet(email) || {};
  const oldQty = wallet[coinId] || 0, oldAvg = avg[coinId] || 0;
  if (oldQty + qty > 0) avg[coinId] = ((oldQty * oldAvg) + (qty * price)) / (oldQty + qty);
  cbSaveAvgPrices(email, avg);
}
function cbUpdateAvgOnSell(email, coinId) {
  const wallet = cbGetWallet(email) || {};
  const avg = cbGetAvgPrices(email);
  if (!wallet[coinId] || wallet[coinId] <= 0) delete avg[coinId];
  cbSaveAvgPrices(email, avg);
}

async function cbHashPassword(password) {
  const enc = new TextEncoder().encode(password + "::coinbrave::salt");
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function cbPasswordStrength(pw) {
  if (!pw || pw.length < 8) return { level: "weak", label: "Too short" };
  let score = 0;
  if (pw.length >= 8) score++; if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++; if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 3) return { level: "weak", label: "Weak" };
  if (score <= 4) return { level: "medium", label: "Medium" };
  return { level: "strong", label: "Strong" };
}

function cbGetFavorites() { try { return JSON.parse(localStorage.getItem(CB_FAV_KEY) || "[]"); } catch { return []; } }
function cbSaveFavorites(l) { localStorage.setItem(CB_FAV_KEY, JSON.stringify(l)); }
function cbToggleFavorite(id) { const f = cbGetFavorites(); const i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); cbSaveFavorites(f); return f.includes(id); }

function cbFormatPrice(p) { if (p == null || isNaN(p)) return "—"; if (p >= 1) return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 }); if (p >= 0.01) return "$" + p.toFixed(4); return "$" + p.toFixed(6); }
function cbFormatSigned(n) { const sign = n >= 0 ? "+" : "-"; return sign + "$" + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }); }
function cbSparkline(prices, width, height, up) { width=width||60; height=height||24; if(!prices||prices.length<2)return""; const min=Math.min(...prices),max=Math.max(...prices),range=max-min||1,step=width/(prices.length-1); const pts=prices.map((p,i)=>`${(i*step).toFixed(1)},${(height-((p-min)/range)*(height-4)-2).toFixed(1)}`).join(" "); const color=up?"var(--up)":"var(--down)"; return `<svg class="sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`; }

function cbGetTransactions(email) { try { return JSON.parse(localStorage.getItem(CB_TX_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveTransactions(email, l) { localStorage.setItem(CB_TX_PREFIX + email, JSON.stringify(l)); }
function cbAddTransaction(email, tx) { const list = cbGetTransactions(email); tx.id = "tx_"+Date.now(); tx.timestamp = new Date().toISOString(); list.unshift(tx); cbSaveTransactions(email, list); }

function cbGetLimitOrders(email) { try { return JSON.parse(localStorage.getItem(CB_LIMIT_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveLimitOrders(email, l) { localStorage.setItem(CB_LIMIT_PREFIX + email, JSON.stringify(l)); }
function cbAddLimitOrder(email, order) { const l = cbGetLimitOrders(email); order.id = "lo_"+Date.now(); l.unshift(order); cbSaveLimitOrders(email, l); }
function cbRemoveLimitOrder(email, id) { cbSaveLimitOrders(email, cbGetLimitOrders(email).filter(o => o.id !== id)); }

function cbCheckLimitOrders(marketCoins) {
  const user = cbCurrentUser(); if (!user || !Array.isArray(marketCoins)) return;
  let orders = cbGetLimitOrders(user.email), changed = false;
  for (const order of orders) {
    const coin = marketCoins.find(c => c.id === order.coinId); if (!coin) continue;
    let hit = (order.side === "buy" && coin.current_price <= order.targetPrice) || (order.side === "sell" && coin.current_price >= order.targetPrice);
    if (hit) {
      const wallet = cbGetWallet(user.email) || {};
      const fee = (order.amount * coin.current_price) * 0.001, total = (order.amount * coin.current_price);
      if (order.side === "buy" && wallet.usd >= total + fee) {
        wallet.usd -= (total + fee); wallet[order.coinId] = (wallet[order.coinId] || 0) + order.amount;
        cbSaveWallet(user.email, wallet); cbUpdateAvgOnBuy(user.email, order.coinId, order.amount, coin.current_price);
        cbAddTransaction(user.email, { type: "buy", coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol, amount: order.amount, price: coin.current_price, total, fee });
        cbAddNotification(user.email, { type: "trade", title: `Limit Buy Filled`, body: `${order.amount} ${coin.symbol.toUpperCase()}` });
        cbRemoveLimitOrder(user.email, order.id); changed = true;
      } else if (order.side === "sell" && (wallet[order.coinId] || 0) >= order.amount) {
        wallet[order.coinId] -= order.amount; if (wallet[order.coinId] <= 0) delete wallet[order.coinId]; wallet.usd += (total - fee);
        cbSaveWallet(user.email, wallet); cbUpdateAvgOnSell(user.email, order.coinId);
        cbAddTransaction(user.email, { type: "sell", coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol, amount: order.amount, price: coin.current_price, total, fee });
        cbAddNotification(user.email, { type: "trade", title: `Limit Sell Filled`, body: `${order.amount} ${coin.symbol.toUpperCase()}` });
        cbRemoveLimitOrder(user.email, order.id); changed = true;
      }
    }
  }
}

function cbGetAlerts(email) { try { return JSON.parse(localStorage.getItem(CB_ALERTS_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveAlerts(email, l) { localStorage.setItem(CB_ALERTS_PREFIX + email, JSON.stringify(l)); }
function cbCheckAlerts(coins) {
  const user = cbCurrentUser(); if (!user || !Array.isArray(coins)) return;
  const alerts = cbGetAlerts(user.email); const byId = Object.fromEntries(coins.map(c => [c.id, c])); let changed = false;
  for (const a of alerts) {
    if (a.triggered) continue; const coin = byId[a.coinId]; if (!coin) continue;
    const hit = (a.direction === "above" && coin.current_price >= a.targetPrice) || (a.direction === "below" && coin.current_price <= a.targetPrice);
    if (hit) { a.triggered = true; changed = true; cbAddNotification(user.email, { type: "alert", title: `${coin.name} hit ${cbFormatPrice(a.targetPrice)}`, body: "" }); }
  }
  if (changed) cbSaveAlerts(user.email, alerts);
}

function cbGetNotifications(email) { try { return JSON.parse(localStorage.getItem(CB_NOTIF_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveNotifications(email, l) { localStorage.setItem(CB_NOTIF_PREFIX + email, JSON.stringify(l)); }
function cbAddNotification(email, n) { const l = cbGetNotifications(email); n.id = "n_"+Date.now(); n.timestamp = new Date().toISOString(); n.read = false; l.unshift(n); cbSaveNotifications(email, l); }

function cbGetHistory(email) { try { return JSON.parse(localStorage.getItem(CB_HISTORY_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveHistory(email, l) { localStorage.setItem(CB_HISTORY_PREFIX + email, JSON.stringify(l)); }
function cbSnapshotPortfolio(email, totalUsd) {
  if (!email || totalUsd == null || isNaN(totalUsd)) return;
  const h = cbGetHistory(email); const today = new Date().toISOString().slice(0, 10); const last = h[h.length - 1];
  if (last && last.date === today) last.value = +totalUsd.toFixed(2);
  else h.push({ date: today, value: +totalUsd.toFixed(2) });
  if (h.length > 365) h.splice(0, h.length - 365); cbSaveHistory(email, h);
}

function cbGetTheme() { return localStorage.getItem(CB_THEME_KEY) || "dark"; }
function cbSetTheme(t) { localStorage.setItem(CB_THEME_KEY, t); if (t === "light") document.body.classList.add("light"); else document.body.classList.remove("light"); }
function cbApplyTheme() { cbSetTheme(cbGetTheme()); }

function cbRequireAuth() {
  if (!cbCurrentUser()) { localStorage.setItem(CB_REDIRECT_KEY, location.href); location.href = "login.html"; return false; }
  return true;
}

function cbLogout() { if (confirm("Log out?")) { cbClearSession(); location.href = "index.html"; } }

async function cbGetMarketForFunds() {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false";
  let res = await fetch(url); if (!res.ok) res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
  if (!res.ok) throw new Error("Failed to load market"); return await res.json();
}

async function cbOpenFundsModal(mode, onSuccess) {
  const user = cbCurrentUser(); if (!user) { location.href = "signup.html"; return; }
  let existing = document.getElementById("cbFundsModal"); if (existing) existing.remove();
  const modal = document.createElement("div"); modal.id = "cbFundsModal"; modal.className = "modal-overlay hidden";
  modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>${mode === "deposit" ? "Deposit" : "Withdraw"}</h3><button class="modal-close" id="cbFundsClose">×</button></div><div class="modal-body"><div class="form-group"><label>Asset</label><select id="cbFundsAsset" style="width:100%;padding:10px;border-radius:8px;background:var(--bg);color:var(--text);border:1px solid var(--border)"><option value="usd">USD (Cash)</option></select></div><div class="form-group"><label>Amount</label><input id="cbFundsAmount" type="number" step="any" min="0" placeholder="0.00" style="width:100%;padding:10px;border-radius:8px;background:var(--bg);color:var(--text);border:1px solid var(--border)" /></div><div id="cbFundsError" class="form-error"></div></div><div class="modal-footer"><button id="cbFundsConfirm" class="btn-primary">Confirm</button></div></div>`;
  document.body.appendChild(modal); modal.classList.remove("hidden");
  let market = []; try { market = await cbGetMarketForFunds(); const sel = document.getElementById("cbFundsAsset"); market.slice(0, 15).forEach(c => { const opt = document.createElement("option"); opt.value = c.id; opt.textContent = `${c.name} (${c.symbol.toUpperCase()})`; sel.appendChild(opt); }); } catch (e) {}
  const wallet = cbGetWallet(user.email) || {};
  const selEl = document.getElementById("cbFundsAsset"), amtEl = document.getElementById("cbFundsAmount"), errEl = document.getElementById("cbFundsError");
  document.getElementById("cbFundsClose").addEventListener("click", () => modal.remove());
  document.getElementById("cbFundsConfirm").addEventListener("click", () => {
    const asset = selEl.value, amt = parseFloat(amtEl.value); const showErr = (m) => { errEl.textContent = m; errEl.classList.add("show"); };
    if (!amt || amt <= 0 || isNaN(amt)) return showErr("Enter a valid amount.");
    const w = cbGetWallet(user.email) || {};
    if (mode === "deposit") {
      if (asset === "usd") { w.usd = +((w.usd || 0) + amt).toFixed(2); }
      else { const coin = market.find(c => c.id === asset); if (!coin) return showErr("Unavailable"); w[asset] = +((w[asset] || 0) + amt).toFixed(8); cbUpdateAvgOnBuy(user.email, asset, amt, coin.current_price); }
      cbSaveWallet(user.email, w); cbAddTransaction(user.email, { type: "deposit", total: amt, coinId: asset }); modal.remove(); if (onSuccess) onSuccess();
    } else {
      if (asset === "usd") { if (amt > (w.usd || 0)) return showErr("Insufficient."); w.usd = +((w.usd || 0) - amt).toFixed(2); }
      else { const coin = market.find(c => c.id === asset); if (!coin || amt > (w[asset] || 0)) return showErr("Insufficient."); w[asset] = +((w[asset] || 0) - amt).toFixed(8); if (w[asset] <= 0) delete w[asset]; cbUpdateAvgOnSell(user.email, asset); }
      cbSaveWallet(user.email, w); cbAddTransaction(user.email, { type: "withdraw", total: amt, coinId: asset }); modal.remove(); if (onSuccess) onSuccess();
    }
  });
}

function cbRenderNav() {
  cbApplyTheme();
  const user = cbCurrentUser(); const path = (location.pathname.split("/").pop() || "");
  const isHome = (path === "" || path === "index.html") ? "active" : ""; const is = (p) => path === p ? "active" : "";

  const nav = document.querySelector(".nav");
  if (nav) {
    if (user) { nav.innerHTML = `<a href="index.html" class="${isHome}">Home</a><a href="market.html" class="${is('market.html')}">Market</a><a href="trade.html" class="${is('trade.html')}">Trade</a><a href="wallet.html" class="${is('wallet.html')}">Assets</a><a href="#" id="logoutBtn" class="btn-signup">Log Out</a>`; document.getElementById("logoutBtn").addEventListener("click", (e) => { e.preventDefault(); cbLogout(); }); }
    else { nav.innerHTML = `<a href="index.html" class="${isHome}">Home</a><a href="market.html" class="${is('market.html')}">Market</a><a href="login.html" class="${is('login.html')}">Log In</a><a href="signup.html" class="btn-signup ${is('signup.html')}">Sign Up</a>`; }
  }

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    let userArea = document.getElementById("topbarUser");
    if (!userArea) { userArea = document.createElement("div"); userArea.id = "topbarUser"; userArea.className = "topbar-user"; topbar.appendChild(userArea); }
    if (user) { userArea.innerHTML = `<div class="user-chip">👤 <span>${user.name}</span></div><a href="#" id="logoutBtnMobile" class="btn-signup">Log Out</a>`; document.getElementById("logoutBtnMobile").addEventListener("click", (e) => { e.preventDefault(); cbLogout(); }); }
    else { userArea.innerHTML = `<a href="login.html" class="btn-signup" style="background:var(--bg-hover);color:var(--text) !important">Log In</a><a href="signup.html" class="btn-signup">Sign Up</a>`; }
  }

  let bn = document.querySelector(".bottom-nav");
  if (!bn) { bn = document.createElement("nav"); bn.className = "bottom-nav"; document.body.appendChild(bn); }
  bn.innerHTML = `<a href="index.html" class="bn-item ${isHome}">Home</a><a href="market.html" class="bn-item ${is('market.html')}">Market</a><a href="trade.html" class="bn-item ${is('trade.html')}">Trade</a><a href="wallet.html" class="bn-item ${is('wallet.html')}">Assets</a>`;
}
