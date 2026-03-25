# Sources & References

This document lists all the resources, APIs, and documentation used in the development of mobula-sentinel.

## API Documentation

### Mobula API
- **Main Documentation**: [https://docs.mobula.io](https://docs.mobula.io)
- **API Dashboard**: [https://admin.mobula.io](https://admin.mobula.io)
- **Token Security Endpoint**: [https://docs.mobula.io/rest-api-reference/endpoint/token-security-get](https://docs.mobula.io/rest-api-reference/endpoint/token-security-get)
- **Wallet Transactions**: [https://docs.mobula.io/rest-api-reference/endpoint/wallet-transactions](https://docs.mobula.io/rest-api-reference/endpoint/wallet-transactions)
- **Market Data**: [https://docs.mobula.io/rest-api-reference/endpoint/all-crypto-assets](https://docs.mobula.io/rest-api-reference/endpoint/all-crypto-assets)

### Third-Party Services
- **DexScreener**: [https://dexscreener.com](https://dexscreener.com) - Used for token chart links
- **Telegram Bot API**: [https://core.telegram.org/bots/api](https://core.telegram.org/bots/api) - Optional notification system

## Technical Stack

### Core Dependencies
- **Node.js**: Runtime environment (v18+)
- **TypeScript**: Primary programming language
- **Commander.js**: CLI framework - [https://github.com/tj/commander.js](https://github.com/tj/commander.js)
- **Axios**: HTTP client - [https://axios-http.com](https://axios-http.com)
- **Chalk**: Terminal styling - [https://github.com/chalk/chalk](https://github.com/chalk/chalk)
- **node-telegram-bot-api**: Telegram integration - [https://github.com/yagop/node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)

## OpenClaw Platform
- **OpenClaw Documentation**: Platform for AI agent plugins
- **ClawHub**: Plugin distribution marketplace

## Security Research

The risk scoring algorithm is based on common DeFi security best practices:
- **Honeypot Detection**: Prevents exit scams where tokens cannot be sold
- **Liquidity Locks**: Ensures project commitment and prevents rug pulls
- **Holder Concentration Analysis**: Identifies potential price manipulation risks
- **Fee Analysis**: Detects excessive trading fees that trap investors
- **Contract Permissions**: Checks for dangerous functions (mint, pause, blacklist)

## Development Standards
- **Semantic Versioning**: [https://semver.org](https://semver.org)
- **Keep a Changelog**: [https://keepachangelog.com](https://keepachangelog.com)
- **MIT License**: [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)

## Blockchain Coverage
Mobula API supports 88+ blockchains including:
- EVM chains: Ethereum, Base, Arbitrum, Optimism, Polygon, BSC, Avalanche
- Non-EVM: Solana, Bitcoin, Cardano, Polkadot
- Full list: [https://docs.mobula.io/blockchains](https://docs.mobula.io/blockchains)

## Rate Limiting & API Quotas
- Free tier: 100 requests/minute
- Implementation follows API best practices with exponential backoff
- Automatic retry logic for transient errors (429, 5xx)

## Attribution
This project is built for the OpenClaw ecosystem and powered by Mobula API.
All trademarks and service marks are the property of their respective owners.
