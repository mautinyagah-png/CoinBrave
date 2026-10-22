const API_M = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY_M = "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=24h";
const URL_M = API_M + QUERY_M;
const PROXY_M = "https://api.allorigins.win/raw?url=";

let allCoins = [];
let sortMode = "market_cap";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  bindSearch();
  bindSortTabs();
  cbEnablePullToRefresh(loadMarket);
  renderSkeletons();
  await loadMarket();
});

function renderSkeletons() {
  const s = (w, h, extra) => `<div class="skeleton" style="width:${w};height:${h};${extra||''}"></div>`;
  const row = `<div class="trade-row skeleton-row">${s('18px','18px','border-radius:50%')}${s('28px','28px','border-radius:50%')}<div>${s('100px','12px')}<div style="margin-top:6px">${s('60px','10px')}</div></div><div>${s('70px','12px','margin-left:auto')}</div>${s('100px','28px')}</div>`;
  document.getElementById("marketList").innerHTML = Array(8).fill(row).join("");
}

async function loadMarket() {
  const el = document.getElementById("marketList");
  try {
    let res = await fetch(URL_M);
    if (!res.ok) res = await fetch(PROXY_M + encodeURIComponent(URL_M));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    allCoins = await res.json();
    cbCheckAlerts(allCoins);
    renderMarket();
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="error-box">⚠️ Could not load markets: <b>${err.message}</b></div>`;
  }
}

function renderMarket() {
  const el = document.getElementById("marketList");
  let list = [...allCoins];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }
  if (sortMode === "gainers") list.sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  else if (sortMode === "losers") list.sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));
  else if (sortMode === "volume") list.sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0));

  if (!list.length) { el.innerHTML = `<div class="empty"><span class="emoji">🔍</span>No coins match your search.</div>`; return; }
  el.innerHTML = list.map(marketRowHTML).join("");
  bindMarketRows(el);
}

function sampleSpark(prices, count) {
  if (!prices || prices.length === 0) return [];
  const n = count || 30;
  const step = Math.max(1, Math.floor(prices.length / n));
  return prices.filter((_, i) => i % step === 0);
}

function marketRowHTML(c) {
  const change = c.price_change_percentage_24h ?? 0;
  const cls = change >= 0 ? "up" : "down";
  const arrow = change >= 0 ? "▲" : "▼";
  const fav = cbGetFavorites().includes(c.id);
  const sampled = sampleSpark(c.sparkline_in_7d?.price || [], 30);
  const spark = cbSparkline(sampled, 55, 22, change >= 0);
  return `
    <div class="trade-row" data-id="${c.id}">
      <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${c.id}">★</button>
      <img src="${c.image}" alt="${c.symbol}" />
      <div class="info">
        <div class="name">${c.name}</div>
        <div class="muted" style="font-size:0.78rem">${c.symbol.toUpperCase()}</div>
      </div>
      <div class="sparkline-cell">${spark}</div>
      <div class="price-col">
        <div class="price">${cbFormatPrice(c.current_price)}</div>
        <div class="${cls}" style="font-size:0.8rem">${arrow} ${Math.abs(change).toFixed(2)}%</div>
      </div>
      <div class="trade-actions">
        <button class="btn-buy" data-trade="${c.id}" data-side="buy">Buy</button>
        <button class="btn-sell" data-trade="${c.id}" data-side="sell">Sell</button>
      </div>
    </div>`;
}

function bindMarketRows(container) {
  container.querySelectorAll(".fav-btn").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); cbToggleFavorite(btn.dataset.fav); renderMarket(); }));
  container.querySelectorAll("[data-trade]").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); location.href = `trade.html?coin=${btn.dataset.trade}&side=${btn.dataset.side}`; }));
  container.querySelectorAll(".trade-row[data-id] .info").forEach(info => {
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
  input.addEventListener("input", () => { searchQuery = input.value.trim(); renderMarket(); });
}

function bindSortTabs() {
  document.querySelectorAll(".sort-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sort-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      sortMode = btn.dataset.sort;
      renderMarket();
    });
  });
}
