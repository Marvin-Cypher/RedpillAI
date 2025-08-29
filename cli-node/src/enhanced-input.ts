/**
 * Enhanced input system inspired by Gemini CLI
 * Features: autocompletion, history, file context detection
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { ColorSchemes, type ColorScheme, getChalkColor } from './color-utils';

export interface InputOptions {
  colorScheme: ColorScheme;
  prompt?: string;
  placeholder?: string;
  enableFileCompletion?: boolean;
  enableCommandCompletion?: boolean;
  history?: string[];
}

export class EnhancedInput {
  private history: string[] = [];
  private historyIndex: number = -1;
  private commands: string[] = [
    '/portfolio', '/market', '/status', '/help', '/theme', '/keys',
    '/analyze', '/price', '/news', '/chart', '/holdings', '/performance',
    '/import', '/export', '/session', '/logs', '/exit', '/clear'
  ];

  constructor(private options: InputOptions) {
    this.history = options.history || [];
  }

  async prompt(): Promise<string> {
    const colors = ColorSchemes[this.options.colorScheme];
    
    // Custom inquirer prompt with enhanced features
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: this.options.prompt || getChalkColor(colors.primary)('❯'),
        prefix: '',
        transformer: (input: string) => {
          // Show hints based on input
          if (input === '/') {
            return getChalkColor(colors.dim)('/ (commands available...)');
          }
          
          if (input === '@') {
            return getChalkColor(colors.dim)('@ (file context...)');
          }
          
          if (input === '!') {
            return getChalkColor(colors.dim)('! (shell command...)');
          }

          // Show file path completion hints
          if (input.includes('@')) {
            const match = input.match(/@([^\s]*)$/);
            if (match) {
              const partialPath = match[1];
              const completion = this.getFileCompletion(partialPath);
              if (completion && completion !== partialPath) {
                return input + getChalkColor(colors.dim)(completion.substring(partialPath.length));
              }
            }
          }

          // Show command completion hints
          if (input.startsWith('/')) {
            const completion = this.getCommandCompletion(input);
            if (completion && completion !== input) {
              return input + getChalkColor(colors.dim)(completion.substring(input.length));
            }
          }

          return input;
        },
        // Enhanced validation and processing
        validate: (input: string) => {
          // File context validation
          if (input.includes('@')) {
            const fileMatches = input.match(/@([^\s]+)/g);
            if (fileMatches) {
              for (const match of fileMatches) {
                const filePath = match.substring(1);
                if (!this.validateFilePath(filePath)) {
                  return chalk.yellow(`Warning: File not found: ${filePath}`);
                }
              }
            }
          }
          
          return true;
        }
      }
    ]);

    // Add to history if non-empty and different from last
    if (input.trim() && (this.history.length === 0 || this.history[this.history.length - 1] !== input)) {
      this.history.push(input.trim());
      // Limit history size
      if (this.history.length > 100) {
        this.history = this.history.slice(-100);
      }
    }

    return input;
  }

  private getCommandCompletion(input: string): string | null {
    const matches = this.commands.filter(cmd => cmd.startsWith(input.toLowerCase()));
    
    if (matches.length === 1) {
      return matches[0];
    }
    
    // Return common prefix if multiple matches
    if (matches.length > 1) {
      let commonPrefix = matches[0];
      for (const match of matches.slice(1)) {
        let i = 0;
        while (i < commonPrefix.length && i < match.length && 
               commonPrefix[i].toLowerCase() === match[i].toLowerCase()) {
          i++;
        }
        commonPrefix = commonPrefix.substring(0, i);
      }
      if (commonPrefix.length > input.length) {
        return commonPrefix;
      }
    }
    
    return null;
  }

  private getFileCompletion(partialPath: string): string | null {
    try {
      const isAbsolute = path.isAbsolute(partialPath);
      const basePath = isAbsolute ? path.dirname(partialPath) : path.dirname(path.resolve(partialPath));
      const fileName = path.basename(partialPath);
      
      if (!fs.existsSync(basePath)) {
        return null;
      }
      
      const files = fs.readdirSync(basePath)
        .filter(file => file.toLowerCase().startsWith(fileName.toLowerCase()))
        .sort();
      
      if (files.length === 1) {
        const fullPath = path.join(basePath, files[0]);
        const relativePath = isAbsolute ? fullPath : path.relative(process.cwd(), fullPath);
        
        // Add trailing slash for directories
        if (fs.statSync(fullPath).isDirectory()) {
          return relativePath + '/';
        }
        return relativePath;
      }
      
      // Return common prefix for multiple matches
      if (files.length > 1) {
        let commonPrefix = files[0];
        for (const file of files.slice(1)) {
          let i = 0;
          while (i < commonPrefix.length && i < file.length && 
                 commonPrefix[i].toLowerCase() === file[i].toLowerCase()) {
            i++;
          }
          commonPrefix = commonPrefix.substring(0, i);
        }
        
        if (commonPrefix.length > fileName.length) {
          const fullPath = path.join(basePath, commonPrefix);
          return isAbsolute ? fullPath : path.relative(process.cwd(), fullPath);
        }
      }
      
    } catch (error) {
      // Silently fail on permission errors etc.
    }
    
    return null;
  }

  private validateFilePath(filePath: string): boolean {
    try {
      const resolvedPath = path.resolve(filePath);
      return fs.existsSync(resolvedPath);
    } catch {
      return false;
    }
  }

  getHistory(): string[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  // Enhanced input processing with context detection
  processInput(input: string): {
    cleanInput: string;
    fileContext: string[];
    isShellCommand: boolean;
    isSlashCommand: boolean;
    shellCommand?: string;
    slashCommand?: string;
  } {
    const result = {
      cleanInput: input,
      fileContext: [] as string[],
      isShellCommand: false,
      isSlashCommand: false,
      shellCommand: undefined as string | undefined,
      slashCommand: undefined as string | undefined
    };

    // Extract file context (@file syntax)
    const fileMatches = input.match(/@([^\s]+)/g);
    if (fileMatches) {
      result.fileContext = fileMatches.map(match => match.substring(1));
      // Remove @file references from clean input but keep context
      result.cleanInput = input.replace(/@[^\s]+/g, '').trim();
    }

    // Detect shell commands (!command syntax)
    if (input.startsWith('!')) {
      result.isShellCommand = true;
      result.shellCommand = input.substring(1).trim();
      result.cleanInput = result.shellCommand;
    }

    // Detect slash commands (/command syntax)
    if (input.startsWith('/') && !input.startsWith('//')) {
      result.isSlashCommand = true;
      result.slashCommand = input.substring(1).trim();
      result.cleanInput = result.slashCommand;
    }

    return result;
  }
}