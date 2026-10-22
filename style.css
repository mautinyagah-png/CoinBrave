* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #0b0e11; color: #eaecef; line-height: 1.5;
  min-height: 100vh;
}
.muted { color: #848e9c; }

/* Topbar */
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; background: #12161c;
  border-bottom: 1px solid #1e2329;
  position: sticky; top: 0; z-index: 20; gap: 16px;
}
.logo {
  display: flex; align-items: center; gap: 8px;
  font-size: 1.25rem; font-weight: 700; color: #f0b90b;
  flex-shrink: 0;
}
.nav { display: flex; gap: 20px; align-items: center; }
.nav a { color: #eaecef; text-decoration: none; font-size: 0.95rem; }
.nav a:hover, .nav a.active { color: #f0b90b; }
.btn-signup {
  background: #f0b90b; color: #0b0e11 !important;
  padding: 8px 16px; border-radius: 6px; font-weight: 600;
}
.user-chip {
  color: #eaecef; font-size: 0.88rem; padding: 6px 12px;
  background: #1a1f27; border-radius: 6px; border: 1px solid #2b3139;
  white-space: nowrap; max-width: 140px;
  overflow: hidden; text-overflow: ellipsis;
}
.topbar-user { display: none; gap: 8px; align-items: center; }

/* Layout */
.container {
  max-width: 1200px; margin: 24px auto;
  padding: 0 16px;
  display: flex; flex-direction: column; gap: 20px;
}
.panel {
  background: #12161c; border: 1px solid #1e2329;
  border-radius: 12px; padding: 20px;
}
.panel h2 { font-size: 1.1rem; margin-bottom: 16px; color: #f0b90b; }
.panel-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 16px;
}
.panel-header h2 { margin-bottom: 0; }
.btn-viewall {
  color: #f0b90b; text-decoration: none;
  font-size: 0.9rem; font-weight: 600;
}
.btn-viewall:hover { text-decoration: underline; }

/* Balance card */
.balance-card {
  background: linear-gradient(135deg, #1a1f27 0%, #12161c 100%);
  border: 1px solid #1e2329; border-radius: 12px;
  padding: 20px; position: relative;
}
.balance-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; gap: 16px;
}
.balance-label {
  font-size: 0.75rem; color: #848e9c;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 8px; font-weight: 600;
}
.balance-value {
  font-size: 2rem; font-weight: 700;
  color: #f0b90b; font-variant-numeric: tabular-nums;
  line-height: 1.1; margin-bottom: 6px;
}
.balance-change { font-size: 0.9rem; }
.balance-toggle {
  background: #0b0e11; border: 1px solid #2b3139;
  color: #848e9c; width: 34px; height: 34px;
  border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0;
}
.balance-toggle:hover { color: #eaecef; border-color: #f0b90b; }
.balance-toggle svg { width: 16px; height: 16px; transition: transform 0.2s; }
.balance-toggle.collapsed svg { transform: rotate(180deg); }

.chart-wrap {
  margin-top: 16px; max-height: 220px;
  overflow: hidden;
  transition: max-height 0.3s, opacity 0.3s, margin 0.3s;
  opacity: 1;
}
.chart-wrap.hidden { max-height: 0; opacity: 0; margin-top: 0; }
.balance-chart { width: 100%; height: 120px; display: block; }
.range-tabs {
  display: flex; gap: 6px; margin-top: 12px;
  justify-content: flex-end;
}
.range-tabs button {
  background: transparent; border: 1px solid #2b3139;
  color: #848e9c; padding: 4px 12px;
  border-radius: 6px; font-size: 0.75rem;
  font-weight: 600; cursor: pointer;
  font-family: inherit; transition: all 0.15s;
}
.range-tabs button.active,
.range-tabs button:hover {
  background: #f0b90b; color: #0b0e11; border-color: #f0b90b;
}

/* Discovery tabs */
.discovery-tabs {
  display: flex; gap: 8px; margin-bottom: 16px;
  overflow-x: auto; padding-bottom: 4px;
  scrollbar-width: none;
}
.discovery-tabs::-webkit-scrollbar { display: none; }
.discovery-tabs button {
  background: #0b0e11; border: 1px solid #2b3139;
  color: #848e9c; padding: 8px 14px;
  border-radius: 8px; font-size: 0.85rem;
  font-weight: 600; cursor: pointer;
  font-family: inherit; white-space: nowrap;
  transition: all 0.15s;
}
.discovery-tabs button.active {
  background: rgba(240,185,11,0.15);
  color: #f0b90b;
  border-color: rgba(240,185,11,0.4);
}
.discovery-tabs button:hover { color: #eaecef; }

/* Coin rows */
.coin-list { display: flex; flex-direction: column; }
.coin-row {
  display: grid;
  grid-template-columns: 24px 32px 1fr auto auto;
  align-items: center; gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid #1e2329;
  transition: background 0.15s;
}
.coin-row:last-child { border-bottom: none; }
.coin-row.clickable { cursor: pointer; }
.coin-row:hover { background: #1a1f27; }
.coin-row img { width: 26px; height: 26px; border-radius: 50%; }
.coin-row .name {
  font-weight: 500; font-size: 0.92rem;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.coin-row .price {
  text-align: right; font-variant-numeric: tabular-nums;
  font-weight: 500; font-size: 0.92rem;
}
.coin-row .up, .coin-row .down {
  text-align: right; font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 72px; font-size: 0.88rem;
}
.fav-btn {
  background: none; border: none;
  color: #2b3139; font-size: 1.1rem;
  cursor: pointer; padding: 2px;
  transition: color 0.15s, transform 0.15s; line-height: 1;
}
.fav-btn:hover { color: #f0b90b; transform: scale(1.15); }
.fav-btn.active { color: #f0b90b; }
.up { color: #0ecb81; }
.down { color: #f6465d; }

/* Trade / Market */
.trade-header {
  display: flex; justify-content: space-between;
  align-items: center; gap: 16px;
  margin-bottom: 16px; flex-wrap: wrap;
}
.trade-header h2 { margin-bottom: 0; }
.search-bar {
  background: #0b0e11; border: 1px solid #2b3139;
  color: #eaecef; padding: 10px 14px;
  border-radius: 8px; font-size: 0.9rem;
  width: 280px; outline: none;
  font-family: inherit; transition: border-color 0.15s;
}
.search-bar:focus { border-color: #f0b90b; }

.trade-row {
  display: grid;
  grid-template-columns: 24px 32px 2fr 1fr auto;
  align-items: center; gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid #1e2329;
  transition: background 0.15s;
}
.trade-row:last-child { border-bottom: none; }
.trade-row:hover { background: #1a1f27; }
.trade-row img { width: 30px; height: 30px; border-radius: 50%; }
.trade-row .info .name { font-weight: 500; font-size: 0.92rem; }
.trade-row .info .amount {
  font-size: 0.78rem; color: #848e9c;
  margin-top: 2px; font-variant-numeric: tabular-nums;
}
.trade-row .price-col { text-align: right; font-variant-numeric: tabular-nums; }
.trade-row .price-col .price { font-weight: 500; font-size: 0.92rem; }
.trade-row .price-col .up,
.trade-row .price-col .down { font-size: 0.8rem; font-weight: 600; }
.trade-actions { display: flex; gap: 6px; }
.btn-buy, .btn-sell {
  padding: 7px 14px; border-radius: 6px;
  font-weight: 600; font-size: 0.8rem;
  cursor: pointer; border: none;
  transition: opacity 0.15s; font-family: inherit;
}
.btn-buy { background: #0ecb81; color: #0b0e11; }
.btn-sell { background: #f6465d; color: #fff; }
.btn-buy:hover, .btn-sell:hover { opacity: 0.88; }
.btn-sell:disabled, .btn-buy:disabled { opacity: 0.35; cursor: not-allowed; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 16px;
}
.modal-overlay.hidden { display: none; }
.modal {
  width: 100%; max-width: 420px;
  background: #12161c; border: 1px solid #1e2329;
  border-radius: 12px; overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #1e2329;
}
.modal-header h3 { font-size: 1.05rem; color: #f0b90b; }
.modal-close {
  background: none; border: none; color: #848e9c;
  font-size: 1.6rem; cursor: pointer; line-height: 1; padding: 0 4px;
}
.modal-close:hover { color: #eaecef; }
.modal-body { padding: 20px; }
.modal-coin-info {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; background: #0b0e11;
  border-radius: 8px; margin-bottom: 16px;
}
.modal-coin-info img { width: 36px; height: 36px; border-radius: 50%; }
.modal-coin-info #modalCoinName { font-weight: 600; }
.modal-footer { padding: 16px 20px; border-top: 1px solid #1e2329; }

/* Forms */
.form-group {
  display: flex; flex-direction: column;
  gap: 6px; margin-bottom: 16px;
}
.form-group label { font-size: 0.85rem; color: #b7bdc6; }
.form-group input {
  background: #0b0e11; border: 1px solid #2b3139;
  color: #eaecef; padding: 12px 14px;
  border-radius: 8px; font-size: 0.95rem;
  font-family: inherit; outline: none;
  transition: border-color 0.15s; width: 100%;
}
.form-group input:focus { border-color: #f0b90b; }
.form-group input[readonly] { background: #0b0e11; color: #848e9c; }
.btn-primary {
  width: 100%; background: #f0b90b; color: #0b0e11;
  border: none; padding: 12px; border-radius: 8px;
  font-size: 1rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s; font-family: inherit;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.form-error {
  color: #f6465d; font-size: 0.85rem;
  margin-bottom: 12px; display: none;
}
.form-error.show { display: block; }

/* Auth pages */
.auth-wrap {
  min-height: calc(100vh - 70px);
  display: flex; align-items: center; justify-content: center;
  padding: 40px 16px;
}
.auth-card {
  width: 100%; max-width: 420px;
  background: #12161c; border: 1px solid #1e2329;
  border-radius: 12px; padding: 32px;
}
.auth-card h1 { font-size: 1.4rem; margin-bottom: 6px; color: #f0b90b; }
.auth-card p.sub { color: #848e9c; margin-bottom: 24px; font-size: 0.9rem; }
.auth-switch {
  text-align: center; margin-top: 20px;
  font-size: 0.9rem; color: #848e9c;
}
.auth-switch a { color: #f0b90b; text-decoration: none; }

/* Wallet / Assets */
.wallet-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  background: linear-gradient(135deg, #1a1f27 0%, #12161c 100%);
  border: 1px solid #1e2329; border-radius: 12px; padding: 20px;
}
.stat-card .label {
  font-size: 0.75rem; color: #848e9c;
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 8px; font-weight: 600;
}
.stat-card .value {
  font-size: 1.5rem; font-weight: 700;
  color: #eaecef; font-variant-numeric: tabular-nums;
}
.stat-card .value.gold { color: #f0b90b; }
.stat-card .sub { font-size: 0.85rem; margin-top: 6px; color: #848e9c; }

.holding-row {
  display: grid;
  grid-template-columns: 32px 2fr 1fr 1fr;
  align-items: center; padding: 14px 8px;
  border-bottom: 1px solid #1e2329; gap: 12px;
}
.holding-row:last-child { border-bottom: none; }
.holding-row img { width: 30px; height: 30px; border-radius: 50%; }
.holding-row .info .name { font-weight: 500; }
.holding-row .info .amount {
  font-size: 0.85rem; color: #848e9c;
  font-variant-numeric: tabular-nums;
}
.holding-row .value { text-align: right; font-variant-numeric: tabular-nums; }
.holding-row .value .usd { font-weight: 600; }
.holding-row .value .price-small { font-size: 0.8rem; color: #848e9c; }

.demo-badge {
  display: inline-block; background: rgba(240,185,11,0.15);
  color: #f0b90b; font-size: 0.7rem;
  padding: 2px 8px; border-radius: 4px;
  margin-left: 8px; font-weight: 600;
}

/* Loading + errors */
.loading { color: #848e9c; padding: 16px 8px; font-size: 0.95rem; }
.error-box {
  color: #f6465d; background: rgba(246,70,93,0.08);
  border: 1px solid rgba(246,70,93,0.3);
  padding: 14px 16px; border-radius: 8px; font-size: 0.9rem;
}

/* Toast */
.toast {
  position: fixed; bottom: 90px; left: 50%;
  transform: translateX(-50%) translateY(120%);
  background: #0ecb81; color: #0b0e11;
  padding: 12px 20px; border-radius: 8px;
  font-weight: 600; font-size: 0.9rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  transition: transform 0.25s ease;
  z-index: 200; max-width: calc(100% - 32px);
}
.toast.show { transform: translateX(-50%) translateY(0); }

/* Bottom nav (hidden by default) */
.bottom-nav { display: none; }

/* Mobile */
@media (max-width: 800px) {
  .topbar { padding: 12px 16px; }
  .topbar .nav { display: none; }
  .topbar-user { display: flex; }
  .topbar-user .btn-signup { padding: 6px 12px !important; font-size: 0.8rem !important; }

  body { padding-bottom: 76px; }

  .bottom-nav {
    display: flex;
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #12161c;
    border-top: 1px solid #1e2329;
    padding: 8px 0;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
    z-index: 50;
    justify-content: space-around;
  }
  .bn-item {
    display: flex; flex-direction: column;
    align-items: center; gap: 3px;
    color: #848e9c; text-decoration: none;
    font-size: 0.68rem; font-weight: 600;
    padding: 6px 8px;
    transition: color 0.15s;
    flex: 1; max-width: 90px;
  }
  .bn-item svg { width: 22px; height: 22px; }
  .bn-item.active { color: #f0b90b; }
  .bn-item:hover { color: #eaecef; }

  .container { margin: 16px auto; gap: 16px; padding: 0 12px; }
  .panel { padding: 16px; }
  .balance-card { padding: 16px; }
  .balance-value { font-size: 1.6rem; }

  .coin-row {
    grid-template-columns: 22px 28px 1fr auto;
    gap: 8px; font-size: 0.88rem;
  }
  .coin-row .price { display: none; }
  .coin-row img { width: 24px; height: 24px; }
  .coin-row .up, .coin-row .down { min-width: 60px; font-size: 0.82rem; }

  .trade-row {
    grid-template-columns: 22px 28px 1fr auto;
    gap: 8px; font-size: 0.88rem;
  }
  .trade-row .price-col { display: none; }
  .btn-buy, .btn-sell { padding: 6px 10px; font-size: 0.75rem; }
  .trade-actions { gap: 4px; }

  .trade-header { flex-direction: column; align-items: stretch; }
  .search-bar { width: 100%; }

  .holding-row {
    grid-template-columns: 28px 1fr 1fr;
    font-size: 0.88rem;
  }
  .holding-row img { width: 26px; height: 26px; }
}

@media (max-width: 400px) {
  .coin-row .up, .coin-row .down { min-width: 52px; font-size: 0.78rem; }
  .btn-buy, .btn-sell { padding: 5px 8px; font-size: 0.72rem; }
}
