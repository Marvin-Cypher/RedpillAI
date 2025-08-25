#!/usr/bin/env node
/**
 * Interactive Setup Wizard for Redpill AI Terminal
 * Guides users through configuring all necessary API keys
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

interface APIConfig {
  name: string;
  key: string;
  description: string;
  url: string;
  required: boolean;
  testEndpoint?: string;
  placeholder?: string;
}

class SetupWizard {
  private envPath: string;
  private currentEnv: { [key: string]: string } = {};

  private apis: APIConfig[] = [
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
    this.envPath = join(process.cwd(), '.env');
    this.loadExistingEnv();
  }

  private loadExistingEnv() {
    if (existsSync(this.envPath)) {
      try {
        const envContent = readFileSync(this.envPath, 'utf8');
        const lines = envContent.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            this.currentEnv[key.trim()] = valueParts.join('=').trim();
          }
        }
      } catch (error) {
        // Ignore errors, start fresh
      }
    }
  }

  async start() {
    console.clear();
    
    const welcome = boxen(
      chalk.blue.bold('🔧 Redpill Terminal Setup') + '\n\n' +
      chalk.white('Welcome to the interactive setup wizard!') + '\n' +
      chalk.dim('I\'ll help you configure API keys for the best experience.') + '\n\n' +
      chalk.green('✨ The more APIs you configure, the more powerful your terminal becomes!'),
      { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'blue' }
    );

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

  private async showCurrentStatus() {
    console.log(chalk.bold('\n📊 Current API Configuration Status:\n'));
    
    for (const api of this.apis) {
      const hasKey = this.currentEnv[api.key] && this.currentEnv[api.key] !== '';
      const status = hasKey ? chalk.green('✓ Configured') : chalk.red('✗ Not configured');
      const required = api.required ? chalk.red('(Required)') : chalk.dim('(Optional)');
      
      console.log(`${api.name.padEnd(20)} ${status} ${required}`);
    }
    console.log();
  }

  private async showMainMenu() {
    const { action } = await inquirer.prompt([
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

  private async setupAllAPIs() {
    console.log(chalk.blue('\n🔄 Setting up all APIs...\n'));

    for (const api of this.apis) {
      await this.setupSingleAPI(api);
    }

    await this.saveConfiguration();
    console.log(chalk.green('\n✅ All APIs configured!\n'));
  }

  private async setupIndividualAPI() {
    const { selectedAPI } = await inquirer.prompt([
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

  private async setupSingleAPI(api: APIConfig) {
    console.log(boxen(
      chalk.cyan.bold(`🔑 ${api.name} Setup`) + '\n\n' +
      chalk.white(api.description) + '\n\n' +
      chalk.dim(`Get your key at: ${api.url}`) + '\n' +
      (api.required ? chalk.red('⚠️  This API is required') : chalk.green('💡 This API is optional but recommended')),
      { padding: 1, borderStyle: 'round', borderColor: api.required ? 'red' : 'cyan' }
    ));

    const currentValue = this.currentEnv[api.key] || '';
    const hasCurrentValue = currentValue && currentValue !== '';

    if (hasCurrentValue) {
      console.log(chalk.green(`Current value: ${this.maskApiKey(currentValue)}`));
    }

    const questions: any[] = [
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

    const { configure } = await inquirer.prompt(questions);

    if (!configure) {
      console.log(chalk.dim(`Skipping ${api.name}...\n`));
      return;
    }

    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: `Enter your ${api.name} API key:`,
        mask: '*',
        validate: (input: string) => {
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
        console.log(chalk.blue(`🧪 Testing ${api.name} API key...`));
        const isValid = await this.testAPIKey(api, apiKey.trim());
        
        if (isValid) {
          console.log(chalk.green(`✅ ${api.name} API key is valid!`));
        } else {
          console.log(chalk.yellow(`⚠️  Could not verify ${api.name} API key (might still work)`));
        }
      }
    }

    console.log();
  }

  private async testAPIKey(api: APIConfig, apiKey: string): Promise<boolean> {
    if (!api.testEndpoint) return true;

    try {
      const url = api.testEndpoint + apiKey;
      await axios.get(url, { timeout: 10000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async testAllAPIs() {
    console.log(chalk.blue('\n🧪 Testing all configured APIs...\n'));

    for (const api of this.apis) {
      const apiKey = this.currentEnv[api.key];
      
      if (!apiKey) {
        console.log(`${api.name.padEnd(20)} ${chalk.gray('Not configured')}`);
        continue;
      }

      if (!api.testEndpoint) {
        console.log(`${api.name.padEnd(20)} ${chalk.yellow('Cannot test (no test endpoint)')}`);
        continue;
      }

      const isValid = await this.testAPIKey(api, apiKey);
      const status = isValid ? chalk.green('✅ Valid') : chalk.red('❌ Invalid/Error');
      console.log(`${api.name.padEnd(20)} ${status}`);
    }

    console.log();
  }

  private async viewCurrentConfig() {
    console.log(chalk.blue('\n📋 Current Configuration:\n'));

    for (const api of this.apis) {
      const apiKey = this.currentEnv[api.key];
      const value = apiKey ? this.maskApiKey(apiKey) : chalk.red('Not set');
      console.log(`${api.key.padEnd(25)} = ${value}`);
    }

    console.log();
  }

  private async showAPIHelp() {
    console.log(boxen(
      chalk.yellow.bold('📚 API Key Help Guide') + '\n\n' +
      chalk.white('Here\'s where to get each API key:\n\n') +
      
      this.apis.map(api => 
        chalk.cyan(`${api.name}:`) + '\n' +
        chalk.dim(`• ${api.description}`) + '\n' +
        chalk.dim(`• Get it at: ${api.url}`) + '\n' +
        (api.required ? chalk.red('• Required for basic functionality') : chalk.green('• Optional but recommended')) + '\n'
      ).join('\n') +
      
      chalk.green('\n💡 Pro tip: Start with OpenAI (required), then add others as needed!'),
      { padding: 1, borderStyle: 'round', borderColor: 'yellow' }
    ));

    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }]);
  }

  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }
    return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  }

  private async saveConfiguration() {
    const envContent = this.buildEnvContent();
    
    try {
      writeFileSync(this.envPath, envContent);
      console.log(chalk.green('✅ Configuration saved to .env file'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to save configuration:'), error);
      console.log(chalk.yellow('\nYou can manually create a .env file with:'));
      console.log(chalk.dim(envContent));
    }
  }

  private buildEnvContent(): string {
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
      } else {
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

  private async finishSetup() {
    const requiredAPIs = this.apis.filter(api => api.required);
    const missingRequired = requiredAPIs.filter(api => !this.currentEnv[api.key]);

    if (missingRequired.length > 0) {
      console.log(chalk.red('\n⚠️  Missing required APIs:'));
      for (const api of missingRequired) {
        console.log(`  • ${api.name} - ${api.description}`);
      }

      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Continue anyway? (Terminal will have limited functionality)',
          default: false
        }
      ]);

      if (!proceed) {
        console.log(chalk.blue('\nLet\'s configure the required APIs...\n'));
        return;
      }
    }

    console.log(boxen(
      chalk.green.bold('🎉 Setup Complete!') + '\n\n' +
      chalk.white('Your Redpill AI Terminal is ready to use.') + '\n\n' +
      chalk.cyan('Start the terminal with:') + '\n' +
      chalk.yellow('node dist/ai-terminal.js') + '\n\n' +
      chalk.dim('You can re-run this setup anytime with:') + '\n' +
      chalk.dim('node dist/setup-wizard.js'),
      { padding: 1, borderStyle: 'round', borderColor: 'green' }
    ));

    const { startNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startNow',
        message: 'Start the AI terminal now?',
        default: true
      }
    ]);

    if (startNow) {
      console.log(chalk.blue('\n🚀 Starting AI Terminal...\n'));
      
      // Dynamic import to avoid circular dependencies
      const { AITerminal } = await import('./ai-terminal');
      const terminal = new AITerminal();
      await terminal.start();
    }
  }
}

// Run the setup wizard
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.start().catch(console.error);
}

export { SetupWizard };