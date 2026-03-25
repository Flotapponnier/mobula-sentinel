# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-25

### Added
- Initial release of mobula-sentinel
- `check` command for token rug detection with 14+ security criteria
- `watch` command for real-time smart money wallet tracking
- `scout` command for discovering new safe tokens
- Risk scoring algorithm (0-100 scale) based on honeypot detection, fees, holder concentration, and LP locks
- Support for 88+ blockchains via Mobula API
- Optional Telegram notifications for all commands
- Persistent state management for watch and scout modes
- Automatic rate limiting (1 req/s) with retry logic
- JSON output mode for agent parsing
- Comprehensive error handling with exponential backoff
- CLI built with Commander.js
- TypeScript implementation with full type safety

### Features
- Token security analysis in <3 seconds
- Continuous wallet monitoring with configurable intervals
- Automatic filtering of safe tokens by liquidity and risk score
- State persistence across restarts
- DexScreener link generation for discovered tokens
- Graceful shutdown handling (Ctrl+C)

### Security
- Read-only operations (no wallet access, no private keys)
- No credential storage
- Open source codebase

### Documentation
- Comprehensive README with usage examples
- SKILL.md for OpenClaw agent integration
- Inline code documentation
- Example prompts for natural language interaction
