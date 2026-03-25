import { MobulaAPI, TokenSecurityData } from '../api/mobula';
import { Formatter, SecurityScore } from '../utils/format';
import TelegramBot from 'node-telegram-bot-api';

export interface CheckOptions {
  address: string;
  blockchain: string;
  json?: boolean;
  telegramBotToken?: string;
  telegramChatId?: string;
}

/**
 * Calculate risk score based on security data
 */
function calculateRiskScore(data: TokenSecurityData): SecurityScore {
  let score = 0;
  const redFlags: string[] = [];
  const positives: string[] = [];

  // CRITICAL RED FLAGS (+40 each)
  if (data.isHoneypot === true) {
    score += 40;
    redFlags.push('Honeypot detected');
  } else {
    positives.push('Not a honeypot');
  }

  if (data.selfDestruct === true) {
    score += 40;
    redFlags.push('Self-destruct function present');
  }

  if (data.balanceMutable === true) {
    score += 40;
    redFlags.push('Balance is mutable');
  }

  // MAJOR RED FLAGS (+20 each)
  if (data.transferPausable === true) {
    score += 20;
    redFlags.push('Transfers can be paused');
  } else {
    positives.push('Transfers cannot be paused');
  }

  if (data.isBlacklisted === true) {
    score += 20;
    redFlags.push('Token is blacklisted');
  }

  if (data.isMintable === true) {
    score += 20;
    redFlags.push('Token is mintable');
  } else {
    positives.push('Token is not mintable');
  }

  if (data.sellFeePercentage !== undefined && data.sellFeePercentage > 10) {
    score += 20;
    redFlags.push(`High sell fee: ${data.sellFeePercentage}%`);
  } else if (data.sellFeePercentage !== undefined) {
    positives.push(`Normal sell fee: ${data.sellFeePercentage}%`);
  }

  if (data.top10HoldingsPercentage !== undefined && data.top10HoldingsPercentage !== null && data.top10HoldingsPercentage > 80) {
    score += 20;
    redFlags.push(`Top 10 holders control ${data.top10HoldingsPercentage.toFixed(1)}% of supply`);
  }

  if (data.locked === false || data.locked === 0 || (typeof data.locked === 'string' && parseFloat(data.locked) === 0)) {
    score += 20;
    redFlags.push('Liquidity not locked');
  } else if (data.locked === true || (typeof data.locked === 'number' && data.locked > 0) || (typeof data.locked === 'string' && parseFloat(data.locked) > 0)) {
    positives.push('Liquidity locked');
  }

  // MINOR RED FLAGS (+10 each)
  if (data.buyFeePercentage !== undefined && data.buyFeePercentage > 5) {
    score += 10;
    redFlags.push(`High buy fee: ${data.buyFeePercentage}%`);
  } else if (data.buyFeePercentage !== undefined) {
    positives.push(`Normal buy fee: ${data.buyFeePercentage}%`);
  }

  if (
    data.top10HoldingsPercentage !== undefined &&
    data.top10HoldingsPercentage !== null &&
    data.top10HoldingsPercentage > 50 &&
    data.top10HoldingsPercentage <= 80
  ) {
    score += 10;
    redFlags.push(`Top 10 holders control ${data.top10HoldingsPercentage.toFixed(1)}% of supply`);
  } else if (data.top10HoldingsPercentage !== undefined && data.top10HoldingsPercentage !== null && data.top10HoldingsPercentage <= 50) {
    positives.push(`Distributed holdings: Top 10 holders have ${data.top10HoldingsPercentage.toFixed(1)}%`);
  }

  if (data.renounced === false) {
    score += 10;
    redFlags.push('Contract not renounced');
  } else if (data.renounced === true) {
    positives.push('Contract renounced');
  }

  // Determine risk level and recommendation
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  let recommendation: string;

  if (score >= 60) {
    riskLevel = 'HIGH';
    recommendation = 'NOT RECOMMENDED - High risk of rug pull';
  } else if (score >= 30) {
    riskLevel = 'MODERATE';
    recommendation = 'CAUTION - Do your own research';
  } else {
    riskLevel = 'LOW';
    recommendation = 'Appears safe, but always verify';
  }

  return {
    score,
    riskLevel,
    redFlags,
    positives,
    recommendation,
  };
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
 * Check command: Perform rug check on a token
 */
export async function checkCommand(options: CheckOptions, api: MobulaAPI): Promise<void> {
  try {
    // Fetch security data
    const securityData = await api.getTokenSecurity(options.blockchain, options.address);

    // Calculate risk score
    const result = calculateRiskScore(securityData);

    // Output result
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            address: options.address,
            blockchain: options.blockchain,
            ...result,
            rawData: securityData,
          },
          null,
          2
        )
      );
    } else {
      const formattedOutput = Formatter.formatSecurityCheck(
        options.address,
        options.blockchain,
        result
      );
      console.log(formattedOutput);
    }

    // Send Telegram alert if configured
    if (options.telegramBotToken && options.telegramChatId) {
      const emoji = result.riskLevel === 'HIGH' ? '🔴' : result.riskLevel === 'MODERATE' ? '🟡' : '🟢';
      const telegramMessage = `${emoji} *Token Security Check*\n\n` +
        `*Token:* \`${options.address}\`\n` +
        `*Chain:* ${options.blockchain}\n` +
        `*Risk Score:* ${result.score}/100\n` +
        `*Level:* ${result.riskLevel}\n\n` +
        `*Recommendation:* ${result.recommendation}\n\n` +
        `Red flags: ${result.redFlags.length > 0 ? result.redFlags.join(', ') : 'None'}`;

      await sendTelegramAlert(options.telegramBotToken, options.telegramChatId, telegramMessage);
    }
  } catch (error) {
    console.error('❌ Error checking token:', (error as Error).message);
    process.exit(1);
  }
}
