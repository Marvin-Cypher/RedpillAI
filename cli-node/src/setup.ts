import inquirer from 'inquirer';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export class SetupWizard {
  private envPath: string;

  constructor() {
    this.envPath = join(process.cwd(), '.env');
  }

  needsSetup(): boolean {
    // Check if basic API keys are configured
    const requiredKeys = ['OPENAI_API_KEY', 'REDPILL_API_KEY'];
    
    for (const key of requiredKeys) {
      if (process.env[key]) {
        return false; // At least one key is configured
      }
    }
    
    return true;
  }

  async askForAPIKeyGuide(): Promise<void> {
    console.log(chalk.yellow('⚠️  API keys not configured. Some features may be limited.'));
    console.log(chalk.dim('You can set OPENAI_API_KEY or REDPILL_API_KEY environment variables.'));
    console.log();
    
    const { setupNow } = await inquirer.prompt([
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

  async run(): Promise<void> {
    console.log(boxen(
      chalk.bold('🔧 Redpill Setup Wizard') + '\n' +
      chalk.dim('Configure your API keys and settings'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));

    // Read existing .env if it exists
    let existingEnv: Record<string, string> = {};
    if (existsSync(this.envPath)) {
      try {
        const content = readFileSync(this.envPath, 'utf8');
        const lines = content.split('\n');
        for (const line of lines) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            existingEnv[key.trim()] = valueParts.join('=').trim();
          }
        }
      } catch (error) {
        console.warn(chalk.yellow('Warning: Could not read existing .env file'));
      }
    }

    // API Key configuration
    const apiKeys = await this.configureAPIKeys(existingEnv);

    // Save to .env file
    await this.saveConfiguration({ ...existingEnv, ...apiKeys });

    console.log(chalk.green('✅ Configuration saved successfully!'));
    console.log(chalk.dim(`Configuration written to: ${this.envPath}`));
  }

  private async configureAPIKeys(existing: Record<string, string>): Promise<Record<string, string>> {
    console.log(chalk.blue('\n📋 API Key Configuration'));
    console.log(chalk.dim('Leave blank to skip or keep existing values\n'));

    const keys: Record<string, string> = {};

    // OpenAI API Key
    const { openaiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'openaiKey',
        message: `OpenAI API Key ${existing.OPENAI_API_KEY ? chalk.dim('(configured)') : ''}:`,
        mask: '*'
      }
    ]);
    if (openaiKey) keys.OPENAI_API_KEY = openaiKey;

    // Redpill AI API Key
    const { redpillKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'redpillKey',
        message: `Redpill AI API Key ${existing.REDPILL_API_KEY ? chalk.dim('(configured)') : ''}:`,
        mask: '*'
      }
    ]);
    if (redpillKey) keys.REDPILL_API_KEY = redpillKey;

    // CoinGecko API Key (optional)
    const { coingeckoKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'coingeckoKey',
        message: `CoinGecko API Key ${existing.COINGECKO_API_KEY ? chalk.dim('(configured)') : ''} [Optional]:`,
        mask: '*'
      }
    ]);
    if (coingeckoKey) keys.COINGECKO_API_KEY = coingeckoKey;

    return keys;
  }

  private async saveConfiguration(config: Record<string, string>): Promise<void> {
    const lines = Object.entries(config)
      .filter(([_, value]) => value) // Only include non-empty values
      .map(([key, value]) => `${key}=${value}`);

    try {
      writeFileSync(this.envPath, lines.join('\n') + '\n');
    } catch (error) {
      throw new Error(`Failed to write configuration file: ${error instanceof Error ? error.message : error}`);
    }
  }
}

// Import boxen dynamically to avoid import issues
function boxen(text: string, options: any) {
  try {
    const boxenModule = require('boxen');
    return boxenModule(text, options);
  } catch {
    return text; // Fallback if boxen is not available
  }
}