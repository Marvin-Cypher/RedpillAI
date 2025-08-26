"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupWizard = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
class SetupWizard {
    constructor() {
        this.envPath = (0, path_1.join)(process.cwd(), '.env');
    }
    needsSetup() {
        // Check if basic API keys are configured
        const requiredKeys = ['OPENAI_API_KEY', 'REDPILL_API_KEY'];
        for (const key of requiredKeys) {
            if (process.env[key]) {
                return false; // At least one key is configured
            }
        }
        return true;
    }
    async askForAPIKeyGuide() {
        console.log(chalk_1.default.yellow('⚠️  API keys not configured. Some features may be limited.'));
        console.log(chalk_1.default.dim('You can set OPENAI_API_KEY or REDPILL_API_KEY environment variables.'));
        console.log();
        const { setupNow } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'setupNow',
                message: 'Would you like to configure API keys now?',
                default: false
            }
        ]);
        if (setupNow) {
            await this.run();
        }
    }
    async run() {
        console.log(boxen(chalk_1.default.bold('🔧 Redpill Setup Wizard') + '\n' +
            chalk_1.default.dim('Configure your API keys and settings'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));
        // Read existing .env if it exists
        let existingEnv = {};
        if ((0, fs_1.existsSync)(this.envPath)) {
            try {
                const content = (0, fs_1.readFileSync)(this.envPath, 'utf8');
                const lines = content.split('\n');
                for (const line of lines) {
                    const [key, ...valueParts] = line.split('=');
                    if (key && valueParts.length > 0) {
                        existingEnv[key.trim()] = valueParts.join('=').trim();
                    }
                }
            }
            catch (error) {
                console.warn(chalk_1.default.yellow('Warning: Could not read existing .env file'));
            }
        }
        // API Key configuration
        const apiKeys = await this.configureAPIKeys(existingEnv);
        // Save to .env file
        await this.saveConfiguration({ ...existingEnv, ...apiKeys });
        console.log(chalk_1.default.green('✅ Configuration saved successfully!'));
        console.log(chalk_1.default.dim(`Configuration written to: ${this.envPath}`));
    }
    async configureAPIKeys(existing) {
        console.log(chalk_1.default.blue('\n📋 API Key Configuration'));
        console.log(chalk_1.default.dim('Leave blank to skip or keep existing values\n'));
        const keys = {};
        // OpenAI API Key
        const { openaiKey } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'openaiKey',
                message: `OpenAI API Key ${existing.OPENAI_API_KEY ? chalk_1.default.dim('(configured)') : ''}:`,
                mask: '*'
            }
        ]);
        if (openaiKey)
            keys.OPENAI_API_KEY = openaiKey;
        // Redpill AI API Key
        const { redpillKey } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'redpillKey',
                message: `Redpill AI API Key ${existing.REDPILL_API_KEY ? chalk_1.default.dim('(configured)') : ''}:`,
                mask: '*'
            }
        ]);
        if (redpillKey)
            keys.REDPILL_API_KEY = redpillKey;
        // CoinGecko API Key (optional)
        const { coingeckoKey } = await inquirer_1.default.prompt([
            {
                type: 'password',
                name: 'coingeckoKey',
                message: `CoinGecko API Key ${existing.COINGECKO_API_KEY ? chalk_1.default.dim('(configured)') : ''} [Optional]:`,
                mask: '*'
            }
        ]);
        if (coingeckoKey)
            keys.COINGECKO_API_KEY = coingeckoKey;
        return keys;
    }
    async saveConfiguration(config) {
        const lines = Object.entries(config)
            .filter(([_, value]) => value) // Only include non-empty values
            .map(([key, value]) => `${key}=${value}`);
        try {
            (0, fs_1.writeFileSync)(this.envPath, lines.join('\n') + '\n');
        }
        catch (error) {
            throw new Error(`Failed to write configuration file: ${error instanceof Error ? error.message : error}`);
        }
    }
}
exports.SetupWizard = SetupWizard;
// Import boxen dynamically to avoid import issues
function boxen(text, options) {
    try {
        const boxenModule = require('boxen');
        return boxenModule(text, options);
    }
    catch {
        return text; // Fallback if boxen is not available
    }
}
//# sourceMappingURL=setup.js.map