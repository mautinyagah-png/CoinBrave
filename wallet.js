const API   = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY = "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false";
const URL   = API + QUERY;
const PROXY = "https://api.allorigins.win/raw?url=";

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  if (!cbRequireAuth()) return;

  const user   = cbCurrentUser();
  const wallet = cbGetWallet(user.email) || { usd: 0 };

  let market = [];
  try {
    let res = await fetch(URL);
    if (!res.ok) res = await fetch(PROXY + encodeURIComponent(URL));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    market = await res.json();
  } catch (err) {
    console.error(err);
    document.getElementById("holdings").innerHTML =
      `<div class="error-box">⚠️ Could not load prices: <b>${err.message}</b></div>`;
    return;
  }

  const byId = Object.fromEntries(market.map(c => [c.id, c]));

  const cash    = wallet.usd || 0;
  let totalUsd  = cash;
  let changeVal = 0;
  let assetRows = [];
  let coinCount = 0;

  for (const [id, amount] of Object.entries(wallet)) {
    if (id === "usd" || !amount) continue;
    const coin = byId[id];
    if (!coin) continue;
    const usdVal = amount * coin.current_price;
    const chg    = usdVal * ((coin.price_change_percentage_24h ?? 0) / 100);
    totalUsd  += usdVal;
    changeVal += chg;
    coinCount++;
    assetRows.push({ coin, amount, usdVal });
  }

  assetRows.sort((a, b) => b.usdVal - a.usdVal);

  const prevTotal  = totalUsd - changeVal;
  const changePct  = prevTotal > 0 ? (changeVal / prevTotal) * 100 : 0;
  const changeCls  = changeVal >= 0 ? "up" : "down";
  const changeArr  = changeVal >= 0 ? "▲" : "▼";

  // Fill stat cards
  document.getElementById("totalUsd").textContent    = "$" + totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.getElementById("totalChange").innerHTML   =
    `<span class="${changeCls}">${changeArr} ${Math.abs(changePct).toFixed(2)}%</span> in last 24h`;
  document.getElementById("cashUsd").textContent     = "$" + cash.toLocaleString(undefined, { maximumFractionDigits: 2 });
  document.getElementById("assetCount").textContent  = coinCount;

  // Render holdings
  const list = document.getElementById("holdings");
  if (assetRows.length === 0) {
    list.innerHTML = `<div class="loading">No coins yet — add some to get started.</div>`;
    return;
  }

  list.innerHTML = assetRows.map(({ coin, amount, usdVal }) => `
    <div class="holding-row">
      <img src="${coin.image}" alt="${coin.symbol}" />
      <div class="info">
        <div class="name">${coin.name} <span style="color:#848e9c">(${coin.symbol.toUpperCase()})</span></div>
        <div class="amount">${amount.toLocaleString()} ${coin.symbol.toUpperCase()}</div>
      </div>
      <div class="value">
        <div class="usd">$${usdVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        <div class="price-small">@ $${coin.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      </div>
      <div class="${coin.price_change_percentage_24h >= 0 ? 'up' : 'down'}" style="text-align:right;font-weight:600">
        ${coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
      </div>
    </div>
  `).join("");
});
