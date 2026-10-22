let user = null;
let allCoins = [];
const PROXY = "https://api.allorigins.win/raw?url=";

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  if (!cbRequireAuth()) return;
  user = cbCurrentUser();
  renderEmojiGrid();
  renderProfile();
  renderTheme();
  renderCashBalance();
  bindProfile();
  bindTheme();
  bindDepositWithdraw();
  await loadCoinsForAlerts();
  renderAlerts();
  bindAlerts();
});

function saveUser(updated) {
  const users = cbGetUsers();
  const idx = users.findIndex(u => u.email === updated.email);
  if (idx >= 0) { users[idx] = updated; cbSaveUsers(users); }
  user = updated;
}

function renderProfile() {
  document.getElementById("nameInput").value = user.name;
  document.getElementById("userIdInput").value = user.userId;
  document.getElementById("avatarPreview").innerHTML = cbRenderAvatarHTML(user, 68);
  document.querySelectorAll(".emoji-cell").forEach(c => c.classList.toggle("selected", c.dataset.emoji === user.avatarEmoji && !user.avatarImage));
  const clearBtn = document.getElementById("clearImageBtn");
  clearBtn.style.display = user.avatarImage ? "block" : "none";
}

function renderEmojiGrid() {
  const grid = document.getElementById("emojiGrid");
  grid.innerHTML = CB_EMOJIS.map(e => `<button class="emoji-cell" data-emoji="${e}">${e}</button>`).join("");
  grid.querySelectorAll(".emoji-cell").forEach(cell => {
    cell.addEventListener("click", () => {
      user.avatarEmoji = cell.dataset.emoji;
      delete user.avatarImage;
      renderProfile();
    });
  });
}

function bindProfile() {
  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    user.name = document.getElementById("nameInput").value.trim() || user.name;
    saveUser(user);
    cbRenderNav();
    showToast("Profile saved");
  });

  document.getElementById("avatarUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { alert("Image too large. Max 200KB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      user.avatarImage = ev.target.result;
      renderProfile();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("clearImageBtn").addEventListener("click", () => {
    delete user.avatarImage;
    renderProfile();
  });
}

function renderTheme() {
  const theme = cbGetTheme();
  document.getElementById("themeDarkBtn").classList.toggle("btn-primary", theme === "dark");
  document.getElementById("themeDarkBtn").classList.toggle("btn-outline", theme !== "dark");
  document.getElementById("themeLightBtn").classList.toggle("btn-primary", theme === "light");
  document.getElementById("themeLightBtn").classList.toggle("btn-outline", theme !== "light");
}

function bindTheme() {
  document.getElementById("themeDarkBtn").addEventListener("click", () => { cbSetTheme("dark"); renderTheme(); });
  document.getElementById("themeLightBtn").addEventListener("click", () => { cbSetTheme("light"); renderTheme(); });
}

function renderCashBalance() {
  const w = cbGetWallet(user.email) || { usd: 0 };
  document.getElementById("cashBalance").textContent = "$" + (w.usd || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function bindDepositWithdraw() {
  const errEl = document.getElementById("dwError");
  const showError = (m) => { errEl.textContent = m; errEl.classList.add("show"); };
  const clearError = () => errEl.classList.remove("show");

  document.getElementById("depositBtn").addEventListener("click", () => {
    clearError();
    const amt = parseFloat(document.getElementById("dwAmount").value);
    if (!amt || amt <= 0) return showError("Enter a valid amount.");
    const w = cbGetWallet(user.email) || { usd: 0 };
    w.usd = +(w.usd + amt).toFixed(2);
    cbSaveWallet(user.email, w);
    cbAddTransaction(user.email, { type: "deposit", total: amt });
    cbAddNotification(user.email, { type: "deposit", title: `Deposited $${amt.toFixed(2)}`, body: "Added to your cash balance." });
    document.getElementById("dwAmount").value = "";
    renderCashBalance();
    showToast(`Deposited $${amt.toFixed(2)}`);
  });

  document.getElementById("withdrawBtn").addEventListener("click", () => {
    clearError();
    const amt = parseFloat(document.getElementById("dwAmount").value);
    if (!amt || amt <= 0) return showError("Enter a valid amount.");
    const w = cbGetWallet(user.email) || { usd: 0 };
    if (amt > w.usd) return showError(`Insufficient cash. You have $${w.usd.toFixed(2)}.`);
    w.usd = +(w.usd - amt).toFixed(2);
    cbSaveWallet(user.email, w);
    cbAddTransaction(user.email, { type: "withdraw", total: amt });
    cbAddNotification(user.email, { type: "withdraw", title: `Withdrew $${amt.toFixed(2)}`, body: "Removed from your cash balance." });
    document.getElementById("dwAmount").value = "";
    renderCashBalance();
    showToast(`Withdrew $${amt.toFixed(2)}`);
  });
}

async function loadCoinsForAlerts() {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
    let res = await fetch(url);
    if (!res.ok) res = await fetch(PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error("API error");
    allCoins = await res.json();
    const sel = document.getElementById("alertCoin");
    sel.innerHTML = allCoins.map(c => `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()}) — ${cbFormatPrice(c.current_price)}</option>`).join("");
  } catch (err) {
    console.error(err);
    document.getElementById("alertCoin").innerHTML = `<option value="">Failed to load coins</option>`;
  }
}

function bindAlerts() {
  document.getElementById("addAlertBtn").addEventListener("click", () => {
    const coinId = document.getElementById("alertCoin").value;
    const direction = document.getElementById("alertDirection").value;
    const price = parseFloat(document.getElementById("alertPrice").value);
    if (!coinId || !price || price <= 0) return alert("Choose a coin and enter a valid target price.");
    const coin = allCoins.find(c => c.id === coinId);
    cbAddAlert(user.email, {
      coinId,
      coinName: coin?.name || coinId,
      coinSymbol: coin?.symbol || "",
      coinImage: coin?.image || "",
      direction,
      targetPrice: price
    });
    document.getElementById("alertPrice").value = "";
    renderAlerts();
    showToast("Alert created");
  });
}

function renderAlerts() {
  const list = document.getElementById("alertList");
  const alerts = cbGetAlerts(user.email);
  if (!alerts.length) { list.innerHTML = `<div class="empty"><span class="emoji">🔕</span>No alerts set yet.</div>`; return; }
  list.innerHTML = alerts.map(a => `
    <div class="alert-row">
      <div class="info">
        <div class="title">${a.coinName} ${a.direction} ${cbFormatPrice(a.targetPrice)}</div>
        <div class="sub">${a.triggered ? "Triggered" : "Active"} · created ${new Date(a.createdAt).toLocaleDateString()}</div>
      </div>
      ${a.triggered ? `<span class="triggered">✓ Hit</span>` : ""}
      <button class="remove-btn" data-id="${a.id}">Remove</button>
    </div>`).join("");
  list.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      cbRemoveAlert(user.email, btn.dataset.id);
      renderAlerts();
    });
  });
}

let toastTimer = null;
function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}
