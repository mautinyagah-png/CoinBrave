const API   = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY = "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
const URL   = API + QUERY;
const PROXY = "https://api.allorigins.win/raw?url=";
const DONUT_COLORS = ["#f0b90b","#0ecb81","#f6465d","#3f88f0","#a855f7","#ff7a00","#00b8d4","#e91e63"];

let currentCalendarDate = new Date();
let userPortfolioTotal = 0;
let userCash = 0;
let currentMarketData = [];

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  if (!cbRequireAuth()) return;
  bindFundsActions();
  bindCardToggles();
  bindCalendarEvents();
  cbEnablePullToRefresh(initWallet);
  renderSkeletons();
  await initWallet();
  handleQueryParams();
});

function handleQueryParams() {
  const params = new URLSearchParams(location.search);
  if (params.get("deposit") === "1") setTimeout(() => cbOpenFundsModal("deposit", initWallet), 400);
  else if (params.get("withdraw") === "1") setTimeout(() => cbOpenFundsModal("withdraw", initWallet), 400);
}

function bindFundsActions() {
  document.getElementById("depositBtn").addEventListener("click", () => cbOpenFundsModal("deposit", initWallet));
  document.getElementById("withdrawBtn").addEventListener("click", () => cbOpenFundsModal("withdraw", initWallet));
}

// --- NEW: Card Toggles ---
function bindCardToggles() {
  document.getElementById("cardTotal").addEventListener("click", function(e) {
    if(e.target.tagName === 'BUTTON') return;
    this.classList.toggle("expanded");
  });
  document.getElementById("cardCash").addEventListener("click", function(e) {
    if(e.target.tagName === 'BUTTON') return;
    this.classList.toggle("expanded");
  });
  document.getElementById("cardPL").addEventListener("click", function(e) {
    if(e.target.id === 'openCalendarBtn') return;
    this.classList.toggle("expanded");
  });

  document.getElementById("openCalendarBtn").addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent card from closing
    document.getElementById("calendarModal").classList.remove("hidden");
    renderCalendar();
  });
}

function renderSkeletons() {
  const s = (w, h, extra) => `<div class="skeleton" style="width:${w};height:${h};${extra||''}"></div>`;
  document.getElementById("holdings").innerHTML = Array(4).fill(
    `<div class="holding-row skeleton-row">${s('28px','28px','border-radius:50%')}<div>${s('100px','12px')}<div style="margin-top:6px">${s('60px','10px')}</div></div><div>${s('80px','12px','margin-left:auto')}</div><div>${s('60px','12px','margin-left:auto')}</div></div>`
  ).join("");
}

async function initWallet() {
  const user = cbCurrentUser();
  const wallet = cbGetWallet(user.email) || { usd: 0 };
  const avgPrices = cbGetAvgPrices(user.email);
  let market = [];

  try {
    let res = await fetch(URL);
    if (!res.ok) res = await fetch(PROXY + encodeURIComponent(URL));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    market = await res.json();
    currentMarketData = market; // Save for breakdown
    cbCheckAlerts(market);
  } catch (err) {
    console.error(err);
    document.getElementById("holdings").innerHTML = `<div class="error-box">⚠️ Could not load prices: <b>${err.message}</b></div>`;
    return;
  }

  const byId = Object.fromEntries(market.map(c => [c.id, c]));
  userCash = wallet.usd || 0;
  let total = userCash, changeVal = 0, totalCost = 0;
  const rows = [];
  let coinCount = 0;

  for (const [id, amount] of Object.entries(wallet)) {
    if (id === "usd" || id === "user_id" || id === "updated_at" || !amount) continue;
    const coin = byId[id];
    if (!coin) continue;
    const usd = amount * coin.current_price;
    const chg = usd * ((coin.price_change_percentage_24h ?? 0) / 100);
    const cost = amount * (avgPrices[id] || 0);
    total += usd; changeVal += chg; totalCost += cost; coinCount++;
    rows.push({ coin, amount, usd, cost });
  }
  rows.sort((a, b) => b.usd - a.usd);
  userPortfolioTotal = total;

  cbSnapshotPortfolio(user.email, total);

  const prev = total - changeVal;
  const pct = prev > 0 ? (changeVal / prev) * 100 : 0;
  const cls = changeVal >= 0 ? "up" : "down";
  const arr = changeVal >= 0 ? "▲" : "▼";

  document.getElementById("totalUsd").textContent = "$" + total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.getElementById("totalChange").innerHTML = `<span class="${cls}">${arr} ${Math.abs(pct).toFixed(2)}%</span> in last 24h`;
  document.getElementById("cashUsd").textContent = "$" + userCash.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const plEl = document.getElementById("totalPL");
  const plPctEl = document.getElementById("totalPLPct");
  if (totalCost > 0) {
    const pl = total - userCash - totalCost;
    const plPct = (pl / totalCost) * 100;
    const plCls = pl >= 0 ? "up" : "down";
    plEl.className = "value " + plCls;
    plEl.textContent = cbFormatSigned(pl);
    plPctEl.innerHTML = `<span class="${plCls}">${pl >= 0 ? "+" : ""}${plPct.toFixed(2)}%</span> · vs. avg cost`;
  } else {
    plEl.textContent = "—";
    plPctEl.textContent = "No cost basis yet";
  }

  renderBreakdown(rows);
  renderDonut(rows, userCash);

  const list = document.getElementById("holdings");
  if (rows.length === 0) {
    list.innerHTML = `<div class="empty"><span class="emoji">💰</span>No coins yet.<br><span class="muted" style="font-size:0.85rem"><a href="trade.html">Visit Trade</a> or tap <b>Deposit</b> above.</span></div>`;
    return;
  }

  list.innerHTML = rows.map(({ coin, amount, usd, cost }) => {
    let plHtml = "";
    if (cost > 0) {
      const pl = usd - cost;
      const plPct = (pl / cost) * 100;
      const plCls = pl >= 0 ? "up" : "down";
      plHtml = `<div class="pl ${plCls}">${cbFormatSigned(pl)} (${pl >= 0 ? "+" : ""}${plPct.toFixed(2)}%)</div>`;
    }
    return `
      <div class="holding-row">
        <img src="${coin.image}" alt="${coin.symbol}" />
        <div class="info">
          <div class="name">${coin.name} <span style="color:var(--text-muted)">(${coin.symbol.toUpperCase()})</span></div>
          <div class="amount">${amount.toLocaleString()} ${coin.symbol.toUpperCase()}</div>
          ${plHtml}
        </div>
        <div class="value">
          <div class="usd">$${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <div class="price-small">@ $${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        </div>
        <div class="${coin.price_change_percentage_24h >= 0 ? 'up' : 'down'}" style="text-align:right;font-weight:600">
          ${coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
        </div>
      </div>`;
  }).join("");
}

// --- NEW: Asset Breakdown List ---
function renderBreakdown(rows) {
  const list = document.getElementById("breakdownList");
  let html = `
    <div class="breakdown-row">
      <div class="b-asset"><span style="font-size:1.1rem">💵</span> Cash (USD)</div>
      <div class="b-value">$${userCash.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    </div>`;
  
  rows.forEach(r => {
    html += `
    <div class="breakdown-row">
      <div class="b-asset"><img src="${r.coin.image}" width="16" height="16" style="border-radius:50%" /> ${r.coin.symbol.toUpperCase()}</div>
      <div class="b-value">$${r.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
    </div>`;
  });
  
  list.innerHTML = html;
}

function renderDonut(rows, cash) {
  const panel = document.getElementById("donutPanel");
  const svg = document.getElementById("donutSvg");
  const legend = document.getElementById("donutLegend");
  const total = rows.reduce((a, r) => a + r.usd, 0) + cash;
  if (rows.length === 0 || total <= 0) { panel.style.display = "none"; return; }
  panel.style.display = "";

  const segments = [];
  if (cash > 0) segments.push({ label: "Cash (USD)", usd: cash, color: "#848e9c" });
  rows.forEach((r, i) => segments.push({ label: r.coin.symbol.toUpperCase(), usd: r.usd, color: DONUT_COLORS[i % DONUT_COLORS.length] }));

  let cumulative = 0;
  const R = 40, C = 50, STROKE = 14;
  const circumference = 2 * Math.PI * R;
  svg.innerHTML = segments.map(s => {
    const pct = s.usd / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const offset = -cumulative * circumference;
    cumulative += pct;
    return `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${STROKE}" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${offset}" transform="rotate(-90 ${C} ${C})"/>`;
  }).join("");

  legend.innerHTML = segments.map(s => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div class="legend-label">${s.label}</div>
      <div class="legend-pct">${((s.usd / total) * 100).toFixed(1)}%</div>
    </div>`).join("");
}

// --- NEW: Calendar Logic ---
function bindCalendarEvents() {
  document.getElementById("closeCalendarBtn").addEventListener("click", () => {
    document.getElementById("calendarModal").classList.add("hidden");
  });
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
  });
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("calendarMonthLabel");
  const user = cbCurrentUser();
  
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  label.textContent = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const history = cbGetHistory(user.email);
  const historyMap = {};
  history.forEach(h => historyMap[h.date] = h.value);

  let html = "";
  // Day headers
  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(d => {
    html += `<div class="calendar-header-day">${d}</div>`;
  });

  // Empty slots for first week
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-day empty"></div>`;
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const valToday = historyMap[dateStr];
    
    // Calculate yesterday
    const prevDate = new Date(year, month, day - 1);
    const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
    const valYesterday = historyMap[prevDateStr];

    let dotHtml = "";
    if (valToday !== undefined && valYesterday !== undefined) {
      if (valToday > valYesterday) dotHtml = `<div class="dot-green"></div>`;
      else if (valToday < valYesterday) dotHtml = `<div class="dot-red"></div>`;
      else dotHtml = `<div class="dot-gray"></div>`;
    } else if (valToday !== undefined) {
      dotHtml = `<div class="dot-gray"></div>`; // First day of data
    }

    html += `
      <div class="calendar-day">
        <span>${day}</span>
        ${dotHtml}
      </div>`;
  }

  grid.innerHTML = html;
}
