import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  apiKey: string;
  telegramBotToken?: string;
  telegramChatId?: string;
}

export class ConfigManager {
  private static stateDir = path.join(os.homedir(), '.mobula-sentinel');
  private static statePath = path.join(ConfigManager.stateDir, 'state.json');

  /**
   * Get configuration from environment variables
   */
  static getConfig(): Config {
    const apiKey = process.env.MOBULA_API_KEY;

    if (!apiKey) {
      console.error('\n❌ ERROR: MOBULA_API_KEY not found in environment variables');
      console.error('Get your free API key at: https://admin.mobula.io\n');
      console.error('Then set it using:');
      console.error('  export MOBULA_API_KEY="your_key_here"\n');
      process.exit(1);
    }

    return {
      apiKey,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID,
    };
  }

  /**
   * Ensure state directory exists
   */
  static ensureStateDir(): void {
    if (!fs.existsSync(ConfigManager.stateDir)) {
      fs.mkdirSync(ConfigManager.stateDir, { recursive: true });
    }
  }

  /**
   * Load state from disk
   */
  static loadState<T>(defaultState: T): T {
    ConfigManager.ensureStateDir();

    if (!fs.existsSync(ConfigManager.statePath)) {
      return defaultState;
    }

    try {
      const data = fs.readFileSync(ConfigManager.statePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn('Warning: Could not load state, using default');
      return defaultState;
    }
  }

  /**
   * Save state to disk
   */
  static saveState<T>(state: T): void {
    ConfigManager.ensureStateDir();
    fs.writeFileSync(ConfigManager.statePath, JSON.stringify(state, null, 2));
  }
}
