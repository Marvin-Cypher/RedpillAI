/**
 * Markdown renderer for CLI output - inspired by Gemini CLI
 * Properly handles tables, code blocks, and formatting for terminal display
 */
export interface MarkdownRendererOptions {
    terminalWidth?: number;
    colorize?: boolean;
    showCodeBlockLanguage?: boolean;
}
export declare class MarkdownRenderer {
    private options;
    constructor(options?: MarkdownRendererOptions);
    /**
     * Render markdown content for terminal display
     */
    render(content: string): string;
    /**
     * Render code blocks with syntax highlighting box
     */
    private renderCodeBlocks;
    /**
     * Create a box around code like Gemini CLI
     */
    private createCodeBox;
    /**
     * Render markdown tables as clean box tables
     */
    private renderTables;
    /**
     * Create a clean box table like in our table formatter
     */
    private createBoxTable;
    /**
     * Render headers with color and formatting
     */
    private renderHeaders;
    /**
     * Render bold text
     */
    private renderBold;
    /**
     * Render italic text
     */
    private renderItalic;
    /**
     * Render links
     */
    private renderLinks;
    /**
     * Render lists with proper bullets
     */
    private renderLists;
    /**
     * Render horizontal rules
     */
    private renderHorizontalRules;
    /**
     * Basic JSON syntax highlighting
     */
    private highlightJson;
    /**
     * Basic Python syntax highlighting
     */
    private highlightPython;
    /**
     * Basic JavaScript syntax highlighting
     */
    private highlightJavaScript;
}
export declare const markdownRenderer: MarkdownRenderer;
//# sourceMappingURL=markdown-renderer.d.ts.map