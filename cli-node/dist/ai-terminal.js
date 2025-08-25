#!/usr/bin/env node
"use strict";
/**
 * AI-Powered Redpill CLI - True Claude Code Experience
 * Understands ANY natural language request and figures out how to execute it
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITerminal = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const axios_1 = __importDefault(require("axios"));
const ora_1 = __importDefault(require("ora"));
const dotenv_1 = require("dotenv");
// Load .env
(0, dotenv_1.config)();
class AITerminal {
    openaiApiKey;
    conversationHistory = [];
    constructor() {
        this.openaiApiKey = process.env.OPENAI_API_KEY;
        // System prompt for the AI agent
        this.conversationHistory.push({
            role: 'system',
            content: `You are an AI investment terminal assistant that can execute ANY financial request.

Your capabilities:
- Get real-time crypto prices (CoinGecko API)
- Get stock prices (Alpha Vantage/Yahoo Finance APIs) 
- Analyze any company or asset
- Compare multiple assets
- Get market news
- Explain financial concepts
- Calculate returns, ratios, portfolio metrics
- Research any ticker or company

For ANY user request, you should:
1. Understand their intent completely 
2. Figure out what data you need
3. Plan the API calls required
4. Execute the calls
5. Present results in a clear, helpful way

Available APIs:
- CoinGecko: https://api.coingecko.com/api/v3/
- Alpha Vantage: https://www.alphavantage.co/
- Financial Modeling Prep: https://financialmodelingprep.com/api/v3/
- News APIs for market updates

IMPORTANT: Always be helpful and execute whatever the user asks for. If you need to make API calls, explain what you're doing and show the results clearly.

Respond in JSON format with this structure:
{
  "understanding": "What you understood from the user's request",
  "plan": "How you will execute this request", 
  "api_calls": [{"type": "api_type", "url": "full_url", "description": "what this fetches"}],
  "response": "Your helpful response to the user"
}`
        });
    }
    async start() {
        console.clear();
        if (!this.openaiApiKey) {
            console.log((0, boxen_1.default)(chalk_1.default.red.bold('❌ Missing OpenAI API Key') + '\n\n' +
                chalk_1.default.white('The AI Terminal needs an OpenAI API key to understand your requests.') + '\n' +
                chalk_1.default.dim('I can help you set this up!'), { padding: 1, borderStyle: 'round', borderColor: 'red' }));
            const { runSetup } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'runSetup',
                    message: 'Run the setup wizard to configure API keys?',
                    default: true
                }
            ]);
            if (runSetup) {
                // Dynamic import to avoid circular dependencies  
                const { SetupWizard } = await Promise.resolve().then(() => __importStar(require('./setup-wizard')));
                const wizard = new SetupWizard();
                await wizard.start();
                return;
            }
            else {
                console.log(chalk_1.default.yellow('\nYou can manually set your API key:'));
                console.log(chalk_1.default.dim('export OPENAI_API_KEY="your-key-here"'));
                console.log(chalk_1.default.yellow('\nOr run the setup wizard:'));
                console.log(chalk_1.default.dim('node dist/setup-wizard.js'));
                return;
            }
        }
        const welcome = (0, boxen_1.default)(chalk_1.default.green.bold('🤖 AI Investment Terminal') + '\n' +
            chalk_1.default.dim('Just ask me anything about investments, markets, or finance.') + '\n' +
            chalk_1.default.dim('I\'ll figure out how to help you.'), { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'green' });
        console.log(welcome);
        console.log(chalk_1.default.dim('Examples:'));
        console.log(chalk_1.default.dim('  • "What\'s the price of PHA token?"'));
        console.log(chalk_1.default.dim('  • "Compare Tesla vs Apple stock performance"'));
        console.log(chalk_1.default.dim('  • "Show me the top crypto gainers today"'));
        console.log(chalk_1.default.dim('  • "What\'s happening in the AI sector?"'));
        console.log(chalk_1.default.dim('  • "Calculate 10% of my $50k portfolio"'));
        console.log();
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
                    this.conversationHistory = [this.conversationHistory[0]]; // Keep system prompt
                    continue;
                }
                await this.processWithAI(input);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(chalk_1.default.red('Error:'), errorMessage);
            }
        }
    }
    async processWithAI(userInput) {
        const spinner = (0, ora_1.default)('🤖 Understanding your request...').start();
        try {
            // Add user message to conversation
            this.conversationHistory.push({
                role: 'user',
                content: userInput
            });
            // Get AI plan
            const aiResponse = await this.callOpenAI();
            let plan;
            try {
                // Try to parse as JSON
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    plan = JSON.parse(jsonMatch[0]);
                }
                else {
                    throw new Error('No JSON found');
                }
            }
            catch {
                // If not JSON, treat as direct response
                plan = {
                    understanding: "User request processed",
                    plan: "Provide direct response",
                    api_calls: [],
                    response: aiResponse
                };
            }
            spinner.text = '🔍 Executing your request...';
            // Execute API calls if any
            const apiResults = [];
            if (plan.api_calls && plan.api_calls.length > 0) {
                for (const apiCall of plan.api_calls) {
                    try {
                        spinner.text = `📡 ${apiCall.description || 'Fetching data'}...`;
                        const result = await this.executeAPICall(apiCall);
                        apiResults.push(result);
                    }
                    catch (error) {
                        console.log(chalk_1.default.red(`Failed to fetch data: ${error}`));
                    }
                }
            }
            spinner.stop();
            // Show what the AI understood
            console.log(chalk_1.default.blue('💭 Understanding:'), plan.understanding);
            // Show the results
            if (apiResults.length > 0) {
                console.log(chalk_1.default.cyan('📊 Data fetched:'));
                for (const result of apiResults) {
                    this.displayAPIResult(result);
                }
            }
            // Show AI response
            console.log(chalk_1.default.green('🤖 Response:'));
            console.log(plan.response);
            console.log();
            // Add AI response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: JSON.stringify(plan)
            });
        }
        catch (error) {
            spinner.stop();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(chalk_1.default.red('❌ AI Error:'), errorMessage);
            // Fallback: try to help anyway
            console.log(chalk_1.default.yellow('🔄 Let me try a different approach...'));
            await this.fallbackResponse(userInput);
        }
    }
    async callOpenAI() {
        if (!this.openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }
        // Clean the API key - remove any whitespace or invalid characters
        const cleanApiKey = this.openaiApiKey.trim().replace(/[^\w-]/g, '');
        const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: this.conversationHistory.slice(-10), // Keep last 10 messages for context
            max_tokens: 800,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${cleanApiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        return response.data.choices[0].message.content;
    }
    async executeAPICall(apiCall) {
        const response = await axios_1.default.get(apiCall.url, {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'redpill-terminal/1.0.0'
            }
        });
        return {
            type: apiCall.type,
            description: apiCall.description,
            data: response.data
        };
    }
    displayAPIResult(result) {
        switch (result.type) {
            case 'crypto_price':
                this.displayCryptoData(result.data);
                break;
            case 'stock_quote':
                this.displayStockData(result.data);
                break;
            case 'market_data':
                this.displayMarketData(result.data);
                break;
            default:
                console.log(chalk_1.default.gray('Raw data:'), JSON.stringify(result.data, null, 2).slice(0, 500) + '...');
        }
    }
    displayCryptoData(data) {
        // Handle CoinGecko response format
        if (data && typeof data === 'object') {
            for (const [symbol, priceData] of Object.entries(data)) {
                if (typeof priceData === 'object' && priceData !== null) {
                    const price = priceData.usd;
                    const change = priceData.usd_24h_change;
                    const marketCap = priceData.usd_market_cap;
                    console.log(chalk_1.default.bold(symbol.toUpperCase()));
                    console.log(`  Price: ${chalk_1.default.cyan('$' + price?.toFixed(4))}`);
                    if (change !== undefined) {
                        const changeColor = change >= 0 ? chalk_1.default.green : chalk_1.default.red;
                        console.log(`  24h Change: ${changeColor((change >= 0 ? '+' : '') + change.toFixed(2) + '%')}`);
                    }
                    if (marketCap) {
                        console.log(`  Market Cap: ${chalk_1.default.dim('$' + this.formatNumber(marketCap))}`);
                    }
                }
            }
        }
    }
    displayStockData(data) {
        // Handle stock API response
        console.log(chalk_1.default.gray('Stock data:'), JSON.stringify(data, null, 2).slice(0, 300) + '...');
    }
    displayMarketData(data) {
        // Handle general market data
        console.log(chalk_1.default.gray('Market data:'), JSON.stringify(data, null, 2).slice(0, 300) + '...');
    }
    async fallbackResponse(userInput) {
        const lower = userInput.toLowerCase();
        try {
            if (lower.includes('pha') || lower.includes('phala')) {
                const response = await axios_1.default.get('https://api.coingecko.com/api/v3/simple/price?ids=pha&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
                console.log(chalk_1.default.blue('📊 PHA Price:'));
                this.displayCryptoData(response.data);
            }
            else if (lower.includes('crypto') && (lower.includes('market') || lower.includes('overview'))) {
                console.log(chalk_1.default.blue('📊 Crypto Market Overview:'));
                // Get top cryptocurrencies
                const topCryptos = await axios_1.default.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h');
                console.log(chalk_1.default.bold('\nTop 10 Cryptocurrencies:'));
                console.log('----------------------------------------');
                for (const coin of topCryptos.data.slice(0, 10)) {
                    const changeColor = coin.price_change_percentage_24h >= 0 ? chalk_1.default.green : chalk_1.default.red;
                    const changeSymbol = coin.price_change_percentage_24h >= 0 ? '+' : '';
                    console.log(`${chalk_1.default.bold(coin.symbol.toUpperCase())} (${coin.name})`);
                    console.log(`  Price: ${chalk_1.default.cyan('$' + coin.current_price.toFixed(2))}`);
                    console.log(`  24h: ${changeColor(changeSymbol + coin.price_change_percentage_24h.toFixed(2) + '%')}`);
                    console.log(`  Market Cap: ${chalk_1.default.dim('$' + this.formatNumber(coin.market_cap))}`);
                    console.log('');
                }
                // Get global market data
                const globalData = await axios_1.default.get('https://api.coingecko.com/api/v3/global');
                const global = globalData.data.data;
                console.log(chalk_1.default.bold('Global Market Stats:'));
                console.log('----------------------------------------');
                console.log(`Total Market Cap: ${chalk_1.default.cyan('$' + this.formatNumber(global.total_market_cap.usd))}`);
                console.log(`24h Volume: ${chalk_1.default.cyan('$' + this.formatNumber(global.total_volume.usd))}`);
                console.log(`Bitcoin Dominance: ${chalk_1.default.yellow(global.market_cap_percentage.btc.toFixed(1) + '%')}`);
                console.log(`Ethereum Dominance: ${chalk_1.default.yellow(global.market_cap_percentage.eth.toFixed(1) + '%')}`);
            }
            else if (lower.includes('btc') || lower.includes('bitcoin')) {
                const response = await axios_1.default.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
                console.log(chalk_1.default.blue('📊 Bitcoin Price:'));
                this.displayCryptoData(response.data);
            }
            else if (lower.includes('eth') || lower.includes('ethereum')) {
                const response = await axios_1.default.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true');
                console.log(chalk_1.default.blue('📊 Ethereum Price:'));
                this.displayCryptoData(response.data);
            }
            else {
                console.log(chalk_1.default.yellow('🤖 I understand you\'re asking about:'), `"${userInput}"`);
                console.log(chalk_1.default.blue('\n💡 Here are some things I can help with:'));
                console.log(chalk_1.default.dim('  • "crypto market overview" - Get top 10 coins + market stats'));
                console.log(chalk_1.default.dim('  • "PHA price" - Get any crypto price'));
                console.log(chalk_1.default.dim('  • "bitcoin vs ethereum" - Compare assets'));
                console.log(chalk_1.default.dim('  • "top crypto gainers" - Market movers'));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Unable to fetch data from CoinGecko API'));
            console.log(chalk_1.default.dim('The API might be rate limiting or temporarily unavailable.'));
        }
        console.log();
    }
    formatNumber(num) {
        if (num >= 1e12)
            return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9)
            return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6)
            return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3)
            return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }
}
exports.AITerminal = AITerminal;
// Run the AI terminal
if (require.main === module) {
    const terminal = new AITerminal();
    terminal.start().catch(console.error);
}
