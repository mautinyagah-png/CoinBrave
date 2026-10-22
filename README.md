# CoinBrave

A polished cryptocurrency trading platform demo — live prices, portfolio tracking, and full trading flow with accounts, wallets, alerts, notifications, rewards, and referral system.

## ✨ Features

### Core
- 🏠 **Home** — portfolio balance card with 24h change and hideable chart (1D/1W/1M/1Y)
- 📊 **Market** — 250+ coins with live prices, sparklines, and sort (Market Cap/Gainers/Losers/Volume)
- 📈 **Coin Detail** — full-page chart (1D/1W/1M/1Y/ALL), stats, and direct Buy/Sell
- 💸 **Trade** — search, live prices, buy/sell with 0.1% fee
- 💰 **Assets** — live portfolio value, 24h change, holdings breakdown

### Accounts & Profile
- 🔐 Sign up / log in with SHA-256 hashed password
- 👤 Profile drawer (tap the CoinBrave logo when logged in)
- 🧑 Custom display name + auto-generated User ID (`CB-XXXXXX`)
- 🎨 Avatar picker — 20 emoji options + custom image upload (max 200KB)
- 🌙 Dark / Light theme toggle

### Extras
- 📜 **Transaction History** — filterable log of buys, sells, deposits, withdrawals
- 🔔 **Notifications** — trade confirmations, alerts, deposits
- 🎯 **Price Alerts** — set above/below targets on any coin; fires when hit
- 🎁 **Rewards Hub** — claim $5 daily (streak tracking)
- 🤝 **Referral** — personal `REF-XXXXXX` code
- 💵 **Deposit / Withdraw** — demo USD in/out

### Polish
- 📱 Mobile-first with bottom navigation (Home/Market/Trade/Assets)
- 🧠 **AI helper** — floating draggable brain icon on every page
- ⚡ **Skeletons** during loading (no more "Loading…" flash)
- 📉 **Sparklines** on Home and Market coin rows (7-day trend)
- 🔄 **Pull-to-refresh** on Home, Market, and Assets
- 🎨 **PWA-ready** — installable on mobile ("Add to Home Screen") with branded icon
- 🛡️ **404 page** redirects to home
- 📄 Privacy + Terms pages

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS |
| Storage | `localStorage` (per-browser) |
| Auth | SHA-256 hash (client-side demo) |
| Price data | CoinGecko Public API |
| Charts | Custom SVG (no dependencies) |
| Hosting | GitHub Pages |

## 🔌 Live Price Data
