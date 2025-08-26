"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedpillTerminal = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const boxen_1 = __importDefault(require("boxen"));
const axios_1 = __importDefault(require("axios"));
const backend_launcher_1 = require("./backend-launcher");
class RedpillTerminal {
    constructor(options = {}) {
        this.nonInteractive = false;
        // Load .env from current directory if it exists
        const dotenv = require('dotenv');
        dotenv.config({ path: '.env' });
        this.apiUrl = process.env.REDPILL_API_URL || 'http://localhost:8000/api/v1';
        this.apiKey = process.env.REDPILL_API_KEY || process.env.OPENAI_API_KEY;
        this.includeDirectories = options.includeDirectories;
        this.nonInteractive = options.nonInteractive || false;
        this.sessionId = options.sessionId;
        // Initialize backend launcher
        this.backendLauncher = new backend_launcher_1.BackendLauncher();
        this.backendLauncher.setupCleanup();
    }
    async start() {
        if (!this.nonInteractive) {
            this.showWelcome();
            this.checkSetup();
            // Ensure backend is running before starting interactive mode
            if (!await this.backendLauncher.ensureBackendRunning()) {
                console.log(chalk_1.default.red('❌ Failed to start Redpill backend. Some features may not work.'));
                console.log(chalk_1.default.dim('You can still use basic terminal features.'));
            }
            await this.runInteractiveMode();
        }
    }
    async executeCommand(command) {
        // Execute a single command (for non-interactive mode)
        return await this.processInput(command);
    }
    showWelcome() {
        console.clear();
        const welcome = (0, boxen_1.default)(chalk_1.default.green.bold('🚀 Redpill Terminal') + '\n' +
            chalk_1.default.dim('Natural language interface to OpenBB Platform') + '\n\n' +
            chalk_1.default.dim('Just describe what you want to do with your portfolio.'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green'
        });
        console.log(welcome);
        console.log(chalk_1.default.dim('Examples:'));
        console.log(chalk_1.default.dim('  • analyze Tesla\'s fundamentals'));
        console.log(chalk_1.default.dim('  • show me tech stocks under $50'));
        console.log(chalk_1.default.dim('  • monitor BTC and ETH'));
        console.log(chalk_1.default.dim('  • what\'s happening in the market today?'));
        console.log(chalk_1.default.dim('  • import my portfolio from CSV'));
        console.log();
    }
    checkSetup() {
        if (!this.apiKey) {
            console.log(chalk_1.default.yellow('⚠️  No API key found. Some features may be limited.'));
            console.log(chalk_1.default.dim('Set OPENAI_API_KEY or REDPILL_API_KEY environment variable.'));
            console.log();
        }
    }
    async runInteractiveMode() {
        while (true) {
            try {
                const { input } = await inquirer_1.default.prompt([
                    {
                        type: 'input',
                        name: 'input',
                        message: chalk_1.default.green('❯'),
                        prefix: '',
                        transformer: (input) => {
                            // Show hint when user types "/"
                            if (input === '/') {
                                return chalk_1.default.dim('/ (type to see commands...)');
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
                    console.log(chalk_1.default.yellow('Goodbye! 👋'));
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
            }
            catch (error) {
                if (error && typeof error === 'object' && 'name' in error && error.name === 'ExitPromptError') {
                    console.log(chalk_1.default.yellow('\nGoodbye! 👋'));
                    process.exit(0);
                }
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(chalk_1.default.red('Error:'), errorMessage);
            }
        }
    }
    async processInput(input) {
        const spinner = this.nonInteractive ? null : (0, ora_1.default)('Thinking...').start();
        try {
            // Try to connect to local backend first
            const result = await this.callBackend(input);
            if (result.success) {
                if (spinner)
                    spinner.stop();
                if (!this.nonInteractive) {
                    this.displayResult(result);
                }
                return result;
            }
            else {
                throw new Error(result.message);
            }
        }
        catch (error) {
            // Fallback to simple processing
            if (spinner)
                spinner.text = 'Processing locally...';
            try {
                const result = await this.processLocally(input);
                if (spinner)
                    spinner.stop();
                if (!this.nonInteractive) {
                    this.displayResult(result);
                }
                return result;
            }
            catch (localError) {
                if (spinner)
                    spinner.stop();
                const errorMessage = localError instanceof Error ? localError.message : 'Unknown error';
                const errorResult = {
                    success: false,
                    message: errorMessage,
                    data: { error: errorMessage }
                };
                if (!this.nonInteractive) {
                    console.log(chalk_1.default.red('❌ Error:'), errorMessage);
                    console.log(chalk_1.default.dim('Make sure the Redpill backend is running or check your API keys.'));
                }
                return errorResult;
            }
        }
    }
    async callBackend(input) {
        try {
            const response = await axios_1.default.post(`${this.apiUrl}/terminal/execute`, {
                command: input,
                context: {
                    timestamp: new Date().toISOString(),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                session_id: this.sessionId,
                include_directories: this.includeDirectories,
                non_interactive: this.nonInteractive
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                },
                timeout: 30000
            });
            // Update session ID if provided
            if (response.data.session_id) {
                this.sessionId = response.data.session_id;
            }
            return {
                success: response.data.success,
                message: response.data.message,
                data: response.data.data
            };
        }
        catch (error) {
            // Try to start backend if connection fails
            if (!await this.backendLauncher.isBackendRunning()) {
                console.log(chalk_1.default.yellow('🔄 Backend not responding, attempting to start...'));
                if (await this.backendLauncher.ensureBackendRunning()) {
                    // Retry the request after backend starts
                    try {
                        const retryResponse = await axios_1.default.post(`${this.apiUrl}/terminal/execute`, {
                            command: input,
                            context: {
                                timestamp: new Date().toISOString(),
                                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                            },
                            session_id: this.sessionId,
                            include_directories: this.includeDirectories,
                            non_interactive: this.nonInteractive
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
                            },
                            timeout: 30000
                        });
                        return {
                            success: retryResponse.data.success,
                            message: retryResponse.data.message,
                            data: retryResponse.data.data
                        };
                    }
                    catch (retryError) {
                        throw new Error('Backend connection failed after restart attempt');
                    }
                }
            }
            throw new Error('Backend connection failed');
        }
    }
    async processLocally(input) {
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
    extractTickers(input) {
        // Simple regex to find potential ticker symbols
        const tickerRegex = /\b[A-Z]{1,5}\b/g;
        return (input.match(tickerRegex) || []).filter(ticker => ticker.length >= 2 && ticker.length <= 5);
    }
    displayResult(result) {
        if (result.data?.visualization) {
            // Handle charts/visualizations
            console.log(chalk_1.default.blue('📊 Visualization:'));
            console.log(result.data.visualization);
        }
        if (result.data?.table) {
            // Handle table data
            console.table(result.data.table);
        }
        // Display the main message (now includes OpenBB-style formatting from backend)
        console.log(result.message);
        if (result.data?.next_steps) {
            console.log(chalk_1.default.dim('\nNext steps:'));
            result.data.next_steps.forEach((step) => {
                console.log(chalk_1.default.dim(`  • ${step}`));
            });
        }
        console.log(); // Add spacing
    }
    isExitCommand(input) {
        return ['exit', 'quit', 'q', 'bye'].includes(input.toLowerCase().trim());
    }
    isClearCommand(input) {
        return ['clear', 'cls'].includes(input.toLowerCase().trim());
    }
    isHelpCommand(input) {
        return ['help', '?', 'h'].includes(input.toLowerCase().trim());
    }
    getAvailableCommands() {
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
    async handleCommandDiscovery(input) {
        const trimmed = input.trim();
        if (trimmed === '/') {
            // Show all available commands
            this.showCommandMenu();
            return;
        }
        // Handle command search/filtering
        const searchTerm = trimmed.substring(1); // Remove the '/'
        const allCommands = this.getAvailableCommands();
        const matches = [];
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
            console.log(chalk_1.default.yellow('No matching commands found.'));
            console.log(chalk_1.default.dim('Type "/" to see all available commands.'));
            return;
        }
        if (matches.length === 1) {
            // Single match - execute it or show details
            const match = matches[0];
            const commandToExecute = match.command.replace(/\\[.*?\\]/g, '').trim();
            if (match.command.includes('[')) {
                console.log(chalk_1.default.blue('Command:'), match.command);
                console.log(chalk_1.default.dim('Description:'), match.description);
                console.log(chalk_1.default.dim('Example: '), match.command.replace(/\[ticker\]/g, 'AAPL').replace(/\[company\]/g, 'Tesla'));
            }
            else {
                // Execute the command directly
                await this.processInput(commandToExecute.substring(1)); // Remove '/' for processing
            }
            return;
        }
        // Multiple matches - show filtered list
        console.log(chalk_1.default.blue(`Found ${matches.length} matching commands:\n`));
        const groupedMatches = {};
        matches.forEach(match => {
            if (!groupedMatches[match.category]) {
                groupedMatches[match.category] = [];
            }
            groupedMatches[match.category].push({ command: match.command, description: match.description });
        });
        Object.entries(groupedMatches).forEach(([category, commands]) => {
            console.log(chalk_1.default.green.bold(category + ':'));
            commands.forEach(cmd => {
                console.log(chalk_1.default.cyan(`  ${cmd.command.padEnd(20)}`), chalk_1.default.dim(cmd.description));
            });
            console.log();
        });
    }
    showCommandMenu() {
        console.log((0, boxen_1.default)(chalk_1.default.bold('🚀 Available Commands\n') +
            chalk_1.default.dim('Type "/" followed by a command or search term\n'), {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));
        const commands = this.getAvailableCommands();
        Object.entries(commands).forEach(([category, cmds]) => {
            console.log(chalk_1.default.green.bold(category + ':'));
            cmds.forEach(cmd => {
                console.log(chalk_1.default.cyan(`  ${cmd.command.padEnd(25)}`), chalk_1.default.dim(cmd.description));
            });
            console.log();
        });
        console.log(chalk_1.default.dim('Examples:'));
        console.log(chalk_1.default.dim('  • /portfolio - Show portfolio overview'));
        console.log(chalk_1.default.dim('  • /analyze TSLA - Analyze Tesla stock'));
        console.log(chalk_1.default.dim('  • /market - Get market overview'));
        console.log(chalk_1.default.dim('  • /port - Search commands containing "port"'));
        console.log();
    }
    showHelp() {
        console.log((0, boxen_1.default)(chalk_1.default.bold('Available Commands') + '\n\n' +
            chalk_1.default.green('Natural Language:') + '\n' +
            '  • analyze TSLA\n' +
            '  • what\'s the price of Bitcoin?\n' +
            '  • show me my portfolio\n' +
            '  • monitor AAPL and MSFT\n' +
            '  • import portfolio from CSV\n\n' +
            chalk_1.default.blue('Quick Commands (type "/"):') + '\n' +
            '  • /portfolio - Portfolio overview\n' +
            '  • /keys - API key status\n' +
            '  • /market - Market data\n' +
            '  • /status - System status\n\n' +
            chalk_1.default.blue('Special Commands:') + '\n' +
            '  • help - Show this help\n' +
            '  • clear - Clear screen\n' +
            '  • exit - Exit terminal', {
            padding: 1,
            borderStyle: 'round',
            borderColor: 'blue'
        }));
        console.log();
    }
}
exports.RedpillTerminal = RedpillTerminal;
//# sourceMappingURL=terminal.js.map