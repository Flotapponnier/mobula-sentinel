import axios, { AxiosInstance, AxiosError } from 'axios';

export interface TokenSecurityData {
  isHoneypot?: boolean;
  selfDestruct?: boolean;
  balanceMutable?: boolean;
  transferPausable?: boolean;
  isBlacklisted?: boolean;
  isMintable?: boolean;
  sellFeePercentage?: number;
  buyFeePercentage?: number;
  top10HoldingsPercentage?: number | null;
  locked?: boolean | number | string;
  renounced?: boolean;
  [key: string]: any;
}

export interface WalletAnalysis {
  winRate?: number;
  labels?: string[];
  pnl7d?: number;
  totalTrades?: number;
  profitableTrades?: number;
  [key: string]: any;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount_usd: number;
  amount: number;
  asset?: {
    symbol: string;
    name: string;
  };
  blockchain: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'transfer';
  [key: string]: any;
}

export interface MarketToken {
  name: string;
  symbol: string;
  contracts: string[];
  blockchain: string;
  liquidity?: number;
  volume?: number;
  createdAt?: number;
  price?: number;
  [key: string]: any;
}

export class MobulaAPI {
  private client: AxiosInstance;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second between requests (respects 100 req/min limit)

  constructor(apiKey: string) {
    this.client = axios.create({
      baseURL: 'https://api.mobula.io/api',
      headers: {
        Authorization: apiKey,
      },
      timeout: 10000,
    });
  }

  /**
   * Rate limiter: ensures we don't exceed 1 request per second
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Handle API errors with retry logic
   */
  private async handleRequest<T>(request: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.rateLimit();
        return await request();
      } catch (error) {
        const axiosError = error as AxiosError;

        // Rate limit hit - wait and retry
        if (axiosError.response?.status === 429) {
          console.warn(`⚠️  Rate limit hit, waiting 60s... (attempt ${attempt}/${retries})`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 60000));
            continue;
          }
        }

        // Server error - exponential backoff
        if (axiosError.response?.status && axiosError.response.status >= 500) {
          console.warn(`⚠️  Server error, retrying... (attempt ${attempt}/${retries})`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }
        }

        // If we've exhausted retries or it's a client error, throw
        if (attempt === retries) {
          throw new Error(`API request failed: ${axiosError.message}`);
        }
      }
    }

    throw new Error('Request failed after all retries');
  }

  /**
   * Get token security information
   */
  async getTokenSecurity(blockchain: string, address: string): Promise<TokenSecurityData> {
    return this.handleRequest(async () => {
      const response = await this.client.get('/2/token/security', {
        params: { blockchain, address },
      });
      return response.data.data as TokenSecurityData;
    });
  }

  /**
   * Get wallet trading analysis
   */
  async getWalletAnalysis(wallet: string, period: string = '7d'): Promise<WalletAnalysis> {
    return this.handleRequest(async () => {
      const response = await this.client.get('/1/wallet/analysis', {
        params: { wallet, period },
      });
      return response.data.data as WalletAnalysis;
    });
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(wallet: string, limit: number = 10): Promise<Transaction[]> {
    return this.handleRequest(async () => {
      const response = await this.client.get('/1/wallet/transactions', {
        params: { wallet, limit },
      });
      return response.data.data.transactions as Transaction[];
    });
  }

  /**
   * Query market for new tokens
   */
  async queryMarket(params: {
    sortBy?: string;
    sortOrder?: string;
    limit?: number;
    blockchain?: string;
  }): Promise<MarketToken[]> {
    return this.handleRequest(async () => {
      const response = await this.client.get('/1/all', {
        params: {
          ...params,
          fields: 'name,symbol,contracts,liquidity,createdAt,price'
        }
      });
      return response.data.data as MarketToken[];
    });
  }
}
