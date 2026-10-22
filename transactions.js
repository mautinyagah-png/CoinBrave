let currentFilter = "all";
let user = null;

document.addEventListener("DOMContentLoaded", async () => {
  await cbRenderNav();
  if (!(await cbRequireAuth())) return;
  user = await cbCurrentUser();
  document.querySelectorAll("[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });
  await render();
});

async function render() {
  const el = document.getElementById("txList");
  let list = await cbGetTransactions(user.email);
  if (currentFilter !== "all") list = list.filter(t => t.type === currentFilter);

  if (!list.length) {
    el.innerHTML = `<div class="empty"><span class="emoji">📭</span>No transactions yet.</div>`;
    return;
  }

  el.innerHTML = list.map(tx => {
    const iconMap = { buy: "🛒", sell: "💸", deposit: "⬇️", withdraw: "⬆️" };
    const sign = (tx.type === "buy" || tx.type === "withdraw") ? "-" : "+";
    const amountDisplay = `$${(tx.total || 0).toFixed(2)}`;
    const cls = (tx.type === "sell" || tx.type === "deposit") ? "up" : "down";
    const sub = tx.coinSymbol
      ? `${sign}${(tx.amount || 0).toLocaleString()} ${tx.coinSymbol.toUpperCase()} @ ${cbFormatPrice(tx.price)}`
      : (tx.type === "deposit" ? "Added to wallet" : "Removed from wallet");
    return `
      <div class="tx-row">
        <div class="tx-icon ${tx.type}">${iconMap[tx.type] || "•"}</div>
        <div class="tx-info">
          <div class="title">${tx.coinName || (tx.type === "deposit" ? "Deposit" : "Withdrawal")}</div>
          <div class="time">${sub}</div>
          <div class="time">${new Date(tx.timestamp).toLocaleString()}</div>
        </div>
        <div class="tx-amount">
          <div class="usd ${cls}">${sign}${amountDisplay}</div>
        </div>
      </div>`;
  }).join("");
}
