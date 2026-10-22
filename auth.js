// CoinBrave shared helpers
const CB_USERS_KEY     = "cb_users";
const CB_SESSION_KEY   = "cb_session";
const CB_WALLET_PREFIX = "cb_wallet_";
const CB_FAV_KEY       = "cb_favorites";
const CB_REDIRECT_KEY  = "cb_redirect";
const CB_TX_PREFIX     = "cb_tx_";
const CB_ALERTS_PREFIX = "cb_alerts_";
const CB_NOTIF_PREFIX  = "cb_notif_";
const CB_THEME_KEY     = "cb_theme";

const CB_EMOJIS = ["🦁","🐂","🐻","🦊","🐺","🐯","🦄","🐳","🦈","🐬","🦅","🐉","🚀","💎","🌙","⭐","🔥","🎯","🎨","🧠"];

function cbGetUsers() { try { return JSON.parse(localStorage.getItem(CB_USERS_KEY) || "[]"); } catch { return []; } }
function cbSaveUsers(users) { localStorage.setItem(CB_USERS_KEY, JSON.stringify(users)); }
function cbGetSession() { return localStorage.getItem(CB_SESSION_KEY); }
function cbSetSession(email) { localStorage.setItem(CB_SESSION_KEY, email); }
function cbClearSession() { localStorage.removeItem(CB_SESSION_KEY); }

function cbCurrentUser() {
  const email = cbGetSession();
  if (!email) return null;
  const user = cbGetUsers().find(u => u.email === email) || null;
  return cbEnsureUserFields(user);
}

function cbEnsureUserFields(user) {
  if (!user) return null;
  let changed = false;
  if (!user.userId) {
    user.userId = "CB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    changed = true;
  }
  if (!user.avatarEmoji && !user.avatarImage) {
    user.avatarEmoji = "🦁";
    changed = true;
  }
  if (changed) {
    const users = cbGetUsers();
    const idx = users.findIndex(u => u.email === user.email);
    if (idx >= 0) {
      users[idx].userId = user.userId;
      users[idx].avatarEmoji = user.avatarEmoji;
      cbSaveUsers(users);
    }
  }
  return user;
}

function cbGetWallet(email) { try { return JSON.parse(localStorage.getItem(CB_WALLET_PREFIX + email) || "null"); } catch { return null; } }
function cbSaveWallet(email, wallet) { localStorage.setItem(CB_WALLET_PREFIX + email, JSON.stringify(wallet)); }

async function cbHashPassword(password) {
  const enc = new TextEncoder().encode(password + "::coinbrave::salt");
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function cbGetFavorites() { try { return JSON.parse(localStorage.getItem(CB_FAV_KEY) || "[]"); } catch { return []; } }
function cbSaveFavorites(list) { localStorage.setItem(CB_FAV_KEY, JSON.stringify(list)); }
function cbToggleFavorite(coinId) {
  const favs = cbGetFavorites();
  const idx = favs.indexOf(coinId);
  if (idx >= 0) favs.splice(idx, 1); else favs.push(coinId);
  cbSaveFavorites(favs);
  return favs.includes(coinId);
}

function cbFormatPrice(p) {
  if (p == null || isNaN(p)) return "—";
  if (p >= 1) return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toFixed(6);
}

function cbGetTransactions(email) { try { return JSON.parse(localStorage.getItem(CB_TX_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveTransactions(email, list) { localStorage.setItem(CB_TX_PREFIX + email, JSON.stringify(list)); }
function cbAddTransaction(email, tx) {
  const list = cbGetTransactions(email);
  tx.id = "tx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  tx.timestamp = new Date().toISOString();
  list.unshift(tx);
  cbSaveTransactions(email, list);
  return tx;
}

function cbGetAlerts(email) { try { return JSON.parse(localStorage.getItem(CB_ALERTS_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveAlerts(email, list) { localStorage.setItem(CB_ALERTS_PREFIX + email, JSON.stringify(list)); }
function cbAddAlert(email, alert) {
  const list = cbGetAlerts(email);
  alert.id = "al_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  alert.createdAt = new Date().toISOString();
  alert.triggered = false;
  list.unshift(alert);
  cbSaveAlerts(email, list);
  return alert;
}
function cbRemoveAlert(email, id) { cbSaveAlerts(email, cbGetAlerts(email).filter(a => a.id !== id)); }

function cbGetNotifications(email) { try { return JSON.parse(localStorage.getItem(CB_NOTIF_PREFIX + email) || "[]"); } catch { return []; } }
function cbSaveNotifications(email, list) { localStorage.setItem(CB_NOTIF_PREFIX + email, JSON.stringify(list)); }
function cbAddNotification(email, notif) {
  const list = cbGetNotifications(email);
  notif.id = "n_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
  notif.timestamp = new Date().toISOString();
  notif.read = false;
  list.unshift(notif);
  cbSaveNotifications(email, list);
}
function cbMarkNotificationsRead(email) { cbSaveNotifications(email, cbGetNotifications(email).map(n => ({ ...n, read: true }))); }
function cbUnreadNotificationsCount(email) { return cbGetNotifications(email).filter(n => !n.read).length; }

function cbCheckAlerts(coins) {
  const user = cbCurrentUser();
  if (!user || !Array.isArray(coins)) return;
  const alerts = cbGetAlerts(user.email);
  const byId = Object.fromEntries(coins.map(c => [c.id, c]));
  let changed = false;
  for (const a of alerts) {
    if (a.triggered) continue;
    const coin = byId[a.coinId];
    if (!coin) continue;
    const hit = (a.direction === "above" && coin.current_price >= a.targetPrice) ||
                (a.direction === "below" && coin.current_price <= a.targetPrice);
    if (hit) {
      a.triggered = true; changed = true;
      cbAddNotification(user.email, {
        type: "alert",
        title: `${coin.name} ${a.direction === "above" ? "hit" : "dropped to"} ${cbFormatPrice(a.targetPrice)}`,
        body: `Current: ${cbFormatPrice(coin.current_price)} · Your ${a.direction} alert for ${cbFormatPrice(a.targetPrice)} triggered.`
      });
    }
  }
  if (changed) cbSaveAlerts(user.email, alerts);
}

function cbGetTheme() { return localStorage.getItem(CB_THEME_KEY) || "dark"; }
function cbSetTheme(t) {
  localStorage.setItem(CB_THEME_KEY, t);
  if (t === "light") document.body.classList.add("light");
  else document.body.classList.remove("light");
}
function cbApplyTheme() { cbSetTheme(cbGetTheme()); }

function cbRequireAuth() {
  if (!cbCurrentUser()) {
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

function cbRenderNav() {
  cbApplyTheme();
  const user = cbCurrentUser();
  const path = (location.pathname.split("/").pop() || "");
  const isHome = (path === "" || path === "index.html") ? "active" : "";
  const is = (p) => path === p ? "active" : "";

  const nav = document.querySelector(".nav");
  if (nav) {
    if (user) {
      nav.innerHTML = `
        <a href="index.html" class="${isHome}">Home</a>
        <a href="market.html" class="${is('market.html')}">Market</a>
        <a href="trade.html" class="${is('trade.html')}">Trade</a>
        <a href="wallet.html" class="${is('wallet.html')}">Assets</a>
        <a href="#" id="logoutBtn" class="btn-signup">Log Out</a>`;
      document.getElementById("logoutBtn").addEventListener("click", (e) => { e.preventDefault(); cbClearSession(); location.href = "index.html"; });
    } else {
      nav.innerHTML = `
        <a href="index.html" class="${isHome}">Home</a>
        <a href="market.html" class="${is('market.html')}">Market</a>
        <a href="trade.html" class="${is('trade.html')}">Trade</a>
        <a href="login.html" class="${is('login.html')}">Log In</a>
        <a href="signup.html" class="btn-signup ${is('signup.html')}">Sign Up</a>`;
    }
  }

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    let userArea = document.getElementById("topbarUser");
    if (!userArea) { userArea = document.createElement("div"); userArea.id = "topbarUser"; userArea.className = "topbar-user"; topbar.appendChild(userArea); }
    if (user) {
      userArea.innerHTML = `
        <div class="user-chip">${cbRenderAvatarHTML(user, 22)} <span>${user.name}</span></div>
        <a href="#" id="logoutBtnMobile" class="btn-signup">Log Out</a>`;
      document.getElementById("logoutBtnMobile").addEventListener("click", (e) => { e.preventDefault(); cbClearSession(); location.href = "index.html"; });
    } else {
      userArea.innerHTML = `
        <a href="login.html" class="btn-signup" style="background:var(--bg-hover);color:var(--text) !important">Log In</a>
        <a href="signup.html" class="btn-signup">Sign Up</a>`;
    }
  }

  let bn = document.querySelector(".bottom-nav");
  if (!bn) { bn = document.createElement("nav"); bn.className = "bottom-nav"; document.body.appendChild(bn); }
  bn.innerHTML = `
    <a href="index.html" class="bn-item ${isHome}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Home</span></a>
    <a href="market.html" class="bn-item ${is('market.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg><span>Market</span></a>
    <a href="trade.html" class="bn-item ${is('trade.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg><span>Trade</span></a>
    <a href="wallet.html" class="bn-item ${is('wallet.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg><span>Assets</span></a>`;

  cbRenderProfileDrawer(user);
  cbRenderAIHelper();
}

function cbRenderProfileDrawer(user) {
  let overlay = document.getElementById("cbDrawerOverlay");
  let drawer = document.getElementById("cbDrawer");
  if (!overlay || !drawer) {
    overlay = document.createElement("div");
    overlay.id = "cbDrawerOverlay";
    overlay.className = "drawer-overlay hidden";
    document.body.appendChild(overlay);
    drawer = document.createElement("aside");
    drawer.id = "cbDrawer";
    drawer.className = "drawer";
    document.body.appendChild(drawer);
    overlay.addEventListener("click", cbCloseDrawer);
  }

  if (!user) {
    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-avatar"><span class="avatar-emoji" style="font-size:32px">🧠</span></div>
        <div class="drawer-info"><div class="drawer-name">Welcome</div><div class="drawer-id">Sign up to unlock your profile</div></div>
        <button class="drawer-close" id="cbDrawerClose">×</button>
      </div>
      <nav class="drawer-menu">
        <a href="index.html" class="drawer-item"><span class="drawer-icon">🏠</span><span>Home</span></a>
        <a href="market.html" class="drawer-item"><span class="drawer-icon">📊</span><span>Market</span></a>
        <a href="login.html" class="drawer-item"><span class="drawer-icon">🔑</span><span>Log In</span></a>
        <a href="signup.html" class="drawer-item"><span class="drawer-icon">✨</span><span>Sign Up</span></a>
      </nav>`;
  } else {
    const unread = cbUnreadNotificationsCount(user.email);
    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-avatar">${cbRenderAvatarHTML(user, 48)}</div>
        <div class="drawer-info"><div class="drawer-name">${user.name}</div><div class="drawer-id">${user.userId}</div></div>
        <button class="drawer-close" id="cbDrawerClose">×</button>
      </div>
      <nav class="drawer-menu">
        <a href="index.html" class="drawer-item"><span class="drawer-icon">🏠</span><span>Home</span></a>
        <a href="wallet.html" class="drawer-item"><span class="drawer-icon">💰</span><span>Assets</span></a>
        <a href="transactions.html" class="drawer-item"><span class="drawer-icon">📜</span><span>Transaction History</span></a>
        <a href="rewards.html" class="drawer-item"><span class="drawer-icon">🎁</span><span>Rewards Hub</span></a>
        <a href="referral.html" class="drawer-item"><span class="drawer-icon">🤝</span><span>Referral</span></a>
        <a href="notifications.html" class="drawer-item"><span class="drawer-icon">🔔</span><span>Notifications</span>${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ""}</a>
        <a href="settings.html" class="drawer-item"><span class="drawer-icon">⚙️</span><span>Settings</span></a>
        <button id="cbDrawerLogout" class="drawer-item drawer-logout"><span class="drawer-icon">🚪</span><span>Log Out</span></button>
      </nav>`;
    document.getElementById("cbDrawerLogout").addEventListener("click", () => { cbClearSession(); location.href = "index.html"; });
  }

  const closeBtn = document.getElementById("cbDrawerClose");
  if (closeBtn) closeBtn.addEventListener("click", cbCloseDrawer);

  const logo = document.querySelector(".logo");
  if (logo && !logo._cbBound) {
    logo._cbBound = true;
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      if (cbCurrentUser()) cbOpenDrawer();
      else location.href = "index.html";
    });
  }
}

function cbOpenDrawer() {
  const overlay = document.getElementById("cbDrawerOverlay");
  const drawer = document.getElementById("cbDrawer");
  if (!overlay || !drawer) return;
  overlay.classList.remove("hidden");
  drawer.classList.add("open");
  document.body.style.overflow = "hidden";
}
function cbCloseDrawer() {
  const overlay = document.getElementById("cbDrawerOverlay");
  const drawer = document.getElementById("cbDrawer");
  if (!overlay || !drawer) return;
  overlay.classList.add("hidden");
  drawer.classList.remove("open");
  document.body.style.overflow = "";
}

function cbRenderAIHelper() {
  if (document.getElementById("cbAIButton")) return;

  const btn = document.createElement("button");
  btn.id = "cbAIButton";
  btn.className = "ai-btn";
  btn.innerHTML = "🧠";
  btn.setAttribute("aria-label", "AI Assistant");
  btn.title = "AI Assistant";

  const panel = document.createElement("div");
  panel.id = "cbAIPanel";
  panel.className = "ai-panel hidden";
  panel.innerHTML = `
    <div class="ai-header">
      <span>🧠 CoinBrave Assistant</span>
      <button id="cbAIClose" class="ai-close">×</button>
    </div>
    <div class="ai-body">
      <p class="ai-intro">Hi! I'm your helper. Pick a topic 👇</p>
      <div class="ai-chips">
        <button data-topic="balance">💰 Check my balance</button>
        <button data-topic="buy">🛒 How do I buy coins?</button>
        <button data-topic="sell">💸 How do I sell coins?</button>
        <button data-topic="alerts">🔔 Set a price alert</button>
        <button data-topic="rewards">🎁 Daily rewards</button>
        <button data-topic="deposit">💵 Deposit / Withdraw</button>
        <button data-topic="support">📞 Contact support</button>
      </div>
      <div id="cbAIAnswer" class="ai-answer"></div>
    </div>`;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  document.getElementById("cbAIClose").addEventListener("click", () => panel.classList.add("hidden"));
  panel.querySelectorAll("[data-topic]").forEach(b => {
    b.addEventListener("click", () => { document.getElementById("cbAIAnswer").innerHTML = cbAIAnswerFor(b.dataset.topic); });
  });

  let dragging = false, moved = false, startX = 0, startY = 0, offX = 0, offY = 0;
  btn.addEventListener("pointerdown", (e) => {
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    const r = btn.getBoundingClientRect();
    offX = e.clientX - r.left; offY = e.clientY - r.top;
    btn.setPointerCapture(e.pointerId);
  });
  btn.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > 5 || dy > 5) moved = true;
    if (!moved) return;
    btn.style.left = (e.clientX - offX) + "px";
    btn.style.top = (e.clientY - offY) + "px";
    btn.style.right = "auto";
    btn.style.bottom = "auto";
  });
  btn.addEventListener("pointerup", (e) => {
    dragging = false;
    try { btn.releasePointerCapture(e.pointerId); } catch {}
    if (!moved) panel.classList.toggle("hidden");
  });
}

function cbAIAnswerFor(topic) {
  const user = cbCurrentUser();
  switch (topic) {
    case "balance": {
      if (!user) return `<p>You're not logged in yet. <a href="signup.html">Create an account</a> to start with $10,000 demo funds.</p>`;
      const w = cbGetWallet(user.email) || {};
      return `<p>You have <b>$${(w.usd || 0).toLocaleString()}</b> in cash. Visit <a href="wallet.html">Assets</a> to see your full portfolio.</p>`;
    }
    case "buy": return `<p>Open <a href="trade.html">Trade</a> → tap <b>Buy</b> on any coin → enter amount → confirm. Fee is 0.1%.</p>`;
    case "sell": return `<p>Open <a href="trade.html">Trade</a> → tap <b>Sell</b> on a coin you hold → enter amount → confirm.</p>`;
    case "alerts": return `<p>Go to <a href="settings.html">Settings</a> → <b>Price Alerts</b> → pick a coin, price, and direction.</p>`;
    case "rewards": return `<p>Visit the <a href="rewards.html">Rewards Hub</a> to claim $5 daily.</p>`;
    case "deposit": return `<p>Go to <a href="settings.html">Settings → Deposit / Withdraw</a>.</p>`;
    case "support": return `<p>Email <a href="mailto:support@coinbrave.demo">support@coinbrave.demo</a>.</p>`;
    default: return "";
  }
}
