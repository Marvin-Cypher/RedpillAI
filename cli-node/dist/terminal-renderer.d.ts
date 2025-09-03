/**
 * Advanced terminal renderer inspired by Gemini CLI
 * Fixes truncation issues with proper text flow management
 */
import type { ColorScheme } from './color-utils';
export interface RenderingOptions {
    terminalWidth: number;
    terminalHeight: number;
    colorScheme: ColorScheme;
    maxHeight?: number;
}
export declare class AdvancedTerminalRenderer {
    private options;
    constructor(options: RenderingOptions);
    /**
     * Render response with proper text flow management (like Gemini CLI)
     */
    renderResponse(content: string, data?: any): void;
    /**
     * Detect if content contains financial tables that could benefit from enhanced formatting
     */
    private isFinancialTable;
    /**
     * Parse content into renderable blocks (similar to Gemini's MarkdownDisplay)
     */
    private parseContent;
    /**
     * Render individual content block with proper formatting
     */
    private renderBlock;
    /**
     * Render text with proper word wrapping (prevents truncation)
     */
    private renderWrappedText;
    /**
     * Render markdown-style tables with proper formatting
     */
    private renderMarkdownTable;
    /**
     * Render code blocks with syntax highlighting
     */
    private renderCodeBlock;
    /**
     * Render OpenBB-style data tables
     */
    private renderTable;
    /**
     * Render OpenBB-style visualizations
     */
    private renderVisualization;
    /**
     * Render OpenBB charts with ASCII representation
     */
    private renderCharts;
}
//# sourceMappingURL=terminal-renderer.d.ts.map