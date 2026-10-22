const API   = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY = "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=24h";
const URL   = API + QUERY;
const PROXY = "https://api.allorigins.win/raw?url=";

let allCoins = [];
let currentTab = "favorites";
let chartRange = 7;
let chartData = [];

document.addEventListener("DOMContentLoaded", () => {
  cbRenderNav();
  bindBalanceToggle();
  bindRangeTabs();
  bindDiscoveryTabs();
  bindAddFunds();
  cbEnablePullToRefresh(loadHomeData);
  renderSkeletons();
  loadHomeData();
});

function bindAddFunds() {
  document.getElementById("addFundsBtn").addEventListener("click", () => {
    location.href = "wallet.html?deposit=1";
  });
}

function renderSkeletons() {
  const s = (w, h, extra) => `<div class="skeleton" style="width:${w};height:${h};${extra||''}"></div>`;
  const row = `<div class="coin-row skeleton-row">${s('18px','18px','border-radius:50%')}${s('24px','24px','border-radius:50%')}${s('120px','12px')}${s('60px','20px')}${s('70px','12px','margin-left:auto')}${s('50px','12px')}</div>`;
  document.getElementById("top5").innerHTML = Array(5).fill(row).join("");
  document.getElementById("discoveryList").innerHTML = Array(3).fill(row).join("");
}

async function loadHomeData() {
  try {
    let res = await fetch(URL);
    if (!res.ok) res = await fetch(PROXY + encodeURIComponent(URL));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    allCoins = await res.json();
  } catch (err) {
    console.error(err);
    const msg = `<div class="error-box">⚠️ Could not load markets: <b>${err.message}</b></div>`;
    document.getElementById("top5").innerHTML = msg;
    document.getElementById("discoveryList").innerHTML = "";
    return;
  }
  cbCheckAlerts(allCoins);
  renderTop5();
  renderDiscovery();
  await renderBalanceCard();
}

function sampleSpark(prices, count) {
  if (!prices || prices.length === 0) return [];
  const n = count || 30;
  const step = Math.max(1, Math.floor(prices.length / n));
  return prices.filter((_, i) => i % step === 0);
}

function renderTop5() {
  const el = document.getElementById("top5");
  el.innerHTML = allCoins.slice(0, 5).map(coinRowHTML).join("");
  bindCoinRows(el);
}

function renderDiscovery() {
  const el = document.getElementById("discoveryList");
  let list = [];
  if (currentTab === "favorites") {
    const favs = cbGetFavorites();
    list = allCoins.filter(c => favs.includes(c.id));
    if (list.length === 0) {
      el.innerHTML = `<div class="empty"><span class="emoji">⭐</span>No favorites yet.<br><span class="muted" style="font-size:0.85rem">Tap the ★ on any coin.</span></div>`;
      return;
    }
  } else if (currentTab === "gainers") {
    list = [...allCoins].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)).slice(0, 10);
  } else {
    list = [...allCoins].sort((a, b) => (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0)).slice(0, 10);
  }
  el.innerHTML = list.map(coinRowHTML).join("");
  bindCoinRows(el);
}

function coinRowHTML(c) {
  const change = c.price_change_percentage_24h ?? 0;
  const cls = change >= 0 ? "up" : "down";
  const arrow = change >= 0 ? "▲" : "▼";
  const fav = cbGetFavorites().includes(c.id);
  const sampled = sampleSpark(c.sparkline_in_7d?.price || [], 30);
  const spark = cbSparkline ? cbSparkline(sampled, 60, 24, change >= 0) : "";
  return `
    <div class="coin-row clickable" data-id="${c.id}">
      <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${c.id}">★</button>
      <img src="${c.image}" alt="${c.symbol}" />
      <span class="name">${c.name} <span class="muted">(${c.symbol.toUpperCase()})</span></span>
      <span class="sparkline-cell">${spark}</span>
      <span class="price">${cbFormatPrice(c.current_price)}</span>
      <span class="${cls}">${arrow} ${Math.abs(change).toFixed(2)}%</span>
    </div>`;
}

function bindCoinRows(container) {
  container.querySelectorAll(".fav-btn").forEach(btn => btn.addEventListener("click", (e) => { e.stopPropagation(); cbToggleFavorite(btn.dataset.fav); renderDiscovery(); renderTop5(); }));
  container.querySelectorAll(".coin-row.clickable").forEach(row => row.addEventListener("click", () => { location.href = `coin.html?coin=${row.dataset.id}`; }));
}

async function renderBalanceCard() {
  const user = cbCurrentUser();
  const hero = document.getElementById("landingHero");
  const card = document.getElementById("balanceCard");
  if (!user) { hero.style.display = ""; card.style.display = "none"; return; }
  hero.style.display = "none"; card.style.display = "";

  const wallet = cbGetWallet(user.email) || { usd: 0 };
  const avgPrices = cbGetAvgPrices(user.email);
  const cash = wallet.usd || 0;
  let total = cash, change24 = 0, totalCost = 0;
  const holdings = [];

  for (const [id, amount] of Object.entries(wallet)) {
    if (id === "usd" || !amount) continue;
    const coin = allCoins.find(c => c.id === id);
    if (!coin) continue;
    const usd = amount * coin.current_price;
    total += usd;
    change24 += usd * ((coin.price_change_percentage_24h ?? 0) / 100);
    totalCost += amount * (avgPrices[id] || 0);
    holdings.push({ coin, amount });
  }

  cbSnapshotPortfolio(user.email, total);

  document.getElementById("balanceValue").textContent = "$" + total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const prev = total - change24;
  const pct = prev > 0 ? (change24 / prev) * 100 : 0;
  const cls = change24 >= 0 ? "up" : "down";
  const arrow = change24 >= 0 ? "▲" : "▼";
  const sign = change24 >= 0 ? "+" : "-";
  document.getElementById("balanceChange").innerHTML = `<span class="${cls}">${arrow} ${sign}$${Math.abs(change24).toFixed(2)} (${sign}${Math.abs(pct).toFixed(2)}%)</span> <span class="muted">· 24h</span>`;

  const plEl = document.getElementById("balancePL");
  if (totalCost > 0) {
    const pl = total - cash - totalCost;
    const plPct = (pl / totalCost) * 100;
    const plCls = pl >= 0 ? "up" : "down";
    plEl.innerHTML = `<span class="muted">P/L:</span> <span class="${plCls}">${cbFormatSigned(pl)} (${pl >= 0 ? "+" : ""}${plPct.toFixed(2)}%)</span>`;
  } else {
    plEl.innerHTML = "";
  }

  await drawChart(holdings, cash, chartRange);
}

async function drawChart(holdings, cash, days) {
  const chartEl = document.getElementById("balanceChart");
  const tooltip = document.getElementById("chartTooltip");
  if (holdings.length === 0) {
    chartEl.innerHTML = `<text x="200" y="70" text-anchor="middle" fill="var(--text-muted)" font-size="12">Buy some coins to track growth</text>`;
    tooltip.classList.remove("show");
    return;
  }
  chartEl.innerHTML = `<text x="200" y="70" text-anchor="middle" fill="var(--text-muted)" font-size="12">Loading chart…</text>`;

  try {
    const sorted = [...holdings].sort((a, b) => b.amount * b.coin.current_price - a.amount * a.coin.current_price).slice(0, 5);
    const series = await Promise.all(sorted.map(h => fetchHistory(h.coin.id, days)));
    const minLen = Math.min(...series.map(s => s.prices.length));
    if (minLen < 2) throw new Error("Not enough data points");

    const dates = series[0].prices.map(p => p[0]);
    const points = [];
    for (let i = 0; i < minLen; i++) {
      let val = cash;
      for (let j = 0; j < sorted.length; j++) val += sorted[j].amount * series[j].prices[i][1];
      points.push({ date: dates[i], value: val });
    }
    chartData = points;

    const values = points.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) {
      chartEl.innerHTML = `<line x1="0" y1="70" x2="400" y2="70" stroke="var(--text-muted)" stroke-width="2" stroke-dasharray="4 4"/>`;
      return;
    }

    const range = max - min;
    const W = 400, H = 140;
    const scaled = points.map((p, i) => {
      const x = (i / (points.length - 1)) * W;
      const y = H - ((p.value - min) / range) * (H - 20) - 10;
      p._x = x; p._y = y;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    const up = points[points.length - 1].value >= points[0].value;
    const color = up ? "var(--up)" : "var(--down)";

    chartEl.innerHTML = `
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="0,${H} ${scaled} ${W},${H}" fill="url(#chartGrad)"/>
      <polyline points="${scaled}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <line id="chartHoverLine" x1="0" y1="0" x2="0" y2="${H}" stroke="var(--text-muted)" stroke-width="1" stroke-dasharray="3 3" opacity="0"/>
      <circle id="chartHoverDot" r="4" fill="${color}" stroke="var(--bg)" stroke-width="2" opacity="0"/>
    `;

    chartEl.onmousemove = (e) => {
      const rect = chartEl.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      let nearest = chartData[0];
      for (const p of chartData) { if (Math.abs(p._x - x) < Math.abs(nearest._x - x)) nearest = p; }
      if (!nearest) return;
      const line = document.getElementById("chartHoverLine");
      const dot = document.getElementById("chartHoverDot");
      if (line) { line.setAttribute("x1", nearest._x); line.setAttribute("x2", nearest._x); line.setAttribute("opacity", "1"); }
      if (dot) { dot.setAttribute("cx", nearest._x); dot.setAttribute("cy", nearest._y); dot.setAttribute("opacity", "1"); }
      const dateStr = new Date(nearest.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
      tooltip.innerHTML = `<div class="tt-date">${dateStr}</div><div class="tt-value">$${nearest.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>`;
      const wrap = chartEl.parentElement;
      const tRect = wrap.getBoundingClientRect();
      let left = e.clientX - tRect.left + 12;
      if (left + 140 > tRect.width) left = e.clientX - tRect.left - 150;
      tooltip.style.left = left + "px";
      tooltip.style.top = (e.clientY - tRect.top - 40) + "px";
      tooltip.classList.add("show");
    };
    chartEl.onmouseleave = () => {
      tooltip.classList.remove("show");
      const line = document.getElementById("chartHoverLine");
      const dot = document.getElementById("chartHoverDot");
      if (line) line.setAttribute("opacity", "0");
      if (dot) dot.setAttribute("opacity", "0");
    };
  } catch (err) {
    console.error("Chart error:", err);
    chartEl.innerHTML = `<text x="200" y="70" text-anchor="middle" fill="var(--down)" font-size="12">Chart unavailable</text>`;
  }
}

async function fetchHistory(coinId, days) {
  const cacheKey = `cb_chart_${coinId}_${days}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) { try { const p = JSON.parse(cached); if (Date.now() - p.ts < 3600000) return p.data; } catch {} }
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  let res = await fetch(url);
  if (!res.ok) res = await fetch(PROXY + encodeURIComponent(url));
  if (!res.ok) throw new Error(`History API error ${res.status}`);
  const data = await res.json();
  try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data })); } catch {}
  return data;
}

function bindBalanceToggle() {
  const btn = document.getElementById("balanceToggle");
  const chart = document.getElementById("chartWrap");
  if (!btn || !chart) return;
  btn.addEventListener("click", () => { chart.classList.toggle("hidden"); btn.classList.toggle("collapsed"); });
}

function bindRangeTabs() {
  document.querySelectorAll(".range-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".range-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      chartRange = parseInt(btn.dataset.range, 10);
      refreshChart();
    });
  });
}

async function refreshChart() {
  const user = cbCurrentUser();
  if (!user) return;
  const wallet = cbGetWallet(user.email) || { usd: 0 };
  const cash = wallet.usd || 0;
  const holdings = [];
  for (const [id, amount] of Object.entries(wallet)) {
    if (id === "usd" || !amount) continue;
    const coin = allCoins.find(c => c.id === id);
    if (coin) holdings.push({ coin, amount });
  }
  await drawChart(holdings, cash, chartRange);
}

function bindDiscoveryTabs() {
  document.querySelectorAll(".discovery-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".discovery-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      renderDiscovery();
    });
  });
}
