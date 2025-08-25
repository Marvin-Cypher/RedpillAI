#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import boxen from 'boxen';
import { config } from 'dotenv';
import { RedpillTerminal } from './terminal';
import { SetupWizard } from './setup';

config(); // Load .env file

const program = new Command();

program
  .name('redpill')
  .description('Natural language terminal for investment operations')
  .version('1.0.0');

program
  .command('start')
  .alias('s')
  .description('Start the interactive terminal')
  .action(async () => {
    const setup = new SetupWizard();
    
    // Check if setup is needed
    if (setup.needsSetup()) {
      await setup.askForAPIKeyGuide();
    }
    
    const terminal = new RedpillTerminal();
    await terminal.start();
  });

program
  .command('setup')
  .description('Configure API keys and settings')
  .action(async () => {
    const setup = new SetupWizard();
    await setup.run();
  });

// Default command - start terminal
program
  .action(async () => {
    const setup = new SetupWizard();
    
    // Check if setup is needed
    if (setup.needsSetup()) {
      await setup.askForAPIKeyGuide();
    }
    
    const terminal = new RedpillTerminal();
    await terminal.start();
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  const setup = new SetupWizard();
  
  // Check if setup is needed
  if (setup.needsSetup()) {
    setup.askForAPIKeyGuide().then(() => {
      const terminal = new RedpillTerminal();
      terminal.start().catch(console.error);
    }).catch(console.error);
  } else {
    const terminal = new RedpillTerminal();
    terminal.start().catch(console.error);
  }
}