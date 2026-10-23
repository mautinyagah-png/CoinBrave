const API   = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY = "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
const URL   = API + QUERY;
const PROXY = "https://api.allorigins.win/raw?url=";

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  if (!cbRequireAuth()) return;
  bindFundsActions();
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
    cbCheckAlerts(market);
  } catch (err) {
    console.error(err);
    document.getElementById("holdings").innerHTML = `<div class="error-box">⚠️ Could not load prices: <b>${err.message}</b></div>`;
    return;
  }

  const byId = Object.fromEntries(market.map(c => [c.id, c]));
  const cash = wallet.usd || 0;
  let total = cash, changeVal = 0, totalCost = 0;
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

  // SAVE THE NEW TOTAL IN HISTORY
  cbSnapshotPortfolio(user.email, total);

  const prev = total - changeVal;
  const pct = prev > 0 ? (changeVal / prev) * 100 : 0;
  const cls = changeVal >= 0 ? "up" : "down";
  const arr = changeVal >= 0 ? "▲" : "▼";

  document.getElementById("totalUsd").textContent = "$" + total.toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.getElementById("totalChange").innerHTML = `<span class="${cls}">${arr} ${Math.abs(pct).toFixed(2)}%</span> in last 24h`;
  document.getElementById("cashUsd").textContent = "$" + cash.toLocaleString(undefined, { maximumFractionDigits: 2 });

  const plEl = document.getElementById("totalPL");
  const plPctEl = document.getElementById("totalPLPct");
  if (totalCost > 0) {
    const pl = total - cash - totalCost;
    const plPct = (pl / totalCost) * 100;
    const plCls = pl >= 0 ? "up" : "down";
    plEl.className = "value " + plCls;
    plEl.textContent = cbFormatSigned(pl);
    plPctEl.innerHTML = `<span class="${plCls}">${pl >= 0 ? "+" : ""}${plPct.toFixed(2)}%</span> · vs. avg cost`;
  } else {
    plEl.textContent = "—";
    plPctEl.textContent = "No cost basis yet";
  }

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
