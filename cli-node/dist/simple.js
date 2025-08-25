#!/usr/bin/env node
"use strict";
/**
 * Simple version of Redpill CLI - Direct OpenBB integration without backend
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleRedpillCLI = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
// Load .env
(0, dotenv_1.config)();
class SimpleRedpillCLI {
    openaiApiKey;
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
    }
    async start() {
        console.clear();
        const welcome = (0, boxen_1.default)(chalk_1.default.green.bold('🚀 Redpill Terminal (Simple)') + '\n' +
            chalk_1.default.dim('Direct financial data access') + '\n' +
            chalk_1.default.dim('Powered by CoinGecko API'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
        });
        console.log(welcome);
        console.log(chalk_1.default.dim('Examples: "eth price", "bitcoin", "btc vs eth"\n'));
        while (true) {
            try {
                const { input } = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'input',
                        message: chalk_1.default.green('❯'),
                        prefix: ''
                    }
                ]);
                if (['exit', 'quit', 'q'].includes(input.toLowerCase())) {
                    console.log(chalk_1.default.yellow('Goodbye! 👋'));
                    break;
                }
                if (input.toLowerCase() === 'clear') {
                    console.clear();
                    continue;
                }
                await this.processInput(input);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(chalk_1.default.red('Error:'), errorMessage);
            }
        }
    }
    async processInput(input) {
        const lower = input.toLowerCase();
        // Extract crypto symbols from input
        const cryptoSymbols = this.extractCryptoSymbols(input);
        if (cryptoSymbols.length > 0) {
            await this.showCryptoPrices(cryptoSymbols);
            return;
        }
        // Fallback response
        console.log(chalk_1.default.yellow('🤖 I understand you\'re asking about:'), `"${input}"`);
        console.log(chalk_1.default.dim('Try: "eth price", "bitcoin", "btc", "ethereum vs bitcoin"'));
        console.log();
    }
    extractCryptoSymbols(input) {
        const cryptoMap = {
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
        const found = [];
        const words = input.toLowerCase().split(/\s+/);
        for (const word of words) {
            if (cryptoMap[word]) {
                found.push(cryptoMap[word]);
            }
        }
        return [...new Set(found)]; // Remove duplicates
    }
    async showCryptoPrices(symbols) {
        try {
            console.log(chalk_1.default.blue('📊 Fetching crypto prices...\n'));
            const prices = await this.fetchCryptoPrices(symbols);
            for (const price of prices) {
                const changeColor = price.change_24h >= 0 ? chalk_1.default.green : chalk_1.default.red;
                const changeSymbol = price.change_24h >= 0 ? '+' : '';
                console.log(chalk_1.default.bold(price.symbol.toUpperCase()));
                console.log(`  Price: ${chalk_1.default.cyan('$' + price.price.toFixed(2))}`);
                console.log(`  24h Change: ${changeColor(changeSymbol + price.change_24h.toFixed(2) + '%')}`);
                if (price.market_cap) {
                    console.log(`  Market Cap: ${chalk_1.default.dim('$' + this.formatNumber(price.market_cap))}`);
                }
                if (price.volume_24h) {
                    console.log(`  24h Volume: ${chalk_1.default.dim('$' + this.formatNumber(price.volume_24h))}`);
                }
                console.log();
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(chalk_1.default.red('❌ Failed to fetch crypto prices:'), errorMessage);
            console.log(chalk_1.default.dim('Note: This uses CoinGecko API which may have rate limits.'));
            console.log();
        }
    }
    async fetchCryptoPrices(symbols) {
        const ids = symbols.join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
        const response = await axios_1.default.get(url, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'redpill-terminal/1.0.0'
            }
        });
        const data = response.data;
        const prices = [];
        for (const [id, priceData] of Object.entries(data)) {
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
    formatNumber(num) {
        if (num >= 1e12) {
            return (num / 1e12).toFixed(1) + 'T';
        }
        else if (num >= 1e9) {
            return (num / 1e9).toFixed(1) + 'B';
        }
        else if (num >= 1e6) {
            return (num / 1e6).toFixed(1) + 'M';
        }
        else if (num >= 1e3) {
            return (num / 1e3).toFixed(1) + 'K';
        }
        return num.toString();
    }
}
exports.SimpleRedpillCLI = SimpleRedpillCLI;
// Run the simple CLI
if (require.main === module) {
    const cli = new SimpleRedpillCLI();
    cli.start().catch(console.error);
}
