import chalk from 'chalk';

export interface SecurityScore {
  score: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  redFlags: string[];
  positives: string[];
  recommendation: string;
}

export class Formatter {
  /**
   * Format security check result for console output
   */
  static formatSecurityCheck(
    address: string,
    blockchain: string,
    result: SecurityScore
  ): string {
    const { score, riskLevel, redFlags, positives, recommendation } = result;

    let output = '\n';

    // Header with risk level
    if (riskLevel === 'HIGH') {
      output += chalk.red.bold(`🔴 HIGH RISK (score: ${score}/100)\n`);
    } else if (riskLevel === 'MODERATE') {
      output += chalk.yellow.bold(`🟡 MODERATE RISK (score: ${score}/100)\n`);
    } else {
      output += chalk.green.bold(`🟢 LOW RISK (score: ${score}/100)\n`);
    }

    output += chalk.gray(`Token: ${address}\n`);
    output += chalk.gray(`Chain: ${blockchain}\n\n`);

    // Red flags
    if (redFlags.length > 0) {
      output += chalk.red.bold('⚠️  Red flags detected:\n');
      redFlags.forEach(flag => {
        output += chalk.red(`  • ${flag}\n`);
      });
      output += '\n';
    }

    // Positives
    if (positives.length > 0) {
      output += chalk.green.bold('✅ Positive points:\n');
      positives.forEach(positive => {
        output += chalk.green(`  • ${positive}\n`);
      });
      output += '\n';
    }

    // Recommendation
    output += chalk.bold(`→ ${recommendation}\n\n`);

    return output;
  }

  /**
   * Format smart money movement alert
   */
  static formatSmartMoneyAlert(data: {
    wallet: string;
    winRate: number;
    label?: string;
    action: string;
    token: string;
    amount: number;
    chain: string;
    txHash: string;
    pnl7d?: number;
    profitableToken?: string;
    profitableReturn?: number;
  }): string {
    let output = '\n';
    output += chalk.yellow.bold('💰 SMART MONEY MOVEMENT\n\n');

    const labelText = data.label ? ` | Label: ${data.label}` : '';
    output += chalk.gray(`Wallet: ${data.wallet.slice(0, 10)}...`);
    output += chalk.cyan(` (Win rate 7d: ${data.winRate}%${labelText})\n\n`);

    output += chalk.bold(`Action: ${data.action}\n`);
    output += chalk.bold(`Token: ${data.token}\n`);
    output += chalk.green(`Amount: $${data.amount.toLocaleString()}\n`);
    output += chalk.gray(`Chain: ${data.chain}\n`);
    output += chalk.gray(`Tx: ${data.txHash.slice(0, 20)}...\n\n`);

    output += chalk.cyan.bold('📊 Wallet stats:\n');
    if (data.pnl7d !== undefined) {
      const pnlColor = data.pnl7d > 0 ? chalk.green : chalk.red;
      output += pnlColor(`  • PnL 7d: ${data.pnl7d > 0 ? '+' : ''}$${data.pnl7d.toLocaleString()}\n`);
    }
    output += chalk.cyan(`  • Winning trades: ${data.winRate}%\n`);
    if (data.profitableToken && data.profitableReturn) {
      output += chalk.green(`  • Most profitable: ${data.profitableToken} (+${data.profitableReturn}%)\n`);
    }

    output += '\n';
    return output;
  }

  /**
   * Format new token discovery alert
   */
  static formatTokenDiscovery(data: {
    name: string;
    symbol: string;
    chain: string;
    address: string;
    liquidity: number;
    volume1h: number;
    riskScore: number;
    checks: string[];
  }): string {
    let output = '\n';
    output += chalk.green.bold('🆕 NEW SAFE TOKEN DETECTED\n\n');

    output += chalk.bold(`Token: $${data.symbol}\n`);
    output += chalk.gray(`Name: ${data.name}\n`);
    output += chalk.gray(`Chain: ${data.chain}\n`);
    output += chalk.gray(`Address: ${data.address}\n\n`);

    output += chalk.cyan(`💧 Liquidity: $${data.liquidity.toLocaleString()}\n`);
    output += chalk.cyan(`📈 Volume 1h: $${data.volume1h.toLocaleString()}\n`);
    output += chalk.green(`🔒 Risk score: ${data.riskScore}/100\n\n`);

    output += chalk.green.bold('✅ Checks passed:\n');
    data.checks.forEach(check => {
      output += chalk.green(`  • ${check}\n`);
    });

    const dexScreenerUrl = `https://dexscreener.com/${data.chain.toLowerCase()}/${data.address}`;
    output += chalk.blue.underline(`\n🔗 DexScreener: ${dexScreenerUrl}\n\n`);

    return output;
  }

  /**
   * Format amount in USD
   */
  static formatUSD(amount: number): string {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
