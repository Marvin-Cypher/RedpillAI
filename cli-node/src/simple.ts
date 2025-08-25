#!/usr/bin/env node
/**
 * Simple version of Redpill CLI - Direct OpenBB integration without backend
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import axios from 'axios';
import { config } from 'dotenv';

// Load .env
config();

interface CryptoPrice {
  symbol: string;
  price: number;
  change_24h: number;
  market_cap?: number;
  volume_24h?: number;
}

class SimpleRedpillCLI {
  private openaiApiKey?: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  async start() {
    console.clear();
    
    const welcome = boxen(
      chalk.green.bold('🚀 Redpill Terminal (Simple)') + '\n' +
      chalk.dim('Direct financial data access') + '\n' +
      chalk.dim('Powered by CoinGecko API'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    );

    console.log(welcome);
    console.log(chalk.dim('Examples: "eth price", "bitcoin", "btc vs eth"\n'));

    while (true) {
      try {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: chalk.green('❯'),
            prefix: ''
          }
        ]);

        if (['exit', 'quit', 'q'].includes(input.toLowerCase())) {
          console.log(chalk.yellow('Goodbye! 👋'));
          break;
        }

        if (input.toLowerCase() === 'clear') {
          console.clear();
          continue;
        }

        await this.processInput(input);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red('Error:'), errorMessage);
      }
    }
  }

  private async processInput(input: string) {
    const lower = input.toLowerCase();
    
    // Extract crypto symbols from input
    const cryptoSymbols = this.extractCryptoSymbols(input);
    
    if (cryptoSymbols.length > 0) {
      await this.showCryptoPrices(cryptoSymbols);
      return;
    }

    // Fallback response
    console.log(chalk.yellow('🤖 I understand you\'re asking about:'), `"${input}"`);
    console.log(chalk.dim('Try: "eth price", "bitcoin", "btc", "ethereum vs bitcoin"'));
    console.log();
  }

  private extractCryptoSymbols(input: string): string[] {
    const cryptoMap: { [key: string]: string } = {
      'btc': 'bitcoin',
      'bitcoin': 'bitcoin',
      'eth': 'ethereum', 
      'ethereum': 'ethereum',
      'ada': 'cardano',
      'cardano': 'cardano',
      'dot': 'polkadot',
      'polkadot': 'polkadot',
      'link': 'chainlink',
      'chainlink': 'chainlink',
      'sol': 'solana',
      'solana': 'solana',
      'matic': 'polygon',
      'polygon': 'polygon',
      'avax': 'avalanche-2',
      'avalanche': 'avalanche-2',
      'atom': 'cosmos',
      'cosmos': 'cosmos',
      'uni': 'uniswap',
      'uniswap': 'uniswap',
      'pha': 'pha',
      'phala': 'pha',
      'phala network': 'pha'
    };

    const found: string[] = [];
    const words = input.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (cryptoMap[word]) {
        found.push(cryptoMap[word]);
      }
    }

    return [...new Set(found)]; // Remove duplicates
  }

  private async showCryptoPrices(symbols: string[]) {
    try {
      console.log(chalk.blue('📊 Fetching crypto prices...\n'));

      const prices = await this.fetchCryptoPrices(symbols);
      
      for (const price of prices) {
        const changeColor = price.change_24h >= 0 ? chalk.green : chalk.red;
        const changeSymbol = price.change_24h >= 0 ? '+' : '';
        
        console.log(chalk.bold(price.symbol.toUpperCase()));
        console.log(`  Price: ${chalk.cyan('$' + price.price.toFixed(2))}`);
        console.log(`  24h Change: ${changeColor(changeSymbol + price.change_24h.toFixed(2) + '%')}`);
        
        if (price.market_cap) {
          console.log(`  Market Cap: ${chalk.dim('$' + this.formatNumber(price.market_cap))}`);
        }
        
        if (price.volume_24h) {
          console.log(`  24h Volume: ${chalk.dim('$' + this.formatNumber(price.volume_24h))}`);
        }
        
        console.log();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red('❌ Failed to fetch crypto prices:'), errorMessage);
      console.log(chalk.dim('Note: This uses CoinGecko API which may have rate limits.'));
      console.log();
    }
  }

  private async fetchCryptoPrices(symbols: string[]): Promise<CryptoPrice[]> {
    const ids = symbols.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'redpill-terminal/1.0.0'
      }
    });

    const data = response.data;
    const prices: CryptoPrice[] = [];

    for (const [id, priceData] of Object.entries(data) as [string, any][]) {
      prices.push({
        symbol: id,
        price: priceData.usd,
        change_24h: priceData.usd_24h_change,
        market_cap: priceData.usd_market_cap,
        volume_24h: priceData.usd_24h_vol
      });
    }

    return prices;
  }

  private formatNumber(num: number): string {
    if (num >= 1e12) {
      return (num / 1e12).toFixed(1) + 'T';
    } else if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

// Run the simple CLI
if (require.main === module) {
  const cli = new SimpleRedpillCLI();
  cli.start().catch(console.error);
}

export { SimpleRedpillCLI };