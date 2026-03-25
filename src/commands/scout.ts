import { MobulaAPI, MarketToken } from '../api/mobula';
import { Formatter } from '../utils/format';
import { ConfigManager } from '../utils/config';
import { checkCommand } from './check';
import TelegramBot from 'node-telegram-bot-api';

export interface ScoutOptions {
  chains: string[];
  minLiquidity: number;
  maxRisk: number;
  interval: number;
  telegramBotToken?: string;
  telegramChatId?: string;
}

interface ScoutState {
  seenTokens: Set<string>;
}

/**
 * Send alert to Telegram
 */
async function sendTelegramAlert(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  try {
    const bot = new TelegramBot(botToken);
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.warn('⚠️  Failed to send Telegram alert:', (error as Error).message);
  }
}

/**
 * Check if token is safe using the check command logic
 */
async function evaluateTokenSafety(
  address: string,
  blockchain: string,
  api: MobulaAPI
): Promise<{ safe: boolean; score: number; checks: string[] }> {
  try {
    const securityData = await api.getTokenSecurity(blockchain, address);

    let score = 0;
    const checks: string[] = [];

    // Use same scoring logic as check command
    if (securityData.isHoneypot === true) {
      score += 40;
    } else {
      checks.push('Not a honeypot');
    }

    if (securityData.selfDestruct === true) {
      score += 40;
    }

    if (securityData.balanceMutable === true) {
      score += 40;
    }

    if (securityData.transferPausable === true) {
      score += 20;
    }

    if (securityData.isBlacklisted === true) {
      score += 20;
    }

    if (securityData.isMintable === true) {
      score += 20;
    }

    if (securityData.sellFeePercentage !== undefined && securityData.sellFeePercentage > 10) {
      score += 20;
    } else if (securityData.sellFeePercentage !== undefined) {
      checks.push(`Normal fees (${securityData.buyFeePercentage || 0}% buy / ${securityData.sellFeePercentage}% sell)`);
    }

    if (securityData.top10HoldingsPercentage !== undefined && securityData.top10HoldingsPercentage !== null && securityData.top10HoldingsPercentage > 80) {
      score += 20;
    } else if (securityData.top10HoldingsPercentage !== undefined && securityData.top10HoldingsPercentage !== null) {
      checks.push(`Distributed holdings (top 10: ${securityData.top10HoldingsPercentage.toFixed(0)}%)`);
    }

    if (securityData.locked === false || securityData.locked === 0) {
      score += 20;
    } else if (securityData.locked === true || (typeof securityData.locked === 'number' && securityData.locked > 0)) {
      checks.push('LP locked');
    }

    if (securityData.buyFeePercentage !== undefined && securityData.buyFeePercentage > 5) {
      score += 10;
    }

    if (
      securityData.top10HoldingsPercentage !== undefined &&
      securityData.top10HoldingsPercentage !== null &&
      securityData.top10HoldingsPercentage > 50 &&
      securityData.top10HoldingsPercentage <= 80
    ) {
      score += 10;
    }

    if (securityData.renounced === false) {
      score += 10;
    }

    return {
      safe: true,
      score,
      checks,
    };
  } catch (error) {
    console.warn(`⚠️  Error evaluating token ${address}:`, (error as Error).message);
    return {
      safe: false,
      score: 100,
      checks: [],
    };
  }
}

/**
 * Scout for new tokens on a blockchain
 */
async function scoutChain(
  chain: string,
  state: ScoutState,
  options: ScoutOptions,
  api: MobulaAPI
): Promise<void> {
  try {
    console.log(`🔍 Scanning ${chain} for new tokens...`);

    // Fetch latest tokens (simplified - get recent tokens with liquidity)
    const tokens = await api.queryMarket({
      limit: 20,
    });

    let newTokensFound = 0;
    let safeTokensFound = 0;

    for (const token of tokens) {
      // Skip if no contracts
      if (!token.contracts || token.contracts.length === 0) {
        continue;
      }

      const tokenKey = `${chain}:${token.contracts[0]}`;

      // Skip if already seen
      if (state.seenTokens.has(tokenKey)) {
        continue;
      }

      state.seenTokens.add(tokenKey);
      newTokensFound++;

      // Check liquidity
      const liquidity = token.liquidity || 0;
      if (liquidity < options.minLiquidity) {
        console.log(
          `⏭️  Skipping ${token.symbol} (liquidity: $${liquidity.toLocaleString()})`
        );
        continue;
      }

      console.log(`\n🆕 New token detected: ${token.symbol}`);
      console.log(`   Liquidity: $${liquidity.toLocaleString()}`);
      console.log(`   Running safety checks...`);

      // Evaluate token safety
      const safety = await evaluateTokenSafety(token.contracts[0], chain, api);

      if (safety.score > options.maxRisk) {
        console.log(`   ❌ Risk score too high: ${safety.score}/100 (max: ${options.maxRisk})`);
        continue;
      }

      console.log(`   ✅ Safe token found! Risk score: ${safety.score}/100`);
      safeTokensFound++;

      // Format and display alert
      const alertData = {
        name: token.name,
        symbol: token.symbol,
        chain: chain,
        address: token.contracts[0],
        liquidity: liquidity,
        volume1h: token.volume || 0,
        riskScore: safety.score,
        checks: safety.checks,
      };

      const formattedAlert = Formatter.formatTokenDiscovery(alertData);
      console.log(formattedAlert);

      // Send Telegram alert if configured
      if (options.telegramBotToken && options.telegramChatId) {
        const dexScreenerUrl = `https://dexscreener.com/${chain.toLowerCase()}/${token.contracts[0]}`;
        const telegramMessage =
          `🆕 *NEW SAFE TOKEN DETECTED*\n\n` +
          `*Token:* $${token.symbol}\n` +
          `*Name:* ${token.name}\n` +
          `*Chain:* ${chain}\n` +
          `*Address:* \`${token.contracts[0]}\`\n\n` +
          `💧 *Liquidity:* $${liquidity.toLocaleString()}\n` +
          `📈 *Volume 1h:* $${(token.volume || 0).toLocaleString()}\n` +
          `🔒 *Risk Score:* ${safety.score}/100\n\n` +
          `✅ *Checks:* ${safety.checks.join(', ')}\n\n` +
          `[View on DexScreener](${dexScreenerUrl})`;

        await sendTelegramAlert(
          options.telegramBotToken,
          options.telegramChatId,
          telegramMessage
        );
      }
    }

    console.log(
      `\n📊 Scan complete: ${newTokensFound} new tokens, ${safeTokensFound} safe tokens found\n`
    );
  } catch (error) {
    console.warn(`⚠️  Error scouting ${chain}:`, (error as Error).message);
  }
}

/**
 * Scout command: Find new safe tokens
 */
export async function scoutCommand(options: ScoutOptions, api: MobulaAPI): Promise<void> {
  console.log('🔍 Mobula Sentinel - Token Scout\n');
  console.log(`Monitoring chains: ${options.chains.join(', ')}`);
  console.log(`Min liquidity: $${options.minLiquidity.toLocaleString()}`);
  console.log(`Max risk score: ${options.maxRisk}/100`);
  console.log(`Interval: ${options.interval}s\n`);

  // Load previous state
  const savedState = ConfigManager.loadState<{ seenTokens: string[] }>({ seenTokens: [] });
  const state: ScoutState = {
    seenTokens: new Set(savedState.seenTokens),
  };

  console.log(`💾 Loaded ${state.seenTokens.size} previously seen tokens\n`);
  console.log('Press Ctrl+C to stop\n');

  let isRunning = true;

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping token scouting...');
    isRunning = false;

    // Save state
    ConfigManager.saveState({
      seenTokens: Array.from(state.seenTokens),
    });

    console.log('💾 State saved. Goodbye!\n');
    process.exit(0);
  });

  // Main scouting loop
  while (isRunning) {
    for (const chain of options.chains) {
      await scoutChain(chain, state, options, api);
    }

    // Save state after each cycle
    ConfigManager.saveState({
      seenTokens: Array.from(state.seenTokens),
    });

    // Wait for next interval
    console.log(`⏰ Waiting ${options.interval}s until next scan...\n`);
    await new Promise(resolve => setTimeout(resolve, options.interval * 1000));
  }
}
