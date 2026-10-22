function formatPrice(p) {
  if (p == null) return "—";
  if (p >= 1000) return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 1)    return "$" + p.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (p >= 0.01) return "$" + p.toFixed(4);
  return "$" + p.toFixed(6);
}

function render(id, list) {
  const el = document.getElementById(id);
  el.innerHTML = list.map(c => {
    const change = c.price_change_percentage_24h;
    const cls = change >= 0 ? "up" : "down";
    const arrow = change >= 0 ? "▲" : "▼";
    return `
      <div class="coin-row">
        <img src="${c.image}" alt="${c.symbol}" />
        <span class="name">${c.name} <span style="color:#848e9c">(${c.symbol.toUpperCase()})</span></span>
        <span class="price">${formatPrice(c.current_price)}</span>
        <span class="${cls}">${arrow} ${Math.abs(change ?? 0).toFixed(2)}%</span>
      </div>
    `;
  }).join("");
}
