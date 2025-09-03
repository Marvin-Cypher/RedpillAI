"use strict";
/**
 * Advanced terminal renderer inspired by Gemini CLI
 * Fixes truncation issues with proper text flow management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedTerminalRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const color_utils_1 = require("./color-utils");
class AdvancedTerminalRenderer {
    constructor(options) {
        this.options = options;
    }
    /**
     * Render response with proper text flow management (like Gemini CLI)
     */
    renderResponse(content, data) {
        // Enhanced table detection - check for financial data that could benefit from better formatting
        const isFinancialTable = this.isFinancialTable(content);
        // If content is already formatted (contains markdown elements), render it directly
        if (content && content.includes('|') && content.includes('-')) {
            // Check if we should enhance this table with colors for CLI
            if (isFinancialTable && process.env.NODE_ENV !== 'production') {
                console.log('💡 Detected financial table - consider using enhanced formatting');
            }
            console.log(content);
            return;
        }
        // Clear any existing content and prepare for rendering
        const contentBlocks = this.parseContent(content);
        // Render each block with proper spacing and flow control
        contentBlocks.forEach((block, index) => {
            this.renderBlock(block, index === contentBlocks.length - 1);
        });
        // Handle additional data (tables, charts, etc.)
        if (data?.table) {
            this.renderTable(data.table);
        }
        if (data?.visualization) {
            this.renderVisualization(data.visualization);
        }
        if (data?.charts) {
            this.renderCharts(data.charts);
        }
    }
    /**
     * Detect if content contains financial tables that could benefit from enhanced formatting
     */
    isFinancialTable(content) {
        if (!content || !content.includes('|'))
            return false;
        const financialKeywords = [
            'price', 'symbol', 'change', 'volume', 'market cap', 'revenue',
            'portfolio', 'holdings', 'quote', 'stock', 'ticker', '$', '%',
            'gain', 'loss', 'return', 'yield'
        ];
        const lowerContent = content.toLowerCase();
        return financialKeywords.some(keyword => lowerContent.includes(keyword));
    }
    /**
     * Parse content into renderable blocks (similar to Gemini's MarkdownDisplay)
     */
    parseContent(content) {
        const lines = content.split('\n');
        const blocks = [];
        let currentBlock = null;
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            // Headers
            if (trimmedLine.match(/^#{1,4}\s+/)) {
                if (currentBlock)
                    blocks.push(currentBlock);
                const level = (line.match(/^#+/) || [''])[0].length;
                currentBlock = {
                    type: 'header',
                    level,
                    content: trimmedLine.replace(/^#+\s*/, ''),
                    lines: [line]
                };
            }
            // Tables
            else if (trimmedLine.match(/^\|.*\|$/)) {
                if (currentBlock?.type !== 'table') {
                    if (currentBlock)
                        blocks.push(currentBlock);
                    currentBlock = {
                        type: 'table',
                        content: '',
                        lines: []
                    };
                }
                currentBlock.lines.push(line);
            }
            // Code blocks
            else if (trimmedLine.match(/^```/)) {
                if (currentBlock?.type !== 'code') {
                    if (currentBlock)
                        blocks.push(currentBlock);
                    currentBlock = {
                        type: 'code',
                        content: '',
                        lines: []
                    };
                }
                currentBlock.lines.push(line);
            }
            // Lists
            else if (trimmedLine.match(/^[-*+]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
                if (currentBlock?.type !== 'list') {
                    if (currentBlock)
                        blocks.push(currentBlock);
                    currentBlock = {
                        type: 'list',
                        content: '',
                        lines: []
                    };
                }
                currentBlock.lines.push(line);
            }
            // Regular text
            else if (trimmedLine.length > 0) {
                if (currentBlock?.type !== 'text') {
                    if (currentBlock)
                        blocks.push(currentBlock);
                    currentBlock = {
                        type: 'text',
                        content: '',
                        lines: []
                    };
                }
                currentBlock.lines.push(line);
            }
            // Empty line - finish current block
            else if (trimmedLine.length === 0 && currentBlock) {
                blocks.push(currentBlock);
                currentBlock = null;
            }
        });
        if (currentBlock) {
            blocks.push(currentBlock);
        }
        return blocks;
    }
    /**
     * Render individual content block with proper formatting
     */
    renderBlock(block, isLast) {
        const colors = require('./color-utils').ColorSchemes[this.options.colorScheme];
        switch (block.type) {
            case 'header':
                const headerColor = block.level === 1 ? 'primary' :
                    block.level === 2 ? 'accent' : 'secondary';
                console.log((0, color_utils_1.getChalkColor)(headerColor, 'bold')(block.content));
                if (!isLast)
                    console.log();
                break;
            case 'table':
                this.renderMarkdownTable(block.lines);
                if (!isLast)
                    console.log();
                break;
            case 'code':
                this.renderCodeBlock(block.lines);
                if (!isLast)
                    console.log();
                break;
            case 'list':
                block.lines.forEach(line => {
                    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)/);
                    if (match) {
                        const [, indent, bullet, text] = match;
                        console.log(indent +
                            (0, color_utils_1.getChalkColor)(colors.accent)(bullet) + ' ' +
                            (0, color_utils_1.getChalkColor)(colors.dim)(text));
                    }
                });
                if (!isLast)
                    console.log();
                break;
            case 'text':
                // Handle long text with proper word wrapping
                const text = block.lines.join('\n');
                this.renderWrappedText(text);
                if (!isLast)
                    console.log();
                break;
        }
    }
    /**
     * Render text with proper word wrapping (prevents truncation)
     */
    renderWrappedText(text) {
        const maxWidth = Math.min(this.options.terminalWidth - 4, 120);
        const words = text.split(/\s+/);
        let currentLine = '';
        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length > maxWidth && currentLine) {
                console.log(currentLine);
                currentLine = word;
            }
            else {
                currentLine = testLine;
            }
        });
        if (currentLine) {
            console.log(currentLine);
        }
    }
    /**
     * Render markdown-style tables with proper formatting
     */
    renderMarkdownTable(lines) {
        const colors = require('./color-utils').ColorSchemes[this.options.colorScheme];
        lines.forEach((line, index) => {
            if (line.includes('|') && !line.match(/^\s*\|[-:\s|]+\|\s*$/)) {
                const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
                if (index === 0) {
                    // Header row
                    const headerRow = cells.map(cell => (0, color_utils_1.getChalkColor)(colors.primary, 'bold')(cell.padEnd(15))).join(' | ');
                    console.log(headerRow);
                    console.log((0, color_utils_1.getChalkColor)(colors.dim)('─'.repeat(headerRow.length / 2)));
                }
                else {
                    // Data row
                    const dataRow = cells.map(cell => (0, color_utils_1.getChalkColor)(colors.dim)(cell.padEnd(15))).join(' | ');
                    console.log(dataRow);
                }
            }
        });
    }
    /**
     * Render code blocks with syntax highlighting
     */
    renderCodeBlock(lines) {
        const colors = require('./color-utils').ColorSchemes[this.options.colorScheme];
        lines.forEach(line => {
            if (!line.trim().startsWith('```')) {
                console.log((0, color_utils_1.getChalkColor)(colors.accent)('  ' + line));
            }
        });
    }
    /**
     * Render OpenBB-style data tables
     */
    renderTable(tableData) {
        console.log(chalk_1.default.blue('\n📊 Data Table:'));
        console.table(tableData);
    }
    /**
     * Render OpenBB-style visualizations
     */
    renderVisualization(vizData) {
        console.log(chalk_1.default.green('\n📈 Chart/Visualization:'));
        console.log(vizData);
    }
    /**
     * Render OpenBB charts with ASCII representation
     */
    renderCharts(charts) {
        console.log(chalk_1.default.magenta('\n📊 Charts:'));
        if (Array.isArray(charts)) {
            charts.forEach((chart, index) => {
                console.log(chalk_1.default.dim(`Chart ${index + 1}:`));
                console.log(chart);
            });
        }
        else {
            console.log(charts);
        }
    }
}
exports.AdvancedTerminalRenderer = AdvancedTerminalRenderer;
//# sourceMappingURL=terminal-renderer.js.map