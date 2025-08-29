import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import axios from 'axios';
import { BackendLauncher } from './backend-launcher';
import * as fs from 'fs';
import * as path from 'path';
import { getAdaptiveAsciiArt } from './branding';
import { ColorSchemes, type ColorScheme, getChalkColor } from './color-utils';
import { EnhancedInput } from './enhanced-input';
import { AdvancedTerminalRenderer } from './terminal-renderer';

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
  private logFile: string;
  private debugMode: boolean = false;
  private colorScheme: ColorScheme = 'default';
  private enhancedInput: EnhancedInput;
  private renderer: AdvancedTerminalRenderer;

  constructor(options: {
    includeDirectories?: string[];
    nonInteractive?: boolean;
    sessionId?: string;
  } = {}) {
    // Load .env from current directory if it exists
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
    
    this.apiUrl = process.env.REDPILL_API_URL || 'http://localhost:8001/api/v2';
    this.apiKey = process.env.REDPILL_API_KEY || process.env.OPENAI_API_KEY;
    this.includeDirectories = options.includeDirectories;
    this.nonInteractive = options.nonInteractive || false;
    this.sessionId = options.sessionId;
    this.debugMode = process.env.REDPILL_DEBUG === 'true' || process.argv.includes('--debug');
    
    // Setup comprehensive logging
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFile = path.join(logsDir, `terminal-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`);
    
    // Initialize backend launcher
    this.backendLauncher = new BackendLauncher();
    this.backendLauncher.setupCleanup();
    
    // Initialize enhanced input system
    this.enhancedInput = new EnhancedInput({
      colorScheme: this.colorScheme,
      enableFileCompletion: true,
      enableCommandCompletion: true
    });

    // Initialize advanced terminal renderer (fixes truncation issues)
    this.renderer = new AdvancedTerminalRenderer({
      terminalWidth: process.stdout.columns || 80,
      terminalHeight: process.stdout.rows || 24,
      colorScheme: this.colorScheme
    });

    // Initialize logging
    console.log('✅ RedpillTerminal initialized with V2 API:', this.apiUrl);
  }

  async start() {
    if (!this.nonInteractive) {
      await this.showWelcome();
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

  async showSystemStatus(): Promise<void> {
    console.log(chalk.bold('🔍 Redpill System Status\n'));
    
    // Get CLI version
    const packageJson = require('../package.json');
    const cliVersion = packageJson.version;
    console.log(chalk.green('✅ CLI:'), `v${cliVersion}`);
    
    // Check backend health
    const spinner = ora('Checking backend health...').start();
    const backendStatus = await this.checkBackendHealth();
    spinner.stop();
    
    if (backendStatus.healthy) {
      console.log(backendStatus.message);
    } else {
      console.log(backendStatus.message);
    }
    
    // Check API configuration
    console.log('\n📋 Configuration:');
    console.log('  API URL:', chalk.dim(this.apiUrl));
    console.log('  API Key:', this.apiKey ? chalk.green('✅ Configured') : chalk.red('❌ Not set'));
    console.log('  Session ID:', this.sessionId || chalk.dim('Not set'));
    
    // Test backend connection
    if (backendStatus.healthy) {
      console.log('\n🧪 Testing backend connection...');
      try {
        const testResult = await this.executeCommand('help');
        if (testResult.success) {
          console.log(chalk.green('✅ Backend connection working'));
        } else {
          console.log(chalk.yellow('⚠️ Backend connection issues'));
        }
      } catch (error) {
        console.log(chalk.red('❌ Backend connection failed'));
      }
    }
    
    console.log();
  }

  private async showWelcome() {
    console.clear();
    
    // Get terminal width for adaptive branding
    const terminalWidth = process.stdout.columns || 80;
    const colors = ColorSchemes[this.colorScheme];
    
    // Display adaptive ASCII art
    const asciiArt = getAdaptiveAsciiArt(terminalWidth);
    console.log(getChalkColor(colors.primary)(asciiArt));
    
    // Get version from package.json
    const packageJson = require('../package.json');
    const cliVersion = packageJson.version;
    
    // Check backend health and get version
    const backendStatus = await this.checkBackendHealth();
    
    const welcome = boxen(
      getChalkColor(colors.accent)('AI-Powered Investment Terminal') + chalk.dim(` v${cliVersion}`) + '\n' +
      chalk.dim('Claude Code architecture with natural language interface') + '\n\n' +
      backendStatus.message,
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: backendStatus.healthy ? colors.success : colors.warning
      }
    );

    console.log(welcome);
    
    console.log(getChalkColor(colors.dim)('💡 Natural language examples:'));
    console.log(getChalkColor(colors.dim)('  • what api keys should i fill in'));
    console.log(getChalkColor(colors.dim)('  • import my portfolio from /path/to/file.csv'));
    console.log(getChalkColor(colors.dim)('  • show my portfolio and create charts'));
    console.log(getChalkColor(colors.dim)('  • help'));
    console.log(getChalkColor(colors.dim)('  • /theme matrix  (change color scheme)'));
    console.log();
  }

  private async checkBackendHealth(): Promise<{ healthy: boolean; message: string; version?: string }> {
    try {
      const response = await axios.get(`${this.apiUrl.replace('/api/v1', '')}/health`, {
        timeout: 5000
      });
      
      if (response.data.status === 'healthy') {
        const backendVersion = response.data.version || 'unknown';
        const architecture = response.data.claude_code_architecture ? 'Claude Code' : 'Legacy';
        return {
          healthy: true,
          message: chalk.green(`🔗 Backend: ${architecture} v${backendVersion} (${response.data.environment})`),
          version: backendVersion
        };
      } else {
        return {
          healthy: false,
          message: chalk.yellow('⚠️ Backend: Unhealthy response')
        };
      }
    } catch (error) {
      return {
        healthy: false,
        message: chalk.red('❌ Backend: Not connected (run: cd backend && uvicorn app.main:app --reload)')
      };
    }
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
        const colors = ColorSchemes[this.colorScheme];
        
        // Use enhanced input system
        const input = await this.enhancedInput.prompt();
        
        // Clear line and show clean input (avoid duplication)
        if (!this.nonInteractive && input.trim()) {
          // Just move to next line, input already shown by inquirer
          process.stdout.write('\n');
        }

        // Handle theme switching first (before command discovery)
        if (input.trim().startsWith('/theme')) {
          const themeParts = input.trim().split(' ');
          const themeName = themeParts.length > 1 ? themeParts[1] : '';
          this.handleThemeChange(themeName);
          continue;
        }

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

        // Send help command to Claude Code backend instead of local processing
        // if (this.isHelpCommand(input)) {
        //   this.showHelp();
        //   continue;
        // }

        // Process enhanced input with context detection
        const inputContext = this.enhancedInput.processInput(input);
        
        // Handle file context display
        if (inputContext.fileContext.length > 0) {
          console.log(getChalkColor(colors.accent)('📁 File context detected:'));
          inputContext.fileContext.forEach(file => {
            console.log(getChalkColor(colors.dim)(`  • ${file}`));
          });
        }

        // Handle shell commands
        if (inputContext.isShellCommand && inputContext.shellCommand) {
          console.log(getChalkColor(colors.accent)('🔧 Shell command:'), getChalkColor(colors.primary)(inputContext.shellCommand));
          console.log(getChalkColor(colors.dim)('Note: Shell execution not implemented yet'));
          continue;
        }

        // Process natural language input with context
        await this.processInput(inputContext.cleanInput, inputContext);

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

  private async processInput(input: string, context?: any): Promise<CommandResult> {
    // Enhanced logging with progress indicators
    const spinner = this.nonInteractive ? null : ora({
      text: '🤖 AI analyzing your request...',
      color: 'cyan'
    }).start();

    try {
      if (spinner) {
        spinner.text = '🔗 Connecting to AI backend...';
      }
      
      // Try to connect to local backend first
      const result = await this.callBackend(input, context);
      
      if (result.success) {
        if (spinner) {
          spinner.succeed('✅ Request completed successfully');
        }
        if (!this.nonInteractive) {
          this.displayResult(result);
        }
        return result;
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      // Check if it's an axios error with response
      if (axios.isAxiosError(error)) {
        // If we got a response from server, it's working but had an error
        if (error.response) {
          if (spinner) {
            spinner.fail('❌ Server responded with error');
          }
          const errorMessage = error.response.data?.message || 'Server error';
          
          if (!this.nonInteractive) {
            console.log(chalk.red('❌'), errorMessage);
            
            // Show Claude Code suggested actions if available
            const suggestedActions = error.response.data?.suggested_actions;
            if (suggestedActions && suggestedActions.length > 0) {
              console.log(chalk.dim('\n💡 Suggestions:'));
              suggestedActions.forEach((action: string) => {
                console.log(chalk.dim(`  • ${action}`));
              });
            }
          }
          
          return {
            success: false,
            message: errorMessage,
            data: error.response.data
          };
        }
        
        // If it's a timeout or connection error
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          if (spinner) {
            spinner.warn('⏱️ Request timed out - operation might still be processing');
          }
          
          if (!this.nonInteractive) {
            console.log(chalk.yellow('⏱️ Request timed out. The operation might still be processing.'));
            console.log(chalk.dim('Try increasing timeout or check backend logs.'));
          }
          
          return {
            success: false,
            message: 'Request timed out',
            data: { error: 'timeout' }
          };
        }
        
        // Connection refused - backend not running
        if (error.code === 'ECONNREFUSED') {
          if (spinner) {
            spinner.fail('🔌 Cannot connect to backend - is it running?');
          }
          
          if (!this.nonInteractive) {
            console.log(chalk.red('❌ Cannot connect to backend server'));
            console.log(chalk.dim('  • Make sure the backend is running: cd backend && uvicorn app.main:app --reload'));
            console.log(chalk.dim('  • Check if port 8000 is available'));
            console.log(chalk.dim('  • Verify your network connection'));
          }
          
          return {
            success: false,
            message: 'Backend not available - please start the server',
            data: { error: 'connection_refused' }
          };
        }
      }
      
      // General error handling
      if (spinner) {
        spinner.fail('❌ Request failed');
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (!this.nonInteractive) {
        console.log(chalk.red('❌ Error:'), errorMessage);
      }
      
      return {
        success: false,
        message: `Backend request failed: ${errorMessage}`,
        data: { error: error }
      };
    }
  }

  private async callBackend(input: string, context?: any): Promise<CommandResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/terminal/query`,
        {
          query: input,
          user_id: this.sessionId || "default",
          context: {
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            include_directories: this.includeDirectories,
            non_interactive: this.nonInteractive,
            file_context: context?.fileContext || [],
            enhanced_input: true
          },
          debug: this.debugMode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
          },
          timeout: 60000  // Increased to 60 seconds for complex operations
        }
      );

      // Update session ID from intent if provided
      if (response.data.intent?.session_id) {
        this.sessionId = response.data.intent.session_id;
      }

      const result: CommandResult = {
        success: response.data.success,
        message: response.data.message,
        data: response.data.data
      };

      // Add Claude Code observability information if in debug mode
      if (process.env.DEBUG === 'true' && response.data.trace) {
        result.data = {
          ...result.data,
          intent: response.data.intent,
          trace: response.data.trace,
          execution_time_ms: response.data.execution_time_ms,
          suggested_actions: response.data.suggested_actions
        };
      }

      return result;

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
                timeout: 60000  // Increased to 60 seconds for complex operations
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


  private displayResult(result: CommandResult) {
    // Use advanced renderer instead of basic console.log (fixes truncation)
    this.renderer.renderResponse(result.message, result.data);
    
    // Handle next steps if present
    if (result.data?.next_steps) {
      console.log(getChalkColor('dim')('\nNext steps:'));
      result.data.next_steps.forEach((step: string) => {
        console.log(getChalkColor('dim')(`  • ${step}`));
      });
      console.log(); // Add spacing
    }
  }

  private isExitCommand(input: string): boolean {
    return ['exit', 'quit', 'q', 'bye'].includes(input.toLowerCase().trim());
  }

  private isClearCommand(input: string): boolean {
    return ['clear', 'cls'].includes(input.toLowerCase().trim());
  }

  // Removed - help now handled by AI backend

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
        { command: '/theme [name]', description: 'Change color theme (default, matrix, neon)' },
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

  private handleThemeChange(themeName: string) {
    const availableThemes = Object.keys(ColorSchemes);
    
    if (!themeName) {
      console.log(chalk.blue('Available themes:'), availableThemes.join(', '));
      console.log(chalk.dim('Usage: /theme <name>'));
      return;
    }
    
    if (availableThemes.includes(themeName as ColorScheme)) {
      this.colorScheme = themeName as ColorScheme;
      
      // Update renderer with new theme
      this.renderer = new AdvancedTerminalRenderer({
        terminalWidth: process.stdout.columns || 80,
        terminalHeight: process.stdout.rows || 24,
        colorScheme: this.colorScheme
      });
      
      console.log(chalk.green(`✅ Theme changed to: ${themeName}`));
      // Refresh display
      setTimeout(() => this.showWelcome(), 500);
    } else {
      console.log(chalk.red(`❌ Unknown theme: ${themeName}`));
      console.log(chalk.dim('Available themes:'), availableThemes.join(', '));
    }
  }

  private async handleAdvancedInput(input: string) {
    // Enhanced input processing inspired by Gemini CLI
    const colors = ColorSchemes[this.colorScheme];
    
    // Handle file context (@file syntax)
    if (input.includes('@')) {
      const fileMatches = input.match(/@([^\s]+)/g);
      if (fileMatches) {
        console.log(getChalkColor(colors.accent)('📁 File context detected:'));
        fileMatches.forEach(match => {
          const filePath = match.substring(1);
          console.log(getChalkColor(colors.dim)(`  • ${filePath}`));
        });
      }
    }

    // Handle shell mode (!command syntax)
    if (input.startsWith('!')) {
      const shellCommand = input.substring(1).trim();
      console.log(getChalkColor(colors.accent)('🔧 Shell command:'), getChalkColor(colors.primary)(shellCommand));
      
      // For now, just show what would be executed
      console.log(getChalkColor(colors.dim)('Note: Shell execution not implemented yet'));
      return;
    }

    // Process through normal AI pipeline
    return await this.processInput(input);
  }

  // Enhanced help system with organized sections
  private showEnhancedHelp() {
    const colors = ColorSchemes[this.colorScheme];
    
    console.log(boxen(
      getChalkColor(colors.primary, 'bold')('🚀 RedPill Terminal Help\n') +
      getChalkColor(colors.dim)('Natural language AI investment terminal\n'),
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: colors.accent
      }
    ));

    console.log(getChalkColor(colors.primary, 'bold')('Basics:'));
    console.log(getChalkColor(colors.secondary)('  Add context'), '- Use', getChalkColor(colors.accent, 'bold')('@'), 'to reference files (e.g.,', getChalkColor(colors.accent, 'bold')('@data/portfolio.csv'), ')');
    console.log(getChalkColor(colors.secondary)('  Shell mode'), '- Use', getChalkColor(colors.accent, 'bold')('!'), 'to execute shell commands (e.g.,', getChalkColor(colors.accent, 'bold')('!ls'), ')');
    console.log(getChalkColor(colors.secondary)('  Natural language'), '- Just type what you want (e.g.,', getChalkColor(colors.accent, 'bold')('show my portfolio'), ')');
    console.log();

    console.log(getChalkColor(colors.primary, 'bold')('Quick Commands:'));
    console.log(getChalkColor(colors.accent)('  /portfolio'), '- Show portfolio overview');
    console.log(getChalkColor(colors.accent)('  /market'), '- Market overview and indices');
    console.log(getChalkColor(colors.accent)('  /theme <name>'), '- Change color theme (default, matrix, neon)');
    console.log(getChalkColor(colors.accent)('  /status'), '- System health check');
    console.log(getChalkColor(colors.accent)('  /'), '- Show all available commands');
    console.log();

    console.log(getChalkColor(colors.primary, 'bold')('Keyboard Shortcuts:'));
    console.log(getChalkColor(colors.accent)('  Ctrl+C'), '- Exit terminal');
    console.log(getChalkColor(colors.accent)('  Ctrl+L'), '- Clear screen (or type "clear")');
    console.log(getChalkColor(colors.accent)('  Up/Down'), '- Command history');
    console.log(getChalkColor(colors.accent)('  Tab'), '- Auto-completion (when available)');
    console.log();

    console.log(getChalkColor(colors.primary, 'bold')('Examples:'));
    console.log(getChalkColor(colors.dim)('  • what api keys should i fill in'));
    console.log(getChalkColor(colors.dim)('  • import my portfolio from @/path/to/file.csv'));
    console.log(getChalkColor(colors.dim)('  • show BTC and ETH prices'));
    console.log(getChalkColor(colors.dim)('  • create a chart comparing AAPL vs MSFT'));
    console.log(getChalkColor(colors.dim)('  • !ls -la (execute shell command)'));
    console.log();
  }
}