const API_TRADE = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY_TRADE = "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
const URL_TRADE = API_TRADE + QUERY_TRADE;
const PROXY_TRADE = "https://api.allorigins.win/raw?url=";
const FEE_RATE = 0.001;

let allCoins = [];
let currentTrade = null;
let currentUser = null;
let orderType = "market";

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  if (!cbRequireAuth()) return;
  currentUser = cbCurrentUser();
  bindModal();
  bindSearch();
  bindPresets();
  bindOrderType();
  await loadAllCoins();
  cbCheckAlerts(allCoins);
  cbCheckLimitOrders(allCoins); // Check orders on load
  startFakeTrades();
});

async function loadAllCoins() {
  const list = document.getElementById("tradeList");
  try {
    let res = await fetch(URL_TRADE);
    if (!res.ok) res = await fetch(PROXY_TRADE + encodeURIComponent(URL_TRADE));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    allCoins = await res.json();
    renderTradeList(allCoins);
    handleQueryParams();
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="error-box">⚠️ Could not load markets: <b>${err.message}</b></div>`;
  }
}

function handleQueryParams() {
  const params = new URLSearchParams(location.search);
  const coinId = params.get("coin");
  const side = params.get("side") === "sell" ? "sell" : "buy";
  if (!coinId) return;
  const coin = allCoins.find(c => c.id === coinId);
  if (!coin) return;
  const row = document.querySelector(`.trade-row[data-id="${coinId}"]`);
  if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
  openModal(coin, side);
}

function renderTradeList(coins) {
  const list = document.getElementById("tradeList");
  const wallet = cbGetWallet(currentUser.email) || { usd: 0 };
  if (!coins.length) { list.innerHTML = `<div class="loading">No coins match your search.</div>`; return; }

  list.innerHTML = coins.map(c => {
    const change = c.price_change_percentage_24h ?? 0;
    const cls = change >= 0 ? "up" : "down";
    const arrow = change >= 0 ? "▲" : "▼";
    const holding = wallet[c.id] || 0;
    const fav = cbGetFavorites().includes(c.id);
    return `
      <div class="trade-row" data-id="${c.id}">
        <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${c.id}">★</button>
        <img src="${c.image}" alt="${c.symbol}" />
        <div class="info">
          <div class="name">${c.name} <span class="muted">(${c.symbol.toUpperCase()})</span></div>
          ${holding > 0 ? `<div class="amount">You hold: ${holding.toLocaleString()} ${c.symbol.toUpperCase()}</div>` : ""}
        </div>
        <div class="price-col">
          <div class="price">${cbFormatPrice(c.current_price)}</div>
          <div class="${cls}">${arrow} ${Math.abs(change).toFixed(2)}%</div>
        </div>
        <div class="trade-actions">
          <button class="btn-buy" data-id="${c.id}" data-side="buy">Buy</button>
          <button class="btn-sell" data-id="${c.id}" data-side="sell" ${holding > 0 ? "" : "disabled"}>Sell</button>
        </div>
      </div>`;
  }).join("");

  list.querySelectorAll(".fav-btn").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); cbToggleFavorite(btn.dataset.fav); renderTradeList(coins); }));
  list.querySelectorAll("button[data-side]").forEach(btn => btn.addEventListener("click", () => {
    const coin = allCoins.find(x => x.id === btn.dataset.id);
    if (coin) openModal(coin, btn.dataset.side);
  }));
  list.querySelectorAll(".trade-row[data-id] .info").forEach(info => {
    info.addEventListener("click", () => {
      const row = info.closest(".trade-row");
      const coin = allCoins.find(c => c.id === row.dataset.id);
      if (coin) cbPushRecent(coin);
      location.href = `coin.html?coin=${row.dataset.id}`;
    });
  });
}

function bindSearch() {
  const input = document.getElementById("searchInput");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return renderTradeList(allCoins);
    renderTradeList(allCoins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)));
  });
}

function bindOrderType() {
  document.querySelectorAll("#orderTypeRow button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#orderTypeRow button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      orderType = btn.dataset.type;
      document.getElementById("limitPriceGroup").style.display = orderType === "limit" ? "block" : "none";
    });
  });
}

function bindPresets() {
  document.querySelectorAll("#presetRow button").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!currentTrade) return;
      const pct = parseInt(btn.dataset.pct, 10) / 100;
      const coin = currentTrade.coin;
      const wallet = cbGetWallet(currentUser.email) || { usd: 0 };
      let amount = 0;
      if (currentTrade.side === "buy") {
        const cashToSpend = wallet.usd * pct;
        const p = orderType === "limit" ? (parseFloat(document.getElementById("modalLimitPrice").value) || coin.current_price) : coin.current_price;
        amount = cashToSpend / (p * (1 + FEE_RATE));
      } else {
        amount = (wallet[coin.id] || 0) * pct;
      }
      document.getElementById("modalAmount").value = amount.toFixed(8);
      recalcTotal();
    });
  });
}

function openModal(coin, side) {
  currentTrade = { coin, side };
  orderType = "market";
  document.getElementById("modalTitle").textContent = `${side === "buy" ? "Buy" : "Sell"} ${coin.symbol.toUpperCase()}`;
  document.getElementById("modalImg").src = coin.image;
  document.getElementById("modalCoinName").textContent = coin.name;
  document.getElementById("modalCoinPrice").textContent = `@ ${cbFormatPrice(coin.current_price)}`;
  document.getElementById("modalSymbol").textContent = coin.symbol.toUpperCase();
  document.getElementById("modalAmount").value = "";
  document.getElementById("modalLimitPrice").value = coin.current_price;
  document.getElementById("modalTotal").value = "$0.00";
  document.getElementById("modalFee").textContent = "0.00";
  document.getElementById("modalError").classList.remove("show");
  
  document.querySelectorAll("#orderTypeRow button").forEach(b => b.classList.remove("active"));
  document.querySelector("#orderTypeRow button[data-type='market']").classList.add("active");
  document.getElementById("limitPriceGroup").style.display = "none";

  const amountInput = document.getElementById("modalAmount");
  if (side === "sell") {
    const wallet = cbGetWallet(currentUser.email) || {};
    amountInput.placeholder = `Max: ${wallet[coin.id] || 0}`;
  } else amountInput.placeholder = "0.00";

  document.getElementById("tradeModal").classList.remove("hidden");
  amountInput.focus();
}

function closeModal() { currentTrade = null; document.getElementById("tradeModal").classList.add("hidden"); }

function bindModal() {
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("tradeModal").addEventListener("click", (e) => { if (e.target.id === "tradeModal") closeModal(); });
  document.getElementById("modalAmount").addEventListener("input", recalcTotal);
  document.getElementById("modalLimitPrice").addEventListener("input", recalcTotal);
  document.getElementById("modalConfirm").addEventListener("click", confirmTrade);
}

function recalcTotal() {
  if (!currentTrade) return;
  const amount = parseFloat(document.getElementById("modalAmount").value) || 0;
  const p = orderType === "limit" ? (parseFloat(document.getElementById("modalLimitPrice").value) || currentTrade.coin.current_price) : currentTrade.coin.current_price;
  const total = amount * p;
  const fee = total * FEE_RATE;
  document.getElementById("modalTotal").value = "$" + total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.getElementById("modalFee").textContent = fee.toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.getElementById("modalError").classList.remove("show");
}

function confirmTrade() {
  if (!currentTrade) return;
  const { coin, side } = currentTrade;
  const amount = parseFloat(document.getElementById("modalAmount").value);
  const errEl = document.getElementById("modalError");
  const showError = (m) => { errEl.textContent = m; errEl.classList.add("show"); };

  if (!amount || amount <= 0 || isNaN(amount)) return showError("Enter a valid amount.");

  if (orderType === "limit") {
    const target = parseFloat(document.getElementById("modalLimitPrice").value);
    if (!target || target <= 0) return showError("Enter a valid target price.");
    
    cbAddLimitOrder(currentUser.email, { coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol, coinImage: coin.image, side, amount, targetPrice: target });
    cbAddNotification(currentUser.email, { type: "trade", title: "Limit Order Placed", body: `${side.toUpperCase()} ${amount} ${coin.symbol.toUpperCase()} @ ${cbFormatPrice(target)}` });
    
    closeModal();
    renderTradeList(allCoins);
    showToast(`Limit ${side.toUpperCase()} set for ${amount} ${coin.symbol.toUpperCase()} at ${cbFormatPrice(target)}`);
    return;
  }

  // Market Order
  const total = amount * coin.current_price;
  const fee = total * FEE_RATE;
  const totalWithFee = total + fee;
  const wallet = cbGetWallet(currentUser.email) || { usd: 0 };

  if (side === "buy") {
    if (totalWithFee > wallet.usd) return showError(`Insufficient USD. You have $${wallet.usd.toFixed(2)}, need $${totalWithFee.toFixed(2)}.`);
    wallet.usd = +(wallet.usd - totalWithFee).toFixed(2);
    wallet[coin.id] = +(((wallet[coin.id] || 0) + amount).toFixed(8));
    cbSaveWallet(currentUser.email, wallet);
    cbUpdateAvgOnBuy(currentUser.email, coin.id, amount, coin.current_price);
  } else {
    const holding = wallet[coin.id] || 0;
    if (amount > holding + 1e-9) return showError(`Insufficient ${coin.symbol.toUpperCase()}. You have ${holding}.`);
    wallet[coin.id] = +((holding - amount).toFixed(8));
    if (wallet[coin.id] <= 0) delete wallet[coin.id];
    wallet.usd = +(wallet.usd + total - fee).toFixed(2);
    cbSaveWallet(currentUser.email, wallet);
    cbUpdateAvgOnSell(currentUser.email, coin.id);
  }

  cbAddTransaction(currentUser.email, { type: side, coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol, coinImage: coin.image, amount, price: coin.current_price, total, fee });
  cbAddNotification(currentUser.email, { type: "trade", title: `${side === "buy" ? "Bought" : "Sold"} ${amount} ${coin.symbol.toUpperCase()}`, body: `@ ${cbFormatPrice(coin.current_price)} · Total $${total.toFixed(2)}` });

  closeModal();
  renderTradeList(allCoins);
  showToast(`${side === "buy" ? "Bought" : "Sold"} ${amount.toLocaleString()} ${coin.symbol.toUpperCase()} for $${total.toFixed(2)}`);
}

// --- FAKE LIVE TRADES ---
function startFakeTrades() {
  setInterval(() => {
    if (!allCoins.length) return;
    const list = document.getElementById("recentTradesList");
    const coin = allCoins[Math.floor(Math.random() * 10)]; // Pick from top 10
    const side = Math.random() > 0.5 ? "buy" : "sell";
    const amount = (Math.random() * 2).toFixed(4);
    const price = coin.current_price * (1 + (Math.random() - 0.5) * 0.001); // Slight price variance
    
    const row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--border)";
    row.innerHTML = `
      <span style="color:var(--${side === "buy" ? "up" : "down"})">${side === "buy" ? "B" : "S"} ${amount} ${coin.symbol.toUpperCase()}</span>
      <span class="muted">$${price.toLocaleString(undefined,{maximumFractionDigits:2})}</span>
    `;
    list.prepend(row);
    if (list.children.length > 15) list.lastElementChild.remove();
  }, 2500);
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}
