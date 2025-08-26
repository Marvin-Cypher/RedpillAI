import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import axios from 'axios';
import { BackendLauncher } from './backend-launcher';

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

export class RedpillTerminal {
  private apiUrl: string;
  private apiKey?: string;
  private sessionId?: string;
  private includeDirectories?: string[];
  private nonInteractive: boolean = false;
  private backendLauncher: BackendLauncher;

  constructor(options: {
    includeDirectories?: string[];
    nonInteractive?: boolean;
    sessionId?: string;
  } = {}) {
    // Load .env from current directory if it exists
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
    
    this.apiUrl = process.env.REDPILL_API_URL || 'http://localhost:8000/api/v1';
    this.apiKey = process.env.REDPILL_API_KEY || process.env.OPENAI_API_KEY;
    this.includeDirectories = options.includeDirectories;
    this.nonInteractive = options.nonInteractive || false;
    this.sessionId = options.sessionId;
    
    // Initialize backend launcher
    this.backendLauncher = new BackendLauncher();
    this.backendLauncher.setupCleanup();
  }

  async start() {
    if (!this.nonInteractive) {
      this.showWelcome();
      this.checkSetup();
      
      // Ensure backend is running before starting interactive mode
      if (!await this.backendLauncher.ensureBackendRunning()) {
        console.log(chalk.red('❌ Failed to start Redpill backend. Some features may not work.'));
        console.log(chalk.dim('You can still use basic terminal features.'));
      }
      
      await this.runInteractiveMode();
    }
  }

  async executeCommand(command: string): Promise<CommandResult> {
    // Execute a single command (for non-interactive mode)
    return await this.processInput(command);
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
            prefix: '',
            transformer: (input: string) => {
              // Show hint when user types "/"
              if (input === '/') {
                return chalk.dim('/ (type to see commands...)');
              }
              return input;
            }
          }
        ]);

        // Handle command discovery
        if (input.trim() === '/' || input.trim().startsWith('/')) {
          await this.handleCommandDiscovery(input);
          continue;
        }

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

  private async processInput(input: string): Promise<CommandResult> {
    const spinner = this.nonInteractive ? null : ora('Thinking...').start();

    try {
      // Try to connect to local backend first
      const result = await this.callBackend(input);
      
      if (result.success) {
        if (spinner) spinner.stop();
        if (!this.nonInteractive) {
          this.displayResult(result);
        }
        return result;
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      // Fallback to simple processing
      if (spinner) spinner.text = 'Processing locally...';
      
      try {
        const result = await this.processLocally(input);
        if (spinner) spinner.stop();
        if (!this.nonInteractive) {
          this.displayResult(result);
        }
        return result;
      } catch (localError) {
        if (spinner) spinner.stop();
        const errorMessage = localError instanceof Error ? localError.message : 'Unknown error';
        
        const errorResult: CommandResult = {
          success: false,
          message: errorMessage,
          data: { error: errorMessage }
        };
        
        if (!this.nonInteractive) {
          console.log(chalk.red('❌ Error:'), errorMessage);
          console.log(chalk.dim('Make sure the Redpill backend is running or check your API keys.'));
        }
        
        return errorResult;
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
          },
          session_id: this.sessionId,
          include_directories: this.includeDirectories,
          non_interactive: this.nonInteractive
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: 30000
        }
      );

      // Update session ID if provided
      if (response.data.session_id) {
        this.sessionId = response.data.session_id;
      }

      return {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data
      };

    } catch (error) {
      // Try to start backend if connection fails
      if (!await this.backendLauncher.isBackendRunning()) {
        console.log(chalk.yellow('🔄 Backend not responding, attempting to start...'));
        if (await this.backendLauncher.ensureBackendRunning()) {
          // Retry the request after backend starts
          try {
            const retryResponse = await axios.post(
              `${this.apiUrl}/terminal/execute`,
              {
                command: input,
                context: {
                  timestamp: new Date().toISOString(),
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                session_id: this.sessionId,
                include_directories: this.includeDirectories,
                non_interactive: this.nonInteractive
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
              success: retryResponse.data.success,
              message: retryResponse.data.message,
              data: retryResponse.data.data
            };
          } catch (retryError) {
            throw new Error('Backend connection failed after restart attempt');
          }
        }
      }
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

    // Display the main message (now includes OpenBB-style formatting from backend)
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

  private getAvailableCommands() {
    return {
      'Quick Commands': [
        { command: '/portfolio', description: 'Show portfolio overview and holdings' },
        { command: '/keys', description: 'Check API key status and configuration' },
        { command: '/market', description: 'Get market overview and data' },
        { command: '/status', description: 'System status and health check' },
        { command: '/logs', description: 'View recent terminal interactions' }
      ],
      'Analysis Commands': [
        { command: '/analyze [ticker]', description: 'Analyze a specific stock or crypto' },
        { command: '/price [ticker]', description: 'Get current price for ticker' },
        { command: '/news [company]', description: 'Get latest news for company' },
        { command: '/chart [ticker]', description: 'Show price chart for ticker' }
      ],
      'Portfolio Commands': [
        { command: '/holdings', description: 'List all portfolio holdings' },
        { command: '/performance', description: 'Show portfolio performance metrics' },
        { command: '/import', description: 'Import portfolio from CSV/JSON' },
        { command: '/export', description: 'Export portfolio data' }
      ],
      'System Commands': [
        { command: '/help', description: 'Show this help menu' },
        { command: '/clear', description: 'Clear the terminal screen' },
        { command: '/session', description: 'Show current session info' },
        { command: '/exit', description: 'Exit the terminal' }
      ]
    };
  }

  private async handleCommandDiscovery(input: string) {
    const trimmed = input.trim();
    
    if (trimmed === '/') {
      // Show all available commands
      this.showCommandMenu();
      return;
    }

    // Handle command search/filtering
    const searchTerm = trimmed.substring(1); // Remove the '/'
    const allCommands = this.getAvailableCommands();
    const matches: Array<{category: string, command: string, description: string}> = [];

    // Find matching commands
    Object.entries(allCommands).forEach(([category, commands]) => {
      commands.forEach(cmd => {
        if (cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) || 
            cmd.description.toLowerCase().includes(searchTerm.toLowerCase())) {
          matches.push({ category, ...cmd });
        }
      });
    });

    if (matches.length === 0) {
      console.log(chalk.yellow('No matching commands found.'));
      console.log(chalk.dim('Type "/" to see all available commands.'));
      return;
    }

    if (matches.length === 1) {
      // Single match - execute it or show details
      const match = matches[0];
      const commandToExecute = match.command.replace(/\\[.*?\\]/g, '').trim();
      
      if (match.command.includes('[')) {
        console.log(chalk.blue('Command:'), match.command);
        console.log(chalk.dim('Description:'), match.description);
        console.log(chalk.dim('Example: '), match.command.replace(/\[ticker\]/g, 'AAPL').replace(/\[company\]/g, 'Tesla'));
      } else {
        // Execute the command directly
        await this.processInput(commandToExecute.substring(1)); // Remove '/' for processing
      }
      return;
    }

    // Multiple matches - show filtered list
    console.log(chalk.blue(`Found ${matches.length} matching commands:\n`));
    
    const groupedMatches: {[key: string]: Array<{command: string, description: string}>} = {};
    matches.forEach(match => {
      if (!groupedMatches[match.category]) {
        groupedMatches[match.category] = [];
      }
      groupedMatches[match.category].push({ command: match.command, description: match.description });
    });

    Object.entries(groupedMatches).forEach(([category, commands]) => {
      console.log(chalk.green.bold(category + ':'));
      commands.forEach(cmd => {
        console.log(chalk.cyan(`  ${cmd.command.padEnd(20)}`), chalk.dim(cmd.description));
      });
      console.log();
    });
  }

  private showCommandMenu() {
    console.log(boxen(
      chalk.bold('🚀 Available Commands\n') +
      chalk.dim('Type "/" followed by a command or search term\n'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'blue'
      }
    ));

    const commands = this.getAvailableCommands();
    
    Object.entries(commands).forEach(([category, cmds]) => {
      console.log(chalk.green.bold(category + ':'));
      cmds.forEach(cmd => {
        console.log(chalk.cyan(`  ${cmd.command.padEnd(25)}`), chalk.dim(cmd.description));
      });
      console.log();
    });

    console.log(chalk.dim('Examples:'));
    console.log(chalk.dim('  • /portfolio - Show portfolio overview'));
    console.log(chalk.dim('  • /analyze TSLA - Analyze Tesla stock'));
    console.log(chalk.dim('  • /market - Get market overview'));
    console.log(chalk.dim('  • /port - Search commands containing "port"'));
    console.log();
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
      chalk.blue('Quick Commands (type "/"):') + '\n' +
      '  • /portfolio - Portfolio overview\n' +
      '  • /keys - API key status\n' +
      '  • /market - Market data\n' +
      '  • /status - System status\n\n' +
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