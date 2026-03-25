#!/usr/bin/env node

import { Command } from 'commander';
import { MobulaAPI } from './api/mobula';
import { ConfigManager } from './utils/config';
import { checkCommand } from './commands/check';
import { watchCommand } from './commands/watch';
import { scoutCommand } from './commands/scout';

const program = new Command();

program
  .name('mobula-sentinel')
  .description('Autonomous crypto security guardian powered by Mobula API')
  .version('1.0.0');

// Check command
program
  .command('check')
  .description('Perform rug check on a token')
  .requiredOption('-a, --address <address>', 'Token contract address')
  .requiredOption('-b, --blockchain <blockchain>', 'Blockchain name (e.g., ethereum, base, solana)')
  .option('--json', 'Output result as JSON')
  .action(async (options) => {
    const config = ConfigManager.getConfig();
    const api = new MobulaAPI(config.apiKey);

    await checkCommand(
      {
        address: options.address,
        blockchain: options.blockchain,
        json: options.json,
        telegramBotToken: config.telegramBotToken,
        telegramChatId: config.telegramChatId,
      },
      api
    );
  });

// Watch command
program
  .command('watch')
  .description('Monitor smart money wallets for movements')
  .requiredOption('-w, --wallets <wallets>', 'Comma-separated list of wallet addresses')
  .option('-i, --interval <seconds>', 'Check interval in seconds', '300')
  .option('-m, --min-amount <usd>', 'Minimum transaction amount in USD', '10000')
  .option('-r, --min-winrate <percentage>', 'Minimum win rate percentage', '60')
  .action(async (options) => {
    const config = ConfigManager.getConfig();
    const api = new MobulaAPI(config.apiKey);

    const wallets = options.wallets.split(',').map((w: string) => w.trim());

    await watchCommand(
      {
        wallets,
        interval: parseInt(options.interval),
        minAmount: parseFloat(options.minAmount),
        minWinrate: parseFloat(options.minWinrate),
        telegramBotToken: config.telegramBotToken,
        telegramChatId: config.telegramChatId,
      },
      api
    );
  });

// Scout command
program
  .command('scout')
  .description('Scout for new safe tokens on specified blockchains')
  .option('-c, --chains <chains>', 'Comma-separated list of blockchains', 'base,ethereum,solana')
  .option('-l, --min-liquidity <usd>', 'Minimum liquidity in USD', '50000')
  .option('-r, --max-risk <score>', 'Maximum risk score (0-100)', '40')
  .option('-i, --interval <seconds>', 'Scan interval in seconds', '600')
  .action(async (options) => {
    const config = ConfigManager.getConfig();
    const api = new MobulaAPI(config.apiKey);

    const chains = options.chains.split(',').map((c: string) => c.trim());

    await scoutCommand(
      {
        chains,
        minLiquidity: parseFloat(options.minLiquidity),
        maxRisk: parseFloat(options.maxRisk),
        interval: parseInt(options.interval),
        telegramBotToken: config.telegramBotToken,
        telegramChatId: config.telegramChatId,
      },
      api
    );
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
