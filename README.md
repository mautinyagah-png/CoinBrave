# CoinBrave

A cryptocurrency exchange and trading platform where users can create accounts,
manage a wallet, and track live coin prices — with the top 5 coins featured on
the homepage and the full market available in the Trade section.

## ✨ Features

- 🔐 User account creation and login
- 👛 Personal wallet view
- 🏠 Homepage featuring the top 5 coins by market cap
- 📈 Trade section listing all other coins
- 💹 Real-time prices and 24h change (via CoinGecko API)
- 🌙 Dark-mode trading dashboard UI

## 🛠 Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Frontend  | _(HTML/CSS/JS or React — TBD)_ |
| Backend   | _(Node.js/Express — planned)_  |
| Database  | _(PostgreSQL — planned)_       |
| Auth      | _(JWT — planned)_              |
| Price API | CoinGecko Public API           |

## 🚦 Roadmap

- [x] Create repository
- [ ] Live market data (top 5 + trade list)
- [ ] Sign-up / login UI (localStorage prototype)
- [ ] Wallet page
- [ ] Real auth + database
- [ ] Order/trade flow

## 🔌 Price Data

Live prices come from the [CoinGecko API](https://www.coingecko.com/en/api):

```js
GET https://api.coingecko.com/api/v3/coins/markets
  ?vs_currency=usd&order=market_cap_desc&per_page=100&page=1# CoinBrave
A full-stack cryptocurrency exchange platform with user authentication, personal wallets, real-time price tracking via CoinGecko, a homepage featuring the top 5 coins, and a dedicated trading section for all other assets.
