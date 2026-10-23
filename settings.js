let user = null;
let allCoins = [];
let avatarEditOpen = false;
const PROXY = "https://api.allorigins.win/raw?url=";

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  if (!cbRequireAuth()) return;
  user = cbCurrentUser();
  renderEmojiGrid();
  renderProfile();
  renderTheme();
  bindProfile();
  bindTheme();
  await loadCoinsForAlerts();
  renderAlerts();
  bindAlerts();
  bindResetWallet();
  bindDeleteAccount();
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
  const hasAvatar = user.avatarEmoji || user.avatarImage;
  const editArea = document.getElementById("avatarEditArea");
  const penExisting = document.querySelector(".avatar-pen");
  if (penExisting) penExisting.remove();
  if (hasAvatar && !avatarEditOpen) {
    const pen = document.createElement("button");
    pen.className = "avatar-pen"; pen.innerHTML = "✏️"; pen.title = "Edit avatar";
    pen.addEventListener("click", () => { avatarEditOpen = true; renderProfile(); });
    document.getElementById("avatarPreview").appendChild(pen);
    editArea.classList.remove("show");
  } else { editArea.classList.add("show"); }
  document.getElementById("clearImageBtn").style.display = user.avatarImage ? "block" : "none";
}

function renderEmojiGrid() {
  const grid = document.getElementById("emojiGrid");
  grid.innerHTML = CB_EMOJIS.map(e => `<button class="emoji-cell" data-emoji="${e}">${e}</button>`).join("");
  grid.querySelectorAll(".emoji-cell").forEach(cell => {
    cell.addEventListener("click", () => {
      user.avatarEmoji = cell.dataset.emoji; delete user.avatarImage; avatarEditOpen = true; renderProfile();
    });
  });
}

function bindProfile() {
  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    user.name = document.getElementById("nameInput").value.trim() || user.name;
    saveUser(user); avatarEditOpen = false; cbRenderNav(); showToast("Profile saved"); renderProfile();
  });
  document.getElementById("avatarUpload").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 200 * 1024) { alert("Image too large. Max 200KB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { user.avatarImage = ev.target.result; avatarEditOpen = true; renderProfile(); };
    reader.readAsDataURL(file);
  });
  document.getElementById("clearImageBtn").addEventListener("click", () => { delete user.avatarImage; renderProfile(); });
}

function renderTheme() {
  const theme = cbGetTheme();
  document.getElementById("themeDarkBtn").className = theme === "dark" ? "btn-primary" : "btn-outline";
  document.getElementById("themeLightBtn").className = theme === "light" ? "btn-primary" : "btn-outline";
}
function bindTheme() {
  document.getElementById("themeDarkBtn").addEventListener("click", () => { cbSetTheme("dark"); renderTheme(); });
  document.getElementById("themeLightBtn").addEventListener("click", () => { cbSetTheme("light"); renderTheme(); });
}

async function loadCoinsForAlerts() {
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
    let res = await fetch(url);
    if (!res.ok) res = await fetch(PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error("API error");
    allCoins = await res.json();
    document.getElementById("alertCoin").innerHTML = allCoins.map(c => `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()}) — ${cbFormatPrice(c.current_price)}</option>`).join("");
  } catch (err) {
    console.error(err);
    document.getElementById("alertCoin").innerHTML = `<option value="">Failed to load</option>`;
  }
}

function bindAlerts() {
  document.getElementById("addAlertBtn").addEventListener("click", () => {
    const coinId = document.getElementById("alertCoin").value;
    const direction = document.getElementById("alertDirection").value;
    const price = parseFloat(document.getElementById("alertPrice").value);
    if (!coinId || !price || price <= 0) return alert("Choose a coin and enter a valid target price.");
    const coin = allCoins.find(c => c.id === coinId);
    cbAddAlert(user.email, { coinId, coinName: coin?.name || coinId, coinSymbol: coin?.symbol || "", direction, targetPrice: price });
    document.getElementById("alertPrice").value = ""; renderAlerts(); showToast("Alert created");
  });
}

function renderAlerts() {
  const list = document.getElementById("alertList");
  const alerts = cbGetAlerts(user.email);
  if (!alerts.length) { list.innerHTML = `<div class="empty"><span class="emoji">🔕</span>No alerts yet.</div>`; return; }
  list.innerHTML = alerts.map(a => `<div class="alert-row"><div class="info"><div class="title">${a.coinName} ${a.direction} ${cbFormatPrice(a.targetPrice)}</div><div class="sub">${a.triggered ? "Triggered" : "Active"} · ${new Date(a.createdAt).toLocaleDateString()}</div></div>${a.triggered ? `<span class="triggered">✓ Hit</span>` : ""}<button class="remove-btn" data-id="${a.id}">Remove</button></div>`).join("");
  list.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => { cbRemoveAlert(user.email, btn.dataset.id); renderAlerts(); });
  });
}

function bindResetWallet() {
  document.getElementById("resetWalletBtn").addEventListener("click", () => {
    if (cbResetWallet(user.email)) { showToast("Wallet reset to $5,000 + starter coins"); setTimeout(() => location.href = "wallet.html", 900); }
  });
}

function bindDeleteAccount() {
  document.getElementById("deleteAccountBtn").addEventListener("click", () => {
    if (cbDeleteAccount(user.email)) location.href = "index.html";
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
