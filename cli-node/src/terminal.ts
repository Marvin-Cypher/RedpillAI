import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import axios from 'axios';

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class RedpillTerminal {
  private apiUrl: string;
  private apiKey?: string;

  constructor() {
    // Load .env from current directory if it exists
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
    
    this.apiUrl = process.env.REDPILL_API_URL || 'http://localhost:8000/api/v1';
    this.apiKey = process.env.REDPILL_API_KEY || process.env.OPENAI_API_KEY;
  }

  async start() {
    this.showWelcome();
    this.checkSetup();
    await this.runInteractiveMode();
  }

  private showWelcome() {
    console.clear();
    
    const welcome = boxen(
      chalk.green.bold('🚀 Redpill Terminal') + '\n' +
      chalk.dim('Natural language interface to OpenBB Platform') + '\n\n' +
      chalk.dim('Just describe what you want to do with your portfolio.'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    );

    console.log(welcome);
    
    console.log(chalk.dim('Examples:'));
    console.log(chalk.dim('  • analyze Tesla\'s fundamentals'));
    console.log(chalk.dim('  • show me tech stocks under $50'));
    console.log(chalk.dim('  • monitor BTC and ETH'));
    console.log(chalk.dim('  • what\'s happening in the market today?'));
    console.log(chalk.dim('  • import my portfolio from CSV'));
    console.log();
  }

  private checkSetup() {
    if (!this.apiKey) {
      console.log(chalk.yellow('⚠️  No API key found. Some features may be limited.'));
      console.log(chalk.dim('Set OPENAI_API_KEY or REDPILL_API_KEY environment variable.'));
      console.log();
    }
  }

  private async runInteractiveMode() {
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

        // Handle special commands
        if (this.isExitCommand(input)) {
          console.log(chalk.yellow('Goodbye! 👋'));
          process.exit(0);
        }

        if (this.isClearCommand(input)) {
          console.clear();
          this.showWelcome();
          continue;
        }

        if (this.isHelpCommand(input)) {
          this.showHelp();
          continue;
        }

        // Process natural language input
        await this.processInput(input);

      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
          console.log(chalk.yellow('\nGoodbye! 👋'));
          process.exit(0);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk.red('Error:'), errorMessage);
      }
    }
  }

  private async processInput(input: string) {
    const spinner = ora('Thinking...').start();

    try {
      // Try to connect to local backend first
      const result = await this.callBackend(input);
      
      if (result.success) {
        spinner.stop();
        this.displayResult(result);
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      // Fallback to simple processing
      spinner.text = 'Processing locally...';
      
      try {
        const result = await this.processLocally(input);
        spinner.stop();
        this.displayResult(result);
      } catch (localError) {
        spinner.stop();
        const errorMessage = localError instanceof Error ? localError.message : 'Unknown error';
        console.log(chalk.red('❌ Error:'), errorMessage);
        console.log(chalk.dim('Make sure the Redpill backend is running or check your API keys.'));
      }
    }
  }

  private async callBackend(input: string): Promise<CommandResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/terminal/execute`,
        {
          command: input,
          context: {
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: 30000
        }
      );

      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data
      };

    } catch (error) {
      throw new Error('Backend connection failed');
    }
  }

  private async processLocally(input: string): Promise<CommandResult> {
    // Simple local processing without OpenBB
    const lower = input.toLowerCase();
    
    if (lower.includes('price') && this.extractTickers(input).length > 0) {
      return {
        success: true,
        message: `To get real-time prices for ${this.extractTickers(input).join(', ')}, please ensure the backend is running with OpenBB integration.`,
        data: { type: 'info', tickers: this.extractTickers(input) }
      };
    }

    if (lower.includes('analyze') && this.extractTickers(input).length > 0) {
      return {
        success: true,
        message: `Analysis for ${this.extractTickers(input).join(', ')} would include fundamentals, technicals, and news. Backend required for live data.`,
        data: { type: 'info', tickers: this.extractTickers(input) }
      };
    }

    if (lower.includes('portfolio')) {
      return {
        success: true,
        message: 'Portfolio features require backend connection for data persistence and analysis.',
        data: { type: 'info' }
      };
    }

    // Default response
    return {
      success: true,
      message: `I understand you're asking about "${input}". For live market data and analysis, please start the Redpill backend server.`,
      data: { type: 'info' }
    };
  }

  private extractTickers(input: string): string[] {
    // Simple regex to find potential ticker symbols
    const tickerRegex = /\b[A-Z]{1,5}\b/g;
    return (input.match(tickerRegex) || []).filter(ticker => 
      ticker.length >= 2 && ticker.length <= 5
    );
  }

  private displayResult(result: CommandResult) {
    if (result.data?.visualization) {
      // Handle charts/visualizations
      console.log(chalk.blue('📊 Visualization:'));
      console.log(result.data.visualization);
    }

    if (result.data?.table) {
      // Handle table data
      console.table(result.data.table);
    }

    // Main message
    console.log(result.message);
    
    if (result.data?.next_steps) {
      console.log(chalk.dim('\nNext steps:'));
      result.data.next_steps.forEach((step: string) => {
        console.log(chalk.dim(`  • ${step}`));
      });
    }

    console.log(); // Add spacing
  }

  private isExitCommand(input: string): boolean {
    return ['exit', 'quit', 'q', 'bye'].includes(input.toLowerCase().trim());
  }

  private isClearCommand(input: string): boolean {
    return ['clear', 'cls'].includes(input.toLowerCase().trim());
  }

  private isHelpCommand(input: string): boolean {
    return ['help', '?', 'h'].includes(input.toLowerCase().trim());
  }

  private showHelp() {
    console.log(boxen(
      chalk.bold('Available Commands') + '\n\n' +
      chalk.green('Natural Language:') + '\n' +
      '  • analyze TSLA\n' +
      '  • what\'s the price of Bitcoin?\n' +
      '  • show me my portfolio\n' +
      '  • monitor AAPL and MSFT\n' +
      '  • import portfolio from CSV\n\n' +
      chalk.blue('Special Commands:') + '\n' +
      '  • help - Show this help\n' +
      '  • clear - Clear screen\n' +
      '  • exit - Exit terminal',
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));
    console.log();
  }
}