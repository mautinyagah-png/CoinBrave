# CoinBrave

A polished cryptocurrency trading platform demo — live prices, portfolio tracking, and full trading flow with accounts, wallets, alerts, notifications, rewards, and referral system.

## Features

### Core
- Home — portfolio balance card with 24h change and hideable chart (1D/1W/1M/1Y)
- Market — 250+ coins with live prices, sparklines, and sort (Market Cap/Gainers/Losers/Volume)
- Coin Detail — full-page chart (1D/1W/1M/1Y/ALL), stats, and direct Buy/Sell
- Trade — search, live prices, buy/sell with 0.1% fee
- Assets — live portfolio value, 24h change, holdings breakdown

### Accounts & Profile
- Sign up / log in with SHA-256 hashed password
- Profile drawer (tap the CoinBrave logo when logged in)
- Custom display name + auto-generated User ID (CB-XXXXXX)
- Avatar picker — 20 emoji options + custom image upload (max 200KB)
- Dark / Light theme toggle

### Extras
- Transaction History — filterable log of buys, sells, deposits, withdrawals
- Notifications — trade confirmations, alerts, deposits
- Price Alerts — set above/below targets on any coin; fires when hit
- Rewards Hub — claim $5 daily (streak tracking)
- Referral — personal REF-XXXXXX code
- Deposit / Withdraw — demo USD in/out

### Polish
- Mobile-first with bottom navigation (Home/Market/Trade/Assets)
- AI helper — floating draggable brain icon on every page
- Skeletons during loading
- Sparklines on Home and Market coin rows (7-day trend)
- Pull-to-refresh on Home, Market, and Assets
- PWA-ready — installable on mobile with branded icon
- 404 page redirects to home
- Privacy + Terms pages

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS |
| Storage | localStorage (per-browser) |
| Auth | SHA-256 hash (client-side demo) |
| Price data | CoinGecko Public API |
| Charts | Custom SVG (no dependencies) |
| Hosting | GitHub Pages |

## Live Price Data

GET https://api.coingecko.com/api/v3/coins/markets
    ?vs_currency=usd&order=market_cap_desc&per_page=250
    &sparkline=true&price_change_percentage=24h

Falls back to a CORS proxy if CoinGecko rate-limits. Polls every 60 seconds.

## Project Structure

- index.html — Home
- market.html — Full market list
- coin.html — Coin detail page
- trade.html — Trading interface
- wallet.html — Assets / portfolio
- signup.html — Create account
- login.html — Log in
- transactions.html — Transaction history
- notifications.html — Notification center
- settings.html — Profile, theme, deposit/withdraw, alerts
- rewards.html — Daily rewards hub
- referral.html — Referral program
- privacy.html — Privacy policy
- terms.html — Terms of service
- 404.html — Not found page
- favicon.svg — Gold shield B icon
- manifest.json — PWA manifest
- sw.js — Service worker
- auth.js — Shared helpers
- app.js — Home page logic
- market.js — Market page logic
- trade.js — Trade page logic
- wallet.js — Assets page logic

## Roadmap

- [x] Live market data
- [x] Accounts + wallets (per-browser)
- [x] Buy/sell with fees
- [x] Portfolio charts
- [x] Price alerts + notifications
- [x] Mobile-first layout + bottom nav
- [x] PWA installability
- [ ] Real backend (Supabase or Node+Postgres) — accounts across devices
- [ ] Order book / limit orders
- [ ] Email verification + password reset

## Disclaimer

CoinBrave is an educational demo project. It does not execute real trades, hold real funds, or store data on any server you don't control. All account data lives in your browser's localStorage.

Do not use this with real credentials or real crypto.

## License

MIT
