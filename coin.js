// coin.js
const params = new URLSearchParams(location.search);
const coinId = params.get("coin");
if (!coinId) location.href = "market.html";

const PROXY = "https://api.allorigins.win/raw?url=";
let coinData = null;
let days = "7";
let sparklinePrices = [];

document.addEventListener("DOMContentLoaded", async () => {
  cbRenderNav();
  document.getElementById("backBtn").addEventListener("click", (e) => {
    e.preventDefault();
    if (document.referrer) history.back(); else location.href = "market.html";
  });
  document.querySelectorAll(".range-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".range-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      days = btn.dataset.days;
      drawChart();
    });
  });
  await loadCoin();
  document.getElementById("coinBuyBtn").href = `trade.html?coin=${coinId}&side=buy`;
  document.getElementById("coinSellBtn").href = `trade.html?coin=${coinId}&side=sell`;
});

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

    const chg = coinData.price_change_percentage_24h ?? 0;
    const cls = chg >= 0 ? "up" : "down";
    const arrow = chg >= 0 ? "▲" : "▼";

    document.getElementById("coinHeader").innerHTML = `
      <img src="${coinData.image}" alt="${coinData.symbol}" style="width:48px;height:48px;border-radius:50%" />
      <div><h1 style="font-size:1.4rem">${coinData.name}</h1><div class="muted">${coinData.symbol.toUpperCase()} · Rank #${coinData.market_cap_rank ?? "—"}</div></div>
    `;
    document.getElementById("coinPrice").innerHTML = `
      <div class="big" style="font-size:2rem;font-weight:700">${cbFormatPrice(coinData.current_price)}</div>
      <div class="chg ${cls}" style="font-size:1rem;font-weight:600;margin-top:4px">${arrow} ${Math.abs(chg).toFixed(2)}% (24h)</div>
    `;
    await drawChart();
  } catch (err) {
    document.getElementById("coinHeader").innerHTML = `<div class="error-box">⚠️ ${err.message}</div>`;
  }
}

async function drawChart() {
  const chart = document.getElementById("coinChart");
  const noteEl = document.getElementById("chartNote");
  noteEl.textContent = "";
  chart.innerHTML = `<text x="200" y="90" text-anchor="middle" fill="var(--text-muted)" font-size="12">Loading chart…</text>`;

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${days}`;
    let res = await fetch(url);
    if (!res.ok) res = await fetch(PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error(`OHLC API ${res.status}`);
    const data = await res.json();

    if (!data || data.length < 2) throw new Error("Not enough data");
    renderCandlesticks(chart, data);

  } catch (err) {
    if ((days === "1" || days === "7") && sparklinePrices.length > 1) {
      const prices = days === "1" ? sparklinePrices.slice(-24) : sparklinePrices;
      drawFallbackLine(chart, prices);
      noteEl.textContent = "Showing line chart (candlesticks unavailable)";
    } else {
      chart.innerHTML = `<text x="200" y="90" text-anchor="middle" fill="var(--text-muted)" font-size="12">Chart unavailable</text>`;
    }
  }
}

function renderCandlesticks(chart, data) {
  const W = 400, H = 180, PAD = 10;
  let maxVal = -Infinity, minVal = Infinity;
  data.forEach(d => {
    if (d[2] > maxVal) maxVal = d[2];
    if (d[3] < minVal) minVal = d[3];
  });
  const range = maxVal - minVal || 1;
  const candleSpacing = W / data.length;
  const candleWidth = Math.max(2, candleSpacing * 0.7);

  let svgContent = "";
  data.forEach((d, i) => {
    const [time, open, high, low, close] = d;
    const x = i * candleSpacing + candleSpacing / 2;
    const yHigh = H - ((high - minVal) / range) * (H - PAD * 2) - PAD;
    const yLow = H - ((low - minVal) / range) * (H - PAD * 2) - PAD;
    const yOpen = H - ((open - minVal) / range) * (H - PAD * 2) - PAD;
    const yClose = H - ((close - minVal) / range) * (H - PAD * 2) - PAD;

    const isUp = close >= open;
    const color = isUp ? "var(--up)" : "var(--down)";
    
    svgContent += `<line x1="${x}" y1="${yHigh}" x2="${x}" y2="${yLow}" stroke="${color}" stroke-width="1.5" />`;
    const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
    const bodyY = Math.min(yClose, yOpen);
    svgContent += `<rect x="${x - candleWidth/2}" y="${bodyY}" width="${candleWidth}" height="${bodyHeight}" fill="${color}" />`;
  });

  chart.innerHTML = svgContent;
}

function drawFallbackLine(chart, values) {
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const W = 400, H = 180, PAD = 10;
  const pts = values.map((v, i) => `${(i / (values.length - 1) * W).toFixed(1)},${(H - ((v - min) / range) * (H - PAD * 2) - PAD).toFixed(1)}`).join(" ");
  chart.innerHTML = `<polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
}
