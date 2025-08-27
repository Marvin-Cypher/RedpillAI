#!/usr/bin/env node

const { RedpillTerminal } = require('./dist/terminal.js');

async function testCommands() {
  const terminal = new RedpillTerminal({
    nonInteractive: true
  });

  const testCases = [
    'technology sector performance',
    'BTC vs QQQ correlation', 
    'sector analysis',
    'Tesla news today'
  ];

  console.log('Testing improved CLI with backend integration...\n');

  for (const command of testCases) {
    console.log(`Testing: "${command}"`);
    const startTime = Date.now();
    
    try {
      const result = await terminal.executeCommand(command);
      const elapsed = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ Success (${elapsed}ms): ${result.message.split('\n')[0]}`);
      } else {
        console.log(`❌ Failed: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

testCommands().catch(console.error);