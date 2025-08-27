#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');

async function test() {
  console.log('Testing inquirer prompt behavior...\n');
  
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message: chalk.green('❯'),
      prefix: '',
      transformer: (input) => {
        if (input === '/') {
          return chalk.dim('/ (type to see commands...)');
        }
        return input;
      }
    }
  ]);
  
  console.log('You entered:', input);
  console.log('\nNow displaying result:');
  console.log('Result message here');
}

test().catch(console.error);