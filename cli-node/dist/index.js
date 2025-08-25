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
    .action(async () => {
    const setup = new setup_1.SetupWizard();
    // Check if setup is needed
    if (setup.needsSetup()) {
        await setup.askForAPIKeyGuide();
    }
    const terminal = new terminal_1.RedpillTerminal();
    await terminal.start();
});
program
    .command('setup')
    .description('Configure API keys and settings')
    .action(async () => {
    const setup = new setup_1.SetupWizard();
    await setup.run();
});
// Default command - start terminal
program
    .action(async () => {
    const setup = new setup_1.SetupWizard();
    // Check if setup is needed
    if (setup.needsSetup()) {
        await setup.askForAPIKeyGuide();
    }
    const terminal = new terminal_1.RedpillTerminal();
    await terminal.start();
});
// Parse command line arguments
program.parse(process.argv);
// If no arguments, show help
if (!process.argv.slice(2).length) {
    const setup = new setup_1.SetupWizard();
    // Check if setup is needed
    if (setup.needsSetup()) {
        setup.askForAPIKeyGuide().then(() => {
            const terminal = new terminal_1.RedpillTerminal();
            terminal.start().catch(console.error);
        }).catch(console.error);
    }
    else {
        const terminal = new terminal_1.RedpillTerminal();
        terminal.start().catch(console.error);
    }
}
