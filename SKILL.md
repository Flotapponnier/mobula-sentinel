---
name: mobula-sentinel
description: >
  Autonomous crypto security guardian. Real-time rug detection,
  smart money wallet tracking, and new token scouting powered
  by Mobula API across 88+ blockchains. Use when user wants to
  check if a token is safe, track whale wallets, or find new
  safe tokens automatically.
version: 1.0.0
author: flotapponnier
license: MIT
env_vars:
  - name: MOBULA_API_KEY
    required: true
    description: "Free Mobula API key — https://admin.mobula.io"
  - name: TELEGRAM_BOT_TOKEN
    required: false
    description: "Telegram bot token for alerts"
  - name: TELEGRAM_CHAT_ID
    required: false
    description: "Telegram chat ID to receive alerts"
install:
  npm: mobula-sentinel
tags: [crypto, security, defi, wallet, rug-detection, smart-money]
---

# mobula-sentinel — Crypto Security Guardian

Autonomous crypto security tool for OpenClaw agents. Detects rug pulls, tracks smart money wallets, and scouts new safe tokens across 88+ blockchains using Mobula API.

## Quick Start (3 steps)

1. Get free API key at https://admin.mobula.io
2. `export MOBULA_API_KEY="your_key_here"`
3. `npm install -g mobula-sentinel`

## Example Prompts

Users can interact with this plugin through natural language:

- "Check if this token is a rug: 0x4f3a... on base"
- "Is this token safe? 0xabc... on ethereum"
- "Start watching these smart money wallets: 0x123, 0x456"
- "Scout for new safe tokens on Solana with min $100k liquidity"
- "Alert me if vitalik.eth makes any big movements"
- "Find new tokens on Base with low risk score"

## Commands

### 1. check - Rug Pull Detection

Analyzes a token's security and calculates a risk score (0-100).

```bash
mobula-sentinel check --address <token_address> --blockchain <chain_name> [--json]
```

**Arguments:**
- `--address` (required): Token contract address
- `--blockchain` (required): Blockchain name (ethereum, base, solana, bsc, polygon, arbitrum, etc.)
- `--json` (optional): Output as JSON for parsing

**Example:**
```bash
mobula-sentinel check --address 0x4f3a120E72C76c22ae802D129F599BFDbc31cb81 --blockchain ethereum
```

**Risk Criteria:**
- 🔴 HIGH RISK (60-100): Critical red flags detected (honeypot, self-destruct, unlocked liquidity)
- 🟡 MODERATE RISK (30-59): Some concerning features (high fees, concentrated holdings)
- 🟢 LOW RISK (0-29): Appears safe with standard tokenomics

**Output includes:**
- Risk score and level
- Red flags (honeypot, fees, holder concentration, LP lock status)
- Positive indicators
- Recommendation

### 2. watch - Smart Money Tracker

Monitors wallet addresses for significant transactions. Only tracks wallets with high win rates or "Smart Money" labels.

```bash
mobula-sentinel watch --wallets <wallet1,wallet2,...> [--interval <seconds>] [--min-amount <usd>] [--min-winrate <percentage>]
```

**Arguments:**
- `--wallets` (required): Comma-separated wallet addresses
- `--interval` (optional): Check interval in seconds (default: 300 = 5min)
- `--min-amount` (optional): Minimum transaction value in USD to alert (default: 10000)
- `--min-winrate` (optional): Minimum win rate % to qualify as smart money (default: 60)

**Example:**
```bash
mobula-sentinel watch --wallets 0xabc...,0xdef... --interval 300 --min-amount 10000
```

**Features:**
- Automatically filters wallets by win rate and labels
- Persists state between restarts (tracks last seen transaction)
- Real-time alerts for significant buys/sells
- Shows wallet stats (PnL, win rate, most profitable tokens)
- Graceful shutdown with Ctrl+C

**State saved in:** `~/.mobula-sentinel/state.json`

### 3. scout - New Token Discovery

Scans blockchains for newly listed tokens and alerts only on safe ones passing security checks.

```bash
mobula-sentinel scout [--chains <chain1,chain2>] [--min-liquidity <usd>] [--max-risk <score>] [--interval <seconds>]
```

**Arguments:**
- `--chains` (optional): Blockchains to monitor (default: "base,ethereum,solana")
- `--min-liquidity` (optional): Minimum liquidity in USD (default: 50000)
- `--max-risk` (optional): Maximum acceptable risk score 0-100 (default: 40)
- `--interval` (optional): Scan interval in seconds (default: 600 = 10min)

**Example:**
```bash
mobula-sentinel scout --chains base,solana --min-liquidity 100000 --max-risk 30
```

**Features:**
- Automatically runs rug checks on all new tokens
- Filters by liquidity and risk score
- Provides DexScreener links
- Tracks seen tokens to avoid duplicates
- Continuous monitoring with configurable intervals

**State saved in:** `~/.mobula-sentinel/state.json`

## Optional: Telegram Alerts

To receive alerts via Telegram, set these environment variables:

```bash
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
```

All commands will automatically send formatted alerts to Telegram when configured.

## Supported Blockchains

88+ chains supported including:
- Ethereum, Base, Solana, BSC, Polygon, Arbitrum, Optimism, Avalanche
- Full list: https://docs.mobula.io/blockchains

## Rate Limits

- Free tier: 100 requests/minute
- The tool automatically rate-limits to 1 request/second
- Handles 429 errors with automatic retry (60s wait)
- Exponential backoff for server errors

## Security

- ✅ Read-only: No trades, no wallet access
- ✅ No private keys ever requested
- ✅ Open source: https://github.com/flotapponnier/mobula-sentinel
- ✅ VirusTotal scan: Benign

## Data Persistence

State files are stored in `~/.mobula-sentinel/`:
- `state.json`: Tracks seen tokens and last transactions for watch mode
- Automatically saved on shutdown (Ctrl+C)
- Persists between restarts

## Error Handling

- Missing API key: Shows clear error with signup link
- Invalid wallet: Skips with warning, continues monitoring
- API errors: Auto-retry with exponential backoff (3 attempts)
- Rate limits: Automatic 60s wait before retry

## Use Cases

1. **Due Diligence**: Check tokens before investing
2. **Copy Trading**: Track successful traders and mirror their moves
3. **Alpha Hunting**: Find new tokens early before they pump
4. **Portfolio Protection**: Monitor your holdings for red flags
5. **Research**: Analyze smart money behavior patterns

## Advanced Usage

### JSON Output (for agent parsing)

```bash
mobula-sentinel check --address 0x... --blockchain ethereum --json
```

Returns structured JSON with full security data and calculated scores.

### Multiple Chains Monitoring

```bash
mobula-sentinel scout --chains ethereum,base,arbitrum,optimism,polygon
```

Scouts across 5 chains simultaneously.

### High-frequency Monitoring

```bash
mobula-sentinel watch --wallets 0x... --interval 60 --min-amount 5000
```

Checks every minute for transactions >= $5k.

## Troubleshooting

**"MOBULA_API_KEY not found"**
- Get free key at https://admin.mobula.io
- Set with: `export MOBULA_API_KEY="your_key"`

**"No wallets meet smart money criteria"**
- Lower `--min-winrate` (default: 60%)
- Check wallet addresses are valid

**"Rate limit hit"**
- Tool automatically waits 60s and retries
- Reduce polling frequency with `--interval`

## Links

- Mobula API Docs: https://docs.mobula.io
- Get API Key: https://admin.mobula.io
- GitHub Repo: https://github.com/flotapponnier/mobula-sentinel
- Report Issues: https://github.com/flotapponnier/mobula-sentinel/issues

## Contributing

Built for OpenClaw ecosystem. PRs welcome!

## License

MIT - Free to use and modify
