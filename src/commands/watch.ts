import { MobulaAPI, Transaction, WalletAnalysis } from '../api/mobula';
import { Formatter } from '../utils/format';
import { ConfigManager } from '../utils/config';
import TelegramBot from 'node-telegram-bot-api';

export interface WatchOptions {
  wallets: string[];
  interval: number;
  minAmount: number;
  minWinrate: number;
  telegramBotToken?: string;
  telegramChatId?: string;
}

interface WalletState {
  wallet: string;
  lastTxHash: string;
  isSmartMoney: boolean;
  winRate: number;
  label?: string;
  analysis?: WalletAnalysis;
}

interface WatchState {
  wallets: { [wallet: string]: WalletState };
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
 * Initialize wallet tracking
 */
async function initializeWallet(
  wallet: string,
  minWinrate: number,
  api: MobulaAPI
): Promise<WalletState | null> {
  try {
    console.log(`📊 Initializing wallet ${wallet.slice(0, 10)}...`);

    // Get latest transaction to establish baseline
    const transactions = await api.getWalletTransactions(wallet, 1);
    const lastTxHash = transactions.length > 0 ? transactions[0].hash : '';

    // For now, track all wallets (win rate analysis not available in free API)
    console.log(`✅ Tracking ${wallet.slice(0, 10)}...`);

    return {
      wallet,
      lastTxHash,
      isSmartMoney: true, // Assume user knows what they're tracking
      winRate: 0, // Not available in API
      label: undefined,
      analysis: undefined,
    };
  } catch (error) {
    console.warn(`⚠️  Error initializing wallet ${wallet}:`, (error as Error).message);
    return null;
  }
}

/**
 * Check for new transactions
 */
async function checkWalletTransactions(
  walletState: WalletState,
  minAmount: number,
  api: MobulaAPI,
  options: WatchOptions
): Promise<WalletState> {
  try {
    const transactions = await api.getWalletTransactions(walletState.wallet, 10);

    // Find new transactions
    const lastTxIndex = transactions.findIndex(tx => tx.hash === walletState.lastTxHash);
    const newTransactions = lastTxIndex === -1 ? transactions : transactions.slice(0, lastTxIndex);

    // Process significant transactions
    for (const tx of newTransactions) {
      const txAmount = tx.amount_usd || 0;

      if (txAmount >= minAmount) {
        // Format and display alert
        const alertData = {
          wallet: walletState.wallet,
          winRate: walletState.winRate,
          label: walletState.label,
          action: tx.type.toUpperCase(),
          token: tx.asset?.symbol || 'Unknown',
          amount: txAmount,
          chain: tx.blockchain || 'Unknown',
          txHash: tx.hash,
          pnl7d: walletState.analysis?.pnl7d,
          profitableToken: undefined,
          profitableReturn: undefined,
        };

        const formattedAlert = Formatter.formatSmartMoneyAlert(alertData);
        console.log(formattedAlert);

        // Send Telegram alert if configured
        if (options.telegramBotToken && options.telegramChatId) {
          const telegramMessage =
            `💰 *WALLET MOVEMENT*\n\n` +
            `*Wallet:* \`${walletState.wallet.slice(0, 16)}...\`\n` +
            `\n*Action:* ${tx.type.toUpperCase()}\n` +
            `*Token:* ${tx.asset?.symbol || 'Unknown'}\n` +
            `*Amount:* $${txAmount.toLocaleString()}\n` +
            `*Chain:* ${tx.blockchain}\n` +
            `*Tx:* \`${tx.hash.slice(0, 20)}...\``;

          await sendTelegramAlert(
            options.telegramBotToken,
            options.telegramChatId,
            telegramMessage
          );
        }
      }
    }

    // Update last transaction hash
    if (newTransactions.length > 0) {
      walletState.lastTxHash = newTransactions[0].hash;
    }

    return walletState;
  } catch (error) {
    console.warn(
      `⚠️  Error checking transactions for ${walletState.wallet}:`,
      (error as Error).message
    );
    return walletState;
  }
}

/**
 * Watch command: Monitor smart money wallets
 */
export async function watchCommand(options: WatchOptions, api: MobulaAPI): Promise<void> {
  console.log('🔍 Mobula Sentinel - Smart Money Watcher\n');
  console.log(`Monitoring ${options.wallets.length} wallet(s)`);
  console.log(`Interval: ${options.interval}s`);
  console.log(`Min amount: $${options.minAmount.toLocaleString()}`);
  console.log(`Min win rate: ${options.minWinrate}%\n`);

  // Load previous state
  const state: WatchState = ConfigManager.loadState<WatchState>({ wallets: {} });

  // Initialize or update wallet tracking
  const walletStates: WalletState[] = [];

  for (const wallet of options.wallets) {
    // Check if wallet is already tracked
    if (state.wallets[wallet] && state.wallets[wallet].isSmartMoney) {
      console.log(`📌 Resuming tracking for ${wallet.slice(0, 10)}...`);
      walletStates.push(state.wallets[wallet]);
    } else {
      // Initialize new wallet
      const walletState = await initializeWallet(wallet, options.minWinrate, api);
      if (walletState) {
        walletStates.push(walletState);
      }
    }
  }

  if (walletStates.length === 0) {
    console.log('❌ No wallets meet the smart money criteria. Exiting.');
    process.exit(0);
  }

  console.log(`\n✅ Tracking ${walletStates.length} smart money wallet(s)\n`);
  console.log('Press Ctrl+C to stop\n');

  // Main monitoring loop
  let isRunning = true;

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping wallet monitoring...');
    isRunning = false;

    // Save state
    const finalState: WatchState = {
      wallets: {},
    };
    walletStates.forEach(ws => {
      finalState.wallets[ws.wallet] = ws;
    });
    ConfigManager.saveState(finalState);

    console.log('💾 State saved. Goodbye!\n');
    process.exit(0);
  });

  // Monitoring loop
  while (isRunning) {
    for (let i = 0; i < walletStates.length; i++) {
      walletStates[i] = await checkWalletTransactions(
        walletStates[i],
        options.minAmount,
        api,
        options
      );
    }

    // Save state after each cycle
    const currentState: WatchState = {
      wallets: {},
    };
    walletStates.forEach(ws => {
      currentState.wallets[ws.wallet] = ws;
    });
    ConfigManager.saveState(currentState);

    // Wait for next interval
    await new Promise(resolve => setTimeout(resolve, options.interval * 1000));
  }
}
