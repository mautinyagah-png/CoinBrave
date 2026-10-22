const API = "https://api.coingecko.com/api/v3/coins/markets";
const params = "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false";

async function loadCoins() {
  try {
    const res = await fetch(`${API}${params}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const coins = await res.json();

    const top5 = coins.slice(0, 5);
    const others = coins.slice(5);

    render("top5", top5);
    render("others", others);
  } catch (err) {
    console.error(err);
    document.getElementById("top5").innerText = "Failed to load prices.";
  }
}

function render(id, list) {
  const el = document.getElementById(id);
  el.innerHTML = list.map(c => `
    <div class="coin-row">
      <img src="${c.image}" width="24" height="24" alt="${c.symbol}" />
      <span class="name">${c.name} (${c.symbol.toUpperCase()})</span>
      <span class="price">$${c.current_price.toLocaleString()}</span>
      <span class="${c.price_change_percentage_24h >= 0 ? 'up' : 'down'}">
        ${c.price_change_percentage_24h?.toFixed(2)}%
      </span>
    </div>
  `).join("");
}

loadCoins();
setInterval(loadCoins, 60000); // refresh every 60s (respects rate limits)
