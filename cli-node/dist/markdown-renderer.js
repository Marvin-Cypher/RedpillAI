"use strict";
/**
 * Markdown renderer for CLI output - inspired by Gemini CLI
 * Properly handles tables, code blocks, and formatting for terminal display
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownRenderer = exports.MarkdownRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
class MarkdownRenderer {
    constructor(options = {}) {
        this.options = {
            terminalWidth: process.stdout.columns || 80,
            colorize: true,
            showCodeBlockLanguage: true,
            ...options
        };
    }
    /**
     * Render markdown content for terminal display
     */
    render(content) {
        if (!content)
            return '';
        let output = content;
        // Process in order of precedence
        output = this.renderCodeBlocks(output);
        output = this.renderTables(output);
        output = this.renderHeaders(output);
        output = this.renderBold(output);
        output = this.renderItalic(output);
        output = this.renderLinks(output);
        output = this.renderLists(output);
        output = this.renderHorizontalRules(output);
        return output;
    }
    /**
     * Render code blocks with syntax highlighting box
     */
    renderCodeBlocks(content) {
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        return content.replace(codeBlockRegex, (match, lang, code) => {
            const trimmedCode = code.trim();
            if (!this.options.colorize) {
                return this.createCodeBox(trimmedCode, lang);
            }
            // Add syntax highlighting based on language
            let highlighted = trimmedCode;
            if (lang === 'json') {
                highlighted = this.highlightJson(trimmedCode);
            }
            else if (lang === 'python' || lang === 'py') {
                highlighted = this.highlightPython(trimmedCode);
            }
            else if (lang === 'javascript' || lang === 'js') {
                highlighted = this.highlightJavaScript(trimmedCode);
            }
            return this.createCodeBox(highlighted, lang);
        });
    }
    /**
     * Create a box around code like Gemini CLI
     */
    createCodeBox(code, lang) {
        const lines = code.split('\n');
        const maxLength = Math.min(Math.max(...lines.map(l => l.length)), this.options.terminalWidth - 4);
        let output = '';
        // Top border with language label
        if (lang && this.options.showCodeBlockLanguage) {
            const label = ` ${lang} `;
            const borderLength = maxLength + 2;
            const labelStart = Math.floor((borderLength - label.length) / 2);
            const before = '─'.repeat(labelStart);
            const after = '─'.repeat(borderLength - labelStart - label.length);
            output += chalk_1.default.gray(`┌${before}${chalk_1.default.cyan(label)}${after}┐\n`);
        }
        else {
            output += chalk_1.default.gray(`┌${'─'.repeat(maxLength + 2)}┐\n`);
        }
        // Code lines
        lines.forEach(line => {
            const padding = ' '.repeat(Math.max(0, maxLength - line.length));
            output += chalk_1.default.gray('│ ') + line + padding + chalk_1.default.gray(' │\n');
        });
        // Bottom border
        output += chalk_1.default.gray(`└${'─'.repeat(maxLength + 2)}┘`);
        return output;
    }
    /**
     * Render markdown tables as clean box tables
     */
    renderTables(content) {
        // Match markdown tables
        const tableRegex = /\n(\|[^\n]+\|\n)+/g;
        return content.replace(tableRegex, (match) => {
            const lines = match.trim().split('\n').filter(l => l.trim());
            if (lines.length < 2)
                return match;
            // Parse table
            const rows = lines.map(line => line.split('|')
                .filter(cell => cell !== '')
                .map(cell => cell.trim()));
            // Remove separator row if present
            const separatorIndex = rows.findIndex(row => row.every(cell => /^[-:\s]+$/.test(cell)));
            if (separatorIndex > -1) {
                rows.splice(separatorIndex, 1);
            }
            // Create clean box table
            return '\n' + this.createBoxTable(rows) + '\n';
        });
    }
    /**
     * Create a clean box table like in our table formatter
     */
    createBoxTable(rows) {
        if (rows.length === 0)
            return '';
        const columnWidths = rows[0].map((_, colIndex) => Math.max(...rows.map(row => (row[colIndex] || '').length)));
        const createRow = (row, chars) => {
            let line = chars.left;
            row.forEach((cell, i) => {
                line += ' ' + cell.padEnd(columnWidths[i]) + ' ';
                if (i < row.length - 1)
                    line += chars.middle;
            });
            line += chars.right;
            return line;
        };
        const createSeparator = (chars) => {
            let line = chars.left;
            columnWidths.forEach((width, i) => {
                line += '─'.repeat(width + 2);
                if (i < columnWidths.length - 1)
                    line += chars.middle;
            });
            line += chars.right;
            return line;
        };
        let output = '';
        // Top border
        output += createSeparator({ left: '┌', middle: '┬', right: '┐' }) + '\n';
        // Header row
        if (rows.length > 0) {
            output += createRow(rows[0], { left: '│', middle: '│', right: '│' }) + '\n';
            output += createSeparator({ left: '├', middle: '┼', right: '┤' }) + '\n';
        }
        // Data rows
        for (let i = 1; i < rows.length; i++) {
            output += createRow(rows[i], { left: '│', middle: '│', right: '│' }) + '\n';
        }
        // Bottom border
        output += createSeparator({ left: '└', middle: '┴', right: '┘' });
        return chalk_1.default.gray(output);
    }
    /**
     * Render headers with color and formatting
     */
    renderHeaders(content) {
        // H1
        content = content.replace(/^# (.+)$/gm, (_, text) => chalk_1.default.bold.cyan(`\n${'═'.repeat(text.length)}\n${text}\n${'═'.repeat(text.length)}\n`));
        // H2
        content = content.replace(/^## (.+)$/gm, (_, text) => chalk_1.default.bold.green(`\n${text}\n${'─'.repeat(text.length)}\n`));
        // H3
        content = content.replace(/^### (.+)$/gm, (_, text) => chalk_1.default.bold.yellow(`${text}`));
        return content;
    }
    /**
     * Render bold text
     */
    renderBold(content) {
        return content.replace(/\*\*(.+?)\*\*/g, (_, text) => chalk_1.default.bold(text));
    }
    /**
     * Render italic text
     */
    renderItalic(content) {
        return content.replace(/\*(.+?)\*/g, (_, text) => chalk_1.default.italic(text));
    }
    /**
     * Render links
     */
    renderLinks(content) {
        return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => chalk_1.default.blue.underline(text) + chalk_1.default.dim(` (${url})`));
    }
    /**
     * Render lists with proper bullets
     */
    renderLists(content) {
        // Unordered lists
        content = content.replace(/^[-*+] (.+)$/gm, (_, text) => chalk_1.default.gray('  •') + ' ' + text);
        // Ordered lists  
        content = content.replace(/^\d+\. (.+)$/gm, (match, text) => {
            const num = match.match(/^\d+/)?.[0] || '1';
            return chalk_1.default.gray(`  ${num}.`) + ' ' + text;
        });
        return content;
    }
    /**
     * Render horizontal rules
     */
    renderHorizontalRules(content) {
        const width = Math.min(60, this.options.terminalWidth - 4);
        return content.replace(/^---+$/gm, chalk_1.default.gray('─'.repeat(width)));
    }
    /**
     * Basic JSON syntax highlighting
     */
    highlightJson(code) {
        return code
            .replace(/"([^"]+)":/g, (_, key) => chalk_1.default.blue(`"${key}":`))
            .replace(/: "([^"]+)"/g, (_, value) => `: ${chalk_1.default.green(`"${value}"`)}`)
            .replace(/: (\d+)/g, (_, num) => `: ${chalk_1.default.yellow(num)}`)
            .replace(/: (true|false|null)/g, (_, keyword) => `: ${chalk_1.default.magenta(keyword)}`);
    }
    /**
     * Basic Python syntax highlighting
     */
    highlightPython(code) {
        const keywords = ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif',
            'for', 'while', 'in', 'and', 'or', 'not', 'True', 'False', 'None'];
        let highlighted = code;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, chalk_1.default.magenta(keyword));
        });
        // Strings
        highlighted = highlighted.replace(/'([^']*)'/g, (_, str) => chalk_1.default.green(`'${str}'`));
        highlighted = highlighted.replace(/"([^"]*)"/g, (_, str) => chalk_1.default.green(`"${str}"`));
        // Comments
        highlighted = highlighted.replace(/#.*/g, comment => chalk_1.default.gray(comment));
        return highlighted;
    }
    /**
     * Basic JavaScript syntax highlighting
     */
    highlightJavaScript(code) {
        const keywords = ['function', 'const', 'let', 'var', 'return', 'if', 'else',
            'for', 'while', 'class', 'extends', 'import', 'export',
            'async', 'await', 'true', 'false', 'null', 'undefined'];
        let highlighted = code;
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, chalk_1.default.magenta(keyword));
        });
        // Strings
        highlighted = highlighted.replace(/'([^']*)'/g, (_, str) => chalk_1.default.green(`'${str}'`));
        highlighted = highlighted.replace(/"([^"]*)"/g, (_, str) => chalk_1.default.green(`"${str}"`));
        highlighted = highlighted.replace(/`([^`]*)`/g, (_, str) => chalk_1.default.green(`\`${str}\``));
        // Comments
        highlighted = highlighted.replace(/\/\/.*/g, comment => chalk_1.default.gray(comment));
        return highlighted;
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
// Export singleton instance for convenience
exports.markdownRenderer = new MarkdownRenderer();
//# sourceMappingURL=markdown-renderer.js.map