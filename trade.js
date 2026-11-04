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
  bindOrderType();
  await loadAllCoins();
  cbCheckAlerts(allCoins);
  cbCheckLimitOrders(allCoins);
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
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="error-box">⚠️ Could not load markets: <b>${err.message}</b></div>`;
  }
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
    return `
      <div class="trade-row" data-id="${c.id}">
        <img src="${c.image}" alt="${c.symbol}" />
        <div class="info">
          <div class="name">${c.name} <span class="muted">(${c.symbol.toUpperCase()})</span></div>
          ${holding > 0 ? `<div class="amount">Hold: ${holding.toLocaleString()}</div>` : ""}
        </div>
        <div class="price-col">
          <div class="price">${cbFormatPrice(c.current_price)}</div>
          <div class="${cls}" style="font-size:0.8rem">${arrow} ${Math.abs(change).toFixed(2)}%</div>
        </div>
        <div class="trade-actions">
          <button class="btn-buy" data-id="${c.id}" data-side="buy" style="background:var(--up); color:#fff; padding:7px 14px; border-radius:6px; border:none; cursor:pointer;">Buy</button>
          <button class="btn-sell" data-id="${c.id}" data-side="sell" ${holding > 0 ? "" : "disabled"} style="background:var(--down); color:#fff; padding:7px 14px; border-radius:6px; border:none; cursor:pointer;">Sell</button>
        </div>
      </div>`;
  }).join("");

  list.querySelectorAll("button[data-side]").forEach(btn => btn.addEventListener("click", () => {
    const coin = allCoins.find(x => x.id === btn.dataset.id);
    if (coin) openModal(coin, btn.dataset.side);
  }));
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
  document.getElementById("modalError").classList.remove("show");
  
  document.querySelectorAll("#orderTypeRow button").forEach(b => b.classList.remove("active"));
  document.querySelector("#orderTypeRow button[data-type='market']").classList.add("active");
  document.getElementById("limitPriceGroup").style.display = "none";

  document.getElementById("tradeModal").classList.remove("hidden");
}

function bindModal() {
  document.getElementById("modalClose").addEventListener("click", () => document.getElementById("tradeModal").classList.add("hidden"));
  document.getElementById("modalAmount").addEventListener("input", recalcTotal);
  document.getElementById("modalLimitPrice").addEventListener("input", recalcTotal);
  document.getElementById("modalConfirm").addEventListener("click", confirmTrade);
}

function recalcTotal() {
  if (!currentTrade) return;
  const amount = parseFloat(document.getElementById("modalAmount").value) || 0;
  const p = orderType === "limit" ? (parseFloat(document.getElementById("modalLimitPrice").value) || currentTrade.coin.current_price) : currentTrade.coin.current_price;
  const total = amount * p;
  document.getElementById("modalTotal").value = "$" + total.toLocaleString(undefined, { maximumFractionDigits: 2 });
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
    
    document.getElementById("tradeModal").classList.add("hidden");
    renderTradeList(allCoins);
    showToast(`Limit ${side.toUpperCase()} set!`);
    return;
  }

  const total = amount * coin.current_price;
  const fee = total * FEE_RATE;
  const totalWithFee = total + fee;
  const wallet = cbGetWallet(currentUser.email) || { usd: 0 };

  if (side === "buy") {
    if (totalWithFee > wallet.usd) return showError(`Insufficient USD.`);
    wallet.usd = +(wallet.usd - totalWithFee).toFixed(2);
    wallet[coin.id] = +(((wallet[coin.id] || 0) + amount).toFixed(8));
    cbSaveWallet(currentUser.email, wallet);
    cbUpdateAvgOnBuy(currentUser.email, coin.id, amount, coin.current_price);
  } else {
    const holding = wallet[coin.id] || 0;
    if (amount > holding) return showError(`Insufficient ${coin.symbol.toUpperCase()}.`);
    wallet[coin.id] = +((holding - amount).toFixed(8));
    if (wallet[coin.id] <= 0) delete wallet[coin.id];
    wallet.usd = +(wallet.usd + total - fee).toFixed(2);
    cbSaveWallet(currentUser.email, wallet);
    cbUpdateAvgOnSell(currentUser.email, coin.id);
  }

  cbAddTransaction(currentUser.email, { type: side, coinId: coin.id, coinName: coin.name, coinSymbol: coin.symbol, coinImage: coin.image, amount, price: coin.current_price, total, fee });
  document.getElementById("tradeModal").classList.add("hidden");
  renderTradeList(allCoins);
  showToast(`Trade successful!`);
}

function startFakeTrades() {
  setInterval(() => {
    if (!allCoins.length) return;
    const list = document.getElementById("recentTradesList");
    const coin = allCoins[Math.floor(Math.random() * 10)];
    const side = Math.random() > 0.5 ? "buy" : "sell";
    const amount = (Math.random() * 2).toFixed(4);
    const price = coin.current_price * (1 + (Math.random() - 0.5) * 0.001);
    
    const row = document.createElement("div");
    row.style.cssText = "display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid var(--border)";
    row.innerHTML = `<span style="color:var(--${side === "buy" ? "up" : "down"})">${side === "buy" ? "B" : "S"} ${amount} ${coin.symbol.toUpperCase()}</span><span class="muted">$${price.toLocaleString(undefined,{maximumFractionDigits:2})}</span>`;
    list.prepend(row);
    if (list.children.length > 10) list.lastElementChild.remove();
  }, 2500);
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.transform = "translateX(-50%) translateY(120%)"; }, 3200);
}
