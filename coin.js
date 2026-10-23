const params = new URLSearchParams(location.search);
const coinId = params.get("coin");
if (!coinId) location.href = "market.html";

const PROXY = "https://api.allorigins.win/raw?url=";
let coinData = null;
let days = "7";
let sparklinePrices = [];

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  bindBack();
  bindRanges();
  bindFav();
  await loadCoin();
  document.getElementById("coinBuyBtn").href = `trade.html?coin=${coinId}&side=buy`;
  document.getElementById("coinSellBtn").href = `trade.html?coin=${coinId}&side=sell`;
});

function bindBack() {
  const btn = document.getElementById("backBtn");
  if (!btn) return;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (document.referrer && document.referrer.includes(location.host)) history.back();
    else location.href = "market.html";
  });
}

function bindRanges() {
  document.querySelectorAll(".range-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".range-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Map the buttons to CoinGecko's accepted OHLC day values
      const val = btn.dataset.days;
      if (val === "1") days = "1";
      else if (val === "7") days = "7";
      else if (val === "30") days = "30";
      else if (val === "365") days = "365";
      else days = "max";
      
      drawChart();
    });
  });
}

function bindFav() {
  const btn = document.getElementById("coinFavBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const isFav = cbToggleFavorite(coinId);
    btn.textContent = isFav ? "★ In Favorites" : "☆ Add to Favorites";
  });
}

async function loadCoin() {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coinId)}&sparkline=true`;
    let res = await fetch(url);
    if (!res.ok) res = await fetch(PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const arr = await res.json();
    if (!arr.length) throw new Error("Coin not found");
    coinData = arr[0];
    sparklinePrices = coinData.sparkline_in_7d?.price || [];
    cbPushRecent(coinData);
    renderHeader();
    renderPrice();
    renderStats();
    updateFavBtn();
    await drawChart();
  } catch (err) {
    console.error(err);
    document.getElementById("coinHeader").innerHTML = `<div class="error-box">⚠️ ${err.message}</div>`;
  }
}

function updateFavBtn() {
  const btn = document.getElementById("coinFavBtn");
  if (!btn) return;
  const isFav = cbGetFavorites().includes(coinId);
  btn.textContent = isFav ? "★ In Favorites" : "☆ Add to Favorites";
}

function renderHeader() {
  const c = coinData;
  document.getElementById("coinHeader").innerHTML = `
    <img src="${c.image}" alt="${c.symbol}" />
    <div class="name-col">
      <h1>${c.name}</h1>
      <div class="symbol">${c.symbol.toUpperCase()} · Rank #${c.market_cap_rank ?? "—"}</div>
    </div>`;
}

function renderPrice() {
  const c = coinData;
  const chg = c.price_change_percentage_24h ?? 0;
  const cls = chg >= 0 ? "up" : "down";
  const arrow = chg >= 0 ? "▲" : "▼";
  document.getElementById("coinPrice").innerHTML = `
    <div class="big">${cbFormatPrice(c.current_price)}</div>
    <div class="chg ${cls}">${arrow} ${Math.abs(chg).toFixed(2)}% (24h)</div>`;
}

function renderStats() {
  const c = coinData;
  const fmtBig = (n) => {
    if (n == null) return "—";
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    return "$" + n.toLocaleString();
  };
  const stats = [
    ["Market Cap", fmtBig(c.market_cap)],
    ["24h Volume", fmtBig(c.total_volume)],
    ["24h High", cbFormatPrice(c.high_24h)],
    ["24h Low", cbFormatPrice(c.low_24h)],
    ["All-Time High", cbFormatPrice(c.ath)],
    ["Circulating", c.circulating_supply ? c.circulating_supply.toLocaleString() + " " + c.symbol.toUpperCase() : "—"],
    ["Total Supply", c.total_supply ? c.total_supply.toLocaleString() : "—"]
  ];
  document.getElementById("coinStats").innerHTML = stats.map(([l, v]) => `
    <div class="coin-stat"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("");
}

// --- NEW CANDLESTICK ENGINE ---
async function drawChart() {
  const chart = document.getElementById("coinChart");
  const noteEl = document.getElementById("chartNote");
  if (noteEl) noteEl.textContent = "";
  chart.innerHTML = `<text x="200" y="90" text-anchor="middle" fill="var(--text-muted)" font-size="12">Loading chart…</text>`;

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${days}`;
    const cacheKey = `cb_ohlc_${coinId}_${days}`;
    let data = null;
    
    // Check cache first (1 hour)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { const p = JSON.parse(cached); if (Date.now() - p.ts < 3600000) data = p.data; } catch {}
    }

    if (!data) {
      let res = await fetch(url);
      if (!res.ok) res = await fetch(PROXY + encodeURIComponent(url));
      if (!res.ok) throw new Error(`OHLC API ${res.status}`);
      data = await res.json();
      try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data })); } catch {}
    }

    if (!data || data.length < 2) throw new Error("Not enough data");
    renderCandlesticks(chart, data);

  } catch (err) {
    console.warn("Candlestick chart unavailable, falling back to line:", err.message);
    
    // Fallback to the line chart if OHLC fails (rate limit)
    if ((days === "1" || days === "7") && sparklinePrices.length > 1) {
      const prices = days === "1" ? sparklinePrices.slice(-24) : sparklinePrices;
      drawFallbackLine(chart, prices);
      if (noteEl) noteEl.textContent = "Showing 7-day trend — detailed candles rate-limited.";
    } else {
      chart.innerHTML = `<text x="200" y="90" text-anchor="middle" fill="var(--text-muted)" font-size="12">Detailed chart unavailable</text><text x="200" y="108" text-anchor="middle" fill="var(--text-muted)" font-size="10">CoinGecko rate limit hit. Try again in a minute.</text>`;
      if (noteEl) noteEl.textContent = "Rate limit reached. Try switching ranges or reload after 30s.";
    }
  }
}

function renderCandlesticks(chart, data) {
  // data format: [[timestamp, open, high, low, close], ...]
  const W = 400, H = 180, PAD = 10;
  
  // Find overall high and low to scale Y axis
  let maxVal = -Infinity, minVal = Infinity;
  data.forEach(d => {
    if (d[2] > maxVal) maxVal = d[2];
    if (d[3] < minVal) minVal = d[3];
  });
  const range = maxVal - minVal || 1;
  
  // Calculate candle width
  const candleSpacing = W / data.length;
  const candleWidth = Math.max(2, candleSpacing * 0.7); // Body width

  let svgContent = `<defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--up)" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="var(--up)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="var(--border)" stroke-width="1" stroke-dasharray="2 2"/>`;

  data.forEach((d, i) => {
    const [time, open, high, low, close] = d;
    const x = i * candleSpacing + candleSpacing / 2;
    
    // Scale Y coordinates (invert because SVG y=0 is top)
    const yHigh = H - ((high - minVal) / range) * (H - PAD * 2) - PAD;
    const yLow = H - ((low - minVal) / range) * (H - PAD * 2) - PAD;
    const yOpen = H - ((open - minVal) / range) * (H - PAD * 2) - PAD;
    const yClose = H - ((close - minVal) / range) * (H - PAD * 2) - PAD;

    const isUp = close >= open;
    const color = isUp ? "var(--up)" : "var(--down)";
    
    // Draw Wick (vertical line)
    svgContent += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1.5" />`;
    
    // Draw Body (rectangle)
    const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
    const bodyY = Math.min(yClose, yOpen);
    svgContent += `<rect x="${x - candleWidth/2}" y="${bodyY}" width="${candleWidth}" height="${bodyHeight}" fill="${color}" />`;
  });

  chart.innerHTML = svgContent;
  
  // Add Hover Tooltip
  const tooltip = document.getElementById("chartTooltip");
  if (!tooltip) return;
  
  chart.onmousemove = (e) => {
    const rect = chart.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const index = Math.floor(xRatio * data.length);
    
    if (index >= 0 && index < data.length) {
      const d = data[index];
      const [time, open, high, low, close] = d;
      const dateStr = new Date(time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      
      tooltip.innerHTML = `
        <div class="tt-date">${dateStr}</div>
        <div style="font-size:0.75rem;line-height:1.4">
          O: <b>${cbFormatPrice(open)}</b><br>
          H: <b style="color:var(--up)">${cbFormatPrice(high)}</b><br>
          L: <b style="color:var(--down)">${cbFormatPrice(low)}</b><br>
          C: <b>${cbFormatPrice(close)}</b>
        </div>
      `;
      
      const wrap = chart.parentElement;
      const tRect = wrap.getBoundingClientRect();
      let left = e.clientX - tRect.left + 15;
      if (left + 120 > tRect.width) left = e.clientX - tRect.left - 130;
      
      tooltip.style.left = left + "px";
      tooltip.style.top = (e.clientY - tRect.top - 40) + "px";
      tooltip.classList.add("show");
    }
  };
  
  chart.onmouseleave = () => { tooltip.classList.remove("show"); };
}

function drawFallbackLine(chart, values) {
  if (!values || values.length < 2) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 400, H = 180, PAD = 10;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - PAD * 2) - PAD;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const up = values[values.length - 1] >= values[0];
  const color = up ? "var(--up)" : "var(--down)";
  chart.innerHTML = `
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="0,${H} ${pts} ${W},${H}" fill="url(#grad)"/>
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  `;
}
