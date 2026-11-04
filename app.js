const API   = "https://api.coingecko.com/api/v3/coins/markets";
const QUERY = "?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=24h";
const URL   = API + QUERY;
const PROXY = "https://api.allorigins.win/raw?url=";

let allCoins = [];
let currentTab = "favorites";

document.addEventListener("DOMContentLoaded", () => {
  cbRenderNav();
  bindDiscoveryTabs();
  bindAddFunds();
  loadHomeData();
});

function bindAddFunds() {
  document.getElementById("addFundsBtn").addEventListener("click", () => {
    location.href = "wallet.html?deposit=1";
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function renderGreeting(user) {
  const wrap = document.getElementById("greetingWrap");
  if (!user) { wrap.style.display = "none"; return; }
  wrap.style.display = "";
  const name = user.name || user.email || "Trader";
  const firstName = String(name).split(" ")[0];
  document.getElementById("greeting").innerHTML = `${getGreeting()}, <span class="name">${firstName}</span> 👋`;
  document.getElementById("greetingSub").textContent = "Here's your portfolio today";
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
  const spark = cbSparkline(sampled, 60, 24, change >= 0);
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
  container.querySelectorAll(".coin-row.clickable").forEach(row => row.addEventListener("click", () => {
    location.href = `coin.html?coin=${row.dataset.id}`;
  }));
}

async function renderBalanceCard() {
  try {
    const user = cbCurrentUser();
    const hero = document.getElementById("landingHero");
    const card = document.getElementById("balanceCard");
    renderGreeting(user);
    if (!user) { hero.style.display = ""; card.style.display = "none"; return; }
    hero.style.display = "none"; card.style.display = "";

    const wallet = cbGetWallet(user.email) || { usd: 0 };
    const avgPrices = cbGetAvgPrices(user.email);
    const cash = wallet.usd || 0;
    let total = cash, change24 = 0, totalCost = 0;

    for (const [id, amount] of Object.entries(wallet)) {
      if (id === "usd" || id === "user_id" || id === "updated_at" || !amount) continue;
      const coin = allCoins.find(c => c.id === id);
      if (!coin) continue;
      const usd = amount * coin.current_price;
      total += usd;
      change24 += usd * ((coin.price_change_percentage_24h ?? 0) / 100);
      totalCost += amount * (avgPrices[id] || 0);
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
    } else plEl.innerHTML = "";

  } catch (e) {
    console.error("Balance render failed", e);
  }
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
