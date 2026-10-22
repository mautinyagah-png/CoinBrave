const API   = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY = "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";
const URL   = API + QUERY;
const PROXY = "https://api.allorigins.win/raw?url=";

async function loadCoins() {
  try {
    let res = await fetch(URL);
    if (!res.ok) {
      console.warn("Direct fetch failed:", res.status, "→ trying proxy…");
      res = await fetch(PROXY + encodeURIComponent(URL));
    }
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const coins = await res.json();
    if (!Array.isArray(coins) || coins.length === 0) throw new Error("Empty response");
    render("top5",   coins.slice(0, 5));
    render("others", coins.slice(5));
  } catch (err) {
    console.error(err);
    const msg = `<div class="error-box">⚠️ Could not load prices: <b>${err.message}</b></div>`;
    document.getElementById("top5").innerHTML   = msg;
    document.getElementById("others").innerHTML = "";
  }
}

function formatPrice(p) {
  if (p == null) return "—";
  if (p >= 1)    return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toFixed(6);
}

function render(id, list) {
  const el = document.getElementById(id);
  el.innerHTML = list.map(c => {
    const change = c.price_change_percentage_24h ?? 0;
    const cls    = change >= 0 ? "up" : "down";
    const arrow  = change >= 0 ? "▲" : "▼";
    return `
      <div class="coin-row">
        <img src="${c.image}" alt="${c.symbol}" />
        <span class="name">${c.name} <span style="color:#848e9c">(${c.symbol.toUpperCase()})</span></span>
        <span class="price">${formatPrice(c.current_price)}</span>
        <span class="${cls}">${arrow} ${Math.abs(change).toFixed(2)}%</span>
      </div>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  cbRenderNav();
  loadCoins();
  setInterval(loadCoins, 60000);
});
