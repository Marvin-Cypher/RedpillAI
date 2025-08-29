"use strict";
/**
 * Enhanced input system inspired by Gemini CLI
 * Features: autocompletion, history, file context detection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedInput = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const color_utils_1 = require("./color-utils");
class EnhancedInput {
    constructor(options) {
        this.options = options;
        this.history = [];
        this.historyIndex = -1;
        this.commands = [
            '/portfolio', '/market', '/status', '/help', '/theme', '/keys',
            '/analyze', '/price', '/news', '/chart', '/holdings', '/performance',
            '/import', '/export', '/session', '/logs', '/exit', '/clear'
        ];
        this.history = options.history || [];
    }
    async prompt() {
        const colors = color_utils_1.ColorSchemes[this.options.colorScheme];
        // Custom inquirer prompt with enhanced features
        const { input } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'input',
                message: this.options.prompt || (0, color_utils_1.getChalkColor)(colors.primary)('❯'),
                prefix: '',
                transformer: (input) => {
                    // Show hints based on input
                    if (input === '/') {
                        return (0, color_utils_1.getChalkColor)(colors.dim)('/ (commands available...)');
                    }
                    if (input === '@') {
                        return (0, color_utils_1.getChalkColor)(colors.dim)('@ (file context...)');
                    }
                    if (input === '!') {
                        return (0, color_utils_1.getChalkColor)(colors.dim)('! (shell command...)');
                    }
                    // Show file path completion hints
                    if (input.includes('@')) {
                        const match = input.match(/@([^\s]*)$/);
                        if (match) {
                            const partialPath = match[1];
                            const completion = this.getFileCompletion(partialPath);
                            if (completion && completion !== partialPath) {
                                return input + (0, color_utils_1.getChalkColor)(colors.dim)(completion.substring(partialPath.length));
                            }
                        }
                    }
                    // Show command completion hints
                    if (input.startsWith('/')) {
                        const completion = this.getCommandCompletion(input);
                        if (completion && completion !== input) {
                            return input + (0, color_utils_1.getChalkColor)(colors.dim)(completion.substring(input.length));
                        }
                    }
                    return input;
                },
                // Enhanced validation and processing
                validate: (input) => {
                    // File context validation
                    if (input.includes('@')) {
                        const fileMatches = input.match(/@([^\s]+)/g);
                        if (fileMatches) {
                            for (const match of fileMatches) {
                                const filePath = match.substring(1);
                                if (!this.validateFilePath(filePath)) {
                                    return chalk_1.default.yellow(`Warning: File not found: ${filePath}`);
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
    getCommandCompletion(input) {
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
    getFileCompletion(partialPath) {
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
        }
        catch (error) {
            // Silently fail on permission errors etc.
        }
        return null;
    }
    validateFilePath(filePath) {
        try {
            const resolvedPath = path.resolve(filePath);
            return fs.existsSync(resolvedPath);
        }
        catch {
            return false;
        }
    }
    getHistory() {
        return [...this.history];
    }
    clearHistory() {
        this.history = [];
    }
    // Enhanced input processing with context detection
    processInput(input) {
        const result = {
            cleanInput: input,
            fileContext: [],
            isShellCommand: false,
            isSlashCommand: false,
            shellCommand: undefined,
            slashCommand: undefined
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
exports.EnhancedInput = EnhancedInput;
//# sourceMappingURL=enhanced-input.js.map