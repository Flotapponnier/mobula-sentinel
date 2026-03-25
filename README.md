# Mobula Sentinel

> Autonomous crypto security guardian for OpenClaw agents

Mobula Sentinel is a production-ready CLI tool that helps you avoid rug pulls, track smart money, and discover safe tokens early. Powered by [Mobula API](https://mobula.io) across 88+ blockchains.

## Features

- **Rug Detection**: Analyze tokens with 14+ security criteria and get a risk score (0-100)
- **Smart Money Tracking**: Monitor whale wallets and get alerted on significant moves
- **Token Scouting**: Auto-discover newly listed tokens that pass safety checks
- **Telegram Alerts**: Optional real-time notifications via Telegram
- **Stateful**: Remembers seen tokens and transactions between restarts
- **Rate Limiting**: Respects API limits with automatic retry logic

## Quick Start

### Installation

```bash
npm install -g mobula-sentinel
```

### Setup

1. Get your free API key at [admin.mobula.io](https://admin.mobula.io)

2. Set environment variable:
```bash
export MOBULA_API_KEY="your_key_here"
```

3. (Optional) Configure Telegram alerts:
```bash
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
```

### Usage

**Check if a token is safe:**
```bash
mobula-sentinel check --address 0x4f3a120E72C76c22ae802D129F599BFDbc31cb81 --blockchain ethereum
```

**Monitor smart money wallets:**
```bash
mobula-sentinel watch --wallets 0xabc...,0xdef... --interval 300
```

**Scout for new safe tokens:**
```bash
mobula-sentinel scout --chains base,solana --min-liquidity 100000 --max-risk 30
```

## Commands

### `check` - Rug Pull Detection

Analyzes a token's security characteristics and calculates a risk score.

```bash
mobula-sentinel check --address <token_address> --blockchain <chain_name> [options]
```

**Options:**
- `--address, -a` (required): Token contract address
- `--blockchain, -b` (required): Blockchain name (ethereum, base, solana, etc.)
- `--json`: Output as JSON

**Risk Scoring:**
- **HIGH RISK (60-100)**: Critical red flags (honeypot, self-destruct, unlocked LP)
- **MODERATE RISK (30-59)**: Some concerns (high fees, concentrated holdings)
- **LOW RISK (0-29)**: Appears safe with standard tokenomics

**Example output:**
```
LOW RISK (score: 18/100)
Token: 0x4f3a120E72C76c22ae802D129F599BFDbc31cb81
Chain: ethereum

Positive points:
  • Not a honeypot
  • Liquidity locked
  • Normal fees (2% buy / 2% sell)
  • Distributed holdings: Top 10 holders have 23%
  • Contract renounced

→ Appears safe, but always verify
```

### `watch` - Smart Money Tracker

Monitors wallet addresses for significant transactions. Only tracks wallets with high win rates or "Smart Money" labels.

```bash
mobula-sentinel watch --wallets <wallet1,wallet2,...> [options]
```

**Options:**
- `--wallets, -w` (required): Comma-separated wallet addresses
- `--interval, -i`: Check interval in seconds (default: 300)
- `--min-amount, -m`: Minimum transaction USD value to alert (default: 10000)
- `--min-winrate, -r`: Minimum win rate % to qualify (default: 60)

**Features:**
- Auto-filters wallets by performance metrics
- Persists state between restarts
- Shows wallet stats (PnL, win rate, best trades)
- Graceful shutdown with Ctrl+C

**Example output:**
```
SMART MONEY MOVEMENT

Wallet: 0xabc123... (Win rate 7d: 73% | Label: Smart Money)

Action: BUY
Token: PEPE
Amount: $45,230
Chain: Ethereum
Tx: 0x789...

Wallet stats:
  • PnL 7d: +$128,000
  • Winning trades: 73%
```

### `scout` - New Token Discovery

Scans blockchains for newly listed tokens and alerts on safe ones only.

```bash
mobula-sentinel scout [options]
```

**Options:**
- `--chains, -c`: Blockchains to monitor (default: "base,ethereum,solana")
- `--min-liquidity, -l`: Minimum liquidity in USD (default: 50000)
- `--max-risk, -r`: Maximum acceptable risk score (default: 40)
- `--interval, -i`: Scan interval in seconds (default: 600)

**Features:**
- Runs security checks on all new tokens
- Filters by liquidity and risk score
- Provides DexScreener links
- Continuous monitoring

**Example output:**
```
NEW SAFE TOKEN DETECTED

Token: $NEWTOKEN
Name: New Token
Chain: Base
Address: 0x123...

Liquidity: $127,000
Volume 1h: $45,000
Risk score: 18/100

Checks passed:
  • Non-honeypot
  • LP locked
  • Normal fees (2% buy / 2% sell)
  • Distributed holdings (top 10: 23%)

DexScreener: https://dexscreener.com/base/0x123...
```

## Security Criteria

The risk scoring algorithm evaluates 14+ security factors:

**Critical Red Flags (+40 points each):**
- Honeypot detection
- Self-destruct function
- Mutable balances

**Major Red Flags (+20 points each):**
- Pausable transfers
- Blacklist functionality
- Mintable supply
- Excessive sell fees (>10%)
- Concentrated holdings (top 10 > 80%)
- Unlocked liquidity

**Minor Red Flags (+10 points each):**
- High buy fees (>5%)
- Moderate concentration (top 10 > 50%)
- Non-renounced contract

## Supported Blockchains

88+ chains including:
- Ethereum, Base, Solana
- BSC, Polygon, Arbitrum, Optimism
- Avalanche, Fantom, Cronos
- And many more...

Full list: [docs.mobula.io/blockchains](https://docs.mobula.io/blockchains)

## Telegram Integration

Enable Telegram alerts by setting environment variables:

```bash
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
```

All commands will automatically send formatted alerts when configured.

## Development

### Build from source

```bash
git clone https://github.com/flotapponnier/mobula-sentinel
cd mobula-sentinel
npm install
npm run build
```

### Run in dev mode

```bash
npm run dev -- check --address 0x... --blockchain ethereum
```

## Rate Limits

- Free tier: 100 requests/minute
- Auto rate-limiting: 1 request/second max
- Automatic retry on 429 errors (60s wait)
- Exponential backoff for server errors

## Data Persistence

State files stored in `~/.mobula-sentinel/`:
- `state.json`: Tracks seen tokens and last transactions
- Automatically saved on shutdown
- Persists between restarts

## OpenClaw Integration

This plugin is designed for OpenClaw agents. Users can interact naturally:

- "Check if this token is safe: 0x... on base"
- "Watch vitalik.eth for big moves"
- "Find new tokens on Solana with high liquidity"

The agent will automatically call the appropriate commands.

## Links

- [Mobula API Docs](https://docs.mobula.io)
- [Get API Key](https://admin.mobula.io)
- [GitHub Repository](https://github.com/flotapponnier/mobula-sentinel)
- [Report Issues](https://github.com/flotapponnier/mobula-sentinel/issues)

## License

MIT License - Free to use and modify

## Contributing

Contributions welcome! Please feel free to submit a Pull Request.

---

Built for the OpenClaw ecosystem | Powered by [Mobula API](https://mobula.io)