#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const dotenv_1 = require("dotenv");
const terminal_1 = require("./terminal");
const setup_1 = require("./setup");
(0, dotenv_1.config)(); // Load .env file
const program = new commander_1.Command();
program
    .name('redpill')
    .description('Natural language terminal for investment operations')
    .version('1.0.0');
program
    .command('start')
    .alias('s')
    .description('Start the interactive terminal')
    .option('--include-directories <dirs>', 'Include directories for project context (comma-separated)')
    .option('--session-id <id>', 'Resume specific conversation session')
    .action(async (options) => {
    const setup = new setup_1.SetupWizard();
    // Check if setup is needed
    if (setup.needsSetup()) {
        await setup.askForAPIKeyGuide();
    }
    const includeDirectories = options.includeDirectories?.split(',').map((d) => d.trim());
    const terminal = new terminal_1.RedpillTerminal({
        includeDirectories,
        sessionId: options.sessionId,
        nonInteractive: false
    });
    await terminal.start();
});
program
    .option('-p, --prompt <prompt>', 'Execute a single command (non-interactive mode)')
    .option('--include-directories <dirs>', 'Include directories for project context (comma-separated)')
    .option('--session-id <id>', 'Resume specific conversation session');
program
    .command('setup')
    .description('Configure API keys and settings')
    .action(async () => {
    const setup = new setup_1.SetupWizard();
    await setup.run();
});
// Quick professional commands
program
    .command('portfolio')
    .alias('pf')
    .description('Show portfolio overview and holdings')
    .option('-l, --list', 'List all holdings')
    .option('-s, --summary', 'Show portfolio summary (default)')
    .action(async (options) => {
    const terminal = new terminal_1.RedpillTerminal({ nonInteractive: true });
    try {
        const command = options.list ? 'portfolio list' : 'what\'s my portfolio';
        const result = await terminal.executeCommand(command);
        console.log(result.message);
        if (result.data) {
            // Pretty print portfolio data
            if (result.data.total_investments) {
                console.log(`\\n💰 Total Invested: $${(result.data.total_investments / 1000000).toFixed(1)}M`);
                console.log(`📈 Current Value: $${(result.data.total_current_valuation / 1000000).toFixed(1)}M`);
                console.log(`📊 Unrealized P&L: $${(result.data.unrealized_gain_loss / 1000000).toFixed(1)}M`);
                console.log(`🏢 Active Investments: ${result.data.active_investments}`);
            }
        }
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('keys')
    .alias('api')
    .description('Manage API keys and configuration')
    .option('-c, --check', 'Check API key status (default)')
    .option('-s, --setup', 'Setup API keys interactively')
    .action(async (options) => {
    if (options.setup) {
        const setup = new setup_1.SetupWizard();
        await setup.run();
    }
    else {
        const terminal = new terminal_1.RedpillTerminal({ nonInteractive: true });
        try {
            const result = await terminal.executeCommand('check api keys');
            console.log(result.message);
            process.exit(result.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }
});
program
    .command('market')
    .alias('m')
    .description('Get market data and prices')
    .option('-o, --overview', 'Market overview (default)')
    .option('-t, --ticker <symbol>', 'Get specific ticker price')
    .action(async (options) => {
    const terminal = new terminal_1.RedpillTerminal({ nonInteractive: true });
    try {
        let command = 'market overview';
        if (options.ticker) {
            command = `${options.ticker} price`;
        }
        const result = await terminal.executeCommand(command);
        console.log(result.message);
        process.exit(result.success ? 0 : 1);
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('status')
    .alias('st')
    .description('System status and health check')
    .action(async () => {
    const terminal = new terminal_1.RedpillTerminal({ nonInteractive: true });
    try {
        await terminal.showSystemStatus();
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('logs')
    .description('View and manage terminal logs')
    .option('-s, --stats', 'Show log statistics')
    .option('-r, --recent [count]', 'Show recent interactions (default: 10)')
    .option('-c, --clean', 'Clean old log files')
    .action(async (options) => {
    if (options.clean) {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            // Clean log files older than 7 days
            const logDir = path.join(process.cwd(), 'backend/logs/terminal');
            console.log('🧹 Cleaning old log files...');
            try {
                const files = await fs.readdir(logDir);
                const now = Date.now();
                const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
                let cleaned = 0;
                for (const file of files) {
                    const filePath = path.join(logDir, file);
                    const stats = await fs.stat(filePath);
                    if (stats.mtime.getTime() < weekAgo) {
                        await fs.unlink(filePath);
                        cleaned++;
                    }
                }
                console.log(`✅ Cleaned ${cleaned} old log files`);
            }
            catch (error) {
                console.log('ℹ️  No log files to clean or directory not found');
            }
        }
        catch (error) {
            console.error('Error cleaning logs:', error);
            process.exit(1);
        }
    }
    else if (options.stats) {
        try {
            const { spawn } = require('child_process');
            const python = spawn('python3', ['view_logs.py', '--stats'], {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            python.on('close', (code) => {
                process.exit(code);
            });
        }
        catch (error) {
            console.error('Error viewing log stats:', error);
            process.exit(1);
        }
    }
    else {
        // Recent logs (default)
        const count = options.recent === true ? 10 : (options.recent || 10);
        try {
            const { spawn } = require('child_process');
            const python = spawn('python3', ['view_logs.py', '--recent', '--limit', count.toString()], {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            python.on('close', (code) => {
                process.exit(code);
            });
        }
        catch (error) {
            console.error('Error viewing recent logs:', error);
            process.exit(1);
        }
    }
});
// Handle non-interactive mode and default behavior
program
    .action(async (options, cmd) => {
    if (options.prompt) {
        // Non-interactive mode
        const setup = new setup_1.SetupWizard();
        if (setup.needsSetup()) {
            console.log('⚠️  Setup required. Run: redpill setup');
            process.exit(1);
        }
        const includeDirectories = options.includeDirectories?.split(',').map((d) => d.trim());
        const terminal = new terminal_1.RedpillTerminal({
            includeDirectories,
            sessionId: options.sessionId,
            nonInteractive: true
        });
        try {
            const result = await terminal.executeCommand(options.prompt);
            console.log(result.message);
            if (result.data?.status_details) {
                result.data.status_details.forEach((detail) => console.log(`  ${detail}`));
            }
            process.exit(result.success ? 0 : 1);
        }
        catch (error) {
            console.error('Error:', error instanceof Error ? error.message : error);
            process.exit(1);
        }
    }
    else {
        // Default interactive mode
        const setup = new setup_1.SetupWizard();
        // Check if setup is needed
        if (setup.needsSetup()) {
            await setup.askForAPIKeyGuide();
        }
        const terminal = new terminal_1.RedpillTerminal();
        await terminal.start();
    }
});
// Parse command line arguments
program.parse(process.argv);
//# sourceMappingURL=index.js.map