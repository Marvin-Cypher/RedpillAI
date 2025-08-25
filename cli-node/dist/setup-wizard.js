#!/usr/bin/env node
"use strict";
/**
 * Interactive Setup Wizard for Redpill AI Terminal
 * Guides users through configuring all necessary API keys
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
exports.SetupWizard = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const fs_1 = require("fs");
const path_1 = require("path");
const axios_1 = __importDefault(require("axios"));
class SetupWizard {
    envPath;
    currentEnv = {};
    apis = [
        {
            name: 'OpenAI',
            key: 'OPENAI_API_KEY',
            description: 'Required for AI-powered natural language understanding',
            url: 'https://platform.openai.com/api-keys',
            required: true,
            testEndpoint: 'https://api.openai.com/v1/models',
            placeholder: 'sk-...'
        },
        {
            name: 'Alpha Vantage',
            key: 'ALPHA_VANTAGE_API_KEY',
            description: 'For stock prices, financial statements, and market data',
            url: 'https://www.alphavantage.co/support/#api-key',
            required: false,
            testEndpoint: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=',
            placeholder: 'DEMO_KEY (or your real key)'
        },
        {
            name: 'Financial Modeling Prep',
            key: 'FMP_API_KEY',
            description: 'For comprehensive financial data and company metrics',
            url: 'https://financialmodelingprep.com/developer/docs#authentication',
            required: false,
            testEndpoint: 'https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=',
            placeholder: 'demo (or your real key)'
        },
        {
            name: 'News API',
            key: 'NEWS_API_KEY',
            description: 'For latest financial news and market updates',
            url: 'https://newsapi.org/register',
            required: false,
            testEndpoint: 'https://newsapi.org/v2/everything?q=bitcoin&apiKey=',
            placeholder: 'your-news-api-key'
        },
        {
            name: 'Polygon.io',
            key: 'POLYGON_API_KEY',
            description: 'For real-time and historical market data',
            url: 'https://polygon.io/dashboard/api-keys',
            required: false,
            testEndpoint: 'https://api.polygon.io/v1/last/stocks/AAPL?apiKey=',
            placeholder: 'your-polygon-key'
        }
    ];
    constructor() {
        this.envPath = (0, path_1.join)(process.cwd(), '.env');
        this.loadExistingEnv();
    }
    loadExistingEnv() {
        if ((0, fs_1.existsSync)(this.envPath)) {
            try {
                const envContent = (0, fs_1.readFileSync)(this.envPath, 'utf8');
                const lines = envContent.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                        const [key, ...valueParts] = trimmed.split('=');
                        this.currentEnv[key.trim()] = valueParts.join('=').trim();
                    }
                }
            }
            catch (error) {
                // Ignore errors, start fresh
            }
        }
    }
    async start() {
        console.clear();
        const welcome = (0, boxen_1.default)(chalk_1.default.blue.bold('🔧 Redpill Terminal Setup') + '\n\n' +
            chalk_1.default.white('Welcome to the interactive setup wizard!') + '\n' +
            chalk_1.default.dim('I\'ll help you configure API keys for the best experience.') + '\n\n' +
            chalk_1.default.green('✨ The more APIs you configure, the more powerful your terminal becomes!'), { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'blue' });
        console.log(welcome);
        // Show current status
        await this.showCurrentStatus();
        // Main setup menu
        while (true) {
            const action = await this.showMainMenu();
            switch (action) {
                case 'setup_all':
                    await this.setupAllAPIs();
                    break;
                case 'setup_individual':
                    await this.setupIndividualAPI();
                    break;
                case 'test_apis':
                    await this.testAllAPIs();
                    break;
                case 'view_current':
                    await this.viewCurrentConfig();
                    break;
                case 'get_help':
                    await this.showAPIHelp();
                    break;
                case 'done':
                    await this.finishSetup();
                    return;
            }
        }
    }
    async showCurrentStatus() {
        console.log(chalk_1.default.bold('\n📊 Current API Configuration Status:\n'));
        for (const api of this.apis) {
            const hasKey = this.currentEnv[api.key] && this.currentEnv[api.key] !== '';
            const status = hasKey ? chalk_1.default.green('✓ Configured') : chalk_1.default.red('✗ Not configured');
            const required = api.required ? chalk_1.default.red('(Required)') : chalk_1.default.dim('(Optional)');
            console.log(`${api.name.padEnd(20)} ${status} ${required}`);
        }
        console.log();
    }
    async showMainMenu() {
        const { action } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: '🚀 Setup all APIs (recommended)', value: 'setup_all' },
                    { name: '🔧 Setup individual API', value: 'setup_individual' },
                    { name: '🧪 Test configured APIs', value: 'test_apis' },
                    { name: '📋 View current configuration', value: 'view_current' },
                    { name: '❓ Get help with API keys', value: 'get_help' },
                    { name: '✅ I\'m done, start the terminal', value: 'done' }
                ]
            }
        ]);
        return action;
    }
    async setupAllAPIs() {
        console.log(chalk_1.default.blue('\n🔄 Setting up all APIs...\n'));
        for (const api of this.apis) {
            await this.setupSingleAPI(api);
        }
        await this.saveConfiguration();
        console.log(chalk_1.default.green('\n✅ All APIs configured!\n'));
    }
    async setupIndividualAPI() {
        const { selectedAPI } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedAPI',
                message: 'Which API would you like to configure?',
                choices: this.apis.map(api => ({
                    name: `${api.name} - ${api.description}`,
                    value: api.key
                }))
            }
        ]);
        const api = this.apis.find(a => a.key === selectedAPI);
        if (api) {
            await this.setupSingleAPI(api);
            await this.saveConfiguration();
        }
    }
    async setupSingleAPI(api) {
        console.log((0, boxen_1.default)(chalk_1.default.cyan.bold(`🔑 ${api.name} Setup`) + '\n\n' +
            chalk_1.default.white(api.description) + '\n\n' +
            chalk_1.default.dim(`Get your key at: ${api.url}`) + '\n' +
            (api.required ? chalk_1.default.red('⚠️  This API is required') : chalk_1.default.green('💡 This API is optional but recommended')), { padding: 1, borderStyle: 'round', borderColor: api.required ? 'red' : 'cyan' }));
        const currentValue = this.currentEnv[api.key] || '';
        const hasCurrentValue = currentValue && currentValue !== '';
        if (hasCurrentValue) {
            console.log(chalk_1.default.green(`Current value: ${this.maskApiKey(currentValue)}`));
        }
        const questions = [
            {
                type: 'confirm',
                name: 'configure',
                message: hasCurrentValue ? 'Update this API key?' : 'Configure this API key?',
                default: !hasCurrentValue || api.required
            }
        ];
        if (!api.required) {
            questions[0].default = hasCurrentValue;
        }
        const { configure } = await inquirer_1.default.prompt(questions);
        if (!configure) {
            console.log(chalk_1.default.dim(`Skipping ${api.name}...\n`));
            return;
        }
        const { apiKey } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'apiKey',
                message: `Enter your ${api.name} API key:`,
                mask: '*',
                validate: (input) => {
                    if (!input.trim()) {
                        return api.required ? 'API key is required' : true;
                    }
                    if (api.placeholder && input.trim() === api.placeholder) {
                        return 'Please enter your actual API key, not the placeholder';
                    }
                    return true;
                }
            }
        ]);
        if (apiKey && apiKey.trim()) {
            this.currentEnv[api.key] = apiKey.trim();
            // Test the API key
            if (api.testEndpoint) {
                console.log(chalk_1.default.blue(`🧪 Testing ${api.name} API key...`));
                const isValid = await this.testAPIKey(api, apiKey.trim());
                if (isValid) {
                    console.log(chalk_1.default.green(`✅ ${api.name} API key is valid!`));
                }
                else {
                    console.log(chalk_1.default.yellow(`⚠️  Could not verify ${api.name} API key (might still work)`));
                }
            }
        }
        console.log();
    }
    async testAPIKey(api, apiKey) {
        if (!api.testEndpoint)
            return true;
        try {
            const url = api.testEndpoint + apiKey;
            await axios_1.default.get(url, { timeout: 10000 });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async testAllAPIs() {
        console.log(chalk_1.default.blue('\n🧪 Testing all configured APIs...\n'));
        for (const api of this.apis) {
            const apiKey = this.currentEnv[api.key];
            if (!apiKey) {
                console.log(`${api.name.padEnd(20)} ${chalk_1.default.gray('Not configured')}`);
                continue;
            }
            if (!api.testEndpoint) {
                console.log(`${api.name.padEnd(20)} ${chalk_1.default.yellow('Cannot test (no test endpoint)')}`);
                continue;
            }
            const isValid = await this.testAPIKey(api, apiKey);
            const status = isValid ? chalk_1.default.green('✅ Valid') : chalk_1.default.red('❌ Invalid/Error');
            console.log(`${api.name.padEnd(20)} ${status}`);
        }
        console.log();
    }
    async viewCurrentConfig() {
        console.log(chalk_1.default.blue('\n📋 Current Configuration:\n'));
        for (const api of this.apis) {
            const apiKey = this.currentEnv[api.key];
            const value = apiKey ? this.maskApiKey(apiKey) : chalk_1.default.red('Not set');
            console.log(`${api.key.padEnd(25)} = ${value}`);
        }
        console.log();
    }
    async showAPIHelp() {
        console.log((0, boxen_1.default)(chalk_1.default.yellow.bold('📚 API Key Help Guide') + '\n\n' +
            chalk_1.default.white('Here\'s where to get each API key:\n\n') +
            this.apis.map(api => chalk_1.default.cyan(`${api.name}:`) + '\n' +
                chalk_1.default.dim(`• ${api.description}`) + '\n' +
                chalk_1.default.dim(`• Get it at: ${api.url}`) + '\n' +
                (api.required ? chalk_1.default.red('• Required for basic functionality') : chalk_1.default.green('• Optional but recommended')) + '\n').join('\n') +
            chalk_1.default.green('\n💡 Pro tip: Start with OpenAI (required), then add others as needed!'), { padding: 1, borderStyle: 'round', borderColor: 'yellow' }));
        await inquirer_1.default.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
    }
    maskApiKey(apiKey) {
        if (apiKey.length <= 8) {
            return '*'.repeat(apiKey.length);
        }
        return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
    }
    async saveConfiguration() {
        const envContent = this.buildEnvContent();
        try {
            (0, fs_1.writeFileSync)(this.envPath, envContent);
            console.log(chalk_1.default.green('✅ Configuration saved to .env file'));
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Failed to save configuration:'), error);
            console.log(chalk_1.default.yellow('\nYou can manually create a .env file with:'));
            console.log(chalk_1.default.dim(envContent));
        }
    }
    buildEnvContent() {
        const lines = [
            '# Redpill AI Terminal Configuration',
            '# Generated by setup wizard',
            `# Created: ${new Date().toISOString()}`,
            ''
        ];
        for (const api of this.apis) {
            const value = this.currentEnv[api.key];
            lines.push(`# ${api.name}: ${api.description}`);
            lines.push(`# Get your key at: ${api.url}`);
            if (value) {
                lines.push(`${api.key}=${value}`);
            }
            else {
                lines.push(`# ${api.key}=your-api-key-here`);
            }
            lines.push('');
        }
        lines.push('# Additional OpenBB Platform settings (optional)');
        lines.push('# OPENBB_TOKEN=your-openbb-token-here');
        lines.push('');
        lines.push('# Backend URL (if using full Redpill backend)');
        lines.push('# REDPILL_API_URL=http://localhost:8000/api/v1');
        return lines.join('\n');
    }
    async finishSetup() {
        const requiredAPIs = this.apis.filter(api => api.required);
        const missingRequired = requiredAPIs.filter(api => !this.currentEnv[api.key]);
        if (missingRequired.length > 0) {
            console.log(chalk_1.default.red('\n⚠️  Missing required APIs:'));
            for (const api of missingRequired) {
                console.log(`  • ${api.name} - ${api.description}`);
            }
            const { proceed } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'proceed',
                    message: 'Continue anyway? (Terminal will have limited functionality)',
                    default: false
                }
            ]);
            if (!proceed) {
                console.log(chalk_1.default.blue('\nLet\'s configure the required APIs...\n'));
                return;
            }
        }
        console.log((0, boxen_1.default)(chalk_1.default.green.bold('🎉 Setup Complete!') + '\n\n' +
            chalk_1.default.white('Your Redpill AI Terminal is ready to use.') + '\n\n' +
            chalk_1.default.cyan('Start the terminal with:') + '\n' +
            chalk_1.default.yellow('node dist/ai-terminal.js') + '\n\n' +
            chalk_1.default.dim('You can re-run this setup anytime with:') + '\n' +
            chalk_1.default.dim('node dist/setup-wizard.js'), { padding: 1, borderStyle: 'round', borderColor: 'green' }));
        const { startNow } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'startNow',
                message: 'Start the AI terminal now?',
                default: true
            }
        ]);
        if (startNow) {
            console.log(chalk_1.default.blue('\n🚀 Starting AI Terminal...\n'));
            // Dynamic import to avoid circular dependencies
            const { AITerminal } = await Promise.resolve().then(() => __importStar(require('./ai-terminal')));
            const terminal = new AITerminal();
            await terminal.start();
        }
    }
}
exports.SetupWizard = SetupWizard;
// Run the setup wizard
if (require.main === module) {
    const wizard = new SetupWizard();
    wizard.start().catch(console.error);
}
